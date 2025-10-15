'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid'

const services = [
  { name: 'API Services', status: 'operational', uptime: '100%' },
  { name: 'Web Application', status: 'operational', uptime: '100%' },
  { name: 'Database', status: 'operational', uptime: '99.99%' },
  { name: 'Real-time Subscriptions', status: 'operational', uptime: '100%' },
  { name: 'AI Services', status: 'operational', uptime: '99.95%' },
  { name: 'Mobile API', status: 'operational', uptime: '100%' },
]

export default function StatusPage() {
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
          <div className="flex items-center justify-center mb-6">
            <CheckCircleIcon className="w-20 h-20 text-green-500" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            All Systems Operational
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            All services are running smoothly
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Last updated: {new Date().toLocaleString('en-GB')}
          </p>
        </motion.div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Service Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="bg-white dark:bg-[#1e2438] rounded-lg shadow-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {service.name}
                  </h3>
                  <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Operational
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {service.uptime} uptime
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Uptime Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white dark:bg-[#1e2438] rounded-lg shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Overall Uptime
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                99.9%
              </div>
              <div className="text-gray-600 dark:text-gray-400">Last 30 days</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                99.95%
              </div>
              <div className="text-gray-600 dark:text-gray-400">Last 90 days</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                99.98%
              </div>
              <div className="text-gray-600 dark:text-gray-400">Last 12 months</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Incidents */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white dark:bg-[#1e2438] rounded-lg shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Recent Incidents
          </h2>
          <div className="text-center py-12">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
              No incidents in the last 30 days
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Our platform has been running smoothly with no interruptions
            </p>
          </div>
        </motion.div>
      </div>

      {/* Subscribe Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-blue-600 dark:bg-blue-700 rounded-lg shadow-lg p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            Get Status Updates
          </h2>
          <p className="text-blue-100 mb-6">
            Subscribe to receive notifications about system status changes and maintenance windows.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
        </motion.div>
      </div>

      {/* Contact Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Having issues? Our support team is here to help.
          </p>
          <a
            href="mailto:support@incommand.uk?subject=System Status Inquiry"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Contact Support
          </a>
        </motion.div>
      </div>
    </div>
  )
}

