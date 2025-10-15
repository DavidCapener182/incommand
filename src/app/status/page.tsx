'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#15192c] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            System Status
          </h1>
          <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold mb-8">
            Coming Soon
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Real-time system status and uptime monitoring will be available here.
          </p>
          <div className="bg-white dark:bg-[#1e2438] rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center justify-center mb-6">
              <CheckCircleIcon className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              All Systems Operational
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Our platform is currently running smoothly. We'll provide detailed status updates and incident history here soon.
            </p>
            <div className="text-left space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="flex items-center justify-between">
                <span>API Services</span>
                <span className="flex items-center text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="w-5 h-5 mr-1" />
                  Operational
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span>Web Application</span>
                <span className="flex items-center text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="w-5 h-5 mr-1" />
                  Operational
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span>Database</span>
                <span className="flex items-center text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="w-5 h-5 mr-1" />
                  Operational
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@incommand.uk?subject=System Status Inquiry"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Report an Issue
            </a>
            <Link
              href="/incidents"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

