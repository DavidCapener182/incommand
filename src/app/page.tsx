"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import MarketingNavigation from "../components/MarketingNavigation"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700 text-white">
      {/* Navbar */}
      <MarketingNavigation />

      {/* HERO SECTION */}
      <section className="relative flex flex-col items-center justify-center text-center flex-grow px-6 pt-24 pb-32 overflow-hidden">
        {/* Subtle animated background overlay */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-800/60 to-blue-700/70" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800/20 to-blue-600/10 animate-pulse-slow" />

        {/* Hero Text */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 max-w-4xl drop-shadow-lg"
        >
          Powerful Event Control{" "}
          <span className="block text-blue-200 mt-2">Built for Real-World Operations</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative z-10 text-blue-100 text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed"
        >
          Manage incidents, monitor attendance, and track performance in real time with a
          unified, AI-powered command platform designed for professional event teams.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 flex flex-wrap justify-center gap-4"
        >
          <Link
            href="/signup"
            className="bg-white text-blue-700 hover:bg-blue-100 hover:-translate-y-0.5 hover:shadow-xl px-8 py-4 rounded-xl text-lg font-semibold shadow-lg transition-all duration-300 active:scale-95"
          >
            Get Started Free
          </Link>
          <Link
            href="/pricing"
            className="bg-transparent border border-white text-white hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-lg px-8 py-4 rounded-xl text-lg font-semibold shadow-md transition-all duration-300 active:scale-95"
          >
            View Pricing
          </Link>
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
      <section className="bg-white text-blue-900 py-20 px-6 lg:px-12 rounded-t-3xl">
        <h2 className="text-center text-3xl sm:text-4xl font-bold mb-14 text-[#23408e]">
          Why Teams Choose InCommand
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {[
            {
              title: "Multi-Tenancy & Event Management",
              desc: "Manage multiple events simultaneously with isolated data, permissions, and real-time dashboards.",
              link: "/features",
            },
            {
              title: "AI-Powered Insights & Analytics",
              desc: "Automated summaries, predictive analytics, and decision-support tools for faster response and better outcomes.",
              link: "/features",
            },
            {
              title: "Real-Time Notifications",
              desc: "Smart alerts and activity feeds keep your entire control room in sync instantly.",
              link: "/features",
            },
            {
              title: "Staff Management & Callsigns",
              desc: "Card-based assignment interface with skill coverage tracking and one-click reassignment.",
              link: "/features",
            },
            {
              title: "Advanced Analytics Dashboard",
              desc: "Heatmaps, incident timelines, and performance metrics for actionable operational insight.",
              link: "/features",
            },
            {
              title: "Security & Compliance",
              desc: "Granular access control, audit logs, and compliance-ready data protection.",
              link: "/features",
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-8 bg-blue-50 rounded-2xl shadow-sm border border-blue-100 hover:shadow-lg hover:-translate-y-1 transition-all"
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
      </section>

      {/* CTA BANNER */}
      <section className="bg-gradient-to-r from-[#23408e] to-[#2661F5] py-24 px-6 lg:px-12 text-center text-white">
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 drop-shadow-md">
          Ready to Transform Your Operations?
        </h2>
        <p className="text-blue-100 text-lg mb-10 leading-relaxed">
          Join hundreds of event and security teams using InCommand to run safer, more efficient operations.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/signup"
            className="bg-white text-blue-700 font-semibold px-8 py-4 rounded-xl hover:bg-blue-100 shadow-md transition-transform active:scale-95"
          >
            Get Started Free
          </Link>
          <Link
            href="/pricing"
            className="border border-white text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 shadow-md transition"
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-blue-900 text-blue-100 py-8 text-center text-xs border-t border-blue-800/60">
        <div className="flex justify-center gap-4 mb-2">
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <span>|</span>
          <Link href="/terms" className="hover:underline">
            Terms of Use
          </Link>
        </div>
        <p className="text-blue-200">
          © {new Date().getFullYear()} InCommand. All rights reserved.
        </p>
      </footer>
    </div>
  )
}