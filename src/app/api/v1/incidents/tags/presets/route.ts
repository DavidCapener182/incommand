import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/v1/incidents/tags/presets
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')

    let query = supabase
      .from('tag_presets')
      .select('*')
      .eq('is_active', true)
      .order('tag_name')

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ presets: data || [] })
  } catch (error) {
    console.error('Error fetching tag presets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tag presets' },
      { status: 500 }
    )
  }
}

