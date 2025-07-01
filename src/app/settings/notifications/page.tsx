'use client'

import React, { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { BellIcon, EnvelopeIcon, DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { 
  NotificationSettings, 
  defaultNotificationSettings, 
  loadNotificationSettings, 
  saveNotificationSettings 
} from '@/utils/notificationSettings';

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadedSettings = loadNotificationSettings();
    setSettings(loadedSettings);
    setIsLoading(false);
  }, []);

  // Save settings to localStorage
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      saveNotificationSettings(settings);
      setLastSaved(new Date());
      
      // Here you could also save to your backend/database
      // await fetch('/api/user/notification-settings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // });
      
    } catch (error) {
      console.error('Error saving notification settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save when settings change
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        handleSaveSettings();
      }, 1000); // Auto-save after 1 second of no changes
      
      return () => clearTimeout(timeoutId);
    }
  }, [settings, isLoading]);

  const updateSetting = (key: keyof NotificationSettings, value: boolean | string) => {
    setSettings((prev: NotificationSettings) => ({ ...prev, [key]: value }));
  };

  const updateQuietHours = (key: keyof NotificationSettings['quietHours'], value: boolean | string) => {
    setSettings((prev: NotificationSettings) => ({
      ...prev,
      quietHours: { ...prev.quietHours, [key]: value }
    }));
  };

  const resetToDefaults = () => {
    setSettings(defaultNotificationSettings);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Notification Settings</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Customize how and when you receive notifications from the platform.
        </p>
        {lastSaved && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            Last saved: {lastSaved.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {/* Notification Types */}
        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6">
          <div className="flex items-center mb-4">
            <BellIcon className="h-5 w-5 text-blue-600 dark:text-blue-300 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Notification Types</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { key: 'incidentAlerts', label: 'Incident Alerts', description: 'Immediate notifications for new incidents and critical updates' },
              { key: 'securityAlerts', label: 'Security Alerts', description: 'Important security-related notifications and warnings' },
              { key: 'systemUpdates', label: 'System Updates', description: 'Platform updates, new features, and maintenance announcements' },
              { key: 'eventReminders', label: 'Event Reminders', description: 'Reminders for upcoming events and deadlines' },
              { key: 'aiInsights', label: 'AI Insights', description: 'AI-generated summaries and analytical insights' },
              { key: 'maintenanceNotifications', label: 'Maintenance Notifications', description: 'Scheduled maintenance and system downtime alerts' }
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{label}</h3>
                  <p className="text-sm text-gray-500 dark:text-blue-100">{description}</p>
                </div>
                <Switch
                  checked={settings[key as keyof NotificationSettings] as boolean}
                  onChange={(checked: boolean) => updateSetting(key as keyof NotificationSettings, checked)}
                  className={`${
                    settings[key as keyof NotificationSettings] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      settings[key as keyof NotificationSettings] ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Methods */}
        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6">
          <div className="flex items-center mb-4">
            <EnvelopeIcon className="h-5 w-5 text-blue-600 dark:text-blue-300 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Delivery Methods</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'inApp', label: 'In-App Notifications', icon: ComputerDesktopIcon, description: 'Show notifications within the application' },
              { key: 'email', label: 'Email Notifications', icon: EnvelopeIcon, description: 'Send notifications to your email address' },
              { key: 'push', label: 'Push Notifications', icon: DevicePhoneMobileIcon, description: 'Browser and mobile push notifications' },
              { key: 'sms', label: 'SMS Notifications', icon: DevicePhoneMobileIcon, description: 'Text message notifications (premium feature)' }
            ].map(({ key, label, icon: Icon, description }) => (
              <div key={key} className="border border-gray-200 dark:border-[#2d437a] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-300 mr-2" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{label}</h3>
                  </div>
                  <Switch
                    checked={settings[key as keyof NotificationSettings] as boolean}
                    onChange={(checked: boolean) => updateSetting(key as keyof NotificationSettings, checked)}
                    className={`${
                      settings[key as keyof NotificationSettings] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        settings[key as keyof NotificationSettings] ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </div>
                <p className="text-xs text-gray-500 dark:text-blue-100">{description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timing & Frequency */}
        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200 mb-4">Timing & Frequency</h2>
          
          <div className="space-y-6">
            {/* Quiet Hours */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Quiet Hours</h3>
                  <p className="text-sm text-gray-500 dark:text-blue-100">Disable non-critical notifications during specified hours</p>
                </div>
                <Switch
                  checked={settings.quietHours.enabled}
                  onChange={(checked: boolean) => updateQuietHours('enabled', checked)}
                  className={`${
                    settings.quietHours.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      settings.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
              
              {settings.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={settings.quietHours.startTime}
                      onChange={(e) => updateQuietHours('startTime', e.target.value)}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-1">End Time</label>
                    <input
                      type="time"
                      value={settings.quietHours.endTime}
                      onChange={(e) => updateQuietHours('endTime', e.target.value)}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Digest Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-2">Digest Frequency</label>
              <select
                value={settings.digestFrequency}
                onChange={(e) => updateSetting('digestFrequency', e.target.value as NotificationSettings['digestFrequency'])}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly Summary</option>
                <option value="daily">Daily Summary</option>
                <option value="weekly">Weekly Summary</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-blue-100 mt-1">
                How often you want to receive grouped notifications
              </p>
            </div>

            {/* Priority Only */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Priority Notifications Only</h3>
                <p className="text-sm text-gray-500 dark:text-blue-100">Only receive high-priority and urgent notifications</p>
              </div>
              <Switch
                checked={settings.priorityOnly}
                onChange={(checked: boolean) => updateSetting('priorityOnly', checked)}
                className={`${
                  settings.priorityOnly ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    settings.priorityOnly ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200 mb-4">Advanced Settings</h2>
          
          <div className="space-y-4">
            {[
              { key: 'soundEnabled', label: 'Sound Effects', description: 'Play notification sounds' },
              { key: 'vibrationEnabled', label: 'Vibration', description: 'Enable vibration for mobile notifications' },
              { key: 'desktopNotifications', label: 'Desktop Notifications', description: 'Show desktop notifications when browser is in background' }
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{label}</h3>
                  <p className="text-sm text-gray-500 dark:text-blue-100">{description}</p>
                </div>
                <Switch
                  checked={settings[key as keyof NotificationSettings] as boolean}
                  onChange={(checked: boolean) => updateSetting(key as keyof NotificationSettings, checked)}
                  className={`${
                    settings[key as keyof NotificationSettings] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      settings[key as keyof NotificationSettings] ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
          
          <button
            onClick={resetToDefaults}
            className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Reset to Defaults
          </button>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">About Notification Settings</h3>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p>• Settings are automatically saved as you make changes</p>
            <p>• Critical security alerts will always be delivered regardless of settings</p>
            <p>• SMS notifications require a verified phone number and may incur charges</p>
            <p>• Desktop notifications require browser permission</p>
          </div>
        </div>
      </div>
    </div>
  );
} 