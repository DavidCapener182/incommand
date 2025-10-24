"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import MarketingNavigation from "../components/MarketingNavigation"
import { useLaunchMode } from "@/hooks/useLaunchMode"
import { LaunchCountdown } from "@/components/marketing/LaunchCountdown"
import { RegisterInterestModal } from "@/components/marketing/RegisterInterestModal"
import { SocialLinks } from "@/components/marketing/SocialLinks"
import { MarketingFooter } from "@/components/marketing/MarketingFooter"
import { Metadata } from "next"
import { pageMetadata } from "@/config/seo.config"

export default function HomePage() {
  const { isPreLaunch, preLaunchConfigured, launchDate, countdownStart, totalDurationMs } = useLaunchMode()
  const [interestOpen, setInterestOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700 text-white">
      {/* Navbar */}
      <MarketingNavigation />

      {/* HERO SECTION */}
      <section className="relative flex flex-col items-center justify-center text-center flex-grow px-6 pt-16 pb-20 sm:pt-24 sm:pb-32 overflow-hidden">
        {/* Subtle animated background overlay */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-800/60 to-blue-700/70" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800/20 to-blue-600/10 animate-pulse-slow" />

        {/* Hero Text */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 max-w-4xl drop-shadow-lg"
        >
          Take Command of Every Event{" "}
          <span className="block text-blue-200 mt-2">Safely, Efficiently, and in Real Time</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative z-10 text-blue-100 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed"
        >
          InCommand is the UK's all-in-one event control and incident management platform — built by safety professionals to help your team respond faster, communicate smarter, and maintain complete operational oversight.
        </motion.p>

        {preLaunchConfigured && (
          <LaunchCountdown
            launchDate={launchDate}
            countdownStart={countdownStart}
            totalDurationMs={totalDurationMs}
            className="relative z-10"
            progressBarClassName="bg-white/30"
          />
        )}

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 flex flex-wrap justify-center gap-4 mt-8"
        >
          {isPreLaunch ? (
            <button
              type="button"
              onClick={() => setInterestOpen(true)}
              className="bg-white text-blue-700 hover:bg-blue-100 hover:-translate-y-0.5 hover:shadow-xl px-8 py-4 rounded-xl text-lg font-semibold shadow-lg transition-all duration-300 active:scale-95"
            >
              Book a Demo
            </button>
          ) : (
            <Link
              href="/signup"
              className="bg-white text-blue-700 hover:bg-blue-100 hover:-translate-y-0.5 hover:shadow-xl px-8 py-4 rounded-xl text-lg font-semibold shadow-lg transition-all duration-300 active:scale-95"
            >
              Book a Demo
            </Link>
          )}
          <Link
            href="/features"
            className="bg-transparent border border-white text-white hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-lg px-8 py-4 rounded-xl text-lg font-semibold shadow-md transition-all duration-300 active:scale-95"
          >
            Explore Features
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 mt-8"
        >
          <SocialLinks />
        </motion.div>

        {/* Hero Illustration Placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative z-10 mt-16 w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-blue-200/30 ring-4 ring-white/10"
        >
          <div className="bg-blue-900/30 flex items-center justify-center w-full h-full">
            <p className="text-blue-200 text-sm sm:text-base italic">
              [ Placeholder for product screenshot or animated preview ]
            </p>
          </div>
        </motion.div>
      </section>

      {/* KEY FEATURES */}
      <section className="relative bg-gradient-to-b from-[#23408e] to-[#2661F5]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#23408e] to-[#2661F5]" />
        <div className="relative z-10 bg-white text-blue-900 py-20 px-6 lg:px-12 rounded-t-3xl overflow-hidden">
        <h2 className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold mb-14 text-[#23408e]">
          Why Event Professionals Choose InCommand
        </h2>
        <p className="text-center text-lg text-blue-700 mb-16 max-w-3xl mx-auto">
          Trusted by UK festivals, venues, and safety teams, InCommand brings together everything you need to manage incidents, monitor operations, and make confident decisions — all in one intuitive platform.
        </p>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {[
            {
              title: "Seamless Multi-Event Control",
              desc: "Manage multiple events with isolated dashboards, permissions, and data in real time.",
              link: "/features",
            },
            {
              title: "AI-Driven Insights",
              desc: "Predict risks and analyse performance with intelligent reporting tools.",
              link: "/features",
            },
            {
              title: "Real-Time Alerts",
              desc: "Receive instant notifications on incidents and activity — wherever you are.",
              link: "/features",
            },
            {
              title: "Smarter Staff Management",
              desc: "Assign, reassign, and track teams visually with callsigns and live status boards.",
              link: "/features",
            },
            {
              title: "Advanced Analytics Dashboard",
              desc: "Heatmaps, incident timelines, and performance metrics designed for operational clarity.",
              link: "/features",
            },
            {
              title: "Security & Compliance",
              desc: "Built for JESIP alignment and GDPR compliance, ensuring data integrity and audit-ready logs.",
              link: "/features",
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 sm:p-8 bg-blue-50 rounded-2xl shadow-sm border border-blue-100 hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <h3 className="text-lg font-semibold text-[#23408e] mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-blue-700 mb-4 leading-relaxed">
                {item.desc}
              </p>
              <Link
                href={item.link}
                className="text-sm font-semibold text-[#2661F5] hover:underline inline-flex items-center"
              >
                Learn more →
              </Link>
            </motion.div>
          ))}
        </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="bg-gradient-to-r from-[#23408e] to-[#2661F5] py-24 px-6 lg:px-12 text-center text-white">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4 drop-shadow-md">
          Ready to Transform Your Operations?
        </h2>
        <p className="text-blue-100 text-lg mb-12 leading-relaxed">
          Join hundreds of event and safety teams using InCommand to deliver safer, smarter, more efficient live operations.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {isPreLaunch ? (
            <button
              type="button"
              onClick={() => setInterestOpen(true)}
              className="bg-white text-blue-700 font-semibold px-8 py-4 rounded-xl hover:bg-blue-100 shadow-md transition-transform active:scale-95"
            >
              Request a Demo
            </button>
          ) : (
            <Link
              href="/signup"
              className="bg-white text-blue-700 font-semibold px-8 py-4 rounded-xl hover:bg-blue-100 shadow-md transition-transform active:scale-95"
            >
              Request a Demo
            </Link>
          )}
          <Link
            href="/pricing"
            className="border border-white text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 shadow-md transition"
          >
            See Pricing
          </Link>
        </div>
      </section>

      <MarketingFooter />

      <RegisterInterestModal open={interestOpen} onOpenChange={setInterestOpen} />
    </div>
  )
}