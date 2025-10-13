import { NextResponse } from 'next/server'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const supabase = getServiceSupabaseClient()
    const { count, error } = await supabase
      .from('green_guide_chunks')
      .select('id', { count: 'exact', head: true })
    if (error) throw error

    const { data: sample } = await supabase
      .from('green_guide_chunks')
      .select('id, page, heading, content')
      .limit(1)

    return NextResponse.json({ count: count || 0, sample: sample?.[0] || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'stats failed' }, { status: 500 })
  }
}


