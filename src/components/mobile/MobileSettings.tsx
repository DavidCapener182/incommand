'use client'

import React from 'react'
import {
  Cog6ToothIcon,
  UserIcon,
  CalendarDaysIcon,
  BellIcon,
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface MobileSettingsProps {
  onBack?: () => void
}

const SETTINGS_LINKS = [
  { href: '/settings', label: 'Profile & account', icon: UserIcon },
  { href: '/settings/events', label: 'Events', icon: CalendarDaysIcon },
  { href: '/settings/notifications', label: 'Notifications', icon: BellIcon },
]

export default function MobileSettings({ onBack }: MobileSettingsProps) {
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
          <Cog6ToothIcon className="h-5 w-5 text-incommand-brand-mobile dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Account and preferences</p>
        </div>
      </div>

      <div className="card-mobile space-y-1">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Sections
        </p>
        {SETTINGS_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-[44px] touch-target items-center justify-between rounded-lg px-3 py-2.5 text-left text-gray-900 dark:text-white active:bg-gray-100 dark:active:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-gray-400" />
              <span className="font-medium">{label}</span>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          </Link>
        ))}
      </div>

      <Link
        href="/settings"
        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-incommand-surface-alt"
      >
        <span className="font-medium text-gray-900 dark:text-white">All settings</span>
        <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-400" />
      </Link>
    </div>
  )
}
