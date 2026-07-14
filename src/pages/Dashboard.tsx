import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHead from '../components/PageHead'
import Empty from '../components/Empty'
import Pill from '../components/Pill'
import { Button } from '../components/Button'
import { useTilt } from '../hooks/useTilt'
import { eur } from '../lib/format'
import { occupancyOf, revenueOf, marginOf } from '../lib/business'
import { computeAlerts } from '../lib/alerts'
import { listProperties, type Property } from '../lib/api/properties'
import { listTenants, listActiveTenantsSummary, type ActiveTenantSummary, type Tenant } from '../lib/api/tenants'
import { listOnboarding, type Onboarding } from '../lib/api/onboarding'
import { listPayments, type Payment } from '../lib/api/payments'
import { listMaintenanceTickets, type MaintenanceTicket } from '../lib/api/maintenance'
import { listMaintenanceSchedules, type MaintenanceSchedule } from '../lib/api/maintenanceSchedules'

export default function Dashboard() {
  const [properties, setProperties] = useState<Property[]>([])
  const [activeTenants, setActiveTenants] = useState<ActiveTenantSummary[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [onboarding, setOnboarding] = useState<Onboarding[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const tilt = useTilt()
  const nav = useNavigate()

  useEffect(() => {
    Promise.all([
      listProperties(), listActiveTenantsSummary(), listTenants(), listOnboarding(), listPayments(), listMaintenanceTickets(), listMaintenanceSchedules(),
    ]).then(([p, at, t, ob, pay, tk, sch]) => {
      setProperties(p); setActiveTenants(at); setTenants(t); setOnboarding(ob); setPayments(pay); setTickets(tk); setSchedules(sch)
      setLoading(false)
    })
  }, [])

  if (loading) return <PageHead title="Dashboard" subtitle="A carregar…" />

  if (properties.length === 0) {
    return (
      <>
        <PageHead title="Dashboard" subtitle="Visão geral do teu negócio" />
        <Empty icon="⌂" title="Ainda não tens apartamentos." subtitle="Começa por adicionar o teu primeiro apartamento."
          action={<Button variant="primary" onClick={() => nav('/apartamentos')}>+ Adicionar apartamento</Button>} />
      </>
    )
  }

  const totalRev = properties.reduce((s, p) => s + revenueOf(p, activeTenants), 0)
  const totalRent = properties.reduce((s, p) => s + (p.head_rent || 0), 0)
  const totalUtil = properties.reduce((s, p) => s + (p.utilities || 0), 0)
  const totalMargin = totalRev - totalRent - totalUtil
  const totalBeds = properties.reduce((s, p) => s + p.beds.length, 0)
  const occBeds = activeTenants.length
  const occPct = totalBeds ? Math.round((occBeds / totalBeds) * 100) : 0
  const alerts = computeAlerts(properties, tenants, onboarding, payments, tickets, schedules)

  const months12 = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (11 - i))
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleDateString('pt-PT', { month: 'short' }) }
  })
  const chartData = months12.map(({ year, month, label }) => ({
    label,
    value: payments.filter(p => p.year === year && p.month === month && p.status === 'paid').reduce((s, p) => s + p.amount, 0),
  }))
  const chartMax = Math.max(...chartData.map(d => d.value), 1)

  return (
    <>
      <PageHead title="Dashboard" subtitle={`${properties.length} apartamentos · ${occBeds} inquilinos ativos`} />
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
        <Kpi label="Receita mensal" value={eur(totalRev)} sub={`${occBeds} camas ocupadas`} />
        <Kpi label="Custo total" value={eur(totalRent + totalUtil)} sub={`${eur(totalRent)} renda · ${eur(totalUtil)} util.`} />
        <Kpi label="Margem mensal" value={eur(totalMargin)} color={totalMargin >= 0 ? '#1f9d4d' : 'var(--color-red)'} sub="antes de impostos" />
        <Kpi label="Ocupação" value={`${occPct}%`} sub={`${occBeds}/${totalBeds} camas`} />
        <Kpi label="Alertas" value={String(alerts.length)} color={alerts.length > 0 ? '#f08b00' : undefined} sub={`${alerts.filter(a => a.level === 'urgent').length} urgentes`} />
      </div>

      {alerts.length > 0 && (
        <>
          <div className="text-[13px] font-bold uppercase tracking-wide text-[var(--ink-3)] mb-3.5">Precisa de atenção</div>
          {alerts.slice(0, 3).map((a, i) => (
            <div key={i} className="card flex items-start gap-3.5 p-[17px_19px] mb-3">
              <div className="text-lg">{a.ico}</div>
              <div>
                <div className="text-[14.5px] font-bold">{a.title}</div>
                <div className="text-[12.5px] text-[var(--ink-2)] font-medium mt-0.5">{a.desc}</div>
              </div>
            </div>
          ))}
          {alerts.length > 3 && (
            <div className="text-center mb-6">
              <button className="link" onClick={() => nav('/alertas')}>Ver todos os {alerts.length} alertas →</button>
            </div>
          )}
        </>
      )}

      <div className="text-[13px] font-bold uppercase tracking-wide text-[var(--ink-3)] mb-3.5">Receita cobrada · últimos 12 meses</div>
      <div className="card p-5 mb-6">
        <div className="flex items-end gap-2" style={{ height: 140 }}>
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full rounded-t-md bg-[var(--color-blue)]/70" style={{ height: `${Math.max((d.value / chartMax) * 100, 2)}%` }} title={eur(d.value)} />
              <span className="text-[10px] text-[var(--ink-3)] font-semibold uppercase">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[13px] font-bold uppercase tracking-wide text-[var(--ink-3)] mb-3.5">Apartamentos</div>
      <div ref={tilt.ref} onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave} className="card tilt p-1.5 overflow-x-auto">
        <table className="w-full text-[13.5px] border-collapse">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-[var(--ink-3)] text-left">
              <th className="p-3.5 font-bold">Apartamento</th>
              <th className="p-3.5 font-bold">Cidade</th>
              <th className="p-3.5 font-bold">Ocupação</th>
              <th className="p-3.5 font-bold">Receita</th>
              <th className="p-3.5 font-bold">Renda</th>
              <th className="p-3.5 font-bold">Margem</th>
            </tr>
          </thead>
          <tbody>
            {properties.map(p => {
              const o = occupancyOf(p, activeTenants)
              const m = marginOf(p, activeTenants)
              const tone = o.pct >= 80 ? 'green' : o.pct >= 50 ? 'amber' : 'red'
              return (
                <tr key={p.id} className="cursor-pointer hover:bg-blue-500/5 border-t border-black/5 dark:border-white/5" onClick={() => nav('/apartamentos')}>
                  <td className="p-3.5 font-semibold">{p.name}</td>
                  <td className="p-3.5 text-[var(--ink-3)]">{p.city || '—'}</td>
                  <td className="p-3.5"><Pill tone={tone}>{o.occ}/{o.total}</Pill></td>
                  <td className="p-3.5" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(revenueOf(p, activeTenants))}</td>
                  <td className="p-3.5 text-[var(--ink-3)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(p.head_rent)}</td>
                  <td className="p-3.5 font-bold" style={{ color: m >= 0 ? '#1f9d4d' : 'var(--color-red)', fontVariantNumeric: 'tabular-nums' }}>{eur(m)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
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
