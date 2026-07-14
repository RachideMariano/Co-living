import { useEffect, useState } from 'react'
import PageHead from '../components/PageHead'
import Empty from '../components/Empty'
import Pill from '../components/Pill'
import { Button } from '../components/Button'
import Modal from '../components/Modal'
import { Field, FieldRow, Input, Select } from '../components/Field'
import { useToast } from '../context/ToastContext'
import { eur, fmtDate, todayISO } from '../lib/format'
import { listProperties, type Property } from '../lib/api/properties'
import { createLead, deleteLead, listLeads, setLeadStatus, updateLead, convertLeadToTenant, type Lead, type LeadInput } from '../lib/api/leads'
import { listActiveTenantsSummary, type ActiveTenantSummary } from '../lib/api/tenants'

const statusTone = { waiting: 'blue', contacted: 'amber', converted: 'green', discarded: 'gray' } as const
const statusLabel = { waiting: 'Em espera', contacted: 'Contactado', converted: 'Convertido', discarded: 'Descartado' } as const

const emptyForm: LeadInput = { name: '', contact: '', desired_move_in: '', budget: null, property_id: null, notes: '' }

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [activeTenants, setActiveTenants] = useState<ActiveTenantSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Lead | null | 'new'>(null)
  const [converting, setConverting] = useState<Lead | null>(null)
  const toast = useToast()

  const refresh = async () => {
    const [l, p, t] = await Promise.all([listLeads(), listProperties(), listActiveTenantsSummary()])
    setLeads(l); setProperties(p); setActiveTenants(t); setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  const propById = (id: string | null) => properties.find(p => p.id === id)

  if (loading) return <PageHead title="Interessados" subtitle="A carregar…" />

  return (
    <>
      <PageHead
        title="Interessados"
        subtitle={`${leads.filter(l => l.status === 'waiting').length} em lista de espera`}
        action={<Button variant="primary" onClick={() => setEditing('new')}>+ Adicionar interessado</Button>}
      />
      {leads.length === 0 ? (
        <Empty icon="★" title="Nenhum interessado registado." />
      ) : (
        <div className="card tilt p-1.5 overflow-x-auto">
          <table className="w-full text-[13.5px] border-collapse">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[var(--ink-3)] text-left">
                <th className="p-3.5 font-bold">Nome</th>
                <th className="p-3.5 font-bold">Apartamento preferido</th>
                <th className="p-3.5 font-bold">Entrada desejada</th>
                <th className="p-3.5 font-bold">Orçamento</th>
                <th className="p-3.5 font-bold">Estado</th>
                <th className="p-3.5 font-bold"></th>
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id} className="border-t border-black/5 dark:border-white/5 cursor-pointer hover:bg-blue-500/5" onClick={() => setEditing(l)}>
                  <td className="p-3.5">
                    <span className="font-semibold">{l.name}</span><br />
                    <span className="text-[var(--ink-3)] text-xs">{l.contact}</span>
                  </td>
                  <td className="p-3.5">{propById(l.property_id)?.name ?? '—'}</td>
                  <td className="p-3.5 text-[var(--ink-3)] text-xs">{l.desired_move_in ? fmtDate(l.desired_move_in) : '—'}</td>
                  <td className="p-3.5" style={{ fontVariantNumeric: 'tabular-nums' }}>{l.budget ? eur(l.budget) : '—'}</td>
                  <td className="p-3.5"><Pill tone={statusTone[l.status]}>{statusLabel[l.status]}</Pill></td>
                  <td className="p-3.5" onClick={e => e.stopPropagation()}>
                    {l.status !== 'converted' && l.status !== 'discarded' && (
                      <button className="link text-xs" onClick={() => setConverting(l)}>Converter em inquilino</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <LeadModal
          lead={editing === 'new' ? null : editing}
          properties={properties}
          onClose={() => setEditing(null)}
          onSaved={async () => { await refresh(); setEditing(null) }}
          toast={toast}
        />
      )}
      {converting && (
        <ConvertModal
          lead={converting}
          properties={properties}
          activeTenants={activeTenants}
          onClose={() => setConverting(null)}
          onConverted={async () => { await refresh(); setConverting(null); toast('Interessado convertido em inquilino') }}
          toast={toast}
        />
      )}
    </>
  )
}

function LeadModal({ lead, properties, onClose, onSaved, toast }: {
  lead: Lead | null; properties: Property[]; onClose: () => void; onSaved: () => void; toast: (m: string) => void
}) {
  const [form, setForm] = useState<LeadInput>(
    lead ? {
      name: lead.name, contact: lead.contact ?? '', desired_move_in: lead.desired_move_in ?? '',
      budget: lead.budget, property_id: lead.property_id, notes: lead.notes ?? '',
    } : emptyForm
  )
  const [saving, setSaving] = useState(false)

  const set = (k: keyof LeadInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'number' ? (e.target.value === '' ? null : +e.target.value) : e.target.value }))

  const save = async () => {
    if (!form.name) { toast('Indica o nome do interessado'); return }
    setSaving(true)
    try {
      if (lead) await updateLead(lead.id, form)
      else await createLead(form)
      toast(lead ? 'Interessado atualizado' : 'Interessado adicionado')
      onSaved()
    } catch (e) {
      toast('Erro ao guardar: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const discard = async () => {
    if (!lead) return
    await setLeadStatus(lead.id, 'discarded')
    toast('Marcado como descartado')
    onSaved()
  }
  const remove = async () => {
    if (!lead) return
    if (!confirm('Eliminar este interessado?')) return
    await deleteLead(lead.id)
    toast('Interessado eliminado')
    onSaved()
  }

  return (
    <Modal
      title={lead ? 'Editar interessado' : 'Novo interessado'}
      onClose={onClose}
      footer={<>
        {lead && <Button variant="danger" onClick={remove}>Eliminar</Button>}
        {lead && lead.status === 'waiting' && <Button onClick={discard}>Descartar</Button>}
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" disabled={saving} onClick={save}>Guardar</Button>
      </>}
    >
      <Field label="Nome"><Input value={form.name} onChange={set('name')} /></Field>
      <Field label="Contacto"><Input value={form.contact ?? ''} onChange={set('contact')} placeholder="+351912345678" /></Field>
      <FieldRow>
        <Field label="Apartamento preferido">
          <Select value={form.property_id ?? ''} onChange={set('property_id')}>
            <option value="">Sem preferência</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Orçamento (€/mês)"><Input type="number" value={form.budget ?? ''} onChange={set('budget')} /></Field>
      </FieldRow>
      <Field label="Data de entrada desejada"><Input type="date" value={form.desired_move_in ?? ''} onChange={set('desired_move_in')} /></Field>
      <Field label="Notas">
        <textarea
          value={form.notes ?? ''} onChange={set('notes')}
          className="w-full rounded-[13px] border border-black/10 dark:border-white/10 bg-white/75 dark:bg-white/5 px-3.5 py-3 text-sm min-h-24 resize-y"
        />
      </Field>
    </Modal>
  )
}

function ConvertModal({ lead, properties, activeTenants, onClose, onConverted, toast }: {
  lead: Lead; properties: Property[]; activeTenants: ActiveTenantSummary[]
  onClose: () => void; onConverted: () => void; toast: (m: string) => void
}) {
  const [propertyId, setPropertyId] = useState(lead.property_id ?? properties[0]?.id ?? '')
  const [bedId, setBedId] = useState('')
  const [rent, setRent] = useState(lead.budget ?? 0)
  const [moveIn, setMoveIn] = useState(lead.desired_move_in ?? todayISO())
  const [saving, setSaving] = useState(false)

  const property = properties.find(p => p.id === propertyId)
  const occupiedBedIds = new Set(activeTenants.map(t => t.bed_id))

  const convert = async () => {
    if (!propertyId) { toast('Escolhe um apartamento'); return }
    setSaving(true)
    try {
      await convertLeadToTenant(lead, propertyId, bedId || null, rent, moveIn)
      onConverted()
    } catch (e) {
      toast('Erro ao converter: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Converter ${lead.name} em inquilino`}
      onClose={onClose}
      footer={<>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" disabled={saving} onClick={convert}>Converter</Button>
      </>}
    >
      <FieldRow>
        <Field label="Apartamento">
          <Select value={propertyId} onChange={e => { setPropertyId(e.target.value); setBedId('') }}>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Cama">
          <Select value={bedId} onChange={e => setBedId(e.target.value)}>
            <option value="">— Sem cama —</option>
            {property?.beds.map(b => (
              <option key={b.id} value={b.id} disabled={occupiedBedIds.has(b.id)}>{b.label}{occupiedBedIds.has(b.id) ? ' (ocupada)' : ''}</option>
            ))}
          </Select>
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="Renda (€/mês)"><Input type="number" value={rent} onChange={e => setRent(+e.target.value)} /></Field>
        <Field label="Data de entrada"><Input type="date" value={moveIn} onChange={e => setMoveIn(e.target.value)} /></Field>
      </FieldRow>
      <p className="text-xs text-[var(--ink-3)] font-medium">A caução e restantes dados podem ser preenchidos depois, na ficha do inquilino.</p>
    </Modal>
  )
}
