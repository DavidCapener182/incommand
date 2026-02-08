'use client'

import React from 'react'
import { UserGroupIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface MobileStaffingProps {
  onBack?: () => void
}

export default function MobileStaffing({ onBack }: MobileStaffingProps) {
  return (
    <div className="space-y-5 p-4 pb-24">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400"
        >
          ← Back
        </button>
      )}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-incommand-brand-mobile/10 dark:bg-incommand-brand-mobile/20">
          <UserGroupIcon className="h-5 w-5 text-incommand-brand-mobile dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Staffing</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Staff deployment and assignment</p>
        </div>
      </div>

      <div className="card-mobile">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          View and manage staff deployment, roles, and availability in the full staffing centre.
        </p>
      </div>

      <Link
        href="/staffing"
        className="flex min-h-[48px] touch-target items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-incommand-surface-alt"
      >
        <span className="font-medium text-gray-900 dark:text-white">Open staffing centre</span>
        <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-400" />
      </Link>
    </div>
  )
}
