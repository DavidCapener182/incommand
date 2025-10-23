import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'
import { emailService } from '@/lib/notifications/emailService'

const applicationSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  service_type: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email('A valid contact email is required'),
  contact_phone: z.string().optional(),
  access_level_ids: z.array(z.string().uuid()).default([]),
  notes: z.string().optional()
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = applicationSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid accreditation payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const { business_name, contact_email, notes, access_level_ids, ...rest } = parsed.data

  try {
    const supabase = getServiceSupabaseClient()

    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .insert([{ business_name, contact_email, notes: notes ?? null, ...rest }])
      .select('*')
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: vendorError?.message ?? 'Unable to create vendor record' }, { status: 500 })
    }

    const inductionToken = crypto.randomUUID()

    const { data: accreditation, error: accreditationError } = await supabase
      .from('vendor_accreditations')
      .insert([
        {
          vendor_id: vendor.id,
          status: 'new',
          feedback: notes ?? null,
          induction_token: inductionToken
        }
      ])
      .select('*')
      .single()

    if (accreditationError || !accreditation) {
      return NextResponse.json({ error: accreditationError?.message ?? 'Unable to create accreditation record' }, { status: 500 })
    }

    if (access_level_ids?.length) {
      const rows = access_level_ids.map((access_level_id) => ({
        accreditation_id: accreditation.id,
        access_level_id
      }))

      const { error: joinError } = await supabase
        .from('vendor_accreditation_access_levels')
        .insert(rows)

      if (joinError) {
        return NextResponse.json({ error: joinError.message }, { status: 500 })
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || ''
    const inductionLink = `${appUrl.replace(/\/$/, '')}/induction/${encodeURIComponent(inductionToken)}`

    try {
      await emailService.send({
        to: contact_email,
        subject: 'inCommand Accreditation Induction',
        html: `
          <p>Hi ${rest.contact_name || business_name},</p>
          <p>Thank you for submitting your accreditation request for <strong>${business_name}</strong>.</p>
          <p>Please complete the short induction using the link below to continue:</p>
          <p><a href="${inductionLink}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Start Induction</a></p>
          <p>If the button does not work, copy and paste this URL into your browser:</p>
          <p><code>${inductionLink}</code></p>
          <p>We look forward to working with you.<br/>inCommand Accreditation Team</p>
        `,
        text: `Hi ${rest.contact_name || business_name},\n\nThank you for submitting your accreditation request for ${business_name}.\n\nPlease complete the induction using the link below to continue:\n${inductionLink}\n\nWe look forward to working with you.\n\ninCommand Accreditation Team`
      })
    } catch (error) {
      console.error('Failed to send induction email', error)
      return NextResponse.json({ error: 'Accreditation created but email failed to send' }, { status: 502 })
    }

    return NextResponse.json({ vendor, accreditation }, { status: 201 })
  } catch (error) {
    console.error('Error creating accreditation', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
