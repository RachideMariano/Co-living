import { supabase } from '../supabase'
import type { Database } from '../database.types'

export type Landlord = Database['public']['Tables']['landlords']['Row']
export type LandlordInput = Omit<Database['public']['Tables']['landlords']['Insert'], 'id' | 'created_at' | 'updated_at' | 'created_by'>

export async function listLandlords(): Promise<Landlord[]> {
  const { data, error } = await supabase.from('landlords').select('*').order('name', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createLandlord(input: LandlordInput): Promise<Landlord> {
  const { data, error } = await supabase.from('landlords').insert(input).select('*').single()
  if (error) throw error
  return data
}

export async function updateLandlord(id: string, input: LandlordInput) {
  const { error } = await supabase.from('landlords').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteLandlord(id: string) {
  const { error } = await supabase.from('landlords').delete().eq('id', id)
  if (error) throw error
}
