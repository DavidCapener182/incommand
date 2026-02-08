import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { smsService } from '@/lib/notifications/smsService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const phoneNumber = body?.phoneNumber ?? body?.phone
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    await smsService.send({
      to: phoneNumber.trim(),
      message: 'Test SMS from inCommand. Your notification settings are working.',
    })

    return NextResponse.json({ success: true, message: 'Test SMS sent' })
  } catch (err: any) {
    console.error('Test SMS error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to send test SMS' },
      { status: 500 }
    )
  }
}
