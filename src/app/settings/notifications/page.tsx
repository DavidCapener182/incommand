"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import Toast, { useToast } from '../../../components/Toast';

interface NotificationSettings {
  // Incident Notifications
  incident_created: boolean;
  incident_updated: boolean;
  incident_resolved: boolean;
  high_priority_incidents: boolean;
  urgent_incidents: boolean;
  
  // AI Insights
  ai_summary_digest: boolean;
  ai_trend_alerts: boolean;
  ai_performance_insights: boolean;
  
  // System Notifications
  system_maintenance: boolean;
  system_updates: boolean;
  security_alerts: boolean;
  
  // Event Notifications
  event_created: boolean;
  event_updated: boolean;
  event_ended: boolean;
  
  // Delivery Methods
  browser_notifications: boolean;
  email_notifications: boolean;
  digest_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

const defaultSettings: NotificationSettings = {
  incident_created: true,
  incident_updated: true,
  incident_resolved: false,
  high_priority_incidents: true,
  urgent_incidents: true,
  ai_summary_digest: true,
  ai_trend_alerts: true,
  ai_performance_insights: false,
  system_maintenance: true,
  system_updates: false,
  security_alerts: true,
  event_created: true,
  event_updated: false,
  event_ended: true,
  browser_notifications: true,
  email_notifications: false,
  digest_frequency: 'daily',
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
};

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { messages, addToast, removeToast } = useToast();
  const [browserPermissionStatus, setBrowserPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    loadNotificationSettings();
    checkBrowserNotificationPermission();
  }, []);

  const checkBrowserNotificationPermission = () => {
    if ('Notification' in window) {
      setBrowserPermissionStatus(Notification.permission);
    }
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setBrowserPermissionStatus(permission);
      
      if (permission === 'granted') {
        addToast({ title: 'Success', message: 'Browser notifications enabled successfully!', type: 'success' });
      } else if (permission === 'denied') {
        addToast({ title: 'Error', message: 'Browser notifications were denied. You can enable them in your browser settings.', type: 'error' });
      }
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading notification settings:', error);
      } else if (data) {
        setSettings(data.settings || defaultSettings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addToast({ title: 'Error', message: 'Please log in to save notification settings', type: 'error' });
        return;
      }

      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          settings: settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving notification settings:', error);
        addToast({ title: 'Error', message: 'Failed to save notification settings', type: 'error' });
      } else {
        addToast({ title: 'Success', message: 'Notification settings saved successfully!', type: 'success' });
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      addToast({ title: 'Error', message: 'Failed to save notification settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const SettingToggle = ({ 
    label, 
    description, 
    settingKey, 
    disabled = false 
  }: { 
    label: string; 
    description: string; 
    settingKey: keyof NotificationSettings; 
    disabled?: boolean;
  }) => (
    <div className="flex items-start justify-between p-4 border border-gray-200 dark:border-[#2d437a] rounded-lg">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
        <p className="text-sm text-gray-600 dark:text-blue-100 mt-1">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer ml-4">
        <input
          type="checkbox"
          className="sr-only"
          checked={settings[settingKey] as boolean}
          onChange={(e) => handleSettingChange(settingKey, e.target.checked)}
          disabled={disabled}
        />
        <div className={`w-11 h-6 rounded-full transition-colors ${
          settings[settingKey] 
            ? 'bg-blue-600' 
            : 'bg-gray-300 dark:bg-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
            settings[settingKey] ? 'translate-x-5' : 'translate-x-0'
          } mt-0.5 ml-0.5`} />
        </div>
      </label>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Loading notification settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Notification Settings</h1>
        <p className="text-gray-600 dark:text-blue-100">Customize how and when you receive notifications from the platform.</p>
      </div>

      <div className="space-y-6">
        {/* Incident Notifications */}
        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-blue-200">Incident Notifications</h2>
          <div className="space-y-4">
            <SettingToggle
              label="New Incidents"
              description="Notify me when new incidents are created"
              settingKey="incident_created"
            />
            <SettingToggle
              label="Incident Updates"
              description="Notify me when incidents are updated or have new activity"
              settingKey="incident_updated"
            />
            <SettingToggle
              label="Incident Resolved"
              description="Notify me when incidents are marked as resolved"
              settingKey="incident_resolved"
            />
            <SettingToggle
              label="High Priority Incidents"
              description="Always notify me about high priority incidents"
              settingKey="high_priority_incidents"
            />
            <SettingToggle
              label="Urgent Incidents"
              description="Immediately notify me about urgent incidents (overrides quiet hours)"
              settingKey="urgent_incidents"
            />
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-blue-200">AI Insights</h2>
          <div className="space-y-4">
            <SettingToggle
              label="AI Summary Digest"
              description="Receive periodic AI-generated summaries of platform activity"
              settingKey="ai_summary_digest"
            />
            <SettingToggle
              label="Trend Alerts"
              description="Notify me when AI detects important trends or patterns"
              settingKey="ai_trend_alerts"
            />
            <SettingToggle
              label="Performance Insights"
              description="Receive AI insights about team and system performance"
              settingKey="ai_performance_insights"
            />
          </div>
        </div>

        {/* System Notifications */}
        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-blue-200">System Notifications</h2>
          <div className="space-y-4">
            <SettingToggle
              label="Maintenance Alerts"
              description="Notify me about scheduled maintenance and downtime"
              settingKey="system_maintenance"
            />
            <SettingToggle
              label="System Updates"
              description="Notify me about new features and system updates"
              settingKey="system_updates"
            />
            <SettingToggle
              label="Security Alerts"
              description="Notify me about security-related events and alerts"
              settingKey="security_alerts"
            />
          </div>
        </div>

        {/* Event Notifications */}
        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-blue-200">Event Notifications</h2>
          <div className="space-y-4">
            <SettingToggle
              label="New Events"
              description="Notify me when new events are created"
              settingKey="event_created"
            />
            <SettingToggle
              label="Event Updates"
              description="Notify me when events are updated or modified"
              settingKey="event_updated"
            />
            <SettingToggle
              label="Event Ended"
              description="Notify me when events are concluded"
              settingKey="event_ended"
            />
          </div>
        </div>

        {/* Delivery Methods */}
        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-blue-200">Delivery Methods</h2>
          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 border border-gray-200 dark:border-[#2d437a] rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">Browser Notifications</h4>
                <p className="text-sm text-gray-600 dark:text-blue-100 mt-1">
                  Receive push notifications in your browser
                  {browserPermissionStatus === 'denied' && (
                    <span className="text-red-600 dark:text-red-400 ml-2">
                      (Permission denied - enable in browser settings)
                    </span>
                  )}
                </p>
              </div>
              <div className="ml-4 flex flex-col items-end space-y-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={settings.browser_notifications && browserPermissionStatus === 'granted'}
                    onChange={(e) => {
                      if (e.target.checked && browserPermissionStatus !== 'granted') {
                        requestBrowserPermission();
                      } else {
                        handleSettingChange('browser_notifications', e.target.checked);
                      }
                    }}
                    disabled={browserPermissionStatus === 'denied'}
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    settings.browser_notifications && browserPermissionStatus === 'granted'
                      ? 'bg-blue-600' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  } ${browserPermissionStatus === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      settings.browser_notifications && browserPermissionStatus === 'granted' ? 'translate-x-5' : 'translate-x-0'
                    } mt-0.5 ml-0.5`} />
                  </div>
                </label>
                {browserPermissionStatus === 'default' && (
                  <button
                    onClick={requestBrowserPermission}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Enable
                  </button>
                )}
              </div>
            </div>

            <SettingToggle
              label="Email Notifications"
              description="Receive notifications via email"
              settingKey="email_notifications"
            />

            <div className="p-4 border border-gray-200 dark:border-[#2d437a] rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Digest Frequency</h4>
              <p className="text-sm text-gray-600 dark:text-blue-100 mb-3">
                How often should we send you summary notifications?
              </p>
              <select
                value={settings.digest_frequency}
                onChange={(e) => handleSettingChange('digest_frequency', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="realtime">Real-time (as they happen)</option>
                <option value="hourly">Hourly digest</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
              </select>
            </div>

            <div className="p-4 border border-gray-200 dark:border-[#2d437a] rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">Quiet Hours</h4>
                  <p className="text-sm text-gray-600 dark:text-blue-100 mt-1">
                    Pause non-urgent notifications during specified hours
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={settings.quiet_hours_enabled}
                    onChange={(e) => handleSettingChange('quiet_hours_enabled', e.target.checked)}
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    settings.quiet_hours_enabled 
                      ? 'bg-blue-600' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      settings.quiet_hours_enabled ? 'translate-x-5' : 'translate-x-0'
                    } mt-0.5 ml-0.5`} />
                  </div>
                </label>
              </div>
              
              {settings.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={settings.quiet_hours_start}
                      onChange={(e) => handleSettingChange('quiet_hours_start', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={settings.quiet_hours_end}
                      onChange={(e) => handleSettingChange('quiet_hours_end', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveNotificationSettings}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast messages={messages} onRemove={removeToast} />
    </div>
  );
} 