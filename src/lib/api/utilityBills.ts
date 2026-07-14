import { supabase } from '../supabase'
import type { Database } from '../database.types'

export type UtilityBill = Database['public']['Tables']['utility_bills']['Row']

export async function listUtilityBills(): Promise<UtilityBill[]> {
  const { data, error } = await supabase.from('utility_bills').select('*')
  if (error) throw error
  return data ?? []
}

export async function setUtilityBill(propertyId: string, year: number, month: number, amount: number, notes?: string) {
  const { error } = await supabase.from('utility_bills').upsert(
    { property_id: propertyId, year, month, amount, notes: notes ?? null },
    { onConflict: 'property_id,year,month' }
  )
  if (error) throw error
}

export async function deleteUtilityBill(id: string) {
  const { error } = await supabase.from('utility_bills').delete().eq('id', id)
  if (error) throw error
}
