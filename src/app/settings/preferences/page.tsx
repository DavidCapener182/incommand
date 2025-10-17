'use client'

import React, { useState } from 'react'
import { 
  useUserPreferences, 
  useThemePreference, 
  useNotificationPreferences, 
  useUIPreferences, 
  useAccessibilitySettings, 
  usePrivacySettings,
  useDashboardLayout 
} from '../../../hooks/useUserPreferences'
import { useSyncPreferences } from '../../../hooks/useUserPreferences'
import { 
  THEME_OPTIONS, 
  TIME_FORMAT_OPTIONS, 
  FONT_SIZE_OPTIONS, 
  LINE_SPACING_OPTIONS, 
  CONTRAST_RATIO_OPTIONS,
  NOTIFICATION_FREQUENCY_OPTIONS 
} from '../../../types/settings'
import { 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon,
  BellIcon,
  Cog6ToothIcon,
  EyeIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { useTooltipOnboarding } from '@/hooks/useTooltipOnboarding'

const PreferencesPage: React.FC = () => {
  const { preferences, isLoading } = useUserPreferences()
  const { theme, setTheme, isDark } = useThemePreference()
  const { notificationPreferences, updateNotificationPreference } = useNotificationPreferences()
  const { uiPreferences, updateUIPreference } = useUIPreferences()
  const { accessibilitySettings, updateAccessibilitySetting } = useAccessibilitySettings()
  const { privacySettings, updatePrivacySetting } = usePrivacySettings()
  const { dashboardLayout } = useDashboardLayout()
  const { syncPreferences, lastSyncTime } = useSyncPreferences()
  const { restartTour, skipTour } = useTooltipOnboarding()
  const [greenGuideEnabled, setGreenGuideEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('green-guide-assistance-enabled')
      return stored !== null ? JSON.parse(stored) : true
    } catch {
      return true
    }
  })

  const persistGreenGuide = (value: boolean) => {
    setGreenGuideEnabled(value)
    try {
      localStorage.setItem('green-guide-assistance-enabled', JSON.stringify(value))
    } catch {}
  }
  
  const [isSyncing, setIsSyncing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await syncPreferences()
      setSuccessMessage('Preferences synced successfully')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to sync preferences:', error)
      setSuccessMessage('Failed to sync preferences')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'auto') => {
    try {
      await setTheme(newTheme)
      setSuccessMessage('Theme updated successfully')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update theme:', error)
    }
  }

  const handleNotificationUpdate = async (path: string, value: any) => {
    try {
      await updateNotificationPreference(path, value)
      setSuccessMessage('Notification preferences updated')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
    }
  }

  const handleUIPreferenceUpdate = async (path: string, value: any) => {
    try {
      await updateUIPreference(path, value)
      setSuccessMessage('UI preferences updated')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update UI preferences:', error)
    }
  }

  const handleAccessibilityUpdate = async (path: string, value: any) => {
    try {
      await updateAccessibilitySetting(path, value)
      setSuccessMessage('Accessibility settings updated')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update accessibility settings:', error)
    }
  }

  const handlePrivacyUpdate = async (path: string, value: any) => {
    try {
      await updatePrivacySetting(path, value)
      setSuccessMessage('Privacy settings updated')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update privacy settings:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-4 text-sm">
          <ol className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <li>
              <a href="/settings" className="hover:underline">Settings</a>
            </li>
            <li>/</li>
            <li className="text-gray-700 dark:text-gray-200 font-medium">Preferences</li>
          </ol>
        </nav>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Cog6ToothIcon className="h-8 w-8 mr-3 text-blue-600" />
            User Preferences
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Customize your experience and sync settings across all your devices
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
            <div className="flex">
              <CheckIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sync Status */}
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ArrowPathIcon className={`h-5 w-5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Cross-Device Sync
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  {lastSyncTime ? `Last synced: ${new Date(lastSyncTime).toLocaleString()}` : 'Never synced'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Green Guide Assistance */}
          <div className="card-alt p-6">
            <div className="flex items-center mb-4">
              <ShieldCheckIcon className="h-6 w-6 text-emerald-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Green Guide Assistance
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Show concise best‑practice hints during incident creation and link to the Green Guide.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Hints</span>
              <button
                onClick={() => persistGreenGuide(!greenGuideEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  greenGuideEnabled ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    greenGuideEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="mt-3 text-xs">
              <a href="/green-guide" target="_blank" rel="noreferrer" className="text-emerald-700 dark:text-emerald-300 hover:underline">Open Green Guide (PDF)</a>
            </div>
          </div>
          {/* Theme Preferences */}
          <div className="card-alt p-6">
            <div className="flex items-center mb-4">
              <SunIcon className="h-6 w-6 text-yellow-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Theme Preferences
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleThemeChange(option.value)}
                      className={`p-3 rounded-md border-2 transition-colors ${
                        theme === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-2">
                        {option.value === 'light' && <SunIcon className="h-5 w-5 text-yellow-500" />}
                        {option.value === 'dark' && <MoonIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
                        {option.value === 'auto' && <ComputerDesktopIcon className="h-5 w-5 text-blue-500" />}
                      </div>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Current Theme
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {isDark ? 'Dark' : 'Light'}
                </span>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="card-alt p-6">
            <div className="flex items-center mb-4">
              <BellIcon className="h-6 w-6 text-green-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Notification Preferences
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Notifications
                </span>
                <button
                  onClick={() => handleNotificationUpdate('email.enabled', !notificationPreferences.email.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    notificationPreferences.email.enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationPreferences.email.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Push Notifications
                </span>
                <button
                  onClick={() => handleNotificationUpdate('push.enabled', !notificationPreferences.push.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    notificationPreferences.push.enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationPreferences.push.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  SMS Notifications
                </span>
                <button
                  onClick={() => handleNotificationUpdate('sms.enabled', !notificationPreferences.sms.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    notificationPreferences.sms.enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationPreferences.sms.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Frequency
                </label>
                <select
                  value={notificationPreferences.email.frequency}
                  onChange={(e) => handleNotificationUpdate('email.frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {NOTIFICATION_FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* UI Preferences */}
          <div className="card-alt p-6">
            <div className="flex items-center mb-4">
              <Cog6ToothIcon className="h-6 w-6 text-blue-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                UI Preferences
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Format
                </label>
                <select
                  value={uiPreferences.time_format}
                  onChange={(e) => handleUIPreferenceUpdate('time_format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TIME_FORMAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Compact Mode
                </span>
                <button
                  onClick={() => handleUIPreferenceUpdate('compact_mode', !uiPreferences.compact_mode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    uiPreferences.compact_mode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      uiPreferences.compact_mode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Animations
                </span>
                <button
                  onClick={() => handleUIPreferenceUpdate('animations_enabled', !uiPreferences.animations_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    uiPreferences.animations_enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      uiPreferences.animations_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Accessibility Settings */}
          <div className="card-alt p-6">
            <div className="flex items-center mb-4">
              <EyeIcon className="h-6 w-6 text-purple-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Accessibility
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Font Size
                </label>
                <select
                  value={accessibilitySettings.font_size}
                  onChange={(e) => handleAccessibilityUpdate('font_size', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {FONT_SIZE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contrast Ratio
                </label>
                <select
                  value={accessibilitySettings.contrast_ratio}
                  onChange={(e) => handleAccessibilityUpdate('contrast_ratio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CONTRAST_RATIO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reduce Motion
                </span>
                <button
                  onClick={() => handleAccessibilityUpdate('reduce_motion', !accessibilitySettings.reduce_motion)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    accessibilitySettings.reduce_motion ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      accessibilitySettings.reduce_motion ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="card-alt p-6">
            <div className="flex items-center mb-4">
              <ShieldCheckIcon className="h-6 w-6 text-red-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Privacy Settings
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Analytics
                </span>
                <button
                  onClick={() => handlePrivacyUpdate('data_sharing.analytics', !privacySettings.data_sharing.analytics)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    privacySettings.data_sharing.analytics ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      privacySettings.data_sharing.analytics ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Crash Reports
                </span>
                <button
                  onClick={() => handlePrivacyUpdate('data_sharing.crash_reports', !privacySettings.data_sharing.crash_reports)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    privacySettings.data_sharing.crash_reports ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      privacySettings.data_sharing.crash_reports ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Public Profile
                </span>
                <button
                  onClick={() => handlePrivacyUpdate('visibility.profile_public', !privacySettings.visibility.profile_public)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    privacySettings.visibility.profile_public ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      privacySettings.visibility.profile_public ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Layout Info */}
          <div className="card-alt p-6">
            <div className="flex items-center mb-4">
              <Cog6ToothIcon className="h-6 w-6 text-indigo-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Dashboard Layout
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Layout Version: {dashboardLayout.layout_version}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Last Modified: {new Date(dashboardLayout.last_modified).toLocaleString()}
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Active Widgets: {Object.keys(dashboardLayout.widgets).length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Customize your dashboard layout from the main dashboard page
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Help & Onboarding</h3>
            <div className="flex gap-2">
              <button
                onClick={restartTour}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Restart tour
              </button>
              <button
                onClick={skipTour}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Don’t show again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreferencesPage
