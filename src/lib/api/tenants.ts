import { supabase } from '../supabase'
import type { Database, TenantStatus } from '../database.types'

export type Tenant = Database['public']['Tables']['tenants']['Row']
export type TenantInput = Omit<Database['public']['Tables']['tenants']['Insert'], 'id' | 'created_at' | 'updated_at' | 'created_by' | 'status' | 'move_out'>

export interface ActiveTenantSummary {
  id: string
  name: string
  rent: number
  property_id: string
  bed_id: string | null
}

export async function listActiveTenantsSummary(): Promise<ActiveTenantSummary[]> {
  const { data, error } = await supabase
    .from('tenants')
    .select('id,name,rent,property_id,bed_id')
    .eq('status', 'active')
  if (error) throw error
  return data ?? []
}

export async function listTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createTenant(input: TenantInput) {
  const { error } = await supabase.from('tenants').insert({ ...input, status: 'active' as TenantStatus })
  if (error) throw error
}

export async function updateTenant(id: string, input: TenantInput) {
  const { error } = await supabase.from('tenants').update(input).eq('id', id)
  if (error) throw error
}

export async function checkoutTenant(id: string, moveOut: string) {
  const { error } = await supabase.from('tenants').update({ status: 'inactive', move_out: moveOut }).eq('id', id)
  if (error) throw error
}

export async function reactivateTenant(id: string) {
  const { error } = await supabase.from('tenants').update({ status: 'active', move_out: null }).eq('id', id)
  if (error) throw error
}

export async function setDepositReturned(id: string, returned: boolean) {
  const { error } = await supabase.from('tenants').update({ deposit_returned: returned }).eq('id', id)
  if (error) throw error
}
