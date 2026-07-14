import { daysBetween, eur, fmtDate, monthKey, todayISO } from './format'
import type { Property } from './api/properties'
import type { Tenant } from './api/tenants'
import type { Onboarding } from './api/onboarding'
import type { Payment } from './api/payments'
import type { MaintenanceTicket } from './api/maintenance'
import type { MaintenanceSchedule } from './api/maintenanceSchedules'

export type AlertLevel = 'urgent' | 'warn' | 'info'
export type AlertType = 'landlord_comm' | 'contract_end' | 'prop_contract' | 'payment' | 'maintenance' | 'maintenance_schedule'

export interface Alert {
  level: AlertLevel
  ico: string
  type: AlertType
  title: string
  desc: string
  tenantId?: string
  propertyId?: string
  ticketId?: string
}

export function computeAlerts(
  properties: Property[], tenants: Tenant[], onboarding: Onboarding[], payments: Payment[], tickets: MaintenanceTicket[] = [],
  schedules: MaintenanceSchedule[] = []
): Alert[] {
  const alerts: Alert[] = []
  const today = todayISO()
  const propById = (id: string) => properties.find(p => p.id === id)
  const obOf = (tenantId: string) => onboarding.find(o => o.tenant_id === tenantId)
  const activeTenants = tenants.filter(t => t.status === 'active')

  activeTenants.forEach(t => {
    const p = propById(t.property_id)
    if (!p) return
    const ob = obOf(t.id)
    if (t.move_in && !ob?.landlord_notified) {
      const ds = daysBetween(t.move_in, today)
      if (ds <= 15 && ds >= 0) {
        alerts.push({
          level: ds >= 12 ? 'urgent' : 'warn', ico: '⚖', type: 'landlord_comm',
          title: `Comunicar ao senhorio: ${t.name}`,
          desc: `Faltam ${15 - ds} dias para o limite legal de 15 dias (${p.name}).`,
          tenantId: t.id,
        })
      } else if (ds > 15) {
        alerts.push({
          level: 'urgent', ico: '⚖', type: 'landlord_comm',
          title: `PRAZO EXCEDIDO: comunicar ${t.name}`,
          desc: `Já passaram ${ds} dias (limite: 15). Regularizar com o senhorio de ${p.name}.`,
          tenantId: t.id,
        })
      }
    }
    if (t.contract_end) {
      const d = daysBetween(today, t.contract_end)
      if (d >= 0 && d <= 60) {
        alerts.push({
          level: d <= 30 ? 'warn' : 'info', ico: '📅', type: 'contract_end',
          title: `Contrato de ${t.name} termina em ${d} dias`,
          desc: `${fmtDate(t.contract_end)} — decidir renovação ou anunciar a cama.`,
          tenantId: t.id,
        })
      }
    }
  })

  properties.forEach(p => {
    if (p.contract_end) {
      const d = daysBetween(today, p.contract_end)
      if (d >= 0 && d <= 120) {
        alerts.push({
          level: d <= 60 ? 'warn' : 'info', ico: '⌂', type: 'prop_contract',
          title: `Contrato com senhorio (${p.name}) termina em ${d} dias`,
          desc: `${fmtDate(p.contract_end)} — renegociar com antecedência.`,
          propertyId: p.id,
        })
      }
    }
  })

  const cmDate = new Date()
  const [cy, cm] = monthKey(cmDate).split('-').map(Number)
  const dom = cmDate.getDate()
  activeTenants.forEach(t => {
    const pay = payments.find(p => p.tenant_id === t.id && p.year === cy && p.month === cm)
    if ((!pay || pay.status !== 'paid') && dom >= 8) {
      const p = propById(t.property_id)
      alerts.push({
        level: dom >= 15 ? 'urgent' : 'warn', ico: '€', type: 'payment',
        title: `Renda em falta: ${t.name}`,
        desc: `${p ? p.name : ''} — ${eur(t.rent)} referente a ${monthKey(cmDate)}.`,
        tenantId: t.id,
      })
    }
  })

  tickets.filter(tk => tk.priority === 'urgent' && tk.status !== 'done').forEach(tk => {
    const p = propById(tk.property_id)
    alerts.push({
      level: 'urgent', ico: '🔧', type: 'maintenance',
      title: `Manutenção urgente: ${tk.title}`,
      desc: `${p ? p.name : ''} — aberto em ${fmtDate(tk.opened_at)}.`,
      propertyId: tk.property_id, ticketId: tk.id,
    })
  })

  schedules.forEach(s => {
    const d = daysBetween(today, s.next_due)
    if (d <= 14) {
      const p = propById(s.property_id)
      alerts.push({
        level: d < 0 ? 'urgent' : d <= 3 ? 'urgent' : 'warn', ico: '🔁', type: 'maintenance_schedule',
        title: d < 0 ? `Manutenção preventiva atrasada: ${s.title}` : `Manutenção preventiva a vencer: ${s.title}`,
        desc: `${p ? p.name : ''} — prevista para ${fmtDate(s.next_due)}.`,
        propertyId: s.property_id,
      })
    }
  })

  const order: Record<AlertLevel, number> = { urgent: 0, warn: 1, info: 2 }
  return alerts.sort((a, b) => order[a.level] - order[b.level])
}
