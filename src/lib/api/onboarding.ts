import { supabase } from '../supabase'
import type { Database } from '../database.types'

export type Onboarding = Database['public']['Tables']['tenant_onboarding']['Row']
export type OnboardingPatch = Partial<Pick<Onboarding,
  'contract_signed' | 'inventory_done' | 'deposit_paid' | 'id_document_received' | 'landlord_notified' | 'direct_debit_setup'
>>

export async function listOnboarding(): Promise<Onboarding[]> {
  const { data, error } = await supabase.from('tenant_onboarding').select('*')
  if (error) throw error
  return data ?? []
}

export async function updateOnboarding(tenantId: string, patch: OnboardingPatch) {
  const body: Database['public']['Tables']['tenant_onboarding']['Update'] = { ...patch }
  if (patch.landlord_notified !== undefined) {
    body.landlord_notified_at = patch.landlord_notified ? new Date().toISOString() : null
  }
  const { error } = await supabase.from('tenant_onboarding').update(body).eq('tenant_id', tenantId)
  if (error) throw error
}
