import { supabase } from '../supabase'
import type { Database } from '../database.types'
import { todayISO } from '../format'

export type MaintenanceSchedule = Database['public']['Tables']['maintenance_schedules']['Row']
export type MaintenanceScheduleInput = Omit<Database['public']['Tables']['maintenance_schedules']['Insert'], 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_done'>

export async function listMaintenanceSchedules(): Promise<MaintenanceSchedule[]> {
  const { data, error } = await supabase.from('maintenance_schedules').select('*').order('next_due', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createMaintenanceSchedule(input: MaintenanceScheduleInput) {
  const { error } = await supabase.from('maintenance_schedules').insert(input)
  if (error) throw error
}

export async function updateMaintenanceSchedule(id: string, input: Partial<MaintenanceScheduleInput>) {
  const { error } = await supabase.from('maintenance_schedules').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteMaintenanceSchedule(id: string) {
  const { error } = await supabase.from('maintenance_schedules').delete().eq('id', id)
  if (error) throw error
}

/** Marca como feita hoje e calcula a próxima data com base na frequência. */
export async function markScheduleDone(schedule: MaintenanceSchedule) {
  const today = todayISO()
  const next = new Date()
  next.setMonth(next.getMonth() + schedule.frequency_months)
  const { error } = await supabase.from('maintenance_schedules')
    .update({ last_done: today, next_due: next.toISOString().slice(0, 10) })
    .eq('id', schedule.id)
  if (error) throw error
}
