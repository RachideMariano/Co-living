import { supabase } from '../supabase'
import type { Database } from '../database.types'
import { removeFile, uniquePath, uploadFile } from './storage'

export type Document = Database['public']['Tables']['documents']['Row']

export const DOC_CATEGORIES = ['contrato', 'template', 'caucao', 'identificacao', 'inventario', 'insurance', 'picture', 'expense_receipt', 'outro'] as const
export const DOC_CATEGORY_LABEL: Record<string, string> = {
  contrato: 'Contrato', template: 'Template / Modelo', caucao: 'Comprovativo de caução', identificacao: 'Documento de identificação',
  inventario: 'Inventário', insurance: 'Seguro', picture: 'Fotografia', expense_receipt: 'Recibo de despesa', outro: 'Outro',
}

export async function listDocumentsForTenant(tenantId: string): Promise<Document[]> {
  const { data, error } = await supabase.from('documents').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listDocumentsForProperty(propertyId: string): Promise<Document[]> {
  const { data, error } = await supabase.from('documents').select('*').eq('property_id', propertyId).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function uploadDocument(opts: { tenantId?: string; propertyId?: string; category: string; file: File }) {
  const prefix = opts.tenantId ? `tenants/${opts.tenantId}` : (opts.propertyId ? `properties/${opts.propertyId}` : 'templates')
  const path = uniquePath(prefix, opts.file.name)
  await uploadFile(path, opts.file)
  const { error } = await supabase.from('documents').insert({
    tenant_id: opts.tenantId ?? null, property_id: opts.propertyId ?? null,
    category: opts.category, file_path: path, file_name: opts.file.name,
  })
  if (error) throw error
}

export async function listTemplates(): Promise<Document[]> {
  const { data, error } = await supabase.from('documents').select('*').is('property_id', null).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function deleteDocument(doc: Document) {
  await removeFile(doc.file_path)
  const { error } = await supabase.from('documents').delete().eq('id', doc.id)
  if (error) throw error
}
