'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ShieldCheckIcon,
  SparklesIcon,
  BellAlertIcon,
  UsersIcon,
  ChartBarIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'
import { FeatureModal } from '@/components/modals/FeatureModal'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { StackedPanel } from '@/components/ui/StackedPanel'
import MarketingNavigation from '@/components/MarketingNavigation'

const features = [
  {
    icon: ShieldCheckIcon,
    title: 'Multi-Tenancy & Event Management',
    description:
      'Manage multiple events seamlessly with complete company isolation, role-based permissions, and real-time dashboards.',
  },
  {
    icon: SparklesIcon,
    title: 'AI-Powered Insights',
    description:
      'Predictive analytics, automated debriefs, and natural language insights for smarter operational decisions.',
  },
  {
    icon: BellAlertIcon,
    title: 'Real-Time Notifications',
    description:
      'Stay instantly informed with live alerts, prioritised by urgency, across all devices.',
  },
  {
    icon: UsersIcon,
    title: 'Staff & Callsign Management',
    description:
      'Coordinate your team visually with skill badges, departmental colours, and one-click assignments.',
  },
  {
    icon: ChartBarIcon,
    title: 'Analytics & Performance',
    description:
      'Identify trends, measure response times, and benchmark performance using live data visualisations.',
  },
  {
    icon: LockClosedIcon,
    title: 'Security & Compliance',
    description:
      'Enterprise-grade protection with full audit trails, SOC 2 infrastructure, and multi-factor authentication.',
  },
]

export default function FeaturesPage() {
  const [selectedFeature, setSelectedFeature] = useState<typeof features[0] | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700 text-white">
      <MarketingNavigation />
      <PageWrapper>

        {/* HERO SECTION */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-10 py-20 px-6 sm:px-10">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-xl text-center lg:text-left"
          >
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
              Transform How You Manage Events
            </h1>
            <p className="text-blue-100 text-lg mb-8">
              InCommand brings together incident tracking, staff management, and analytics in one
              intelligent command platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/signup"
                className="bg-white text-blue-800 font-semibold px-6 py-3 rounded-xl shadow-md hover:bg-blue-100 transition-transform active:scale-95"
              >
                Start Free Trial
              </Link>
              <Link
                href="/pricing"
                className="bg-transparent border border-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </motion.div>

          {/* Product Image Placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="relative w-full max-w-lg"
          >
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-blue-200/30">
              <Image
                src="/placeholder-dashboard.png"
                alt="Screenshot of InCommand dashboard showing live incidents and analytics"
                fill
                className="object-cover"
              />
            </div>
          </motion.div>
        </section>

        {/* FEATURE GRID */}
        <StackedPanel className="py-16 px-6 sm:px-10 bg-white text-blue-900 rounded-t-3xl">
          <h2 className="text-center text-3xl font-bold mb-12 text-[#23408e]">
            Why Event Professionals Choose InCommand
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-md border border-blue-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
                onClick={() => setSelectedFeature(feature)}
              >
                <feature.icon className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-blue-900">
                  {feature.title}
                </h3>
                <p className="text-blue-700 text-sm">{feature.description}</p>
                <span className="text-blue-600 text-sm font-medium mt-3 inline-flex items-center">
                  Learn more →
                </span>
              </motion.div>
            ))}
          </div>
        </StackedPanel>

        {/* VISUAL BREAK SECTION */}
        <section className="relative py-20 bg-gradient-to-r from-blue-800 to-blue-700 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <Image
              src="/placeholder-event-control-room.jpg"
              alt="Event control room with staff operating screens"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-extrabold mb-4">Designed for Every Scale of Operation</h2>
            <p className="text-blue-100 text-lg">
              From small festivals to major city events — InCommand scales effortlessly with your
              needs.
            </p>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section className="py-20 px-6 sm:px-10 bg-white text-blue-900">
          <h2 className="text-center text-3xl font-bold mb-12 text-[#23408e]">
            What Our Clients Say
          </h2>
          <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-3">
            {[
              {
                quote:
                  'We reduced incident response times by 40% using InCommand during our first major deployment.',
                name: 'Event Safety Manager',
                org: 'Major UK Arena',
              },
              {
                quote:
                  'Finally, a platform that understands the operational challenges of live events.',
                name: 'Head of Security',
                org: 'National Stadium Group',
              },
              {
                quote:
                  'The analytics and AI summaries are game-changers for post-event debriefs.',
                name: 'Operations Lead',
                org: 'City Festival',
              },
            ].map((t) => (
              <div
                key={t.name}
                className="p-6 bg-blue-50 rounded-2xl shadow border border-blue-100"
              >
                <p className="italic text-blue-800 mb-4">"{t.quote}"</p>
                <p className="font-semibold text-blue-900">{t.name}</p>
                <p className="text-sm text-blue-600">{t.org}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-gradient-to-r from-blue-700 to-blue-600 py-20 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to Transform Your Operations?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join hundreds of event and security teams who trust InCommand.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-blue-700 font-semibold px-8 py-4 rounded-xl hover:bg-blue-100 shadow-md transition-transform active:scale-95"
            >
              Get Started Free
            </Link>
            <a
              href="mailto:sales@incommand.uk?subject=Request Demo"
              className="border border-white text-white px-8 py-4 rounded-xl hover:bg-white/10 font-semibold transition-colors"
            >
              Request a Demo
            </a>
          </div>
        </section>

        {/* MODAL */}
        {selectedFeature && (
          <FeatureModal
            isOpen={true}
            onClose={() => setSelectedFeature(null)}
            title={selectedFeature.title}
            content={
              <div className="text-blue-800">
                <p>{selectedFeature.description}</p>
              </div>
            }
            icon={selectedFeature.icon}
          />
        )}
      </PageWrapper>
    </div>
  )
}