'use client'

import React, { useState, useEffect } from 'react'
import { useSystemSettings, useUpdateSystemSettings } from '../../../hooks/useSystemSettings'
import { useRole } from '../../../hooks/useRole'
import AdminProtectedRoute from '../../../components/AdminProtectedRoute'
import { 
  Cog6ToothIcon, 
  ExclamationTriangleIcon, 
  FlagIcon, 
  BellIcon, 
  ShieldCheckIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface FeatureFlag {
  name: string
  description: string
  enabled: boolean
}

const SystemSettingsPage: React.FC = () => {
  const { systemSettings, isLoading } = useSystemSettings()
  const { updateSystemSettings, updateFeatureFlag, toggleMaintenanceMode, canUpdate } = useUpdateSystemSettings()
  
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([])
  const [notificationSettings, setNotificationSettings] = useState({
    email_enabled: true,
    push_enabled: true,
    sms_enabled: false,
    quiet_hours: { enabled: false, start: '22:00', end: '08:00' }
  })
  const [platformConfig, setPlatformConfig] = useState({
    max_file_upload_size: 10485760,
    session_timeout: 3600,
    max_login_attempts: 5
  })
  
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // Initialize form data when settings load
  useEffect(() => {
    if (systemSettings) {
      setMaintenanceMode(systemSettings.maintenance_mode)
      setMaintenanceMessage(systemSettings.maintenance_message)
      
      // Convert feature flags object to array
      const flags: FeatureFlag[] = Object.entries(systemSettings.feature_flags).map(([key, value]) => ({
        name: key,
        description: getFeatureFlagDescription(key),
        enabled: value || false
      }))
      setFeatureFlags(flags)
      
      setNotificationSettings(systemSettings.notification_settings)
      setPlatformConfig(systemSettings.platform_config)
    }
  }, [systemSettings])

  const getFeatureFlagDescription = (flagName: string): string => {
    const descriptions: Record<string, string> = {
      ai_insights: 'Enable AI-powered insights and recommendations',
      predictive_analytics: 'Enable predictive analytics and forecasting',
      social_media_monitoring: 'Enable social media monitoring features',
      advanced_notifications: 'Enable advanced notification scheduling and templates',
      maintenance_mode: 'Enable system maintenance mode',
      beta_features: 'Enable beta features for testing'
    }
    return descriptions[flagName] || 'Feature flag for system functionality'
  }

  const handleMaintenanceModeToggle = async () => {
    if (!canUpdate) return
    
    setIsUpdating(true)
    try {
      await toggleMaintenanceMode(!maintenanceMode, maintenanceMessage)
      setShowSuccess(true)
      setUpdateMessage('Maintenance mode updated successfully')
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update maintenance mode:', error)
      setUpdateMessage('Failed to update maintenance mode')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleFeatureFlagToggle = async (flagName: string, enabled: boolean) => {
    if (!canUpdate) return
    
    setIsUpdating(true)
    try {
      await updateFeatureFlag(flagName as any, enabled)
      setShowSuccess(true)
      setUpdateMessage(`Feature flag "${flagName}" updated successfully`)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update feature flag:', error)
      setUpdateMessage('Failed to update feature flag')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleNotificationSettingsUpdate = async () => {
    if (!canUpdate) return
    
    setIsUpdating(true)
    try {
      await updateSystemSettings({ notification_settings: notificationSettings })
      setShowSuccess(true)
      setUpdateMessage('Notification settings updated successfully')
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update notification settings:', error)
      setUpdateMessage('Failed to update notification settings')
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePlatformConfigUpdate = async () => {
    if (!canUpdate) return
    
    setIsUpdating(true)
    try {
      await updateSystemSettings({ platform_config: platformConfig })
      setShowSuccess(true)
      setUpdateMessage('Platform configuration updated successfully')
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update platform configuration:', error)
      setUpdateMessage('Failed to update platform configuration')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Cog6ToothIcon className="h-8 w-8 mr-3 text-blue-600" />
              System Settings
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage system-wide configuration, feature flags, and maintenance settings
            </p>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
              <div className="flex">
                <CheckIcon className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    {updateMessage}
                  </p>
                </div>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="ml-auto"
                >
                  <XMarkIcon className="h-5 w-5 text-green-400" />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Maintenance Mode */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Maintenance Mode
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Maintenance Mode
                  </span>
                  <button
                    onClick={handleMaintenanceModeToggle}
                    disabled={!canUpdate || isUpdating}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      maintenanceMode ? 'bg-yellow-600' : 'bg-gray-200 dark:bg-gray-700'
                    } ${!canUpdate ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maintenance Message
                  </label>
                  <textarea
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    disabled={!canUpdate}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    rows={3}
                    placeholder="Enter maintenance message..."
                  />
                </div>
              </div>
            </div>

            {/* Feature Flags */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <FlagIcon className="h-6 w-6 text-blue-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Feature Flags
                </h2>
              </div>
              
              <div className="space-y-3">
                {featureFlags.map((flag) => (
                  <div key={flag.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {flag.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        {flag.enabled && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {flag.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleFeatureFlagToggle(flag.name, !flag.enabled)}
                      disabled={!canUpdate || isUpdating}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        flag.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      } ${!canUpdate ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          flag.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <BellIcon className="h-6 w-6 text-green-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Notification Settings
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Notifications
                  </span>
                  <button
                    onClick={() => setNotificationSettings(prev => ({ ...prev, email_enabled: !prev.email_enabled }))}
                    disabled={!canUpdate}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      notificationSettings.email_enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                    } ${!canUpdate ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.email_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Push Notifications
                  </span>
                  <button
                    onClick={() => setNotificationSettings(prev => ({ ...prev, push_enabled: !prev.push_enabled }))}
                    disabled={!canUpdate}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      notificationSettings.push_enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                    } ${!canUpdate ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.push_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    SMS Notifications
                  </span>
                  <button
                    onClick={() => setNotificationSettings(prev => ({ ...prev, sms_enabled: !prev.sms_enabled }))}
                    disabled={!canUpdate}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      notificationSettings.sms_enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                    } ${!canUpdate ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.sms_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <button
                  onClick={handleNotificationSettingsUpdate}
                  disabled={!canUpdate || isUpdating}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? 'Updating...' : 'Update Notification Settings'}
                </button>
              </div>
            </div>

            {/* Platform Configuration */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <ShieldCheckIcon className="h-6 w-6 text-purple-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Platform Configuration
                </h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max File Upload Size (bytes)
                  </label>
                  <input
                    type="number"
                    value={platformConfig.max_file_upload_size}
                    onChange={(e) => setPlatformConfig(prev => ({ ...prev, max_file_upload_size: parseInt(e.target.value) }))}
                    disabled={!canUpdate}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Session Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    value={platformConfig.session_timeout}
                    onChange={(e) => setPlatformConfig(prev => ({ ...prev, session_timeout: parseInt(e.target.value) }))}
                    disabled={!canUpdate}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Login Attempts
                  </label>
                  <input
                    type="number"
                    value={platformConfig.max_login_attempts}
                    onChange={(e) => setPlatformConfig(prev => ({ ...prev, max_login_attempts: parseInt(e.target.value) }))}
                    disabled={!canUpdate}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
                
                <button
                  onClick={handlePlatformConfigUpdate}
                  disabled={!canUpdate || isUpdating}
                  className="w-full px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? 'Updating...' : 'Update Platform Configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  )
}

export default SystemSettingsPage
