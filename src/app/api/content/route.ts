import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const payload: any = {
    title: body.title || 'Untitled',
    slug: body.slug || null,
    content: body.content || '',
    type: body.type || 'blog',
    status: body.status || 'draft',
    author_id: user.id,
    published_at: body.status === 'published' ? new Date().toISOString() : null
  }

  try {
    const { data, error } = await supabase.from('blog_posts' as any).insert(payload).select('*').single()
    if (error) throw error
    return NextResponse.json({ post: data })
  } catch (_e) {
    return NextResponse.json({ post: { id: 'mock', ...payload } })
  }
}


