import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'
import CompleteInductionButton from '@/components/induction/CompleteInductionButton'
import type { VendorAccreditationStatus } from '@/types/vendor'

export const metadata: Metadata = {
  title: 'Induction | inCommand Accreditation'
}

export const revalidate = 0

interface InductionPageProps {
  params: { token: string }
}

interface InductionRecord {
  id: string
  status: VendorAccreditationStatus
  vendors: {
    business_name: string
    contact_name?: string | null
    service_type?: string | null
  } | null
}

function getStatusCopy(status: VendorAccreditationStatus) {
  switch (status) {
    case 'approved':
      return 'You are all set. Present yourself at the accreditation point with photo ID to receive your wristband or pass.'
    case 'pending_review':
      return 'Thanks for completing the induction. Our accreditation team is reviewing your submission.'
    case 'rejected':
      return 'This request is no longer active. Contact the accreditation desk if you require assistance.'
    default:
      return 'Review the key safety notes below, then confirm completion to send your induction acknowledgement to the accreditation team.'
  }
}

export default async function InductionPage({ params }: InductionPageProps) {
  const { token } = params

  if (!token) {
    notFound()
  }

  let record: InductionRecord | null = null

  try {
    const supabase = getServiceSupabaseClient()
    const { data, error } = await supabase
      .from('vendor_accreditations')
      .select('id, status, vendors:vendor_id ( business_name, contact_name, service_type )')
      .eq('induction_token', token)
      .single()

    if (error || !data) {
      notFound()
    }

    record = data as unknown as InductionRecord
  } catch (error) {
    console.error('Induction lookup failed', error)
    notFound()
  }

  if (!record) {
    notFound()
  }

  const organisation = record.vendors?.business_name || 'Accreditation applicant'
  const contactName = record.vendors?.contact_name || 'team member'
  const serviceType = record.vendors?.service_type || 'Vendor'

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_rgba(15,23,42,0.95))]">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-16 text-slate-100">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-300">inCommand Accreditation</p>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Induction briefing</h1>
          <p className="text-sm text-slate-300 sm:text-base">{getStatusCopy(record.status)}</p>
        </header>

        <section className="rounded-3xl bg-white/5 p-8 ring-1 ring-white/10 backdrop-blur">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Welcome, {contactName}</h2>
              <p className="text-sm text-slate-300">
                {organisation} – {serviceType}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-sm font-semibold text-blue-200">Event Safety Essentials</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-300">
                  <li>Carry your accreditation pass at all times while onsite.</li>
                  <li>Report hazards immediately to the control room.</li>
                  <li>Follow radio call sign discipline for your assigned team.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-sm font-semibold text-blue-200">Site Orientation</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-300">
                  <li>Use designated access routes and check in with zone supervisors.</li>
                  <li>Know the nearest muster point for your work location.</li>
                  <li>Escalate welfare concerns for staff or attendees immediately.</li>
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
              <h3 className="text-sm font-semibold text-blue-200">Code of conduct</h3>
              <p className="mt-2">
                Maintain professional standards, respect all event personnel, and comply with directions from the control room team. Alcohol or
                substance use while on accreditation is strictly prohibited. Breaches may result in accreditation withdrawal.
              </p>
            </div>

            <CompleteInductionButton token={token} initialStatus={record.status} />
          </div>
        </section>

        <footer className="text-center text-xs text-slate-500">
          Need help? Contact the accreditation desk via the event control room.
        </footer>
      </main>
    </div>
  )
}
