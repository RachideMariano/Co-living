import { useEffect, useState } from 'react'
import PageHead from '../components/PageHead'
import Empty from '../components/Empty'
import Pill from '../components/Pill'
import { Button } from '../components/Button'
import Modal from '../components/Modal'
import { Field, FieldRow, Input, Select } from '../components/Field'
import { useToast } from '../context/ToastContext'
import { eur, fmtDate } from '../lib/format'
import { listProperties, type Property } from '../lib/api/properties'
import {
  closeTicket, createTicket, deleteTicket, listMaintenanceTickets, setTicketStatus, updateTicket,
  type MaintenanceInput, type MaintenanceTicket,
} from '../lib/api/maintenance'
import {
  createMaintenanceSchedule, deleteMaintenanceSchedule, listMaintenanceSchedules, markScheduleDone, updateMaintenanceSchedule,
  type MaintenanceSchedule, type MaintenanceScheduleInput,
} from '../lib/api/maintenanceSchedules'
import { daysBetween, todayISO } from '../lib/format'

const statusTone = { open: 'red', in_progress: 'amber', done: 'green' } as const
const statusLabel = { open: 'Aberto', in_progress: 'Em curso', done: 'Concluído' } as const

const emptyForm: MaintenanceInput = { property_id: '', title: '', description: '', priority: 'normal', cost: null }
const emptyScheduleForm: MaintenanceScheduleInput = { property_id: '', title: '', frequency_months: 12, next_due: todayISO(), notes: '' }

export default function Maintenance() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<MaintenanceTicket | null | 'new'>(null)
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null | 'new'>(null)
  const toast = useToast()

  const refresh = async () => {
    const [t, p, sch] = await Promise.all([listMaintenanceTickets(), listProperties(), listMaintenanceSchedules()])
    setTickets(t); setProperties(p); setSchedules(sch); setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  const propById = (id: string) => properties.find(p => p.id === id)

  const advance = async (t: MaintenanceTicket) => {
    if (t.status === 'open') { await setTicketStatus(t.id, 'in_progress'); refresh() }
    else if (t.status === 'in_progress') { setEditing(t) } // fechar pede custo, abre modal
  }

  if (loading) return <PageHead title="Manutenção" subtitle="A carregar…" />

  return (
    <>
      <PageHead
        title="Manutenção"
        subtitle={`${tickets.filter(t => t.status !== 'done').length} tickets em aberto`}
        action={<Button variant="primary" disabled={properties.length === 0} onClick={() => setEditing('new')}>+ Novo ticket</Button>}
      />
      {tickets.length === 0 ? (
        <Empty icon="🔧" title="Nenhum ticket de manutenção." />
      ) : (
        <div className="card tilt p-1.5 overflow-x-auto">
          <table className="w-full text-[13.5px] border-collapse">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[var(--ink-3)] text-left">
                <th className="p-3.5 font-bold">Título</th>
                <th className="p-3.5 font-bold">Apartamento</th>
                <th className="p-3.5 font-bold">Prioridade</th>
                <th className="p-3.5 font-bold">Estado</th>
                <th className="p-3.5 font-bold">Aberto</th>
                <th className="p-3.5 font-bold">Custo</th>
                <th className="p-3.5 font-bold"></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id} className="border-t border-black/5 dark:border-white/5 cursor-pointer hover:bg-blue-500/5" onClick={() => setEditing(t)}>
                  <td className="p-3.5 font-semibold">{t.title}</td>
                  <td className="p-3.5">{propById(t.property_id)?.name ?? '—'}</td>
                  <td className="p-3.5">{t.priority === 'urgent' ? <Pill tone="red">Urgente</Pill> : <Pill tone="gray">Normal</Pill>}</td>
                  <td className="p-3.5"><Pill tone={statusTone[t.status]}>{statusLabel[t.status]}</Pill></td>
                  <td className="p-3.5 text-[var(--ink-3)] text-xs">{fmtDate(t.opened_at)}</td>
                  <td className="p-3.5" style={{ fontVariantNumeric: 'tabular-nums' }}>{t.cost ? eur(t.cost) : '—'}</td>
                  <td className="p-3.5" onClick={e => e.stopPropagation()}>
                    {t.status !== 'done' && (
                      <button className="link text-xs" onClick={() => advance(t)}>
                        {t.status === 'open' ? 'Iniciar' : 'Fechar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between items-end mt-9 mb-3.5">
        <div className="text-[13px] font-bold uppercase tracking-wide text-[var(--ink-3)]">Manutenção preventiva</div>
        <Button disabled={properties.length === 0} onClick={() => setEditingSchedule('new')}>+ Novo agendamento</Button>
      </div>
      {schedules.length === 0 ? (
        <p className="text-[13px] text-[var(--ink-3)] font-medium">Sem manutenções recorrentes agendadas (ex: extintores, caldeira).</p>
      ) : (
        <div className="card p-1.5 overflow-x-auto">
          <table className="w-full text-[13.5px] border-collapse">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[var(--ink-3)] text-left">
                <th className="p-3.5 font-bold">Título</th>
                <th className="p-3.5 font-bold">Apartamento</th>
                <th className="p-3.5 font-bold">Frequência</th>
                <th className="p-3.5 font-bold">Próxima</th>
                <th className="p-3.5 font-bold"></th>
              </tr>
            </thead>
            <tbody>
              {schedules.map(s => {
                const overdue = daysBetween(todayISO(), s.next_due) < 0
                return (
                  <tr key={s.id} className="border-t border-black/5 dark:border-white/5 cursor-pointer hover:bg-blue-500/5" onClick={() => setEditingSchedule(s)}>
                    <td className="p-3.5 font-semibold">{s.title}</td>
                    <td className="p-3.5">{propById(s.property_id)?.name ?? '—'}</td>
                    <td className="p-3.5 text-[var(--ink-3)]">a cada {s.frequency_months} meses</td>
                    <td className="p-3.5">{overdue ? <Pill tone="red">{fmtDate(s.next_due)}</Pill> : <span className="text-[var(--ink-3)] text-xs">{fmtDate(s.next_due)}</span>}</td>
                    <td className="p-3.5" onClick={e => e.stopPropagation()}>
                      <button className="link text-xs" onClick={async () => { await markScheduleDone(s); refresh(); toast('Marcado como feito ✓') }}>Marcar feito</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <TicketModal
          ticket={editing === 'new' ? null : editing}
          properties={properties}
          onClose={() => setEditing(null)}
          onSaved={async () => { await refresh(); setEditing(null) }}
          toast={toast}
        />
      )}
      {editingSchedule && (
        <ScheduleModal
          schedule={editingSchedule === 'new' ? null : editingSchedule}
          properties={properties}
          onClose={() => setEditingSchedule(null)}
          onSaved={async () => { await refresh(); setEditingSchedule(null) }}
          toast={toast}
        />
      )}
    </>
  )
}

function ScheduleModal({ schedule, properties, onClose, onSaved, toast }: {
  schedule: MaintenanceSchedule | null; properties: Property[]; onClose: () => void; onSaved: () => void; toast: (m: string) => void
}) {
  const [form, setForm] = useState<MaintenanceScheduleInput>(
    schedule ? {
      property_id: schedule.property_id, title: schedule.title, frequency_months: schedule.frequency_months,
      next_due: schedule.next_due, notes: schedule.notes ?? '',
    } : { ...emptyScheduleForm, property_id: properties[0]?.id ?? '' }
  )
  const [saving, setSaving] = useState(false)

  const set = (k: keyof MaintenanceScheduleInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'number' ? +e.target.value : e.target.value }))

  const save = async () => {
    if (!form.title) { toast('Dá um título ao agendamento'); return }
    setSaving(true)
    try {
      if (schedule) await updateMaintenanceSchedule(schedule.id, form)
      else await createMaintenanceSchedule(form)
      toast(schedule ? 'Agendamento atualizado' : 'Agendamento criado')
      onSaved()
    } catch (e) {
      toast('Erro ao guardar: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!schedule) return
    if (!confirm('Eliminar este agendamento?')) return
    await deleteMaintenanceSchedule(schedule.id)
    toast('Agendamento eliminado')
    onSaved()
  }

  return (
    <Modal
      title={schedule ? 'Editar agendamento' : 'Novo agendamento recorrente'}
      onClose={onClose}
      footer={<>
        {schedule && <Button variant="danger" onClick={remove}>Eliminar</Button>}
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" disabled={saving} onClick={save}>Guardar</Button>
      </>}
    >
      <Field label="Título"><Input value={form.title} onChange={set('title')} placeholder="Ex: Revisão da caldeira" /></Field>
      <FieldRow>
        <Field label="Apartamento">
          <Select value={form.property_id} onChange={set('property_id')}>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Frequência (meses)"><Input type="number" value={form.frequency_months} onChange={set('frequency_months')} /></Field>
      </FieldRow>
      <Field label="Próxima data"><Input type="date" value={form.next_due} onChange={set('next_due')} /></Field>
      <Field label="Notas">
        <textarea
          value={form.notes ?? ''} onChange={set('notes')}
          className="w-full rounded-[13px] border border-black/10 dark:border-white/10 bg-white/75 dark:bg-white/5 px-3.5 py-3 text-sm min-h-20 resize-y"
        />
      </Field>
    </Modal>
  )
}

function TicketModal({ ticket, properties, onClose, onSaved, toast }: {
  ticket: MaintenanceTicket | null; properties: Property[]; onClose: () => void; onSaved: () => void; toast: (m: string) => void
}) {
  const [form, setForm] = useState<MaintenanceInput>(
    ticket ? {
      property_id: ticket.property_id, title: ticket.title, description: ticket.description ?? '',
      priority: ticket.priority, cost: ticket.cost,
    } : { ...emptyForm, property_id: properties[0]?.id ?? '' }
  )
  const [saving, setSaving] = useState(false)

  const set = (k: keyof MaintenanceInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'number' ? (e.target.value === '' ? null : +e.target.value) : e.target.value }))

  const save = async () => {
    if (!form.title) { toast('Dá um título ao ticket'); return }
    setSaving(true)
    try {
      if (ticket) await updateTicket(ticket.id, form)
      else await createTicket(form)
      toast(ticket ? 'Ticket atualizado' : 'Ticket criado')
      onSaved()
    } catch (e) {
      toast('Erro ao guardar: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const close = async () => {
    if (!ticket) return
    if (!confirm(ticket.cost ? `Fechar o ticket e lançar despesa de ${eur(ticket.cost)}?` : 'Fechar este ticket?')) return
    await closeTicket({ ...ticket, ...form })
    toast('Ticket concluído' + (ticket.cost ? ' · despesa lançada' : ''))
    onSaved()
  }

  const remove = async () => {
    if (!ticket) return
    if (!confirm('Eliminar este ticket?')) return
    await deleteTicket(ticket.id)
    toast('Ticket eliminado')
    onSaved()
  }

  return (
    <Modal
      title={ticket ? 'Editar ticket' : 'Novo ticket'}
      onClose={onClose}
      footer={<>
        {ticket && <Button variant="danger" onClick={remove}>Eliminar</Button>}
        {ticket && ticket.status !== 'done' && <Button onClick={close}>Fechar ticket</Button>}
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" disabled={saving} onClick={save}>Guardar</Button>
      </>}
    >
      <Field label="Título"><Input value={form.title} onChange={set('title')} placeholder="Ex: Fuga na torneira da cozinha" /></Field>
      <FieldRow>
        <Field label="Apartamento">
          <Select value={form.property_id} onChange={set('property_id')}>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Prioridade">
          <Select value={form.priority ?? 'normal'} onChange={set('priority')}>
            <option value="normal">Normal</option>
            <option value="urgent">Urgente</option>
          </Select>
        </Field>
      </FieldRow>
      <Field label="Descrição">
        <textarea
          value={form.description ?? ''} onChange={set('description')}
          className="w-full rounded-[13px] border border-black/10 dark:border-white/10 bg-white/75 dark:bg-white/5 px-3.5 py-3 text-sm min-h-24 resize-y"
        />
      </Field>
      <Field label="Custo (€) — opcional, lança despesa ao fechar"><Input type="number" value={form.cost ?? ''} onChange={set('cost')} placeholder="0" /></Field>
    </Modal>
  )
}
