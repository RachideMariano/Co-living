import { useEffect, useMemo, useState } from 'react'
import PageHead from '../components/PageHead'
import Empty from '../components/Empty'
import Pill from '../components/Pill'
import { Button } from '../components/Button'
import Modal from '../components/Modal'
import { Field, FieldRow, Input, Select } from '../components/Field'
import { useToast } from '../context/ToastContext'
import { eur, fmtDate, todayISO } from '../lib/format'
import { listProperties, type Property } from '../lib/api/properties'
import {
  checkoutTenant, createTenant, listTenants, reactivateTenant, setDepositReturned, updateTenant,
  type Tenant, type TenantInput,
} from '../lib/api/tenants'
import { listOnboarding, updateOnboarding, type Onboarding, type OnboardingPatch } from '../lib/api/onboarding'
import { listPayments, type Payment } from '../lib/api/payments'
import { lateCount } from '../lib/business'
import DocumentsSection from '../components/DocumentsSection'
import InspectionsSection from '../components/InspectionsSection'

const STEPS: { key: keyof OnboardingPatch; label: string }[] = [
  { key: 'contract_signed', label: 'Contrato assinado' },
  { key: 'inventory_done', label: 'Inventário feito' },
  { key: 'deposit_paid', label: 'Caução paga' },
  { key: 'id_document_received', label: 'Documento de identificação recebido' },
  { key: 'landlord_notified', label: 'Comunicação ao senhorio (art. 1088.º CC)' },
  { key: 'direct_debit_setup', label: 'Débito direto configurado' },
]

const emptyForm: TenantInput = {
  property_id: '', bed_id: null, name: '', contact: '', rent: 0, deposit: 0,
  move_in: todayISO(), contract_end: '', notes: '',
}

export default function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [onboarding, setOnboarding] = useState<Onboarding[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Tenant | null | 'new'>(null)
  const [checklistFor, setChecklistFor] = useState<Tenant | null>(null)
  const toast = useToast()

  const refresh = async () => {
    const [t, o, p, pay] = await Promise.all([listTenants(), listOnboarding(), listProperties(), listPayments()])
    setTenants(t)
    setOnboarding(o)
    setProperties(p)
    setPayments(pay)
    setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  const onboardingOf = (tenantId: string) => onboarding.find(o => o.tenant_id === tenantId)
  const propById = (id: string) => properties.find(p => p.id === id)
  const bedLabel = (propId: string, bedId: string | null) => propById(propId)?.beds.find(b => b.id === bedId)?.label ?? '—'

  const active = useMemo(() => tenants.filter(t => t.status === 'active'), [tenants])
  const inactive = useMemo(() => tenants.filter(t => t.status !== 'active'), [tenants])

  if (loading) return <PageHead title="Inquilinos" subtitle="A carregar…" />

  return (
    <>
      <PageHead
        title="Inquilinos"
        subtitle={`${active.length} ativos · ${inactive.length} saídas`}
        action={
          <Button variant="primary" disabled={properties.length === 0} onClick={() => setEditing('new')}>
            + Adicionar inquilino
          </Button>
        }
      />

      {tenants.length === 0 ? (
        <Empty icon="☺" title="Nenhum inquilino ainda." subtitle={properties.length === 0 ? 'Adiciona primeiro um apartamento.' : undefined} />
      ) : (
        <div className="card tilt p-1.5 overflow-x-auto">
          <table className="w-full text-[13.5px] border-collapse">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[var(--ink-3)] text-left">
                <th className="p-3.5 font-bold">Nome</th>
                <th className="p-3.5 font-bold">Apartamento</th>
                <th className="p-3.5 font-bold">Cama</th>
                <th className="p-3.5 font-bold">Renda</th>
                <th className="p-3.5 font-bold">Contrato</th>
                <th className="p-3.5 font-bold">Senhorio avisado</th>
                <th className="p-3.5 font-bold">Onboarding</th>
                <th className="p-3.5 font-bold">Risco</th>
              </tr>
            </thead>
            <tbody>
              {active.map(t => {
                const p = propById(t.property_id)
                const ob = onboardingOf(t.id)
                const doneCount = ob ? STEPS.filter(s => ob[s.key as keyof Onboarding]).length : 0
                return (
                  <tr key={t.id} className="cursor-pointer hover:bg-blue-500/5 border-t border-black/5 dark:border-white/5" onClick={() => setEditing(t)}>
                    <td className="p-3.5">
                      <span className="font-semibold">{t.name}</span><br />
                      <span className="text-[var(--ink-3)] text-xs">{t.contact}</span>
                    </td>
                    <td className="p-3.5">{p?.name ?? '—'}</td>
                    <td className="p-3.5 text-[var(--ink-3)]">{bedLabel(t.property_id, t.bed_id)}</td>
                    <td className="p-3.5" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(t.rent)}</td>
                    <td className="p-3.5 text-[var(--ink-3)] text-xs">{t.contract_end ? fmtDate(t.contract_end) : '—'}</td>
                    <td className="p-3.5">{ob?.landlord_notified ? <Pill tone="green">Sim ✓</Pill> : <Pill tone="red">Pendente</Pill>}</td>
                    <td className="p-3.5" onClick={e => e.stopPropagation()}>
                      <button className="link text-xs" onClick={() => setChecklistFor(t)}>{doneCount}/6 · Checklist</button>
                    </td>
                    <td className="p-3.5">
                      {(() => {
                        const late = lateCount(t.id, payments)
                        if (late === 0) return <span className="text-[var(--ink-3)] text-xs">—</span>
                        return <Pill tone={late >= 3 ? 'red' : 'amber'}>⚠ {late}x atraso{late > 1 ? 's' : ''}</Pill>
                      })()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {inactive.length > 0 && (
        <>
          <div className="text-[13px] font-bold uppercase tracking-wide text-[var(--ink-3)] mt-8 mb-3.5">Saídas</div>
          <div className="card p-1.5 overflow-x-auto">
            <table className="w-full text-[13.5px] border-collapse">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-[var(--ink-3)] text-left">
                  <th className="p-3.5 font-bold">Nome</th>
                  <th className="p-3.5 font-bold">Apartamento</th>
                  <th className="p-3.5 font-bold">Saiu</th>
                  <th className="p-3.5 font-bold">Caução</th>
                  <th className="p-3.5 font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {inactive.map(t => {
                  const p = propById(t.property_id)
                  return (
                    <tr key={t.id} className="border-t border-black/5 dark:border-white/5">
                      <td className="p-3.5 font-semibold">{t.name}</td>
                      <td className="p-3.5">{p?.name ?? '—'}</td>
                      <td className="p-3.5 text-[var(--ink-3)]">{fmtDate(t.move_out)}</td>
                      <td className="p-3.5">
                        {t.deposit_returned ? <Pill tone="green">Devolvida</Pill> : (
                          <button className="link text-xs" onClick={async () => { await setDepositReturned(t.id, true); refresh(); toast('Caução marcada como devolvida') }}>
                            {eur(t.deposit)} · marcar devolvida
                          </button>
                        )}
                      </td>
                      <td className="p-3.5">
                        <button className="link text-xs" onClick={async () => { await reactivateTenant(t.id); refresh(); toast('Inquilino reativado') }}>Reativar</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editing && (
        <TenantModal
          tenant={editing === 'new' ? null : editing}
          properties={properties}
          activeTenants={active}
          onClose={() => setEditing(null)}
          onSaved={async () => { await refresh(); setEditing(null) }}
          toast={toast}
        />
      )}
      {checklistFor && (
        <ChecklistModal
          tenant={checklistFor}
          onboarding={onboardingOf(checklistFor.id) ?? null}
          onClose={() => setChecklistFor(null)}
          onChanged={refresh}
        />
      )}
    </>
  )
}

function TenantModal({ tenant, properties, activeTenants, onClose, onSaved, toast }: {
  tenant: Tenant | null; properties: Property[]; activeTenants: Tenant[]
  onClose: () => void; onSaved: () => void; toast: (m: string) => void
}) {
  const [form, setForm] = useState<TenantInput>(
    tenant ? {
      property_id: tenant.property_id, bed_id: tenant.bed_id, name: tenant.name, contact: tenant.contact ?? '',
      rent: tenant.rent, deposit: tenant.deposit, move_in: tenant.move_in ?? '', contract_end: tenant.contract_end ?? '',
      notes: tenant.notes ?? '',
      guarantor_name: tenant.guarantor_name ?? '', guarantor_contact: tenant.guarantor_contact ?? '',
      guarantor_relationship: tenant.guarantor_relationship ?? '',
    } : { ...emptyForm, property_id: properties[0]?.id ?? '' }
  )
  const [saving, setSaving] = useState(false)

  const set = (k: keyof TenantInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'number' ? +e.target.value : e.target.value }))

  const selectedProperty = properties.find(p => p.id === form.property_id)
  const occupiedBedIds = new Set(activeTenants.filter(t => t.id !== tenant?.id).map(t => t.bed_id))

  const save = async () => {
    if (!form.name) { toast('Indica o nome do inquilino'); return }
    setSaving(true)
    try {
      const data = { ...form, bed_id: form.bed_id || null }
      if (tenant) await updateTenant(tenant.id, data)
      else await createTenant(data)
      toast(tenant ? 'Inquilino atualizado' : 'Inquilino adicionado')
      onSaved()
    } catch (e) {
      toast('Erro ao guardar: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const checkout = async () => {
    if (!tenant) return
    if (!confirm('Marcar este inquilino como saído? A cama fica livre.')) return
    await checkoutTenant(tenant.id, todayISO())
    toast('Saída registada · lembra-te de devolver a caução')
    onSaved()
  }

  return (
    <Modal
      title={tenant ? 'Editar inquilino' : 'Novo inquilino'}
      onClose={onClose}
      footer={<>
        {tenant && <Button variant="danger" onClick={checkout}>Marcar saída</Button>}
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" disabled={saving} onClick={save}>Guardar</Button>
      </>}
    >
      <Field label="Nome completo"><Input value={form.name} onChange={set('name')} /></Field>
      <Field label="Contacto (com indicativo, ex: +351912345678)"><Input value={form.contact ?? ''} onChange={set('contact')} placeholder="+351912345678" /></Field>
      <FieldRow>
        <Field label="Apartamento">
          <Select value={form.property_id} onChange={e => setForm(f => ({ ...f, property_id: e.target.value, bed_id: null }))}>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Cama">
          <Select value={form.bed_id ?? ''} onChange={set('bed_id')}>
            <option value="">— Sem cama —</option>
            {selectedProperty?.beds.map(b => (
              <option key={b.id} value={b.id} disabled={occupiedBedIds.has(b.id) && b.id !== tenant?.bed_id}>
                {b.label}{occupiedBedIds.has(b.id) && b.id !== tenant?.bed_id ? ' (ocupada)' : ''}
              </option>
            ))}
          </Select>
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="Renda (€/mês)"><Input type="number" value={form.rent} onChange={set('rent')} placeholder="350" /></Field>
        <Field label="Caução (€)"><Input type="number" value={form.deposit} onChange={set('deposit')} placeholder="700" /></Field>
      </FieldRow>
      <FieldRow>
        <Field label="Data de entrada"><Input type="date" value={form.move_in ?? ''} onChange={set('move_in')} /></Field>
        <Field label="Fim do contrato"><Input type="date" value={form.contract_end ?? ''} onChange={set('contract_end')} /></Field>
      </FieldRow>
      {tenant && <DocumentsSection tenantId={tenant.id} />}
      {tenant && <InspectionsSection tenantId={tenant.id} />}
      <div className="text-xs font-bold uppercase tracking-wide text-[var(--ink-3)] mb-2 mt-1">Fiador / garante (opcional)</div>
      <FieldRow>
        <Field label="Nome do fiador"><Input value={form.guarantor_name ?? ''} onChange={set('guarantor_name')} /></Field>
        <Field label="Relação"><Input value={form.guarantor_relationship ?? ''} onChange={set('guarantor_relationship')} placeholder="Pai, mãe, amigo…" /></Field>
      </FieldRow>
      <Field label="Contacto do fiador"><Input value={form.guarantor_contact ?? ''} onChange={set('guarantor_contact')} placeholder="Telefone ou email" /></Field>
      <Field label="Notas">
        <textarea
          value={form.notes ?? ''} onChange={set('notes')} placeholder="Documentos, referências, observações…"
          className="w-full rounded-[13px] border border-black/10 dark:border-white/10 bg-white/75 dark:bg-white/5 px-3.5 py-3 text-sm min-h-24 resize-y"
        />
      </Field>
    </Modal>
  )
}

function ChecklistModal({ tenant, onboarding, onClose, onChanged }: {
  tenant: Tenant; onboarding: Onboarding | null; onClose: () => void; onChanged: () => void
}) {
  const toggle = async (key: keyof OnboardingPatch, value: boolean) => {
    await updateOnboarding(tenant.id, { [key]: value })
    onChanged()
  }

  return (
    <Modal title={`Onboarding · ${tenant.name}`} onClose={onClose} footer={<Button variant="primary" onClick={onClose}>Concluído</Button>}>
      <p className="text-[13px] text-[var(--ink-3)] font-medium mb-4">6 passos para formalizar a entrada do inquilino.</p>
      {STEPS.map(step => {
        const checked = onboarding ? !!onboarding[step.key as keyof Onboarding] : false
        return (
          <label key={step.key} className="flex items-center gap-3 px-3.5 py-3 bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-[13px] mb-2 cursor-pointer">
            <input
              type="checkbox" checked={checked} onChange={e => toggle(step.key, e.target.checked)}
              className="w-[18px] h-[18px] accent-[var(--color-blue)]"
            />
            <span className="text-sm font-medium">{step.label}</span>
          </label>
        )
      })}
    </Modal>
  )
}
