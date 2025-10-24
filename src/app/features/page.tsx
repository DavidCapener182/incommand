'use client'

import React, { useState } from 'react'
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
import { useLaunchMode } from '@/hooks/useLaunchMode'
import { RegisterInterestModal } from '@/components/marketing/RegisterInterestModal'
import { SocialLinks } from '@/components/marketing/SocialLinks'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

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
  const { isPreLaunch } = useLaunchMode()
  const [interestOpen, setInterestOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700 text-white">
      <MarketingNavigation />
      <PageWrapper>

        {/* HERO SECTION */}
        <section className="relative flex flex-col lg:flex-row items-center justify-between gap-10 py-24 px-6 sm:px-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-blue-800/40 to-blue-700/30" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-800/20 to-blue-600/10 animate-pulse-slow" />
          
          {/* TEXT */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative z-10 max-w-xl text-center lg:text-left"
          >
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent drop-shadow-lg">
                Transform How You Manage Events
              </span>
            </h1>
            <p className="text-blue-100 text-lg mb-10 leading-relaxed">
              InCommand brings together incident tracking, staff management, and analytics in one
              intelligent command platform for modern safety teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {isPreLaunch ? (
                <button
                  type="button"
                  onClick={() => setInterestOpen(true)}
                  className="bg-white text-blue-800 font-semibold px-8 py-4 rounded-xl shadow-lg hover:bg-blue-50 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 active:scale-95"
                >
                  Register Interest
                </button>
              ) : (
                <Link
                  href="/signup"
                  className="bg-white text-blue-800 font-semibold px-8 py-4 rounded-xl shadow-lg hover:bg-blue-50 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 active:scale-95"
                >
                  Start Free Trial
                </Link>
              )}
              <Link
                href="/pricing"
                className="border border-white text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
              >
                View Pricing
              </Link>
            </div>
            <div className="mt-8">
              <SocialLinks />
            </div>
          </motion.div>

          {/* IMAGE */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="relative w-full max-w-lg mt-10 lg:mt-0 z-10"
          >
            <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl border border-blue-200/30 ring-4 ring-white/10">
              <Image
                src="/placeholder-dashboard.png"
                alt="Screenshot of InCommand dashboard showing live incidents and analytics"
                fill
                className="object-cover"
              />
            </div>
          </motion.div>
        </section>

        {/* FEATURES GRID */}
        <StackedPanel className="py-20 px-6 sm:px-10 bg-white text-blue-900 rounded-t-3xl">
          <h2 className="text-center text-3xl font-bold mb-14 text-[#23408e]">
            Why Event Professionals Choose InCommand
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-md border border-blue-100 hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer min-h-[230px]"
                onClick={() => setSelectedFeature(feature)}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-blue-700" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-blue-900">
                  {feature.title}
                </h3>
                <p className="text-blue-700 text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>
                <span className="text-blue-600 text-sm font-semibold inline-flex items-center hover:underline">
                  Learn more →
                </span>
              </motion.div>
            ))}
          </div>
        </StackedPanel>

        {/* VISUAL BREAK */}
        <section className="relative py-24 bg-gradient-to-r from-blue-800 to-blue-700 overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <Image
              src="/placeholder-event-control-room.jpg"
              alt="Event control room with staff operating screens"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white drop-shadow-md">
              Designed for Every Scale of Operation
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              From small festivals to major city events — InCommand adapts effortlessly to your
              organisation&apos;s scale, workflows, and command structure.
            </p>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-20 px-6 sm:px-10 bg-gradient-to-b from-white to-blue-50 text-blue-900">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-center text-3xl font-bold mb-12 text-[#23408e]">
              What Our Clients Say
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
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
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="p-6 bg-white rounded-2xl shadow border border-blue-100 hover:shadow-lg hover:-translate-y-1 transition"
              >
                <p className="italic text-blue-800 mb-4">&ldquo;{t.quote}&rdquo;</p>
                <p className="font-semibold text-blue-900">{t.name}</p>
                <p className="text-sm text-blue-600">{t.org}</p>
              </motion.div>
            ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-[#23408e] to-[#2661F5] py-24 text-center text-white">
          <div className="max-w-7xl mx-auto px-6 sm:px-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 drop-shadow-md">
              Ready to Transform Your Operations?
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              Join hundreds of event and safety teams already using InCommand.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isPreLaunch ? (
                <button
                  type="button"
                  onClick={() => setInterestOpen(true)}
                  className="bg-white text-blue-700 font-semibold px-8 py-4 rounded-xl hover:bg-blue-100 shadow-md transition-transform active:scale-95"
                >
                  Register Interest
                </button>
              ) : (
                <Link
                  href="/signup"
                  className="bg-white text-blue-700 font-semibold px-8 py-4 rounded-xl hover:bg-blue-100 shadow-md transition-transform active:scale-95"
                >
                  Get Started Free
                </Link>
              )}
            <a
              href="mailto:sales@incommand.uk?subject=Request Demo"
              className="border border-white text-white px-8 py-4 rounded-xl hover:bg-white/10 font-semibold transition-colors"
            >
              Request a Demo
            </a>
            </div>
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
      <MarketingFooter />
      <RegisterInterestModal open={interestOpen} onOpenChange={setInterestOpen} />
    </div>
  )
}