import { supabase } from '../supabase'
import type { Allocation } from '../allocations'

export async function saveAllocations(expenseId: string, allocations: Allocation[]) {
  if (!allocations || allocations.length === 0) return
  const rows: any[] = allocations.map(a => ({ expense_id: expenseId, tenant_id: a.tenant_id, days: a.days, share: a.share }))
  const { error } = await (supabase as any).from('expense_allocations').insert(rows)
  if (error) throw error
}

export async function listAllocationsForExpense(expenseId: string) {
  const { data, error } = await supabase.from('expense_allocations').select('*').eq('expense_id', expenseId)
  if (error) throw error
  return data ?? []
}
