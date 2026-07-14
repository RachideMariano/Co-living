import { supabase } from '../supabase'
import type { Database } from '../database.types'

export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseInput = Omit<Database['public']['Tables']['expenses']['Insert'], 'id' | 'created_at' | 'created_by'>

export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createExpense(input: ExpenseInput) {
  const { error } = await supabase.from('expenses').insert(input)
  if (error) throw error
}

export async function updateExpense(id: string, input: Partial<ExpenseInput>) {
  const { error } = await supabase.from('expenses').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}
