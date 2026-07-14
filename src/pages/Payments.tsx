import { useEffect, useMemo, useState } from 'react'
import PageHead from '../components/PageHead'
import Empty from '../components/Empty'
import { Select } from '../components/Field'
import { useToast } from '../context/ToastContext'
import { eur, monthKey } from '../lib/format'
import { listTenants, type Tenant } from '../lib/api/tenants'
import { listProperties, type Property } from '../lib/api/properties'
import { listPayments, togglePayment, markMonthPaid, type Payment } from '../lib/api/payments'
import type { PaymentStatus } from '../lib/database.types'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const cellCls: Record<PaymentStatus, string> = {
  paid: 'bg-[linear-gradient(150deg,rgba(48,209,88,.24),rgba(48,209,88,.1))] text-[#1f8f43]',
  pending: 'bg-black/[.06] dark:bg-white/10 text-[var(--ink-3)]',
  late: 'bg-[linear-gradient(150deg,rgba(255,69,58,.22),rgba(255,69,58,.1))] text-[#d0342b]',
}
const cellSym: Record<PaymentStatus, string> = { paid: '✓', pending: '·', late: '!' }

export default function Payments() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [payYear, setPayYear] = useState(new Date().getFullYear())
  const toast = useToast()

  const refresh = async () => {
    const [t, p, pay] = await Promise.all([listTenants(), listProperties(), listPayments()])
    setTenants(t); setProperties(p); setPayments(pay)
    setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  const active = useMemo(() => tenants.filter(t => t.status === 'active'), [tenants])
  const propById = (id: string) => properties.find(p => p.id === id)
  const paymentFor = (tenantId: string, year: number, month: number) => payments.find(p => p.tenant_id === tenantId && p.year === year && p.month === month)

  const cm = monthKey(new Date())
  const [cmYear, cmMonth] = cm.split('-').map(Number)
  const { totalCollected, totalExpected } = useMemo(() => {
    let collected = 0, expected = 0
    active.forEach(t => {
      expected += t.rent || 0
      const p = paymentFor(t.id, cmYear, cmMonth)
      if (p?.status === 'paid') collected += t.rent || 0
    })
    return { totalCollected: collected, totalExpected: expected }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, payments])

  const onToggle = async (tenantId: string, year: number, month: number, amount: number) => {
    const current = paymentFor(tenantId, year, month)?.status ?? 'pending'
    await togglePayment(tenantId, year, month, current, amount)
    refresh()
  }

  const onMarkMonth = async (month: number) => {
    await Promise.all(active.map(t => markMonthPaid(t.id, payYear, month, t.rent)))
    refresh()
    toast('Mês marcado como pago para todos')
  }

  if (loading) return <PageHead title="Pagamentos" subtitle="A carregar…" />

  return (
    <>
      <PageHead
        title="Pagamentos"
        subtitle="Toca numa célula: pendente → pago → atrasado"
        action={
          <Select value={payYear} onChange={e => setPayYear(+e.target.value)} className="w-auto">
            {[payYear - 1, payYear, payYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
        }
      />

      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
        <Kpi label="Recebido este mês" value={eur(totalCollected)} color="#1f9d4d" sub={`de ${eur(totalExpected)} esperado`} />
        <Kpi label="Em falta" value={eur(totalExpected - totalCollected)} color={totalExpected - totalCollected > 0 ? 'var(--color-red)' : undefined} sub={cm} />
        <Kpi label="Taxa de cobrança" value={`${totalExpected ? Math.round(totalCollected / totalExpected * 100) : 0}%`} sub="este mês" />
      </div>

      {active.length === 0 ? (
        <Empty icon="€" title="Sem inquilinos ativos." />
      ) : (
        <>
          <div className="card tilt p-1.5 overflow-x-auto">
            <table className="w-full text-[13.5px] border-collapse">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-[var(--ink-3)] text-left">
                  <th className="p-3.5 font-bold sticky left-0 bg-white/90 dark:bg-[#222]/90 backdrop-blur-sm">Inquilino</th>
                  {MONTHS.map((m, i) => (
                    <th key={m} className="p-1.5 font-bold text-center">
                      <div>{m}</div>
                      <button className="link text-[10px] font-semibold normal-case" onClick={() => onMarkMonth(i + 1)}>tudo pago</button>
                    </th>
                  ))}
                  <th className="p-3.5 font-bold text-right">Total {payYear}</th>
                </tr>
              </thead>
              <tbody>
                {active.map(t => {
                  let yearTotal = 0
                  const p = propById(t.property_id)
                  return (
                    <tr key={t.id} className="border-t border-black/5 dark:border-white/5">
                      <td className="p-3.5 sticky left-0 bg-white/90 dark:bg-[#222]/90 backdrop-blur-sm">
                        <span className="font-semibold">{t.name}</span><br />
                        <span className="text-[var(--ink-3)] text-[11px]">{p?.name ?? ''}</span>
                      </td>
                      {MONTHS.map((_, i) => {
                        const month = i + 1
                        const st = paymentFor(t.id, payYear, month)?.status ?? 'pending'
                        if (st === 'paid') yearTotal += t.rent || 0
                        return (
                          <td key={month} className="text-center p-1.5">
                            <button
                              onClick={() => onToggle(t.id, payYear, month, t.rent)}
                              className={`inline-flex items-center justify-center w-[30px] h-[30px] rounded-[9px] font-bold text-[13px] transition-transform hover:scale-110 ${cellCls[st]}`}
                            >
                              {cellSym[st]}
                            </button>
                          </td>
                        )
                      })}
                      <td className="p-3.5 text-right font-extrabold" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(yearTotal)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--ink-3)] font-medium mt-3">✓ pago · <span className="opacity-70">·</span> pendente · ! atrasado</p>
        </>
      )}
    </>
  )
}

function Kpi({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="card p-5">
      <div className="text-[11.5px] uppercase tracking-wide font-bold text-[var(--ink-3)] mb-2">{label}</div>
      <div className="text-[30px] font-extrabold" style={{ color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div className="text-xs font-semibold text-[var(--ink-3)] mt-1">{sub}</div>}
    </div>
  )
}
