'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ShieldCheckIcon,
  SparklesIcon,
  BellAlertIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'
import { FeatureModal } from '@/components/modals/FeatureModal'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { StackedPanel } from '@/components/ui/StackedPanel'

const features = [
  {
    icon: ShieldCheckIcon,
    title: 'Multi-Tenancy & Event Management',
    description: 'Complete company isolation with role-based permissions. Manage multiple events simultaneously with comprehensive incident tracking and real-time updates.',
    modalContent: (
      <div className="space-y-4">
        <p className="text-lg leading-relaxed">
          InCommand&apos;s multi-tenancy architecture ensures complete data isolation between organizations while maintaining exceptional performance. Each company operates within its own secure environment with customizable branding, workflows, and compliance requirements.
        </p>
        <p>
          Our event management system allows you to oversee multiple concurrent events from a unified dashboard. Switch seamlessly between events, monitor real-time incident feeds, and maintain comprehensive audit trails for each operation.
        </p>
        <h3 className="text-xl font-semibold mt-6 mb-3">Key Capabilities:</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>Complete data isolation with row-level security</li>
          <li>Role-based access control (RBAC) with granular permissions</li>
          <li>Multi-event dashboard with real-time switching</li>
          <li>Custom branding and white-label options</li>
          <li>Comprehensive audit logging and compliance tracking</li>
          <li>Event templates for rapid deployment</li>
        </ul>
      </div>
    ),
  },
  {
    icon: SparklesIcon,
    title: 'AI-Powered Insights & Analytics',
    description: 'Intelligent chatbot, automated debrief summaries, predictive analytics, and AI-generated insights to help you make data-driven decisions.',
    modalContent: (
      <div className="space-y-4">
        <p className="text-lg leading-relaxed">
          InCommand&apos;s AI-powered analytics deliver automated summaries, predictive alerts, and data-driven insights using advanced natural language understanding. The system continuously monitors event patterns, detects emerging trends, and identifies potential risks before they escalate into critical incidents.
        </p>
        <p>
          Designed specifically for operational leads working under pressure, our AI assistant helps you make informed, proactive decisions by surfacing actionable intelligence from your incident data in real-time.
        </p>
        <h3 className="text-xl font-semibold mt-6 mb-3">Intelligent Features:</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>Natural language chatbot for instant insights</li>
          <li>Automated post-event debrief generation</li>
          <li>Predictive risk assessment and early warning alerts</li>
          <li>Trend detection across historical incident data</li>
          <li>AI-assisted incident description enhancement</li>
          <li>Smart recommendations for mitigation strategies</li>
        </ul>
      </div>
    ),
  },
  {
    icon: BellAlertIcon,
    title: 'Real-time Notifications',
    description: 'Smart toast notifications with priority-based color coding, notification drawer with activity feed, and real-time subscriptions for instant updates.',
    modalContent: (
      <div className="space-y-4">
        <p className="text-lg leading-relaxed">
          Stay informed with InCommand&apos;s intelligent notification system that prioritizes critical alerts and ensures you never miss important updates. Our smart notification engine filters, categorizes, and delivers alerts based on your role, preferences, and the urgency of each incident.
        </p>
        <p>
          Real-time subscriptions ensure instant delivery across all your devices, while the unified notification drawer provides a complete activity feed for reviewing missed updates or tracking incident progression over time.
        </p>
        <h3 className="text-xl font-semibold mt-6 mb-3">Notification Features:</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>Priority-based color coding (critical, high, medium, low)</li>
          <li>Real-time push notifications across all devices</li>
          <li>Unified notification drawer with filtering</li>
          <li>Smart grouping of related incident updates</li>
          <li>Customizable notification preferences by incident type</li>
          <li>Escalation alerts for time-sensitive incidents</li>
        </ul>
      </div>
    ),
  },
  {
    icon: UsersIcon,
    title: 'Staff Management & Callsigns',
    description: 'Modern card-based interface with color-coded departments, visual status indicators, skill badges, and real-time assignment capabilities.',
    modalContent: (
      <div className="space-y-4">
        <p className="text-lg leading-relaxed">
          InCommand transforms staff coordination with an intuitive card-based interface that displays team availability, skills, and current assignments at a glance. Our callsign management system integrates professional radio protocols with modern digital workflows, ensuring seamless communication across your entire operation.
        </p>
        <p>
          Assign staff to incidents, track their status in real-time, and maintain a complete record of who responded to what and when. Color-coded departments and skill badges help you deploy the right people to the right incidents quickly.
        </p>
        <h3 className="text-xl font-semibold mt-6 mb-3">Staff Management Tools:</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>Visual staff cards with real-time status indicators</li>
          <li>Automated callsign assignment with radio protocols</li>
          <li>Color-coded departmental grouping</li>
          <li>Skill and certification tracking with badges</li>
          <li>One-click incident assignment with history tracking</li>
          <li>Shift scheduling and availability management</li>
        </ul>
      </div>
    ),
  },
  {
    icon: ExclamationTriangleIcon,
    title: 'Incident Tracking & Response',
    description: 'Comprehensive incident management with photo attachments, audit logging, status tracking, and enhanced search and filtering capabilities.',
    modalContent: (
      <div className="space-y-4">
        <p className="text-lg leading-relaxed">
          Built around the principle that &quot;if it isn&apos;t written down, it didn&apos;t happen,&quot; InCommand provides legally defensible incident logging that meets JESIP and JDM standards. Every incident is timestamped, attributed, and preserved with a complete audit trail suitable for court proceedings and regulatory compliance.
        </p>
        <p>
          Our structured logging templates ensure consistency while allowing flexibility for complex situations. Photo attachments, retrospective logging with justification, and non-destructive amendments ensure your incident records are both comprehensive and credible.
        </p>
        <h3 className="text-xl font-semibold mt-6 mb-3">Incident Management Features:</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>JESIP-compliant structured logging templates</li>
          <li>Photo and document attachment support</li>
          <li>Complete audit trail with amendment tracking</li>
          <li>Advanced search, filtering, and export capabilities</li>
          <li>Status tracking with automated escalation rules</li>
          <li>Legal-ready contemporaneous and retrospective logging</li>
        </ul>
      </div>
    ),
  },
  {
    icon: DevicePhoneMobileIcon,
    title: 'Mobile-First Design',
    description: 'Fully responsive interface optimized for on-the-go management. Access all features from any device with seamless mobile navigation.',
    modalContent: (
      <div className="space-y-4">
        <p className="text-lg leading-relaxed">
          Event operations don&apos;t happen behind desks—they happen in the field. InCommand is designed mobile-first, ensuring every feature works flawlessly on smartphones and tablets. Our responsive interface adapts intelligently to different screen sizes, providing the same powerful functionality whether you&apos;re at a command post or walking the venue.
        </p>
        <p>
          Progressive Web App (PWA) technology enables offline functionality, home screen installation, and native app-like performance without app store downloads or updates.
        </p>
        <h3 className="text-xl font-semibold mt-6 mb-3">Mobile Capabilities:</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>Touch-optimized interface for one-handed operation</li>
          <li>Progressive Web App with offline support</li>
          <li>Camera integration for incident photo capture</li>
          <li>GPS location tagging for incidents</li>
          <li>Voice-to-text incident reporting</li>
          <li>Optimized data usage for limited connectivity</li>
        </ul>
      </div>
    ),
  },
  {
    icon: ChartBarIcon,
    title: 'Advanced Analytics Dashboard',
    description: 'Incident heatmaps, performance metrics, trend analysis, location hotspot identification, and actionable security recommendations.',
    modalContent: (
      <div className="space-y-4">
        <p className="text-lg leading-relaxed">
          Transform raw incident data into strategic insights with InCommand&apos;s comprehensive analytics suite. Our dashboards visualize patterns, trends, and hotspots across your events, helping you identify recurring issues, allocate resources effectively, and demonstrate ROI to stakeholders.
        </p>
        <p>
          Interactive charts, filterable datasets, and exportable reports enable both real-time operational monitoring and long-term strategic planning. Identify peak incident times, common problem areas, and staff performance metrics to continuously improve your operations.
        </p>
        <h3 className="text-xl font-semibold mt-6 mb-3">Analytics Features:</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>Real-time incident heatmaps with location clustering</li>
          <li>Trend analysis across time, type, and severity</li>
          <li>Staff performance and response time metrics</li>
          <li>Predictive modeling for resource allocation</li>
          <li>Custom reports with scheduled email delivery</li>
          <li>Benchmark comparisons across events and venues</li>
        </ul>
      </div>
    ),
  },
  {
    icon: LockClosedIcon,
    title: 'Security & Permissions',
    description: 'Enterprise-grade security with role-based access control, company isolation, audit trails, and comprehensive permission management.',
    modalContent: (
      <div className="space-y-4">
        <p className="text-lg leading-relaxed">
          InCommand implements defense-in-depth security architecture with multiple layers of protection. Row-level security policies ensure users can only access data they&apos;re authorized to see, while comprehensive audit logging tracks every action for accountability and compliance.
        </p>
        <p>
          Built on Supabase with PostgreSQL, our platform meets enterprise security standards including SOC 2, GDPR, and industry-specific compliance requirements. Two-factor authentication, session management, and encryption at rest and in transit protect your sensitive operational data.
        </p>
        <h3 className="text-xl font-semibold mt-6 mb-3">Security Features:</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>Row-level security (RLS) with policy-based access control</li>
          <li>Role-based permissions with granular controls</li>
          <li>Multi-factor authentication (MFA) support</li>
          <li>Complete audit trails for all user actions</li>
          <li>SOC 2 Type II compliance infrastructure</li>
          <li>Automatic data retention and deletion policies</li>
        </ul>
      </div>
    ),
  },
]

export default function FeaturesPage() {
  const [selectedFeature, setSelectedFeature] = useState<typeof features[0] | null>(null)

  return (
    <PageWrapper>
      {/* Hero Section with Image Placeholder */}
      <div className="relative -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-8 h-80 sm:h-96 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Content overlay */}
        <div className="relative h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Powerful Features for
              <span className="block mt-2">
                Professional Event Management
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Everything you need to manage events professionally, respond to incidents faster, and keep your teams connected.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <StackedPanel className="space-y-12">
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card-depth p-6 group cursor-pointer"
              onClick={() => setSelectedFeature(feature)}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {feature.description}
                  </p>
                  <span className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm inline-flex items-center">
                    Learn more
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="card-depth bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Event Management?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of event teams using InCommand to deliver safer, more efficient events.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:sales@incommand.uk?subject=Request Demo"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Request a Demo
              </a>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </motion.div>
        </div>
      </StackedPanel>

      {/* Feature Modal */}
      {selectedFeature && (
        <FeatureModal
          isOpen={true}
          onClose={() => setSelectedFeature(null)}
          title={selectedFeature.title}
          content={selectedFeature.modalContent}
          icon={selectedFeature.icon}
        />
      )}
    </PageWrapper>
  )
}
