'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient<Database> | null = null

export const getBrowserClient = (): SupabaseClient<Database> => {
  if (!browserClient) {
    browserClient = createClientComponentClient<Database>()
  }
  return browserClient
}

export const supabaseBrowserClient = getBrowserClient()
export type BrowserSupabaseClient = SupabaseClient<Database>
