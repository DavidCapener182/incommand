// Server component wrapper
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { TimelineSkeleton } from './timeline/Skeleton'

const TimelineClient = dynamic(() => import('./timeline/TimelineClient'), {
  ssr: false,
  loading: () => <TimelineSkeleton />,
})

export default async function IncidentTimeline({ incidents }: { incidents: any[] }) {
  // data fetched server-side (no client Supabase calls)
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm border border-blue-100">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">Incident Timeline</h2>
      <Suspense fallback={<TimelineSkeleton />}>
        <TimelineClient incidents={incidents} />
      </Suspense>
    </section>
  )
}
