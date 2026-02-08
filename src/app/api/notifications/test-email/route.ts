import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { emailService } from '@/lib/notifications/emailService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized or no email' }, { status: 401 })
    }

    await emailService.send({
      to: user.email,
      subject: 'Test email from inCommand',
      html: '<p>This is a test email to verify your notification settings. If you received this, email notifications are working.</p>',
      text: 'This is a test email to verify your notification settings. If you received this, email notifications are working.',
    })

    return NextResponse.json({ success: true, message: 'Test email sent' })
  } catch (err: any) {
    console.error('Test email error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to send test email' },
      { status: 500 }
    )
  }
}
