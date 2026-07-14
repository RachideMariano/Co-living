import { supabase } from '../supabase'

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
