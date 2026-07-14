import type { Property } from './api/properties'
import type { ActiveTenantSummary } from './api/tenants'
import type { Payment } from './api/payments'

export function occupancyOf(p: Property, tenants: ActiveTenantSummary[]) {
  const occ = tenants.filter(t => t.property_id === p.id).length
  const total = p.beds.length
  return { occ, total, pct: total ? Math.round((occ / total) * 100) : 0 }
}

export function revenueOf(p: Property, tenants: ActiveTenantSummary[]) {
  return tenants.filter(t => t.property_id === p.id).reduce((s, t) => s + (t.rent || 0), 0)
}

export function marginOf(p: Property, tenants: ActiveTenantSummary[]) {
  return revenueOf(p, tenants) - (p.head_rent || 0) - (p.utilities || 0)
}

/** Nº de meses marcados como "atrasado" nos últimos `monthsBack` meses (excluindo o mês corrente). */
export function lateCount(tenantId: string, payments: Payment[], monthsBack = 6): number {
  const now = new Date()
  let count = 0
  for (let i = 1; i <= monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const p = payments.find(p => p.tenant_id === tenantId && p.year === d.getFullYear() && p.month === d.getMonth() + 1)
    if (p?.status === 'late') count++
  }
  return count
}
