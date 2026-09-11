import { supabase } from '../supabase'

export type Receipt = any // loose type until DB types regenerated

export async function listReceipts(): Promise<Receipt[]> {
  const { data, error } = await supabase.from('receipts').select('*').order('issued_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createReceipt(payload: {
  tenant_id: string
  property_id?: string
  bed_id?: string
  year: number
  month: number
  period_start?: string
  period_end?: string
  days_billed?: number
  rent: number
  prorated?: boolean
  prorated_amount?: number
  amount_paid?: number
  payment_method?: string
  notes?: string
}) {
  // generate a sequential receipt_number for the year: YYYY-XXXX
  const year = payload.year
  const { count, error: cErr } = await supabase.from('receipts').select('id', { count: 'exact', head: true }).eq('year', year)
  if (cErr) throw cErr
  const seq = (count ?? 0) + 1
  const num = `${year}-${String(seq).padStart(4, '0')}`

  const { error } = await (supabase as any).from('receipts').insert([{ ...payload, receipt_number: num }])
  if (error) throw error
  return num
}
