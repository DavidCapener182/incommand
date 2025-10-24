'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ShieldCheckIcon,
  LightBulbIcon,
  CheckCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import MarketingNavigation from '@/components/MarketingNavigation'
import { useLaunchMode } from '@/hooks/useLaunchMode'
import { RegisterInterestModal } from '@/components/marketing/RegisterInterestModal'
import { SocialLinks } from '@/components/marketing/SocialLinks'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

const values = [
  {
    icon: ShieldCheckIcon,
    title: 'Safety First',
    description:
      'Every attendee deserves to feel safe. Our platform empowers teams to respond rapidly and effectively to incidents.',
  },
  {
    icon: LightBulbIcon,
    title: 'Innovation',
    description:
      'We harness AI, automation, and predictive analytics to deliver modern, proactive event safety management.',
  },
  {
    icon: CheckCircleIcon,
    title: 'Reliability',
    description:
      'Our clients rely on InCommand during their most critical operations. We maintain 99.9% uptime, always.',
  },
  {
    icon: UsersIcon,
    title: 'Community',
    description:
      'We connect event professionals worldwide, sharing knowledge and best practices to improve safety standards together.',
  },
]

const stats = [
  { value: '15+', label: 'Years in Event Operations' },
  { value: '500+', label: 'Events Supported' },
  { value: '10,000+', label: 'Incidents Logged' },
  { value: '99.9%', label: 'Uptime Guarantee' },
]

export default function AboutPage() {
  const { isPreLaunch } = useLaunchMode()
  const [interestOpen, setInterestOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F1F4F9] text-slate-900">
      <MarketingNavigation />

      {/* HERO — full-width, clean gradient */}
      <section className="relative w-full overflow-hidden">
        <div className="relative w-full bg-gradient-to-b from-[#23408e] to-[#2661F5] text-white">
          <Image
            src="/placeholder-control-room.jpg"
            alt="Event control room with staff monitoring operations"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#23408e]/80 via-[#2661F5]/60 to-[#23408e]/70" />
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative z-10 text-center py-20 sm:py-32 px-6"
          >
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">
              Making Events Safer — One Incident at a Time
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              We're redefining event management and incident response with real-time, field-proven technology built by professionals who've been there.
            </p>
            <div className="mt-10 flex justify-center">
              <SocialLinks />
            </div>
          </motion.div>
        </div>
      </section>

      {/* MISSION */}
      <section className="py-20 bg-white text-blue-900">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 space-y-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-6 text-[#23408e]">Our Mission</h2>
            <p className="text-lg text-blue-800 mb-6 leading-relaxed">
              To empower event teams to respond faster, communicate smarter, and maintain the highest standards of safety and compliance — no matter the size or scale of operation.
            </p>
            <p className="text-lg text-blue-700 max-w-3xl mx-auto leading-relaxed">
              InCommand isn't just software — it's a professional platform that transforms how teams coordinate, document, and analyse safety operations in real time.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h3 className="text-2xl font-semibold mt-8 text-[#23408e] mb-4">
              Designed by Practitioners, for Practitioners
            </h3>
            <p className="text-blue-800 leading-relaxed mb-3">
              After years managing major UK events, our founder recognised a problem — most incident management systems were built for offices, not the field. They were complicated, outdated, or couldn't adapt to the pace of live event control.
            </p>
            <p className="text-blue-700 leading-relaxed">
              InCommand bridges that gap. Built mobile-first and JESIP-aligned, it's a legally defensible system that keeps teams connected, accountable, and in control — wherever they operate.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FOUNDER — no borders or rings */}
      <section className="bg-gradient-to-b from-blue-50 to-blue-100 text-blue-900 py-20 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-3xl overflow-hidden shadow-lg flex-shrink-0"
          >
            <Image
              src="/placeholder-david-capener.jpg"
              alt="Portrait of David Capener, CEO & Founder of InCommand"
              fill
              className="object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="flex-1"
          >
            <h3 className="text-2xl font-bold mb-2">David Capener</h3>
            <p className="text-blue-600 font-semibold mb-6 text-lg">CEO & Founder</p>
            <p className="text-blue-800 mb-4 leading-relaxed">
              With over 15 years of experience in event management, safety, and security, David founded InCommand to solve the operational challenges faced by professionals on the ground.
            </p>
            <p className="text-blue-700 mb-4 leading-relaxed">
              Having led control rooms at major festivals and sports events, he understands the realities of coordinating large-scale operations with fragmented tools. InCommand was designed from that experience — a platform built for real-world demands.
            </p>
            <p className="italic text-blue-700 font-medium leading-relaxed">
              "If it isn't written down, it didn't happen." That simple truth underpins every aspect of our system — clarity, accountability, and safety above all.
            </p>
          </motion.div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-20 bg-white text-blue-900 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold mb-12 text-[#23408e]"
          >
            Our Values
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 sm:p-8 rounded-2xl bg-blue-50 hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-700" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-blue-800 text-sm leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-gradient-to-r from-[#23408e] to-[#2661F5] text-white py-20 text-center px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Built on Real Experience</h2>
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-10">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-4xl sm:text-5xl font-extrabold mb-2">{stat.value}</div>
                <div className="text-blue-100 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#23408e] to-[#2661F5] py-24 text-center text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Partner with Us to Elevate Event Safety
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Whether you're managing a local festival or an international venue, InCommand empowers your team to operate safely, efficiently, and with complete confidence.
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
                Register Interest
              </Link>
            )}
            <a
              href="mailto:info@incommand.uk?subject=About InCommand"
              className="border border-white text-white px-8 py-4 rounded-xl hover:bg-white/10 font-semibold transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      <MarketingFooter />
      <RegisterInterestModal open={interestOpen} onOpenChange={setInterestOpen} />
    </div>
  )
}