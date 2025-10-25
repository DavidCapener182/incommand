'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

let browserClient: any = null

export const getBrowserClient = (): any => {
  if (!browserClient) {
    browserClient = createClientComponentClient<Database>()
  }
  return browserClient
}

export const supabaseBrowserClient = getBrowserClient()
export type BrowserSupabaseClient = SupabaseClient<Database>
