import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHead from '../components/PageHead'
import Empty from '../components/Empty'
import Pill from '../components/Pill'
import { Button } from '../components/Button'
import Modal from '../components/Modal'
import { Field, FieldRow, Input } from '../components/Field'
import { useTilt } from '../hooks/useTilt'
import { useToast } from '../context/ToastContext'
import { eur } from '../lib/format'
import { occupancyOf, revenueOf, marginOf } from '../lib/business'
import {
  addBed, addBeds, createProperty, deleteProperty, listProperties, removeBed, updateProperty,
  type Property, type PropertyInput,
} from '../lib/api/properties'
import { listActiveTenantsSummary, type ActiveTenantSummary } from '../lib/api/tenants'

const emptyForm: PropertyInput = {
  name: '', address: '', city: 'Porto', landlord_name: '', landlord_contact: '',
  head_rent: 0, utilities: 250, contract_start: '', contract_end: '',
}

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<ActiveTenantSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Property | null | 'new'>(null)
  const [bedsFor, setBedsFor] = useState<Property | null>(null)
  const toast = useToast()

  const refresh = async () => {
    const [props, tens] = await Promise.all([listProperties(), listActiveTenantsSummary()])
    setProperties(props)
    setTenants(tens)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  if (loading) return <PageHead title="Apartamentos" subtitle="A carregar…" />

  return (
    <>
      <PageHead
        title="Apartamentos"
        subtitle={`${properties.length} imóveis geridos`}
        action={<Button variant="primary" onClick={() => setEditing('new')}>+ Adicionar apartamento</Button>}
      />
      {properties.length === 0 ? (
        <Empty icon="⌂" title="Nenhum apartamento ainda." />
      ) : (
        properties.map(p => (
          <PropertyCard
            key={p.id} property={p} tenants={tenants}
            onEdit={() => setEditing(p)} onManageBeds={() => setBedsFor(p)}
          />
        ))
      )}

      {editing && (
        <PropertyModal
          property={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { await refresh(); setEditing(null) }}
          toast={toast}
        />
      )}
      {bedsFor && (
        <BedsModal
          property={bedsFor}
          tenants={tenants}
          onClose={async () => { await refresh(); setBedsFor(null) }}
          onChanged={async () => {
            const props = await listProperties()
            setProperties(props)
            setBedsFor(props.find(p => p.id === bedsFor.id) ?? null)
          }}
        />
      )}
    </>
  )
}

function PropertyCard({ property: p, tenants, onEdit, onManageBeds }: {
  property: Property; tenants: ActiveTenantSummary[]; onEdit: () => void; onManageBeds: () => void
}) {
  const tilt = useTilt()
  const o = occupancyOf(p, tenants)
  const m = marginOf(p, tenants)
  const tone = o.pct >= 80 ? 'green' : o.pct >= 50 ? 'amber' : 'red'

  return (
    <div ref={tilt.ref} onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave} className="card tilt p-[22px] mb-4">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div
            className="w-[52px] h-[52px] rounded-2xl shrink-0 flex items-center justify-center text-[22px] text-white"
            style={{ background: 'linear-gradient(145deg,#ffb340,#ff8c00)', boxShadow: '0 6px 16px rgba(255,140,0,.35)' }}
          >⌂</div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-[18px] font-bold tracking-tight">{p.name}</h3>
              <Pill tone={tone}>{o.occ}/{o.total} camas</Pill>
            </div>
            <p className="text-[13px] text-[var(--ink-3)] font-medium mt-0.5">{p.address}{p.city ? ' · ' + p.city : ''}</p>
            <p className="text-xs text-[var(--ink-3)] font-medium mt-0.5">Senhorio: {p.landlord_name || '—'} {p.landlord_contact ? '· ' + p.landlord_contact : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onEdit}>Editar</Button>
          <Button onClick={onManageBeds}>Camas</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mt-4.5">
        <Stat label="Receita" value={eur(revenueOf(p, tenants))} />
        <Stat label="Renda" value={eur(p.head_rent)} />
        <Stat label="Utilities" value={eur(p.utilities)} />
        <Stat label="Margem" value={eur(m)} color={m >= 0 ? '#1f9d4d' : 'var(--color-red)'} />
      </div>

      <div className="grid gap-3 mt-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(165px,1fr))' }}>
        {p.beds.length === 0 ? (
          <p className="text-[13px] text-[var(--ink-3)] font-medium">Sem camas configuradas. <button className="link" onClick={onManageBeds}>Configurar camas</button></p>
        ) : p.beds.map(bed => {
          const t = tenants.find(tn => tn.property_id === p.id && tn.bed_id === bed.id)
          return (
            <div key={bed.id} className={`rounded-2xl p-4 relative ${t ? 'border border-[rgba(48,209,88,.35)]' : 'border border-dashed border-black/15'}`}
                 style={{ background: t ? 'linear-gradient(150deg,rgba(48,209,88,.16),rgba(48,209,88,.05))' : 'rgba(255,255,255,.42)' }}>
              <div className="text-[10.5px] uppercase tracking-wide font-bold text-[var(--ink-3)]">{bed.label}</div>
              {t ? (
                <>
                  <div className="text-[14.5px] font-semibold mt-1">{t.name}</div>
                  <div className="text-xs text-[var(--ink-3)] font-medium mt-0.5">{eur(t.rent)}/mês</div>
                </>
              ) : (
                <>
                  <div className="text-[14.5px] text-[var(--ink-3)] mt-1">Vaga</div>
                  <Link to="/inquilinos" className="link text-xs">+ Adicionar inquilino</Link>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-wide font-bold text-[var(--ink-3)]">{label}</div>
      <div className="text-[19px] font-extrabold" style={{ color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  )
}

function PropertyModal({ property, onClose, onSaved, toast }: {
  property: Property | null; onClose: () => void; onSaved: () => void; toast: (m: string) => void
}) {
  const [form, setForm] = useState<PropertyInput>(
    property ? {
      name: property.name, address: property.address ?? '', city: property.city ?? '',
      landlord_name: property.landlord_name ?? '', landlord_contact: property.landlord_contact ?? '',
      head_rent: property.head_rent, utilities: property.utilities,
      contract_start: property.contract_start ?? '', contract_end: property.contract_end ?? '',
    } : emptyForm
  )
  const [saving, setSaving] = useState(false)

  const set = (k: keyof PropertyInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'number' ? +e.target.value : e.target.value }))

  const save = async () => {
    if (!form.name) { toast('Dá um nome ao apartamento'); return }
    setSaving(true)
    try {
      if (property) await updateProperty(property.id, form)
      else await createProperty(form)
      toast(property ? 'Apartamento atualizado' : 'Apartamento criado')
      onSaved()
    } catch (e) {
      toast('Erro ao guardar: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!property) return
    if (!confirm('Eliminar este apartamento? Os inquilinos associados também serão removidos.')) return
    await deleteProperty(property.id)
    toast('Apartamento eliminado')
    onSaved()
  }

  return (
    <Modal
      title={property ? 'Editar apartamento' : 'Novo apartamento'}
      onClose={onClose}
      footer={<>
        {property && <Button variant="danger" onClick={remove}>Eliminar</Button>}
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" disabled={saving} onClick={save}>Guardar</Button>
      </>}
    >
      <Field label="Nome / referência"><Input value={form.name} onChange={set('name')} placeholder="Ex: T3 Santos Pousada" /></Field>
      <Field label="Morada"><Input value={form.address ?? ''} onChange={set('address')} placeholder="Rua, número" /></Field>
      <FieldRow>
        <Field label="Cidade"><Input value={form.city ?? ''} onChange={set('city')} /></Field>
        <Field label="Renda ao senhorio (€/mês)"><Input type="number" value={form.head_rent} onChange={set('head_rent')} /></Field>
      </FieldRow>
      <FieldRow>
        <Field label="Utilities estimadas (€/mês)"><Input type="number" value={form.utilities} onChange={set('utilities')} /></Field>
        <Field label="Nome do senhorio"><Input value={form.landlord_name ?? ''} onChange={set('landlord_name')} /></Field>
      </FieldRow>
      <Field label="Contacto do senhorio"><Input value={form.landlord_contact ?? ''} onChange={set('landlord_contact')} placeholder="Telefone ou email" /></Field>
      <FieldRow>
        <Field label="Início do contrato"><Input type="date" value={form.contract_start ?? ''} onChange={set('contract_start')} /></Field>
        <Field label="Fim do contrato"><Input type="date" value={form.contract_end ?? ''} onChange={set('contract_end')} /></Field>
      </FieldRow>
    </Modal>
  )
}

function BedsModal({ property, tenants, onClose, onChanged }: {
  property: Property; tenants: ActiveTenantSummary[]; onClose: () => void; onChanged: () => void
}) {
  const [newLabel, setNewLabel] = useState('')

  const add = async () => {
    if (!newLabel.trim()) return
    await addBed(property.id, newLabel.trim())
    setNewLabel('')
    onChanged()
  }
  const quickBeds = async (type: 3 | 5) => {
    const labels = type === 3
      ? ['Quarto 1', 'Quarto 2', 'Quarto 3']
      : ['Quarto 1 - Cama A', 'Quarto 1 - Cama B', 'Quarto 2 - Cama A', 'Quarto 2 - Cama B', 'Quarto 3']
    await addBeds(property.id, labels)
    onChanged()
  }
  const remove = async (id: string) => {
    await removeBed(id)
    onChanged()
  }

  return (
    <Modal title={`Camas · ${property.name}`} onClose={onClose} footer={<Button variant="primary" onClick={onClose}>Concluído</Button>}>
      <p className="text-[13px] text-[var(--ink-3)] font-medium mb-4">Adiciona uma cama por cada vaga arrendável.</p>
      {property.beds.length === 0 && <p className="text-[13px] text-[var(--ink-3)] font-medium mb-2.5">Sem camas ainda.</p>}
      {property.beds.map(b => {
        const occ = tenants.find(t => t.property_id === property.id && t.bed_id === b.id)
        return (
          <div key={b.id} className="flex justify-between items-center px-3.5 py-3 bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-[13px] mb-2">
            <div>
              <span className="font-semibold">{b.label}</span>{' '}
              {occ ? <Pill tone="green">{occ.name}</Pill> : <Pill tone="gray">Vaga</Pill>}
            </div>
            {occ
              ? <span className="text-xs text-[var(--ink-3)] font-medium">Ocupada</span>
              : <Button variant="danger" onClick={() => remove(b.id)}>Remover</Button>}
          </div>
        )
      })}
      <div className="flex gap-2 mt-3.5">
        <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Ex: Quarto 1 - Cama A" onKeyDown={e => e.key === 'Enter' && add()} />
        <Button variant="primary" onClick={add}>+ Adicionar</Button>
      </div>
      <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10">
        <p className="text-xs text-[var(--ink-3)] font-semibold mb-2">Adicionar rapidamente:</p>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => quickBeds(3)}>3 quartos individuais</Button>
          <Button onClick={() => quickBeds(5)}>2 duplos + 1 individual</Button>
        </div>
      </div>
    </Modal>
  )
}
