'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function CareersPage() {
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
            Careers at InCommand
          </h1>
          <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold mb-8">
            Coming Soon
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Join our team and help shape the future of event management.
          </p>
          <div className="bg-white dark:bg-[#1e2438] rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Work With Us
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              We're building a talented team passionate about creating tools that make events safer and more efficient. Check back soon for open positions, or reach out to express your interest.
            </p>
            <a
              href="mailto:careers@incommand.uk?subject=Career Inquiry"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Email: careers@incommand.uk
            </a>
          </div>
          <Link
            href="/incidents"
            className="inline-flex items-center px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

