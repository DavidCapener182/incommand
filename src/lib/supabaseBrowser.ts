'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

let browserClient: ReturnType<typeof createClientComponentClient> | null = null

export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createClientComponentClient()
  }
  return browserClient
}

export const supabase = getBrowserClient()
export const supabaseBrowserClient = supabase
