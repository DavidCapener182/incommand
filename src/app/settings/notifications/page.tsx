"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Toast, { useToast } from '../../../components/Toast';
import { useNotificationPreferences, useSyncPreferences } from '../../../hooks/useUserPreferences';
import { CheckIcon, XMarkIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';

// remove local fallback hooks and localStorage usage

export default function NotificationSettingsPage() {
  const { notificationPreferences, updateNotificationPreference } = useNotificationPreferences();
  const { syncPreferences, lastSyncTime } = useSyncPreferences();
  const { user } = useAuth();
  const { messages, addToast, removeToast } = useToast();
  const [browserPermissionStatus, setBrowserPermissionStatus] = useState<NotificationPermission>('default');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    checkBrowserNotificationPermission();
  }, []);

  const checkBrowserNotificationPermission = () => {
    if ('Notification' in window) {
      setBrowserPermissionStatus(Notification.permission);
    }
  };

  const requestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      addToast({ title: 'Error', message: 'Browser notifications are not supported in this browser', type: 'error' });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserPermissionStatus(permission);
      
      if (permission === 'granted') {
        addToast({ title: 'Success', message: 'Browser notifications enabled successfully!', type: 'success' });
        // Update push notification preference to enabled
        try {
          await updateNotificationPreference('push.enabled', true);
        } catch (error) {
          console.error('Failed to update push preference:', error);
          addToast({ title: 'Warning', message: 'Permission granted but failed to save preference', type: 'warning' });
        }
      } else if (permission === 'denied') {
        addToast({ title: 'Error', message: 'Browser notifications were denied. You can enable them in your browser settings.', type: 'error' });
        // Update push notification preference to disabled
        try {
          await updateNotificationPreference('push.enabled', false);
        } catch (error) {
          console.error('Failed to update push preference:', error);
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      addToast({ title: 'Error', message: 'Failed to request notification permission', type: 'error' });
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncPreferences();
      setSuccessMessage('Settings saved successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      addToast({ title: 'Error', message: 'Failed to save settings', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNotificationUpdate = async (path: string, value: any) => {
    try {
      await updateNotificationPreference(path, value);
      setSuccessMessage('Notification preferences updated');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      addToast({ title: 'Error', message: 'Failed to update notification preferences', type: 'error' });
    }
  };

  const SettingToggle = ({ 
    label, 
    description, 
    path,
    disabled = false 
  }: { 
    label: string; 
    description: string; 
    path: string;
    disabled?: boolean;
  }) => {
    const value = path.split('.').reduce<any>((obj: any, key: string) => obj?.[key], notificationPreferences as any) as boolean;
    
    return (
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-3 sm:p-4 border border-gray-200 dark:border-[#2d437a] rounded-lg gap-3 sm:gap-4">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
          <p className="text-sm text-gray-600 dark:text-blue-100 mt-1">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer sm:ml-4 self-start sm:self-auto">
          <input
            type="checkbox"
            className="sr-only"
            checked={Boolean(value)}
            onChange={(e) => handleNotificationUpdate(path, e.target.checked)}
            disabled={disabled}
          />
          <div className={`w-11 h-6 rounded-full transition-colors ${
            value 
              ? 'bg-blue-600' 
              : 'bg-gray-300 dark:bg-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
              value ? 'translate-x-5' : 'translate-x-0'
            } mt-0.5 ml-0.5`} />
          </div>
        </label>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Notification Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage how and when you receive notifications
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
            <button
              onClick={() => setShowSuccess(false)}
              className="ml-auto"
            >
              <XMarkIcon className="h-5 w-5 text-green-400" />
            </button>
          </div>
        </div>
      )}

      {/* Save Status */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`h-5 w-5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Settings Status
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                {lastSyncTime ? `Last saved: ${new Date(lastSyncTime).toLocaleString()}` : 'Not saved yet'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSyncing ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-white dark:bg-[#23408e] shadow-sm rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-blue-200">Email Notifications</h2>
        <div className="space-y-3 sm:space-y-4">
          <SettingToggle
            label="Email Notifications"
            description="Receive notifications via email"
            path="email.enabled"
          />

          <div className="p-3 sm:p-4 border border-gray-200 dark:border-[#2d437a] rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Email Frequency</h4>
            <p className="text-sm text-gray-600 dark:text-blue-100 mb-3">
              How often should we send you email notifications?
            </p>
            <select
              value={notificationPreferences?.email?.frequency || 'immediate'}
              onChange={(e) => handleNotificationUpdate('email.frequency', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
            >
              <option value="immediate">Immediate (as they happen)</option>
              <option value="hourly">Hourly digest</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </div>

          <SettingToggle
            label="Incident Alerts"
            description="Receive email notifications for new incidents"
            path="email.categories.incidents"
          />

          <SettingToggle
            label="System Updates"
            description="Receive email notifications for system updates"
            path="email.categories.system_updates"
          />

          <SettingToggle
            label="Reports"
            description="Receive email notifications for reports"
            path="email.categories.reports"
          />

          <SettingToggle
            label="Social Media"
            description="Receive email notifications for social media activity"
            path="email.categories.social_media"
          />
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-white dark:bg-[#23408e] shadow-sm rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-blue-200">Push Notifications</h2>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-3 sm:p-4 border border-gray-200 dark:border-[#2d437a] rounded-lg gap-3 sm:gap-4">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">Browser Notifications</h4>
              <p className="text-sm text-gray-600 dark:text-blue-100 mt-1">
                Receive push notifications in your browser
                {browserPermissionStatus === 'denied' && (
                  <span className="text-red-600 dark:text-red-400 block sm:inline sm:ml-2 mt-1 sm:mt-0">
                    (Permission denied - enable in browser settings)
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-2 sm:space-y-0 sm:space-x-2 sm:ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={notificationPreferences?.push?.enabled && browserPermissionStatus === 'granted'}
                  onChange={(e) => {
                    if (e.target.checked && browserPermissionStatus !== 'granted') {
                      requestBrowserPermission();
                    } else {
                      handleNotificationUpdate('push.enabled', e.target.checked);
                    }
                  }}
                  disabled={browserPermissionStatus === 'denied'}
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  notificationPreferences?.push?.enabled && browserPermissionStatus === 'granted'
                    ? 'bg-blue-600' 
                    : 'bg-gray-300 dark:bg-gray-600'
                } ${browserPermissionStatus === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    notificationPreferences?.push?.enabled && browserPermissionStatus === 'granted' ? 'translate-x-5' : 'translate-x-0'
                  } mt-0.5 ml-0.5`} />
                </div>
              </label>
              {browserPermissionStatus === 'default' && (
                <button
                  onClick={requestBrowserPermission}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
                >
                  Enable
                </button>
              )}
            </div>
          </div>

          <SettingToggle
            label="Sound"
            description="Play sound for push notifications"
            path="push.sound"
            disabled={!notificationPreferences?.push?.enabled}
          />

          <SettingToggle
            label="Vibration"
            description="Vibrate device for push notifications"
            path="push.vibration"
            disabled={!notificationPreferences?.push?.enabled}
          />

          <SettingToggle
            label="Incident Alerts"
            description="Receive push notifications for new incidents"
            path="push.categories.incidents"
            disabled={!notificationPreferences?.push?.enabled}
          />

          <SettingToggle
            label="System Updates"
            description="Receive push notifications for system updates"
            path="push.categories.system_updates"
            disabled={!notificationPreferences?.push?.enabled}
          />

          <SettingToggle
            label="Reports"
            description="Receive push notifications for reports"
            path="push.categories.reports"
            disabled={!notificationPreferences?.push?.enabled}
          />

          <SettingToggle
            label="Social Media"
            description="Receive push notifications for social media activity"
            path="push.categories.social_media"
            disabled={!notificationPreferences?.push?.enabled}
          />
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="bg-white dark:bg-[#23408e] shadow-sm rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-blue-200">SMS Notifications</h2>
        <div className="space-y-3 sm:space-y-4">
          <SettingToggle
            label="SMS Notifications"
            description="Receive notifications via SMS"
            path="sms.enabled"
          />

          <SettingToggle
            label="Emergency Only"
            description="Only send SMS for emergency notifications"
            path="sms.emergency_only"
            disabled={!notificationPreferences?.sms?.enabled}
          />
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white dark:bg-[#23408e] shadow-sm rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-blue-200">Quiet Hours</h2>
        <div className="space-y-3 sm:space-y-4">
          <div className="p-3 sm:p-4 border border-gray-200 dark:border-[#2d437a] rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3 sm:gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">Quiet Hours</h4>
                <p className="text-sm text-gray-600 dark:text-blue-100 mt-1">
                  Pause non-urgent notifications during specified hours
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer sm:ml-4 self-start sm:self-auto">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={notificationPreferences?.quiet_hours?.enabled}
                  onChange={(e) => handleNotificationUpdate('quiet_hours.enabled', e.target.checked)}
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  notificationPreferences?.quiet_hours?.enabled 
                    ? 'bg-blue-600' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    notificationPreferences?.quiet_hours?.enabled ? 'translate-x-5' : 'translate-x-0'
                  } mt-0.5 ml-0.5`} />
                </div>
              </label>
            </div>

            {notificationPreferences?.quiet_hours?.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={notificationPreferences?.quiet_hours?.start || '22:00'}
                    onChange={(e) => handleNotificationUpdate('quiet_hours.start', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={notificationPreferences?.quiet_hours?.end || '08:00'}
                    onChange={(e) => handleNotificationUpdate('quiet_hours.end', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="bg-white dark:bg-[#23408e] shadow-sm rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-blue-200">Notification Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/settings/notifications/templates" className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#1a2a57] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2d437a] transition-colors">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Notification Templates</div>
              <div className="text-sm text-gray-500 dark:text-blue-300">Manage notification templates</div>
            </div>
          </a>

          <a href="/settings/notifications/scheduler" className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#1a2a57] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2d437a] transition-colors">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
              <ClockIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Notification Scheduler</div>
              <div className="text-sm text-gray-500 dark:text-blue-300">Schedule automated notifications</div>
            </div>
          </a>
        </div>
      </div>

      <Toast messages={messages} onRemove={removeToast} />
    </div>
  );
} 