import { useEffect, useMemo, useState } from 'react'
import PageHead from '../components/PageHead'
import Empty from '../components/Empty'
import { Button } from '../components/Button'
import Modal from '../components/Modal'
import { Field, FieldRow, Input, Select } from '../components/Field'
import { useToast } from '../context/ToastContext'
import { eur, fmtDate, todayISO } from '../lib/format'
import { listProperties, type Property } from '../lib/api/properties'
import { createExpense, deleteExpense, listExpenses, updateExpense, type Expense, type ExpenseInput } from '../lib/api/expenses'

const CATEGORIES = ['Manutenção', 'Limpeza', 'Mobiliário', 'Internet/TV', 'Seguros', 'Outros']

const emptyForm: ExpenseInput = { property_id: '', category: CATEGORIES[0], description: '', amount: 0, date: todayISO() }

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Expense | null | 'new'>(null)
  const [filterProp, setFilterProp] = useState('')
  const toast = useToast()

  const refresh = async () => {
    const [e, p] = await Promise.all([listExpenses(), listProperties()])
    setExpenses(e); setProperties(p); setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  const propById = (id: string) => properties.find(p => p.id === id)
  const filtered = useMemo(() => filterProp ? expenses.filter(e => e.property_id === filterProp) : expenses, [expenses, filterProp])
  const total = filtered.reduce((s, e) => s + e.amount, 0)

  if (loading) return <PageHead title="Despesas" subtitle="A carregar…" />

  return (
    <>
      <PageHead
        title="Despesas"
        subtitle={`${filtered.length} despesas · ${eur(total)} no total`}
        action={<Button variant="primary" disabled={properties.length === 0} onClick={() => setEditing('new')}>+ Adicionar despesa</Button>}
      />

      {properties.length > 0 && (
        <div className="mb-4">
          <Select value={filterProp} onChange={e => setFilterProp(e.target.value)} className="w-auto">
            <option value="">Todos os apartamentos</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </div>
      )}

      {filtered.length === 0 ? (
        <Empty icon="📄" title="Nenhuma despesa registada." />
      ) : (
        <div className="card tilt p-1.5 overflow-x-auto">
          <table className="w-full text-[13.5px] border-collapse">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[var(--ink-3)] text-left">
                <th className="p-3.5 font-bold">Data</th>
                <th className="p-3.5 font-bold">Apartamento</th>
                <th className="p-3.5 font-bold">Categoria</th>
                <th className="p-3.5 font-bold">Descrição</th>
                <th className="p-3.5 font-bold">SOP</th>
                <th className="p-3.5 font-bold text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-t border-black/5 dark:border-white/5 cursor-pointer hover:bg-blue-500/5" onClick={() => setEditing(e)}>
                  <td className="p-3.5 text-[var(--ink-3)]">{fmtDate(e.date)}</td>
                  <td className="p-3.5">{propById(e.property_id)?.name ?? '—'}</td>
                  <td className="p-3.5">{e.category}{e.maintenance_id && <span className="text-[var(--ink-3)] text-xs"> · manutenção</span>}</td>
                  <td className="p-3.5 text-[var(--ink-3)]">{e.description || '—'}</td>
                  <td className="p-3.5">{e.sop_id ? <a href={`#/sops/${e.sop_id}`} className="link">Ver SOP</a> : '—'}</td>
                  <td className="p-3.5 text-right font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ExpenseModal
          expense={editing === 'new' ? null : editing}
          properties={properties}
          onClose={() => setEditing(null)}
          onSaved={async () => { await refresh(); setEditing(null) }}
          toast={toast}
        />
      )}
    </>
  )
}

function ExpenseModal({ expense, properties, onClose, onSaved, toast }: {
  expense: Expense | null; properties: Property[]; onClose: () => void; onSaved: () => void; toast: (m: string) => void
}) {
  const [form, setForm] = useState<ExpenseInput>(
    expense ? {
      property_id: expense.property_id, category: expense.category, description: expense.description ?? '',
      amount: expense.amount, date: expense.date,
    } : { ...emptyForm, property_id: properties[0]?.id ?? '' }
  )
  const [saving, setSaving] = useState(false)

  const set = (k: keyof ExpenseInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'number' ? +e.target.value : e.target.value }))

  const save = async () => {
    if (!form.amount) { toast('Indica o valor da despesa'); return }
    setSaving(true)
    try {
      if (expense) await updateExpense(expense.id, form)
      else await createExpense(form)
      toast(expense ? 'Despesa atualizada' : 'Despesa criada')
      onSaved()
    } catch (e) {
      toast('Erro ao guardar: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!expense) return
    if (!confirm('Eliminar esta despesa?')) return
    await deleteExpense(expense.id)
    toast('Despesa eliminada')
    onSaved()
  }

  return (
    <Modal
      title={expense ? 'Editar despesa' : 'Nova despesa'}
      onClose={onClose}
      footer={<>
        {expense && <Button variant="danger" onClick={remove}>Eliminar</Button>}
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" disabled={saving} onClick={save}>Guardar</Button>
      </>}
    >
      <FieldRow>
        <Field label="Apartamento">
          <Select value={form.property_id} onChange={set('property_id')}>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Categoria">
          <Select value={form.category} onChange={set('category')}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="Valor (€)"><Input type="number" value={form.amount} onChange={set('amount')} /></Field>
        <Field label="Data"><Input type="date" value={form.date} onChange={set('date')} /></Field>
      </FieldRow>
      <Field label="Descrição"><Input value={form.description ?? ''} onChange={set('description')} placeholder="Opcional" /></Field>
    </Modal>
  )
}
