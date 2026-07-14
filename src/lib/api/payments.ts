import { supabase } from '../supabase'
import type { Database, PaymentStatus } from '../database.types'
import { todayISO } from '../format'

export type Payment = Database['public']['Tables']['payments']['Row']

export async function listPayments(): Promise<Payment[]> {
  const { data, error } = await supabase.from('payments').select('*')
  if (error) throw error
  return data ?? []
}

const nextStatus: Record<PaymentStatus, PaymentStatus> = { pending: 'paid', paid: 'late', late: 'pending' }

export async function togglePayment(tenantId: string, year: number, month: number, current: PaymentStatus, amount: number) {
  const next = nextStatus[current]
  if (next === 'pending') {
    const { error } = await supabase.from('payments').delete().eq('tenant_id', tenantId).eq('year', year).eq('month', month)
    if (error) throw error
  } else {
    const { error } = await supabase.from('payments').upsert(
      { tenant_id: tenantId, year, month, status: next, amount, paid_at: next === 'paid' ? todayISO() : null },
      { onConflict: 'tenant_id,year,month' }
    )
    if (error) throw error
  }
}

export async function markMonthPaid(tenantId: string, year: number, month: number, amount: number) {
  const { error } = await supabase.from('payments').upsert(
    { tenant_id: tenantId, year, month, status: 'paid' as PaymentStatus, amount, paid_at: todayISO() },
    { onConflict: 'tenant_id,year,month' }
  )
  if (error) throw error
}
