import { useEffect, useMemo, useState } from 'react'
import PageHead from '../components/PageHead'
import { Button } from '../components/Button'
import { listProperties, type Property } from '../lib/api/properties'
import { listTenants, type Tenant } from '../lib/api/tenants'
import { listMaintenanceSchedules, type MaintenanceSchedule } from '../lib/api/maintenanceSchedules'
import { listAllInspections, type Inspection } from '../lib/api/inspections'

interface CalEvent {
  date: string
  label: string
  tone: 'blue' | 'orange' | 'purple' | 'green' | 'red'
}

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const toneDot: Record<CalEvent['tone'], string> = {
  blue: 'bg-[var(--color-blue)]', orange: 'bg-[var(--color-orange)]', purple: 'bg-[var(--color-purple)]',
  green: 'bg-[var(--color-green)]', red: 'bg-[var(--color-red)]',
}

export default function CalendarPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([])
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  useEffect(() => {
    Promise.all([listProperties(), listTenants(), listMaintenanceSchedules(), listAllInspections()]).then(([p, t, s, i]) => {
      setProperties(p); setTenants(t); setSchedules(s); setInspections(i); setLoading(false)
    })
  }, [])

  const tenantById = (id: string) => tenants.find(t => t.id === id)
  const propById = (id: string) => properties.find(p => p.id === id)

  const events = useMemo(() => {
    const list: CalEvent[] = []
    tenants.forEach(t => {
      if (t.contract_end) list.push({ date: t.contract_end, label: `Fim contrato: ${t.name}`, tone: 'orange' })
      if (t.status === 'active' && t.move_in) list.push({ date: t.move_in, label: `Entrada: ${t.name}`, tone: 'green' })
      if (t.move_out) list.push({ date: t.move_out, label: `Saída: ${t.name}`, tone: 'red' })
    })
    properties.forEach(p => {
      if (p.contract_end) list.push({ date: p.contract_end, label: `Fim contrato senhorio: ${p.name}`, tone: 'orange' })
    })
    schedules.forEach(s => {
      const p = propById(s.property_id)
      list.push({ date: s.next_due, label: `Manutenção: ${s.title}${p ? ' · ' + p.name : ''}`, tone: 'purple' })
    })
    inspections.forEach(i => {
      const t = tenantById(i.tenant_id)
      list.push({ date: i.date, label: `Vistoria ${i.type === 'move_in' ? 'entrada' : 'saída'}: ${t?.name ?? ''}`, tone: 'blue' })
    })
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenants, properties, schedules, inspections])

  const eventsOn = (dateStr: string) => events.filter(e => e.date === dateStr)

  if (loading) return <PageHead title="Calendário" subtitle="A carregar…" />

  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = (firstOfMonth.getDay() + 6) % 7 // 0 = Segunda
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }
  const todayStr = now.toISOString().slice(0, 10)

  return (
    <>
      <PageHead
        title="Calendário"
        subtitle="Datas críticas: contratos, vistorias, manutenção preventiva"
        action={
          <div className="flex items-center gap-2">
            <Button onClick={prevMonth}>‹</Button>
            <span className="text-sm font-bold w-40 text-center">{MONTH_NAMES[month]} {year}</span>
            <Button onClick={nextMonth}>›</Button>
          </div>
        }
      />
      <div className="card p-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map(w => <div key={w} className="text-center text-[11px] font-bold uppercase text-[var(--ink-3)] py-1.5">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} className="min-h-[92px]" />
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayEvents = eventsOn(dateStr)
            const isToday = dateStr === todayStr
            return (
              <div key={i} className={`min-h-[92px] rounded-xl p-1.5 border ${isToday ? 'border-[var(--color-blue)] bg-blue-500/5' : 'border-black/5 dark:border-white/5'}`}>
                <div className={`text-xs font-bold mb-1 ${isToday ? 'text-[var(--color-blue)]' : 'text-[var(--ink-3)]'}`}>{day}</div>
                {dayEvents.slice(0, 3).map((e, j) => (
                  <div key={j} className="flex items-center gap-1 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${toneDot[e.tone]}`} />
                    <span className="text-[10px] leading-tight truncate">{e.label}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && <div className="text-[10px] text-[var(--ink-3)] font-semibold">+{dayEvents.length - 3}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
