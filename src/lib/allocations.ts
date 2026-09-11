import { supabase } from './supabase'

function clampDate(d: Date, min: Date, max: Date) {
  if (d < min) return min
  if (d > max) return max
  return d
}

export type Allocation = { tenant_id: string; days: number; share: number }

// Calcula a partilha da despesa `amount` no mês `year`/`month` para a propriedade
// `propertyId`, distribuindo proporcionalmente pelos dias ocupados de cada inquilino.
export async function calculateExpenseShares(propertyId: string, year: number, month: number, amount: number) {
  const periodStart = new Date(year, month - 1, 1)
  const periodEnd = new Date(year, month, 0)

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('property_id', propertyId)
    .or(`status.eq.active,status.eq.inactive`)

  if (error) throw error
  if (!tenants || tenants.length === 0) return []

  const allocations: Allocation[] = []
  let totalDays = 0

  for (const t of tenants) {
    if (!t.move_in) continue
    const moveIn = new Date(t.move_in)
    const moveOut = t.move_out ? new Date(t.move_out) : null

    // tenant occupied during month if moveIn <= periodEnd and (no moveOut or moveOut >= periodStart)
    if (moveIn > periodEnd) continue
    if (moveOut && moveOut < periodStart) continue

    const start = clampDate(moveIn, periodStart, periodEnd)
    const end = moveOut ? clampDate(moveOut, periodStart, periodEnd) : periodEnd
    const days = Math.max(0, (end.getDate() - start.getDate() + 1))
    if (days <= 0) continue
    allocations.push({ tenant_id: t.id, days, share: 0 })
    totalDays += days
  }

  if (totalDays === 0) return []

  // compute share
  for (const a of allocations) {
    a.share = Math.round((amount * (a.days / totalDays)) * 100) / 100
  }

  return allocations
}
