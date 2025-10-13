'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-8" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        {title}
      </h2>
      <div className="bg-white/90 dark:bg-[#1e2a78]/90 backdrop-blur-lg rounded-2xl border border-gray-200/60 dark:border-[#2d437a]/50 p-4">
        {children}
      </div>
    </section>
  )
}

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155] px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Sticky TOC */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <nav className="lg:col-span-1 lg:sticky lg:top-4 self-start bg-white/80 dark:bg-[#1e2a78]/80 backdrop-blur-md rounded-2xl p-4 border border-gray-200/60 dark:border-[#2d437a]/50">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Contents</h2>
            <ul className="space-y-2 text-sm">
              {[
                ['introduction', 'Introduction'],
                ['dashboard', 'Dashboard Overview'],
                ['events', 'Event Management'],
                ['incidents', 'Incident Management'],
                ['quickadd', 'Quick Add & AI Tools'],
                ['attendance', 'Attendance & Occupancy'],
                ['reports', 'Reports'],
                ['analytics', 'Analytics & Risk Pulse'],
                ['settings', 'Settings'],
                ['accessibility', 'Accessibility & Shortcuts'],
                ['mobile', 'Mobile View'],
                ['support', 'Support & Contact'],
                ['technical', 'Technical Details'],
              ].map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="text-blue-700 dark:text-blue-300 hover:underline">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <main className="lg:col-span-3">
            <Section id="introduction" title="Introduction">
              <p className="text-gray-700 dark:text-gray-100">
                InCommand is a platform for live event control, combining incident logging, team coordination,
                analytics, and real‑time risk awareness. This tutorial guides new users through the core features
                and operational best practices.
              </p>
              <div className="mt-3 flex gap-2 text-sm">
                <Link href="/events/create" className="text-blue-600 hover:underline">Create Event</Link>
                <span className="text-gray-400">•</span>
                <Link href="/incidents" className="text-blue-600 hover:underline">Log Incident</Link>
                <span className="text-gray-400">•</span>
                <Link href="/" className="text-blue-600 hover:underline">View Dashboard</Link>
              </div>
            </Section>

            <Section id="dashboard" title="Dashboard Overview">
              <p className="text-gray-700 dark:text-gray-100 mb-2">Purpose: Live operational picture with key metrics and alerts.</p>
              <ul className="list-disc pl-5 text-gray-700 dark:text-gray-100 text-sm space-y-1">
                <li>Use filters to focus on priority incidents</li>
                <li>Monitor live status indicators and alerts</li>
              </ul>
              <figure className="mt-3">
                <img src="/assets/help/dashboard-overview.png" alt="Dashboard Overview" className="rounded-xl border border-gray-200 dark:border-[#2d437a]" />
                <figcaption className="text-xs text-gray-500 mt-1">Dashboard Overview</figcaption>
              </figure>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/60 dark:border-blue-800/40 text-sm">
                Best practice: Keep filters minimal during peak operations for clarity.
              </div>
              <div className="mt-2 text-xs"><Link href="#onboarding">Related tooltip: Dashboard</Link></div>
            </Section>

            <Section id="events" title="Event Management">
              <p className="text-gray-700 dark:text-gray-100 mb-2">Purpose: Define the current event and timings.</p>
              <figure className="mt-3">
                <img src="/assets/help/event-management.png" alt="Event Management" className="rounded-xl border border-gray-200 dark:border-[#2d437a]" />
                <figcaption className="text-xs text-gray-500 mt-1">Event Management</figcaption>
              </figure>
            </Section>

            <Section id="incidents" title="Incident Management">
              <p className="text-gray-700 dark:text-gray-100 mb-2">Purpose: Create, review, and update incidents with audit trail.</p>
              <figure className="mt-3">
                <img src="/assets/help/incident-management.png" alt="Incident Management" className="rounded-xl border border-gray-200 dark:border-[#2d437a]" />
                <figcaption className="text-xs text-gray-500 mt-1">Incident Management</figcaption>
              </figure>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/60 dark:border-blue-800/40 text-sm">
                Best practice: Use professional, factual language. Amend, do not overwrite.
              </div>
            </Section>

            <Section id="quickadd" title="Quick Add & AI Tools">
              <p className="text-gray-700 dark:text-gray-100 mb-2">Purpose: Rapid entry of structured logs via text or voice.</p>
              <figure className="mt-3">
                <img src="/assets/help/quick-add.png" alt="Quick Add" className="rounded-xl border border-gray-200 dark:border-[#2d437a]" />
                <figcaption className="text-xs text-gray-500 mt-1">Quick Add</figcaption>
              </figure>
              <div className="mt-2 text-xs"><Link href="#onboarding">Related tooltip: Quick Add (AI)</Link></div>
            </Section>

            <Section id="attendance" title="Attendance & Occupancy">
              <p className="text-gray-700 dark:text-gray-100 mb-2">Purpose: Monitor capacity and thresholds.</p>
              <figure className="mt-3">
                <img src="/assets/help/attendance.png" alt="Attendance" className="rounded-xl border border-gray-200 dark:border-[#2d437a]" />
                <figcaption className="text-xs text-gray-500 mt-1">Attendance</figcaption>
              </figure>
            </Section>

            <Section id="reports" title="Reports">
              <p className="text-gray-700 dark:text-gray-100 mb-2">Purpose: Export summaries for safety and compliance.</p>
              <figure className="mt-3">
                <img src="/assets/help/reports.png" alt="Reports" className="rounded-xl border border-gray-200 dark:border-[#2d437a]" />
                <figcaption className="text-xs text-gray-500 mt-1">Reports</figcaption>
              </figure>
            </Section>

            <Section id="analytics" title="Analytics & Risk Pulse">
              <p className="text-gray-700 dark:text-gray-100 mb-2">Purpose: Identify trends, response times, and risk signals.</p>
              <figure className="mt-3">
                <img src="/assets/help/analytics.png" alt="Analytics" className="rounded-xl border border-gray-200 dark:border-[#2d437a]" />
                <figcaption className="text-xs text-gray-500 mt-1">Analytics</figcaption>
              </figure>
              <div className="mt-2 text-xs"><Link href="#onboarding">Related tooltip: Analytics & Risk Pulse</Link></div>
            </Section>

            <Section id="settings" title="Settings">
              <p className="text-gray-700 dark:text-gray-100 mb-2">Purpose: Control preferences, notifications, and system options.</p>
            </Section>

            <Section id="accessibility" title="Accessibility & Shortcuts">
              <p className="text-gray-700 dark:text-gray-100 mb-2">Screen reader friendly and keyboard accessible. Try ? to view shortcuts.</p>
            </Section>

            <Section id="mobile" title="Mobile View">
              <p className="text-gray-700 dark:text-gray-100 mb-2">Optimised for field teams with offline tolerance.</p>
            </Section>

            <Section id="support" title="Support & Contact">
              <p className="text-gray-700 dark:text-gray-100 mb-2">Need help? Use the floating support button or contact support@incommandapp.com.</p>
            </Section>

            <Section id="technical" title="Technical Details">
              <ul className="list-disc pl-5 text-gray-700 dark:text-gray-100 text-sm space-y-1">
                <li>Supabase for auth, data, and audit logs</li>
                <li>OpenAI for AI Quick Add parsing</li>
                <li>Voice input with browser speech APIs</li>
                <li>what3words & GPS integration</li>
                <li>Dark mode and responsive layout</li>
              </ul>
            </Section>
          </main>
        </div>
      </div>
      {/* Floating Help Button */}
      <motion.a
        href="/settings/support"
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Need More Help?
      </motion.a>
    </div>
  )
}


