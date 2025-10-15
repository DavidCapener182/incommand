'use client'

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

const features = [
  {
    icon: ShieldCheckIcon,
    title: 'Multi-Tenancy & Event Management',
    description: 'Complete company isolation with role-based permissions. Manage multiple events simultaneously with comprehensive incident tracking and real-time updates.',
  },
  {
    icon: SparklesIcon,
    title: 'AI-Powered Insights & Analytics',
    description: 'Intelligent chatbot, automated debrief summaries, predictive analytics, and AI-generated insights to help you make data-driven decisions.',
  },
  {
    icon: BellAlertIcon,
    title: 'Real-time Notifications',
    description: 'Smart toast notifications with priority-based color coding, notification drawer with activity feed, and real-time subscriptions for instant updates.',
  },
  {
    icon: UsersIcon,
    title: 'Staff Management & Callsigns',
    description: 'Modern card-based interface with color-coded departments, visual status indicators, skill badges, and real-time assignment capabilities.',
  },
  {
    icon: ExclamationTriangleIcon,
    title: 'Incident Tracking & Response',
    description: 'Comprehensive incident management with photo attachments, audit logging, status tracking, and enhanced search and filtering capabilities.',
  },
  {
    icon: DevicePhoneMobileIcon,
    title: 'Mobile-First Design',
    description: 'Fully responsive interface optimized for on-the-go management. Access all features from any device with seamless mobile navigation.',
  },
  {
    icon: ChartBarIcon,
    title: 'Advanced Analytics Dashboard',
    description: 'Incident heatmaps, performance metrics, trend analysis, location hotspot identification, and actionable security recommendations.',
  },
  {
    icon: LockClosedIcon,
    title: 'Security & Permissions',
    description: 'Enterprise-grade security with role-based access control, company isolation, audit trails, and comprehensive permission management.',
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#15192c]">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Powerful Features for
            <span className="block text-blue-600 dark:text-blue-400">
              Professional Event Management
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Everything you need to manage events professionally, respond to incidents faster, and keep your teams connected.
          </p>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white dark:bg-[#1e2438] rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 group"
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
                  <Link
                    href="/incidents"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm inline-flex items-center"
                  >
                    Learn more
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 dark:bg-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center"
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
      </div>
    </div>
  )
}

