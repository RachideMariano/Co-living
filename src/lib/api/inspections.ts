import { supabase } from '../supabase'
import type { Database, InspectionType } from '../database.types'
import { uniquePath, uploadFile, removeFile } from './storage'

export type Inspection = Database['public']['Tables']['inspections']['Row']

export async function listInspectionsForTenant(tenantId: string): Promise<Inspection[]> {
  const { data, error } = await supabase.from('inspections').select('*').eq('tenant_id', tenantId).order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listAllInspections(): Promise<Inspection[]> {
  const { data, error } = await supabase.from('inspections').select('*')
  if (error) throw error
  return data ?? []
}

export async function createInspection(tenantId: string, type: InspectionType, date: string, notes: string): Promise<Inspection> {
  const { data, error } = await supabase.from('inspections').insert({ tenant_id: tenantId, type, date, notes }).select('*').single()
  if (error) throw error
  return data
}

export async function updateInspectionNotes(id: string, notes: string) {
  const { error } = await supabase.from('inspections').update({ notes }).eq('id', id)
  if (error) throw error
}

export async function addInspectionPhoto(inspection: Inspection, file: File) {
  const path = uniquePath(`inspections/${inspection.tenant_id}/${inspection.id}`, file.name)
  await uploadFile(path, file)
  const { error } = await supabase.from('inspections').update({ photos: [...inspection.photos, path] }).eq('id', inspection.id)
  if (error) throw error
  return path
}

export async function removeInspectionPhoto(inspection: Inspection, path: string) {
  await removeFile(path)
  const { error } = await supabase.from('inspections').update({ photos: inspection.photos.filter(p => p !== path) }).eq('id', inspection.id)
  if (error) throw error
}

export async function deleteInspection(inspection: Inspection) {
  await Promise.all(inspection.photos.map(p => removeFile(p).catch(() => {})))
  const { error } = await supabase.from('inspections').delete().eq('id', inspection.id)
  if (error) throw error
}
