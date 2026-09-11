import { supabase } from '../supabase'
import type { Database } from '../database.types'

export type Sop = Database['public']['Tables']['sops']['Row']
export type SopInput = Omit<Database['public']['Tables']['sops']['Insert'], 'id' | 'created_at'>

export async function listSops(propertyId?: string): Promise<Sop[]> {
  let q = supabase.from('sops').select('*').order('created_at', { ascending: false })
  if (propertyId) q = q.eq('property_id', propertyId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function getSop(id: string): Promise<Sop | null> {
  const { data, error } = await supabase.from('sops').select('*').eq('id', id).limit(1).single()
  if (error && (error as any).code !== 'PGRST116') throw error
  return data ?? null
}

export async function createSop(input: SopInput) {
  const { data, error } = await supabase.from('sops').insert(input).select('*').limit(1)
  if (error) throw error
  return data?.[0] ?? null
}

export async function updateSop(id: string, patch: Partial<SopInput>) {
  const { error } = await supabase.from('sops').update(patch).eq('id', id)
  if (error) throw error
}

export async function attachDocumentToSop(sopId: string, docId: string) {
  const sop = await getSop(sopId)
  if (!sop) throw new Error('SOP not found')
  const docs = Array.isArray(sop.documents) ? [...sop.documents, docId] : [docId]
  await updateSop(sopId, { documents: docs as any })
}
