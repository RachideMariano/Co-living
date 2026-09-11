import { supabase } from '../supabase'
import type { Database } from '../database.types'

export type Material = Database['public']['Tables']['materials']['Row']
export type MaterialInput = Omit<Database['public']['Tables']['materials']['Insert'], 'id' | 'created_at' | 'updated_at' | 'created_by'>

export async function listMaterials(): Promise<Material[]> {
  const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Material[]
}

export async function createMaterial(input: MaterialInput) {
  const { error } = await supabase.from('materials').insert(input)
  if (error) throw error
}

export async function updateMaterial(id: string, input: MaterialInput) {
  const { error } = await supabase.from('materials').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteMaterial(id: string) {
  const { error } = await supabase.from('materials').delete().eq('id', id)
  if (error) throw error
}
