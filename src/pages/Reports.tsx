import { useEffect, useMemo, useState } from 'react'
import PageHead from '../components/PageHead'
import Empty from '../components/Empty'
import { Button } from '../components/Button'
import { Select } from '../components/Field'
import { eur } from '../lib/format'
import { downloadCsv } from '../lib/csv'
import { listProperties, type Property } from '../lib/api/properties'
import { listTenants, type Tenant } from '../lib/api/tenants'
import { listPayments, type Payment } from '../lib/api/payments'
import { listExpenses, type Expense } from '../lib/api/expenses'
import { listUtilityBills, setUtilityBill, type UtilityBill } from '../lib/api/utilityBills'
import { Input } from '../components/Field'

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function Reports() {
  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [utilityBills, setUtilityBills] = useState<UtilityBill[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const refresh = async () => {
    const [p, t, pay, exp, ub] = await Promise.all([listProperties(), listTenants(), listPayments(), listExpenses(), listUtilityBills()])
    setProperties(p); setTenants(t); setPayments(pay); setExpenses(exp); setUtilityBills(ub); setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  const rows = useMemo(() => properties.map(p => {
    const propTenantIds = new Set(tenants.filter(t => t.property_id === p.id).map(t => t.id))
    const collected = payments
      .filter(pay => pay.year === year && pay.month === month && pay.status === 'paid' && propTenantIds.has(pay.tenant_id))
      .reduce((s, pay) => s + pay.amount, 0)
    const propExpenses = expenses
      .filter(e => e.property_id === p.id && e.date.startsWith(`${year}-${String(month).padStart(2, '0')}`))
      .reduce((s, e) => s + e.amount, 0)
    const bill = utilityBills.find(b => b.property_id === p.id && b.year === year && b.month === month)
    const utilitiesReal = bill?.amount ?? p.utilities ?? 0
    const margin = collected - (p.head_rent || 0) - utilitiesReal - propExpenses
    return {
      property: p, collected, headRent: p.head_rent || 0,
      utilitiesEstimate: p.utilities || 0, utilitiesReal, hasBill: !!bill,
      expenses: propExpenses, margin,
    }
  }), [properties, tenants, payments, expenses, utilityBills, year, month])

  const totals = rows.reduce((acc, r) => ({
    collected: acc.collected + r.collected, headRent: acc.headRent + r.headRent,
    utilities: acc.utilities + r.utilitiesReal, expenses: acc.expenses + r.expenses, margin: acc.margin + r.margin,
  }), { collected: 0, headRent: 0, utilities: 0, expenses: 0, margin: 0 })

  const exportCsv = () => {
    downloadCsv(
      `pnl_${year}-${String(month).padStart(2, '0')}.csv`,
      ['Apartamento', 'Receita cobrada', 'Renda ao senhorio', 'Utilities (estimado)', 'Utilities (real)', 'Despesas', 'Margem'],
      rows.map(r => [r.property.name, r.collected, r.headRent, r.utilitiesEstimate, r.utilitiesReal, r.expenses, r.margin])
    )
  }

  const saveUtilityBill = async (propertyId: string, amount: number) => {
    await setUtilityBill(propertyId, year, month, amount)
    refresh()
  }

  if (loading) return <PageHead title="Relatórios" subtitle="A carregar…" />

  return (
    <>
      <PageHead
        title="Relatórios"
        subtitle="P&L mensal por apartamento"
        action={
          <div className="flex gap-2 items-center flex-wrap">
            <Select value={month} onChange={e => setMonth(+e.target.value)} className="w-auto">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </Select>
            <Select value={year} onChange={e => setYear(+e.target.value)} className="w-auto">
              {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
            <Button onClick={exportCsv} disabled={rows.length === 0}>Exportar CSV</Button>
          </div>
        }
      />

      {rows.length === 0 ? (
        <Empty icon="📊" title="Sem apartamentos para reportar." />
      ) : (
        <div className="card tilt p-1.5 overflow-x-auto">
          <table className="w-full text-[13.5px] border-collapse">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[var(--ink-3)] text-left">
                <th className="p-3.5 font-bold">Apartamento</th>
                <th className="p-3.5 font-bold text-right">Receita cobrada</th>
                <th className="p-3.5 font-bold text-right">Renda</th>
                <th className="p-3.5 font-bold text-right">Utilities (estimado)</th>
                <th className="p-3.5 font-bold text-right">Utilities (real)</th>
                <th className="p-3.5 font-bold text-right">Despesas</th>
                <th className="p-3.5 font-bold text-right">Margem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.property.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="p-3.5 font-semibold">{r.property.name}</td>
                  <td className="p-3.5 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(r.collected)}</td>
                  <td className="p-3.5 text-right text-[var(--ink-3)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(r.headRent)}</td>
                  <td className="p-3.5 text-right text-[var(--ink-3)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(r.utilitiesEstimate)}</td>
                  <td className="p-3.5 text-right">
                    <UtilityBillCell value={r.utilitiesReal} hasBill={r.hasBill} onSave={amount => saveUtilityBill(r.property.id, amount)} />
                  </td>
                  <td className="p-3.5 text-right text-[var(--ink-3)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(r.expenses)}</td>
                  <td className="p-3.5 text-right font-extrabold" style={{ color: r.margin >= 0 ? '#1f9d4d' : 'var(--color-red)', fontVariantNumeric: 'tabular-nums' }}>{eur(r.margin)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-black/10 dark:border-white/10 font-bold">
                <td className="p-3.5">Total</td>
                <td className="p-3.5 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(totals.collected)}</td>
                <td className="p-3.5 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(totals.headRent)}</td>
                <td className="p-3.5 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>—</td>
                <td className="p-3.5 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(totals.utilities)}</td>
                <td className="p-3.5 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(totals.expenses)}</td>
                <td className="p-3.5 text-right" style={{ color: totals.margin >= 0 ? '#1f9d4d' : 'var(--color-red)', fontVariantNumeric: 'tabular-nums' }}>{eur(totals.margin)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-[var(--ink-3)] font-medium mt-3">Receita cobrada = rendas marcadas como pagas nesse mês (grelha de Pagamentos). "Utilities (real)" é editável — clica no valor para lançar a fatura real do mês; sem fatura lançada, a margem usa a estimativa. Recibos fiscais oficiais emitem-se no Portal das Finanças — isto é só um relatório interno.</p>
    </>
  )
}

function UtilityBillCell({ value, hasBill, onSave }: { value: number; hasBill: boolean; onSave: (amount: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(value))

  if (editing) {
    return (
      <Input
        type="number" autoFocus value={val} onChange={e => setVal(e.target.value)}
        onBlur={() => { setEditing(false); onSave(+val || 0) }}
        onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); onSave(+val || 0) } }}
        className="w-24 text-right ml-auto"
      />
    )
  }
  return (
    <button className="link" style={{ fontVariantNumeric: 'tabular-nums' }} onClick={() => { setVal(String(value)); setEditing(true) }}>
      {eur(value)}{!hasBill && <span className="text-[var(--ink-3)]"> (est.)</span>}
    </button>
  )
}
