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
import MarketingNavigation from '@/components/MarketingNavigation'
import { useLaunchMode } from '@/hooks/useLaunchMode'
import { RegisterInterestModal } from '@/components/marketing/RegisterInterestModal'
import { SocialLinks } from '@/components/marketing/SocialLinks'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { FeatureModal } from '@/components/modals/FeatureModal'

const features = [
  {
    icon: ShieldCheckIcon,
    title: 'Oversee Multiple Events Seamlessly',
    description:
      'Manage multiple sites, venues, or events from one dashboard — with dedicated access levels and team visibility.',
  },
  {
    icon: SparklesIcon,
    title: 'Predict Risks Before They Escalate',
    description:
      'AI-powered analytics highlight emerging trends and potential issues before they affect safety outcomes.',
  },
  {
    icon: BellAlertIcon,
    title: 'Stay Informed with Real-Time Alerts',
    description:
      'Smart notifications keep control rooms and field teams aligned, ensuring no critical incident goes unseen.',
  },
  {
    icon: UsersIcon,
    title: 'Smarter Staff Assignment',
    description:
      'Visual dashboards make it easy to deploy teams, manage skills coverage, and reassign staff instantly.',
  },
  {
    icon: ChartBarIcon,
    title: 'Turn Data into Safer Decisions',
    description:
      'Analyse incident data, track response times, and benchmark performance using dynamic heatmaps and metrics.',
  },
  {
    icon: LockClosedIcon,
    title: 'Built for Compliance and Security',
    description:
      'Maintain a full audit trail of actions, aligned with UK JESIP frameworks and GDPR data standards.',
  },
]

export default function FeaturesPage() {
  const [selectedFeature, setSelectedFeature] = useState<(typeof features)[number] | null>(null)
  const { isPreLaunch } = useLaunchMode()
  const [interestOpen, setInterestOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F1F4F9] text-slate-900">
      <MarketingNavigation />

      {/* HERO — full width gradient (no borders/rings) */}
      <section className="relative w-full overflow-hidden">
        <div className="w-full bg-gradient-to-b from-[#23408e] to-[#2661F5] text-white">
          <div className="mx-auto max-w-7xl py-16 sm:py-24 px-6 sm:px-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-xl text-center lg:text-left"
            >
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Designed for Modern Event Safety Teams
                </span>
              </h1>
              <p className="text-blue-100 text-lg mb-10 leading-relaxed">
                Streamline every aspect of live event control — from incident logging to staff coordination — with one intelligent, AI-powered command platform trusted across the UK.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {isPreLaunch ? (
                  <button
                    type="button"
                    onClick={() => setInterestOpen(true)}
                    className="bg-white text-blue-800 font-semibold px-8 py-4 rounded-xl shadow hover:bg-blue-50 transition-all active:scale-95"
                  >
                    Register Interest
                  </button>
                ) : (
                  <Link
                    href="/signup"
                    className="bg-white text-blue-800 font-semibold px-8 py-4 rounded-xl shadow hover:bg-blue-50 transition-all active:scale-95"
                  >
                    Request a Demo
                  </Link>
                )}
                <Link
                  href="/pricing"
                  className="border border-white text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-all"
                >
                  Talk to Sales
                </Link>
              </div>

              <div className="mt-8">
                <SocialLinks />
              </div>
            </motion.div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative w-full max-w-lg"
            >
              {/* No border/ring here */}
              <div className="aspect-video rounded-3xl overflow-hidden bg-white/10 backdrop-blur-sm">
                <Image
                  src="/placeholder-dashboard.png"
                  alt="Screenshot of InCommand dashboard showing live incidents and analytics"
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID — no borders on cards */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl bg-white rounded-3xl py-16 px-6 sm:px-10">
          <h2 className="text-center text-3xl font-bold mb-14 text-[#23408e]">
            Powerful Features for Safer, Smarter Operations
          </h2>
          <p className="text-center text-lg text-blue-700 mb-16 max-w-3xl mx-auto">
            InCommand equips your team with the tools they need to plan, monitor, and manage any live event — whether it&apos;s a local festival or a national stadium. Each feature is built to enhance coordination, accountability, and response speed.
          </p>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <motion.button
                type="button"
                key={feature.title}
                onClick={() => setSelectedFeature(feature)}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="text-left bg-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-lg hover:-translate-y-1.5 transition-all cursor-pointer min-h-[200px] sm:min-h-[230px] focus:outline-none"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-blue-700" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-blue-900">
                  {feature.title}
                </h3>
                <p className="text-blue-700 text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>
                <span className="text-blue-600 text-sm font-semibold inline-flex items-center">
                  Learn more →
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* VISUAL BREAK */}
      <section className="relative py-24 bg-gradient-to-r from-[#23408e] to-[#2661F5] overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <Image
            src="/placeholder-event-control-room.jpg"
            alt="Event control room with staff operating screens"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative text-center max-w-3xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white">
            From the Field to the Control Room — One Connected Platform
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            Designed by practitioners with real-world experience, InCommand connects your on-site teams and control staff through a single, secure interface. From mobile reporting to live dashboards, every decision becomes faster, clearer, and fully accountable.
          </p>
        </div>
      </section>

      {/* SCALE & PROOF */}
      <section className="py-20 px-6 sm:px-10 bg-gradient-to-b from-white to-blue-50 text-blue-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-3xl font-bold mb-12 text-[#23408e]">
            Built for Scale, Proven in the Field
          </h2>
          <p className="text-center text-lg text-blue-700 mb-16 max-w-3xl mx-auto">
            InCommand adapts to any operation — from small community festivals to complex, city-wide deployments.
          </p>

          <div className="grid gap-8 grid-cols-1 xs:grid-cols-2 md:grid-cols-3 mb-16">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[#23408e] mb-2">500+</div>
              <div className="text-blue-700">Events Supported</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[#23408e] mb-2">10,000+</div>
              <div className="text-blue-700">Incidents Managed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[#23408e] mb-2">99.9%</div>
              <div className="text-blue-700">Uptime Guarantee</div>
            </div>
          </div>

          <h3 className="text-center text-2xl font-bold mb-8 text-[#23408e]">
            Trusted by Industry Leaders
          </h3>
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
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="p-6 bg-white rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition"
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
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Experience the Future of Event Control
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Discover how InCommand helps your team coordinate safely and efficiently, no matter the size or complexity of your event.
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
                Request a Demo
              </Link>
            )}
            <a
              href="mailto:sales@incommand.uk?subject=Request Demo"
              className="border border-white text-white px-8 py-4 rounded-xl hover:bg-white/10 font-semibold transition-colors"
            >
              Talk to Sales
            </a>
          </div>
        </div>
      </section>

      {/* Feature modal */}
      {selectedFeature && (
        <FeatureModal
          isOpen
          onClose={() => setSelectedFeature(null)}
          title={selectedFeature.title}
          content={<div className="text-blue-800">{selectedFeature.description}</div>}
          icon={selectedFeature.icon}
        />
      )}

      <MarketingFooter />
      <RegisterInterestModal open={interestOpen} onOpenChange={setInterestOpen} />
    </div>
  )
}