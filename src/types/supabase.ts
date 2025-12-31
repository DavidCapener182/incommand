/**
 * Supabase Database Types
 * 
 * This file should be generated using: node scripts/generateSupabaseTypes.mjs
 * For now, this is a minimal stub to allow the build to pass.
 * 
 * To generate proper types, ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * are set in your environment, then run the generation script.
 */

export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Partial<Record<string, any>>
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, any>
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, any>
        Returns: any
      }
    }
    Enums: {
      [key: string]: string
    }
    CompositeTypes: {
      [key: string]: Record<string, any>
    }
  }
}
