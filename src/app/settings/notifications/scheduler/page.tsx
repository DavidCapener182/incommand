'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  Cog6ToothIcon, 
  TrashIcon, 
  PlayIcon, 
  PauseIcon, 
  PencilIcon 
} from '@heroicons/react/24/outline';
import { useIsAdmin } from '../../../../hooks/useRole';
import { supabase } from '../../../../lib/supabase';
import { ScheduledNotification as DBScheduledNotification } from '../../../../types/settings';

type ScheduledNotification = {
  id: string;
  user_id: string;
  template_id?: string;
  schedule_type: 'one_time' | 'recurring' | 'conditional';
  cron_expression?: string;
  scheduled_at?: string;
  next_run_at?: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  variables: Record<string, any>;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
  // UI-only fields
  title?: string;
  message?: string;
  timezone?: string;
  isActive?: boolean;
}

interface NotificationQueue {
  id: string;
  scheduledNotificationId: string;
  status: 'pending' | 'sent' | 'failed';
  scheduledFor: string;
  sentAt?: string;
  errorMessage?: string;
}

export default function NotificationSchedulerPage() {
  const isAdmin = useIsAdmin();
  // user comes from AuthContext via supabase; access through supabase.auth if needed, but keep existing logic simple
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))
  }, [])
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [notificationQueue, setNotificationQueue] = useState<NotificationQueue[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    cronExpression: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isActive: true
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [frequency, setFrequency] = useState('daily');

  useEffect(() => {
    if (currentUserId) {
      loadScheduledNotifications();
      loadNotificationQueue();
    }
  }, [currentUserId]);

  const loadScheduledNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScheduledNotifications(data || []);
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
    }
  };

  const loadNotificationQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .order('scheduledFor', { ascending: false });

      if (error) throw error;
      setNotificationQueue(data || []);
    } catch (error) {
      console.error('Error loading notification queue:', error);
    }
  };

  const generateCronExpression = () => {
    const date = selectedDate;
    const [hours, minutes] = selectedTime.split(':');
    
    switch (frequency) {
      case 'daily':
        return `${minutes} ${hours} * * *`;
      case 'weekly':
        const dayOfWeek = date.getDay();
        return `${minutes} ${hours} * * ${dayOfWeek}`;
      case 'monthly':
        const dayOfMonth = date.getDate();
        return `${minutes} ${hours} ${dayOfMonth} * *`;
      case 'yearly':
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${minutes} ${hours} ${day} ${month} *`;
      default:
        return `${minutes} ${hours} * * *`;
    }
  };

  const handleCreateNotification = async () => {
    if (!formData.title || !formData.message) return;

    const cronExpression = formData.cronExpression || generateCronExpression();
    
    try {
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .insert([{
          user_id: currentUserId,
          schedule_type: 'recurring',
          cron_expression: cronExpression,
          status: 'pending',
          variables: { title: formData.title, message: formData.message },
          max_retries: 3,
        }])
        .select()
        .single();

      if (error) throw error;

      setScheduledNotifications(prev => [data as unknown as ScheduledNotification, ...prev]);
      setFormData({
        title: '',
        message: '',
        cronExpression: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isActive: true
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating scheduled notification:', error);
    }
  };

  const handleUpdateNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .update({
          cron_expression: formData.cronExpression || null,
          variables: { title: formData.title, message: formData.message },
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setScheduledNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, cron_expression: formData.cronExpression, variables: { title: formData.title, message: formData.message }, updated_at: new Date().toISOString() }
            : notification
        )
      );
      setEditingId(null);
      setFormData({
        title: '',
        message: '',
        cronExpression: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isActive: true
      });
    } catch (error) {
      console.error('Error updating scheduled notification:', error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setScheduledNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting scheduled notification:', error);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .update({ status: isActive ? 'cancelled' : 'pending' })
        .eq('id', id);

      if (error) throw error;

      setScheduledNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, isActive: !isActive }
            : notification
        )
      );
    } catch (error) {
      console.error('Error toggling notification status:', error);
    }
  };

  const formatCronExpression = (cron: string) => {
    const parts = cron.split(' ');
    if (parts.length === 5) {
      const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
      return `${hour}:${minute.padStart(2, '0')} ${dayOfMonth === '*' ? 'every day' : `day ${dayOfMonth}`} ${month === '*' ? 'every month' : `month ${month}`}`;
    }
    return cron;
  };

  const getNextRunTime = (cronExpression: string) => {
    // Simple calculation - in production, use a proper cron parser
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    return tomorrow.toISOString();
  };

  if (!currentUserId || !isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notification Scheduler</h1>
          <p className="text-gray-600 dark:text-gray-300">Schedule automated notifications and manage the notification queue</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)} 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Cog6ToothIcon className="w-4 h-4" />
          Create Schedule
        </button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="card-depth p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-blue-200">
              {editingId ? 'Edit Scheduled Notification' : 'Create New Schedule'}
            </h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notification Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter notification title"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Timezone
                </label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message
              </label>
              <input
                id="message"
                type="text"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter notification message"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frequency
                </label>
                <select 
                  value={frequency} 
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cronExpression" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cron Expression
              </label>
              <input
                id="cronExpression"
                type="text"
                value={formData.cronExpression}
                onChange={(e) => setFormData(prev => ({ ...prev, cronExpression: e.target.value }))}
                placeholder="* * * * * (leave empty to auto-generate)"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-sm text-gray-500 mt-1">
                Generated: {generateCronExpression()}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => editingId ? handleUpdateNotification(editingId) : handleCreateNotification()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {editingId ? 'Update' : 'Create'} Schedule
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                  setFormData({
                    title: '',
                    message: '',
                    cronExpression: '',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    isActive: true
                  });
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Notifications */}
      <div className="card-depth p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-blue-200 flex items-center gap-2">
            <ClockIcon className="w-5 h-5" />
            Scheduled Notifications ({scheduledNotifications.length})
          </h2>
        </div>
        <div className="space-y-4">
          {scheduledNotifications.map((notification) => (
            <div
              key={notification.id}
              className="border border-gray-200 dark:border-[#2d437a] rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{notification.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      notification.status === 'pending' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {notification.status === 'pending' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">{notification.message}</p>
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <p>Schedule: {notification.cron_expression ? formatCronExpression(notification.cron_expression) : 'N/A'}</p>
                    <p>Timezone: {formData.timezone}</p>
                    <p>Next Run: {notification.cron_expression ? getNextRunTime(notification.cron_expression) : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(notification.id, notification.status === 'pending')}
                    className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {notification.status === 'pending' ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(notification.id);
                      setFormData({
                        title: notification.title || '',
                        message: notification.message || '',
                        cronExpression: notification.cron_expression || '',
                        timezone: formData.timezone,
                        isActive: notification.status === 'pending'
                      });
                    }}
                    className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {scheduledNotifications.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No scheduled notifications found. Create your first schedule to get started.
            </div>
          )}
        </div>
      </div>

      {/* Notification Queue */}
      <div className="card-depth p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-blue-200 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Notification Queue ({notificationQueue.length})
          </h2>
        </div>
        <div className="space-y-4">
          {notificationQueue.map((queueItem) => (
            <div
              key={queueItem.id}
              className="border border-gray-200 dark:border-[#2d437a] rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      queueItem.status === 'sent' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : queueItem.status === 'failed'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {queueItem.status}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Scheduled for: {new Date(queueItem.scheduledFor).toLocaleString()}
                    </span>
                  </div>
                  {queueItem.sentAt && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sent at: {new Date(queueItem.sentAt).toLocaleString()}
                    </p>
                  )}
                  {queueItem.errorMessage && (
                    <p className="text-sm text-red-500 dark:text-red-400">
                      Error: {queueItem.errorMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {notificationQueue.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No notifications in queue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
