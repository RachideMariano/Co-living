// Escrito à mão para arrancar o projeto. Depois de aplicares a migração, substitui por:
//   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts

export type PaymentStatus = 'pending' | 'paid' | 'late'
export type TenantStatus = 'active' | 'inactive'
export type TicketStatus = 'open' | 'in_progress' | 'done'
export type TicketPriority = 'normal' | 'urgent'
export type LeadStatus = 'waiting' | 'contacted' | 'converted' | 'discarded'
export type InspectionType = 'move_in' | 'move_out'

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          name: string
          address: string | null
          city: string | null
          landlord_name: string | null
          landlord_contact: string | null
          landlord_id: string | null
          head_rent: number
          utilities: number
          contract_start: string | null
          contract_end: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['properties']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['properties']['Row']>
        Relationships: []
      }
      beds: {
        Row: {
          id: string
          property_id: string
          label: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['beds']['Row']> & { property_id: string; label: string }
        Update: Partial<Database['public']['Tables']['beds']['Row']>
        Relationships: []
      }
      tenants: {
        Row: {
          id: string
          property_id: string
          bed_id: string | null
          name: string
          contact: string | null
          rent: number
          deposit: number
          deposit_returned: boolean
          move_in: string | null
          move_out: string | null
          contract_end: string | null
          status: TenantStatus
          notes: string | null
          guarantor_name: string | null
          guarantor_contact: string | null
          guarantor_relationship: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['tenants']['Row']> & { property_id: string; name: string }
        Update: Partial<Database['public']['Tables']['tenants']['Row']>
        Relationships: []
      }
      tenant_onboarding: {
        Row: {
          tenant_id: string
          contract_signed: boolean
          inventory_done: boolean
          deposit_paid: boolean
          id_document_received: boolean
          landlord_notified: boolean
          landlord_notified_at: string | null
          direct_debit_setup: boolean
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['tenant_onboarding']['Row']> & { tenant_id: string }
        Update: Partial<Database['public']['Tables']['tenant_onboarding']['Row']>
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          tenant_id: string
          year: number
          month: number
          status: PaymentStatus
          amount: number
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['payments']['Row']> & { tenant_id: string; year: number; month: number; amount: number }
        Update: Partial<Database['public']['Tables']['payments']['Row']>
        Relationships: []
      }
      maintenance_tickets: {
        Row: {
          id: string
          property_id: string
          tenant_id: string | null
          title: string
          description: string | null
          status: TicketStatus
          priority: TicketPriority
          cost: number | null
          opened_at: string
          closed_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['maintenance_tickets']['Row']> & { property_id: string; title: string }
        Update: Partial<Database['public']['Tables']['maintenance_tickets']['Row']>
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          property_id: string
          category: string
          description: string | null
          amount: number
          date: string
          maintenance_id: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['expenses']['Row']> & { property_id: string; category: string; amount: number; date: string }
        Update: Partial<Database['public']['Tables']['expenses']['Row']>
        Relationships: []
      }
      leads: {
        Row: {
          id: string
          name: string
          contact: string | null
          desired_move_in: string | null
          budget: number | null
          property_id: string | null
          notes: string | null
          status: LeadStatus
          converted_tenant_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['leads']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['leads']['Row']>
        Relationships: []
      }
      app_settings: {
        Row: {
          id: number
          utilities_default: number
        }
        Insert: Partial<Database['public']['Tables']['app_settings']['Row']>
        Update: Partial<Database['public']['Tables']['app_settings']['Row']>
        Relationships: []
      }
      landlords: {
        Row: {
          id: string
          name: string
          contact: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['landlords']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['landlords']['Row']>
        Relationships: []
      }
      utility_bills: {
        Row: {
          id: string
          property_id: string
          year: number
          month: number
          amount: number
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['utility_bills']['Row']> & { property_id: string; year: number; month: number; amount: number }
        Update: Partial<Database['public']['Tables']['utility_bills']['Row']>
        Relationships: []
      }
      maintenance_schedules: {
        Row: {
          id: string
          property_id: string
          title: string
          frequency_months: number
          last_done: string | null
          next_due: string
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['maintenance_schedules']['Row']> & { property_id: string; title: string; next_due: string }
        Update: Partial<Database['public']['Tables']['maintenance_schedules']['Row']>
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          tenant_id: string | null
          property_id: string | null
          category: string
          file_path: string
          file_name: string
          uploaded_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['documents']['Row']> & { file_path: string; file_name: string }
        Update: Partial<Database['public']['Tables']['documents']['Row']>
        Relationships: []
      }
      inspections: {
        Row: {
          id: string
          tenant_id: string
          type: InspectionType
          date: string
          notes: string | null
          photos: string[]
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['inspections']['Row']> & { tenant_id: string; type: InspectionType }
        Update: Partial<Database['public']['Tables']['inspections']['Row']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
