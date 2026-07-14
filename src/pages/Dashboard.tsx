import { useEffect, useState } from 'react'
import PageHead from '../components/PageHead'
import Empty from '../components/Empty'
import Pill from '../components/Pill'
import { Button } from '../components/Button'
import { useTilt } from '../hooks/useTilt'
import { eur } from '../lib/format'
import { occupancyOf, revenueOf, marginOf } from '../lib/business'
import { listProperties, type Property } from '../lib/api/properties'
import { listActiveTenantsSummary, type ActiveTenantSummary } from '../lib/api/tenants'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<ActiveTenantSummary[]>([])
  const [loading, setLoading] = useState(true)
  const tilt = useTilt()
  const nav = useNavigate()

  useEffect(() => {
    Promise.all([listProperties(), listActiveTenantsSummary()]).then(([p, t]) => {
      setProperties(p); setTenants(t); setLoading(false)
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

  const totalRev = properties.reduce((s, p) => s + revenueOf(p, tenants), 0)
  const totalRent = properties.reduce((s, p) => s + (p.head_rent || 0), 0)
  const totalUtil = properties.reduce((s, p) => s + (p.utilities || 0), 0)
  const totalMargin = totalRev - totalRent - totalUtil
  const totalBeds = properties.reduce((s, p) => s + p.beds.length, 0)
  const occBeds = tenants.length
  const occPct = totalBeds ? Math.round((occBeds / totalBeds) * 100) : 0

  return (
    <>
      <PageHead title="Dashboard" subtitle={`${properties.length} apartamentos · ${occBeds} inquilinos ativos`} />
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
        <Kpi label="Receita mensal" value={eur(totalRev)} sub={`${occBeds} camas ocupadas`} />
        <Kpi label="Custo total" value={eur(totalRent + totalUtil)} sub={`${eur(totalRent)} renda · ${eur(totalUtil)} util.`} />
        <Kpi label="Margem mensal" value={eur(totalMargin)} color={totalMargin >= 0 ? '#1f9d4d' : 'var(--color-red)'} sub="antes de impostos" />
        <Kpi label="Ocupação" value={`${occPct}%`} sub={`${occBeds}/${totalBeds} camas`} />
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
              const o = occupancyOf(p, tenants)
              const m = marginOf(p, tenants)
              const tone = o.pct >= 80 ? 'green' : o.pct >= 50 ? 'amber' : 'red'
              return (
                <tr key={p.id} className="cursor-pointer hover:bg-blue-500/5 border-t border-black/5 dark:border-white/5" onClick={() => nav('/apartamentos')}>
                  <td className="p-3.5 font-semibold">{p.name}</td>
                  <td className="p-3.5 text-[var(--ink-3)]">{p.city || '—'}</td>
                  <td className="p-3.5"><Pill tone={tone}>{o.occ}/{o.total}</Pill></td>
                  <td className="p-3.5" style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(revenueOf(p, tenants))}</td>
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
