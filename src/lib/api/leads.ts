import { supabase } from '../supabase'
import type { Database } from '../database.types'

export type Lead = Database['public']['Tables']['leads']['Row']
export type LeadInput = Omit<Database['public']['Tables']['leads']['Insert'], 'id' | 'created_at' | 'updated_at' | 'created_by' | 'status' | 'converted_tenant_id'>

export async function listLeads(): Promise<Lead[]> {
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createLead(input: LeadInput) {
  const { error } = await supabase.from('leads').insert(input)
  if (error) throw error
}

export async function updateLead(id: string, input: Partial<LeadInput>) {
  const { error } = await supabase.from('leads').update(input).eq('id', id)
  if (error) throw error
}

export async function setLeadStatus(id: string, status: 'waiting' | 'contacted' | 'converted' | 'discarded') {
  const { error } = await supabase.from('leads').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deleteLead(id: string) {
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw error
}

/** Cria o inquilino a partir do lead e marca o lead como convertido. */
export async function convertLeadToTenant(lead: Lead, propertyId: string, bedId: string | null, rent: number, moveIn: string) {
  const { data, error } = await supabase.from('tenants').insert({
    property_id: propertyId, bed_id: bedId, name: lead.name, contact: lead.contact,
    rent, deposit: 0, move_in: moveIn, status: 'active',
  }).select('id').single()
  if (error) throw error
  const { error: leadError } = await supabase.from('leads').update({ status: 'converted', converted_tenant_id: data.id }).eq('id', lead.id)
  if (leadError) throw leadError
  return data.id as string
}
