'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export default class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    console.error('[GlobalErrorBoundary]', error, errorInfo)

    // Report to performance monitor if available
    try {
      const { performanceMonitor } = require('@/lib/monitoring/performanceMonitor')
      performanceMonitor?.trackError?.({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      })
    } catch {
      // Monitoring unavailable – ignore
    }
  }

  handleReload = () => window.location.reload()

  handleRetry = () => this.setState({ hasError: false, error: undefined, errorInfo: undefined })

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#15192c] p-4">
        <div className="max-w-lg w-full rounded-2xl border border-gray-200 dark:border-[#2d437a] bg-white dark:bg-[#1b203b] shadow-lg p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-5">
              <ExclamationTriangleIcon className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              An unexpected error occurred. You can try again or reload the page.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="w-full mb-6 text-left">
                <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                  Error details
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-gray-100 dark:bg-gray-900 p-3 text-xs text-red-700 dark:text-red-300">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 w-full">
              <button
                onClick={this.handleRetry}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Reload page
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
