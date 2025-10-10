'use client'

import React, { useState, useEffect } from 'react'
import {
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

export default function ClientPortalPage() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'analytics'>('summary')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Client Portal
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View reports and analytics for your events
          </p>
        </div>

        {/* Client Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Summary Cards */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">12</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Events Completed</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">98.5%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Safety Rating</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">4.8/5</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Client Satisfaction</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Event Reports
            </h3>
            <div className="flex gap-2">
              {(['summary', 'detailed', 'analytics'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reportType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Report List */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <DocumentTextIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Summer Festival Report - June 2024
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Generated on June 30, 2024
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Information */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-700 dark:from-blue-800 dark:to-purple-900 text-white rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-2">Need Support?</h3>
          <p className="text-blue-100 dark:text-blue-200 mb-4">
            Our team is here to help with your event management needs
          </p>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Contact Support
            </button>
            <button className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/30 transition-colors">
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
