import { supabase } from '../supabase'
import type { Database } from '../database.types'

export type Bed = Database['public']['Tables']['beds']['Row']
export type Property = Database['public']['Tables']['properties']['Row'] & { beds: Bed[] }
export type PropertyInput = Omit<Database['public']['Tables']['properties']['Insert'], 'id' | 'created_at' | 'updated_at' | 'created_by'>

export async function listProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*, beds(*)')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Property[]
}

export async function createProperty(input: PropertyInput) {
  const { error } = await supabase.from('properties').insert(input)
  if (error) throw error
}

export async function updateProperty(id: string, input: PropertyInput) {
  const { error } = await supabase.from('properties').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteProperty(id: string) {
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw error
}

export async function addBed(propertyId: string, label: string) {
  const { error } = await supabase.from('beds').insert({ property_id: propertyId, label })
  if (error) throw error
}

export async function addBeds(propertyId: string, labels: string[]) {
  const { error } = await supabase.from('beds').insert(labels.map(label => ({ property_id: propertyId, label })))
  if (error) throw error
}

export async function removeBed(id: string) {
  const { error } = await supabase.from('beds').delete().eq('id', id)
  if (error) throw error
}
