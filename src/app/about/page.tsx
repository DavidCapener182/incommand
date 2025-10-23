'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ShieldCheckIcon,
  LightBulbIcon,
  CheckCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { StackedPanel } from '@/components/ui/StackedPanel'
import MarketingNavigation from '@/components/MarketingNavigation'

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
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700 text-white">
      <MarketingNavigation />
      <PageWrapper>

        {/* HERO SECTION (unchanged — just polished overlay intensity) */}
        <section className="relative flex items-center justify-center h-[70vh] overflow-hidden">
          <Image
            src="/placeholder-control-room.jpg"
            alt="Event control room with staff monitoring operations"
            fill
            className="object-cover opacity-50"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/90 via-blue-800/70 to-blue-700/60" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-800/20 to-blue-600/10 animate-pulse-slow" />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative z-10 text-center px-6"
          >
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 drop-shadow-md">
              Making Events Safer
              <span className="block mt-2 text-blue-200 font-semibold">
                One Incident at a Time
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              We’re redefining event management and incident response with intelligent,
              real-time technology built by professionals who’ve been on the ground.
            </p>
          </motion.div>
        </section>

        {/* MISSION SECTION */}
        <StackedPanel className="bg-white text-blue-900 py-20 px-6 sm:px-10 space-y-12 rounded-t-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-8 text-[#23408e]">Our Mission</h2>
            <p className="text-lg text-blue-800 mb-6 leading-relaxed">
              To empower event teams to respond faster, communicate smarter, and maintain the
              highest standards of safety and compliance — no matter the scale of operation.
            </p>
            <p className="text-lg text-blue-700 max-w-3xl mx-auto leading-relaxed">
              InCommand is more than a tool — it’s a professional platform designed to transform
              how teams coordinate, document, and analyse safety operations in real time.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h3 className="text-2xl font-semibold mt-8 text-[#23408e] mb-4">
              Why We Built InCommand
            </h3>
            <p className="text-blue-800 leading-relaxed mb-3">
              After years managing major UK events, our founder recognised that most incident
              management systems were either overcomplicated or completely outdated. Safety teams
              deserved better — something designed from the ground up for real-world event control.
            </p>
            <p className="text-blue-700 leading-relaxed">
              InCommand bridges that gap: a mobile-first, JESIP-aligned, legally defensible
              system that keeps teams connected and in control.
            </p>
          </motion.div>
        </StackedPanel>

        {/* FOUNDER SECTION */}
        <section className="bg-gradient-to-b from-blue-50 to-blue-100 text-blue-900 py-20 px-6 sm:px-10">
          <div className="max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-center mb-12 text-[#23408e]"
            >
              Meet the Founder
            </motion.h2>
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="relative w-64 h-64 rounded-2xl overflow-hidden shadow-2xl border border-blue-200 ring-4 ring-white/50 flex-shrink-0"
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
                With over 15 years of experience in event management, safety, and security,
                David founded InCommand to solve real problems faced by professionals in the field.
              </p>
              <p className="text-blue-700 mb-4 leading-relaxed">
                Having led control rooms at major festivals and sports events, he understands the
                challenges of fragmented tools and outdated systems. InCommand was designed from
                that experience — a platform built by practitioners, for practitioners.
              </p>
              <p className="italic text-blue-700 font-medium leading-relaxed">
                “If it isn’t written down, it didn’t happen.”  
                That principle underpins every aspect of our platform.
              </p>
            </motion.div>
            </div>
          </div>
        </section>

        {/* VALUES SECTION */}
        <section className="py-20 px-6 sm:px-10 bg-white text-blue-900">
          <div className="max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-center mb-12 text-[#23408e]"
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
                className="p-8 rounded-2xl border border-blue-100 bg-blue-50 hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <value.icon className="w-8 h-8 text-blue-700" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-blue-800 text-sm leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="bg-gradient-to-r from-blue-700 to-blue-600 text-white py-20 px-6 sm:px-10 text-center">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 drop-shadow-sm">Built on Real Experience</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-5xl font-extrabold mb-2">{stat.value}</div>
                <div className="text-blue-100 text-sm">{stat.label}</div>
              </motion.div>
            ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="bg-white text-blue-900 py-20 px-6 sm:px-10 text-center">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 text-[#23408e]">
              Partner with Us to Elevate Event Safety
            </h2>
            <p className="text-lg text-blue-700 mb-10 max-w-2xl mx-auto leading-relaxed">
              Whether you&apos;re managing a local festival or an international venue, InCommand is built
              to make your operations safer, smarter, and more efficient.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-blue-700 shadow-md transition-transform active:scale-95"
            >
              Get Started
            </Link>
            <a
              href="mailto:info@incommand.uk?subject=About InCommand"
              className="border border-blue-700 text-blue-700 px-8 py-4 rounded-xl hover:bg-blue-50 font-semibold transition-colors"
            >
              Contact Us
            </a>
            </div>
          </div>
        </section>
      </PageWrapper>
    </div>
  )
}