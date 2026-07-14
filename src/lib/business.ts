import type { Property } from './api/properties'
import type { ActiveTenantSummary } from './api/tenants'

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
