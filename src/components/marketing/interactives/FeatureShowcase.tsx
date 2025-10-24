'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { FadeIn } from '@/components/marketing/Motion'
import {
  ShieldCheckIcon,
  SparklesIcon,
  BellAlertIcon,
  UsersIcon,
  ChartBarIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'

const FeatureModal = dynamic(
  () => import('@/components/modals/FeatureModal').then((mod) => mod.FeatureModal),
  { ssr: false },
)

interface FeatureDefinition {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  details?: string
}

const featureDefinitions: FeatureDefinition[] = [
  {
    icon: ShieldCheckIcon,
    title: 'Oversee Multiple Events Seamlessly',
    description:
      'Manage multiple sites, venues, or events from one dashboard — with dedicated access levels and team visibility.',
    details:
      'Create discrete operational spaces for each event, invite stakeholders with the correct access level, and monitor cross-venue activity without losing context.',
  },
  {
    icon: SparklesIcon,
    title: 'Predict Risks Before They Escalate',
    description:
      'AI-powered analytics highlight emerging trends and potential issues before they affect safety outcomes.',
    details:
      'InCommand analyses logs, weather, and attendance data to surface actionable insights so crews can intervene early and deploy resources precisely where they’re needed.',
  },
  {
    icon: BellAlertIcon,
    title: 'Stay Informed with Real-Time Alerts',
    description:
      'Smart notifications keep control rooms and field teams aligned, ensuring no critical incident goes unseen.',
    details:
      'Configure escalation rules, broadcast targeted updates, and track acknowledgement to maintain a perfect operational picture.',
  },
  {
    icon: UsersIcon,
    title: 'Smarter Staff Assignment',
    description:
      'Visual dashboards make it easy to deploy teams, manage skills coverage, and reassign staff instantly.',
    details:
      'Drag-and-drop assignment tools, callsign management, and live presence indicators help supervisors coordinate teams without friction.',
  },
  {
    icon: ChartBarIcon,
    title: 'Turn Data into Safer Decisions',
    description:
      'Analyse incident data, track response times, and benchmark performance using dynamic heatmaps and metrics.',
    details:
      'Generate executive summaries, export compliance reports, and review log quality trends in seconds to support rapid debriefs.',
  },
  {
    icon: LockClosedIcon,
    title: 'Built for Compliance and Security',
    description:
      'Maintain a full audit trail of actions, aligned with UK JESIP frameworks and GDPR data standards.',
    details:
      'Fine-grained permissions, audit-ready histories, and secure data residency ensure every entry is accountable and compliant.',
  },
]

export const FeatureShowcase = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const activeFeature = useMemo(() => (activeIndex !== null ? featureDefinitions[activeIndex] : null), [activeIndex])

  return (
    <>
      <div className="grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {featureDefinitions.map((feature, index) => (
          <FadeIn
            key={feature.title}
            delay={index * 0.08}
            className="min-h-[180px] cursor-pointer rounded-2xl bg-white p-6 text-left shadow-md transition-all hover:-translate-y-1.5 hover:shadow-lg focus:outline-none sm:min-h-[200px] sm:p-8"
            onClick={() => setActiveIndex(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setActiveIndex(index)
              }
            }}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 sm:h-14 sm:w-14">
              <feature.icon className="h-6 w-6 text-blue-700 sm:h-7 sm:w-7" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-blue-900">{feature.title}</h3>
            <p className="mb-4 text-sm leading-relaxed text-blue-700">{feature.description}</p>
            <span className="inline-flex items-center text-sm font-semibold text-blue-600">Learn more →</span>
          </FadeIn>
        ))}
      </div>

      {activeFeature && (
        <FeatureModal
          isOpen
          onClose={() => setActiveIndex(null)}
          title={activeFeature.title}
          content={
            <div className="space-y-4">
              <p>{activeFeature.description}</p>
              {activeFeature.details && <p>{activeFeature.details}</p>}
            </div>
          }
          icon={activeFeature.icon}
        />
      )}
    </>
  )
}
