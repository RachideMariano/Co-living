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

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function Reports() {
  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  useEffect(() => {
    Promise.all([listProperties(), listTenants(), listPayments(), listExpenses()]).then(([p, t, pay, exp]) => {
      setProperties(p); setTenants(t); setPayments(pay); setExpenses(exp); setLoading(false)
    })
  }, [])

  const rows = useMemo(() => properties.map(p => {
    const propTenantIds = new Set(tenants.filter(t => t.property_id === p.id).map(t => t.id))
    const collected = payments
      .filter(pay => pay.year === year && pay.month === month && pay.status === 'paid' && propTenantIds.has(pay.tenant_id))
      .reduce((s, pay) => s + pay.amount, 0)
    const propExpenses = expenses
      .filter(e => e.property_id === p.id && e.date.startsWith(`${year}-${String(month).padStart(2, '0')}`))
      .reduce((s, e) => s + e.amount, 0)
    const margin = collected - (p.head_rent || 0) - (p.utilities || 0) - propExpenses
    return { property: p, collected, headRent: p.head_rent || 0, utilities: p.utilities || 0, expenses: propExpenses, margin }
  }), [properties, tenants, payments, expenses, year, month])

  const totals = rows.reduce((acc, r) => ({
    collected: acc.collected + r.collected, headRent: acc.headRent + r.headRent,
    utilities: acc.utilities + r.utilities, expenses: acc.expenses + r.expenses, margin: acc.margin + r.margin,
  }), { collected: 0, headRent: 0, utilities: 0, expenses: 0, margin: 0 })

  const exportCsv = () => {
    downloadCsv(
      `pnl_${year}-${String(month).padStart(2, '0')}.csv`,
      ['Apartamento', 'Receita cobrada', 'Renda ao senhorio', 'Utilities', 'Despesas', 'Margem'],
      rows.map(r => [r.property.name, r.collected, r.headRent, r.utilities, r.expenses, r.margin])
    )
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
                <th className="p-3.5 font-bold text-right">Utilities</th>
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
                  <td className="p-3.5 text-right text-[var(--ink-3)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(r.utilities)}</td>
                  <td className="p-3.5 text-right text-[var(--ink-3)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(r.expenses)}</td>
                  <td className="p-3.5 text-right font-extrabold" style={{ color: r.margin >= 0 ? '#1f9d4d' : 'var(--color-red)', fontVariantNumeric: 'tabular-nums' }}>{eur(r.margin)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-black/10 dark:border-white/10 font-bold">
                <td className="p-3.5">Total</td>
                <td className="p-3.5 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(totals.collected)}</td>
                <td className="p-3.5 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(totals.headRent)}</td>
                <td className="p-3.5 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(totals.utilities)}</td>
                <td className="p-3.5 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(totals.expenses)}</td>
                <td className="p-3.5 text-right" style={{ color: totals.margin >= 0 ? '#1f9d4d' : 'var(--color-red)', fontVariantNumeric: 'tabular-nums' }}>{eur(totals.margin)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-[var(--ink-3)] font-medium mt-3">Receita cobrada = rendas marcadas como pagas nesse mês (grelha de Pagamentos). Recibos fiscais oficiais emitem-se no Portal das Finanças — isto é só um relatório interno.</p>
    </>
  )
}
