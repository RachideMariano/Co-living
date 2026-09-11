import { supabase } from '../supabase'
import type { Database } from '../database.types'
import { calculateExpenseShares } from '../allocations'
import { saveAllocations } from './allocations'

export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseInput = Omit<Database['public']['Tables']['expenses']['Insert'], 'id' | 'created_at' | 'created_by'>

export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createExpense(input: ExpenseInput) {
  const { data, error } = await supabase.from('expenses').insert(input).select('*').limit(1)
  if (error) throw error
  const created = data?.[0]
  if (!created) return

  try {
    // compute allocations for the property/month and persist
    const d = new Date(created.date)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const allocations = await calculateExpenseShares(created.property_id, year, month, Number(created.amount))
    await saveAllocations(created.id, allocations as any)
  } catch (e) {
    // don't fail the expense creation if allocations fail; log to console
    console.error('Failed to compute/save allocations', e)
  }
}

export async function updateExpense(id: string, input: Partial<ExpenseInput>) {
  const { error } = await supabase.from('expenses').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}
