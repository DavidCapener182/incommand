"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import MarketingNavigation from "../components/MarketingNavigation"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700 text-white">
      {/* Navbar */}
      <MarketingNavigation />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center flex-grow px-6 pt-16 pb-24">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 max-w-3xl"
        >
          Powerful Event Control <br />
          <span className="text-blue-200">Built for Real-World Operations</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-blue-100 text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed"
        >
          Manage incidents, monitor attendance, and track performance in real time with a
          unified, AI-powered command platform.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Link
            href="/pricing"
            className="bg-[#2661F5] hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-lg font-semibold shadow-md transition-transform active:scale-95"
          >
            Request a Demo
          </Link>
          <Link
            href="/login"
            className="bg-white text-blue-800 hover:bg-blue-100 px-6 py-3 rounded-xl text-lg font-semibold shadow-md transition-transform active:scale-95"
          >
            Log In
          </Link>
        </motion.div>
      </section>

      {/* Key Features */}
      <section className="bg-[#F8FAFC] text-blue-900 py-16 px-6 lg:px-12 rounded-t-3xl">
        <h2 className="text-center text-3xl font-extrabold mb-12 text-[#23408e]">
          Why Teams Choose InCommand
        </h2>
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {[
            {
              title: "Multi-Tenancy & Event Management",
              desc: "Manage multiple events simultaneously with isolated data, permissions, and roles.",
              link: "/features",
            },
            {
              title: "AI-Powered Insights & Analytics",
              desc: "Automated summaries, predictive analytics, and decision-support tools for faster response.",
              link: "/features",
            },
            {
              title: "Real-Time Notifications",
              desc: "Smart alerts and activity feeds keep your entire control room in sync instantly.",
              link: "/features",
            },
            {
              title: "Staff Management & Callsigns",
              desc: "Card-based assignment interface with skill coverage tracking and instant rebalancing.",
              link: "/features",
            },
            {
              title: "Advanced Analytics Dashboard",
              desc: "Heatmaps, incident timelines, and performance metrics for operational oversight.",
              link: "/features",
            },
            {
              title: "Security & Permissions",
              desc: "Granular access control, audit logs, and compliance support for safe operations.",
              link: "/features",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-6 bg-white rounded-2xl shadow-md border border-blue-100 hover:shadow-xl transition"
            >
              <h3 className="text-lg font-semibold text-[#23408e] mb-2">{item.title}</h3>
              <p className="text-sm text-blue-700 mb-4">{item.desc}</p>
              <Link
                href={item.link}
                className="text-sm font-medium text-[#2661F5] hover:underline"
              >
                Learn more →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-blue-700 to-blue-600 py-20 px-6 lg:px-12 text-center text-white">
        <h2 className="text-3xl font-extrabold mb-4">Ready to Transform Your Operations?</h2>
        <p className="text-blue-100 text-lg mb-8">
          Join hundreds of event and security teams using InCommand to stay coordinated.
        </p>
        <Link
          href="/signup"
          className="bg-white text-blue-800 font-semibold px-8 py-4 rounded-xl hover:bg-blue-100 shadow-md transition"
        >
          Get Started
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-blue-100 py-6 text-center text-xs">
        <div className="flex justify-center gap-4 mb-2">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          <span>|</span>
          <Link href="/terms" className="hover:underline">Terms of Use</Link>
        </div>
        <p>© {new Date().getFullYear()} InCommand. All rights reserved.</p>
      </footer>
    </div>
  )
}