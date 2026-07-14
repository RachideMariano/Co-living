import { supabase } from '../supabase'
import type { Database } from '../database.types'
import { todayISO } from '../format'

export type MaintenanceTicket = Database['public']['Tables']['maintenance_tickets']['Row']
export type MaintenanceInput = Omit<Database['public']['Tables']['maintenance_tickets']['Insert'], 'id' | 'created_at' | 'updated_at' | 'created_by' | 'status' | 'closed_at'>

export async function listMaintenanceTickets(): Promise<MaintenanceTicket[]> {
  const { data, error } = await supabase.from('maintenance_tickets').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createTicket(input: MaintenanceInput) {
  const { error } = await supabase.from('maintenance_tickets').insert({ ...input, status: 'open' })
  if (error) throw error
}

export async function updateTicket(id: string, input: Partial<MaintenanceInput>) {
  const { error } = await supabase.from('maintenance_tickets').update(input).eq('id', id)
  if (error) throw error
}

export async function setTicketStatus(id: string, status: 'open' | 'in_progress' | 'done') {
  const { error } = await supabase.from('maintenance_tickets').update({ status }).eq('id', id)
  if (error) throw error
}

/** Fecha o ticket e, se houver custo, cria a despesa correspondente. */
export async function closeTicket(ticket: MaintenanceTicket) {
  const { error } = await supabase.from('maintenance_tickets').update({ status: 'done', closed_at: todayISO() }).eq('id', ticket.id)
  if (error) throw error
  if (ticket.cost && ticket.cost > 0) {
    const { error: expError } = await supabase.from('expenses').insert({
      property_id: ticket.property_id,
      category: 'Manutenção',
      description: ticket.title,
      amount: ticket.cost,
      date: todayISO(),
      maintenance_id: ticket.id,
    })
    if (expError) throw expError
  }
}

export async function deleteTicket(id: string) {
  const { error } = await supabase.from('maintenance_tickets').delete().eq('id', id)
  if (error) throw error
}
