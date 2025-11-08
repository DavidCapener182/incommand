'use client'
import React, { useState, useEffect, useTransition } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CardContainer } from '@/components/ui/CardContainer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { BellIcon, EnvelopeIcon, DevicePhoneMobileIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';
import { updateNotificationPreference } from '../actions';
import type { Database } from '@/types/supabase';

type NotificationSettingsRecord = {
  user_id: string;
  email_incidents: boolean | null;
  email_updates: boolean | null;
  email_reports: boolean | null;
  email_social: boolean | null;
  push_enabled: boolean | null;
  push_sound: boolean | null;
  push_vibrate: boolean | null;
  push_incidents: boolean | null;
  push_updates: boolean | null;
  push_reports: boolean | null;
  push_social: boolean | null;
  sms_enabled: boolean | null;
  sms_emergency_only: boolean | null;
  sms_number: string | null;
  quiet_hours_enabled: boolean | null;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
};

export default function NotificationSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [smsVerificationCode, setSmsVerificationCode] = useState('');
  const [smsVerifying, setSmsVerifying] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      // Initialize empty settings so page can render
      setSettings({
        userId: '',
        emailIncidents: false,
        emailUpdates: false,
        emailReports: false,
        emailSocial: false,
        pushEnabled: false,
        pushSound: false,
        pushVibrate: false,
        pushIncidents: false,
        pushUpdates: false,
        pushReports: false,
        pushSocial: false,
        smsEnabled: false,
        smsEmergencyOnly: true,
        smsNumber: null,
        quietHoursEnabled: false,
        quietHoursStart: null,
        quietHoursEnd: null,
      });
      return;
    }

    const loadSettings = async () => {
      setLoading(true);
      try {
        // Fetch settings from Supabase
        const { data, error } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        const notificationData = data as NotificationSettingsRecord | null;

        if (notificationData) {
          // Map database fields to component state
          setSettings({
            userId: notificationData.user_id,
            emailIncidents: notificationData.email_incidents ?? false,
            emailUpdates: notificationData.email_updates ?? false,
            emailReports: notificationData.email_reports ?? false,
            emailSocial: notificationData.email_social ?? false,
            pushEnabled: notificationData.push_enabled ?? false,
            pushSound: notificationData.push_sound ?? false,
            pushVibrate: notificationData.push_vibrate ?? false,
            pushIncidents: notificationData.push_incidents ?? false,
            pushUpdates: notificationData.push_updates ?? false,
            pushReports: notificationData.push_reports ?? false,
            pushSocial: notificationData.push_social ?? false,
            smsEnabled: notificationData.sms_enabled ?? false,
            smsEmergencyOnly: notificationData.sms_emergency_only !== false,
            smsNumber: notificationData.sms_number ?? null,
            quietHoursEnabled: notificationData.quiet_hours_enabled ?? false,
            quietHoursStart: notificationData.quiet_hours_start,
            quietHoursEnd: notificationData.quiet_hours_end,
          });
        } else {
          // Initialize with defaults if no data found
          setSettings({
            userId: user.id,
            emailIncidents: false,
            emailUpdates: false,
            emailReports: false,
            emailSocial: false,
            pushEnabled: false,
            pushSound: false,
            pushVibrate: false,
            pushIncidents: false,
            pushUpdates: false,
            pushReports: false,
            pushSocial: false,
            smsEnabled: false,
            smsEmergencyOnly: true,
            smsNumber: null,
            quietHoursEnabled: false,
            quietHoursStart: null,
            quietHoursEnd: null,
          });
        }

        // Check push notification permission
        if ('Notification' in window) {
          setPushPermission(Notification.permission);
        }
      } catch (error: any) {
        console.error('Failed to load notification settings:', error);
        // Initialize with defaults even on error so page can render
        setSettings({
          userId: user.id,
          emailIncidents: false,
          emailUpdates: false,
          emailReports: false,
          emailSocial: false,
          pushEnabled: false,
          pushSound: false,
          pushVibrate: false,
          pushIncidents: false,
          pushUpdates: false,
          pushReports: false,
          pushSocial: false,
          smsEnabled: false,
          smsEmergencyOnly: true,
          smsNumber: null,
          quietHoursEnabled: false,
          quietHoursStart: null,
          quietHoursEnd: null,
        });
        addToast({
          type: 'error',
          title: 'Error',
          message: error.message || 'Failed to load notification settings. Using defaults.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user, authLoading, addToast]);

  const handleUpdate = async (field: string, value: any) => {
    if (!user || !settings) return;

    const updated = { ...settings, [field]: value };
    setSettings(updated);

    startTransition(async () => {
      try {
        // Map field names to database column names
        const dbFieldMap: Record<string, string> = {
          emailIncidents: 'email_incidents',
          emailUpdates: 'email_updates',
          emailReports: 'email_reports',
          emailSocial: 'email_social',
          pushEnabled: 'push_enabled',
          pushSound: 'push_sound',
          pushVibrate: 'push_vibrate',
          pushIncidents: 'push_incidents',
          pushUpdates: 'push_updates',
          pushReports: 'push_reports',
          pushSocial: 'push_social',
          smsEnabled: 'sms_enabled',
          smsEmergencyOnly: 'sms_emergency_only',
          smsNumber: 'sms_number',
          quietHoursEnabled: 'quiet_hours_enabled',
          quietHoursStart: 'quiet_hours_start',
          quietHoursEnd: 'quiet_hours_end',
        };

        const dbField = dbFieldMap[field] || field;
        const updateData: Partial<NotificationSettingsRecord> & { user_id: string } = {
          user_id: user.id,
          [dbField]: value,
        };

        const { error } = await supabase
          .from('notification_settings')
          .upsert(updateData);

        if (error) throw error;

        addToast({
          type: 'success',
          title: 'Success',
          message: 'Notification settings updated',
        });
      } catch (error: any) {
        console.error('Failed to update notification settings:', error);
        addToast({
          type: 'error',
          title: 'Error',
          message: error.message || 'Failed to update settings',
        });
        // Revert on error
        setSettings(settings);
      }
    });
  };

  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      addToast({
        type: 'error',
        title: 'Not Supported',
        message: 'Push notifications are not supported in this browser',
      });
      return;
    }

    const permission = await Notification.requestPermission();
    setPushPermission(permission);

    if (permission === 'granted') {
      handleUpdate('pushEnabled', true);
      addToast({
        type: 'success',
        title: 'Success',
        message: 'Push notifications enabled',
      });
    } else {
      addToast({
        type: 'error',
        title: 'Permission Denied',
        message: 'Push notifications were denied. Please enable them in your browser settings.',
      });
    }
  };

  const handleTestEmail = async () => {
    if (!user) return;
    startTransition(async () => {
      try {
        // TODO: Integrate with actual email service
        console.log(`[Notification] Sending test email to user ${user.id}`);
        addToast({
          type: 'success',
          title: 'Test Email Sent',
          message: 'Check your inbox for a test email',
        });
      } catch (error: any) {
        addToast({
          type: 'error',
          title: 'Error',
          message: error.message || 'Failed to send test email',
        });
      }
    });
  };

  const handleTestPush = async () => {
    if (!user) return;
    startTransition(async () => {
      try {
        // TODO: Integrate with actual push service
        console.log(`[Notification] Sending test push to user ${user.id}`);
        if (pushPermission === 'granted' && 'Notification' in window) {
          new Notification('Test Notification from inCommand', {
            body: 'This is a test push notification.',
            icon: '/favicon.ico',
          });
        }
        addToast({
          type: 'success',
          title: 'Test Push Sent',
          message: 'You should receive a test notification',
        });
      } catch (error: any) {
        addToast({
          type: 'error',
          title: 'Error',
          message: error.message || 'Failed to send test push',
        });
      }
    });
  };

  const handleVerifySMS = async () => {
    if (!user || !settings?.smsNumber) return;
    setSmsVerifying(true);
    // Stub: In production, this would verify the OTP code
    setTimeout(() => {
      setSmsVerifying(false);
      addToast({
        type: 'success',
        title: 'SMS Verified',
        message: 'Your phone number has been verified',
      });
    }, 1000);
  };

  const handleTestSMS = async () => {
    if (!user || !settings?.smsNumber) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Please enter a phone number first',
      });
      return;
    }
    startTransition(async () => {
      try {
        // TODO: Integrate with actual SMS service
        console.log(`[Notification] Sending test SMS to ${settings.smsNumber} for user ${user.id}`);
        addToast({
          type: 'success',
          title: 'Test SMS Sent',
          message: 'Check your phone for a test SMS',
        });
      } catch (error: any) {
        addToast({
          type: 'error',
          title: 'Error',
          message: error.message || 'Failed to send test SMS',
        });
      }
    });
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <CardContainer>
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-blue-100">Loading notification settings...</div>
          </div>
        </CardContainer>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <CardContainer>
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-blue-100">You must be signed in to view notification settings.</div>
          </div>
        </CardContainer>
      </div>
    );
  }

  if (!settings) {
    // This should never happen after loading completes, but just in case
    return (
      <div className="max-w-4xl mx-auto">
        <CardContainer>
          <div className="text-center py-8">
            <div className="text-red-500 dark:text-red-400">Failed to initialize settings</div>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Reload Page
            </Button>
          </div>
        </CardContainer>
      </div>
    );
  }

  const quietHoursPreview = settings.quietHoursEnabled && settings.quietHoursStart && settings.quietHoursEnd
    ? `${settings.quietHoursStart} - ${settings.quietHoursEnd}`
    : 'Not set';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Email Notifications */}
      <CardContainer>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-[#1a2a57] rounded-lg">
            <EnvelopeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Email Notifications</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Configure which emails you receive</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Incident Alerts</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive emails for new incidents</p>
            </div>
            <Switch
              checked={settings.emailIncidents}
              onCheckedChange={(checked) => handleUpdate('emailIncidents', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Updates</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive emails for incident updates</p>
            </div>
            <Switch
              checked={settings.emailUpdates}
              onCheckedChange={(checked) => handleUpdate('emailUpdates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Reports</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive daily/weekly reports</p>
            </div>
            <Switch
              checked={settings.emailReports}
              onCheckedChange={(checked) => handleUpdate('emailReports', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Social Media</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive social media alerts</p>
            </div>
            <Switch
              checked={settings.emailSocial}
              onCheckedChange={(checked) => handleUpdate('emailSocial', checked)}
            />
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-[#2d437a]">
            <Button variant="outline" onClick={handleTestEmail} disabled={isPending}>
              Send Test Email
            </Button>
          </div>
        </div>
      </CardContainer>

      {/* Push Notifications */}
      <CardContainer>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-[#1a2a57] rounded-lg">
            <BellIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Push Notifications</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Browser push notifications</p>
          </div>
        </div>

        <div className="space-y-4">
          {pushPermission === 'default' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Push notifications require browser permission. Click the button below to enable them.
              </p>
              <Button variant="primary" onClick={handleRequestPushPermission}>
                Request Permission
              </Button>
            </div>
          )}

          {pushPermission === 'denied' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700 dark:text-red-300">
                Push notifications are blocked. Please enable them in your browser settings.
              </p>
            </div>
          )}

          {pushPermission === 'granted' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Push Notifications</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Receive browser push notifications</p>
                </div>
                <Switch
                  checked={settings.pushEnabled}
                  onCheckedChange={(checked) => handleUpdate('pushEnabled', checked)}
                  disabled={!settings.pushEnabled && pushPermission !== 'granted'}
                />
              </div>

              {settings.pushEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Sound</Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Play sound with notifications</p>
                    </div>
                    <Switch
                      checked={settings.pushSound}
                      onCheckedChange={(checked) => handleUpdate('pushSound', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Vibration</Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Vibrate device for notifications</p>
                    </div>
                    <Switch
                      checked={settings.pushVibrate}
                      onCheckedChange={(checked) => handleUpdate('pushVibrate', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Incidents</Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Push notifications for incidents</p>
                    </div>
                    <Switch
                      checked={settings.pushIncidents}
                      onCheckedChange={(checked) => handleUpdate('pushIncidents', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Updates</Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Push notifications for updates</p>
                    </div>
                    <Switch
                      checked={settings.pushUpdates}
                      onCheckedChange={(checked) => handleUpdate('pushUpdates', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Reports</Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Push notifications for reports</p>
                    </div>
                    <Switch
                      checked={settings.pushReports}
                      onCheckedChange={(checked) => handleUpdate('pushReports', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Social Media</Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Push notifications for social media</p>
                    </div>
                    <Switch
                      checked={settings.pushSocial}
                      onCheckedChange={(checked) => handleUpdate('pushSocial', checked)}
                    />
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-gray-200 dark:border-[#2d437a]">
                <Button variant="outline" onClick={handleTestPush} disabled={isPending || !settings.pushEnabled}>
                  Send Test Push
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContainer>

      {/* SMS Notifications */}
      <CardContainer>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 dark:bg-[#1a2a57] rounded-lg">
            <DevicePhoneMobileIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">SMS Notifications</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Text message notifications</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="smsNumber">Phone Number</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="smsNumber"
                type="tel"
                value={settings.smsNumber || ''}
                onChange={(e) => handleUpdate('smsNumber', e.target.value)}
                placeholder="+44 123 456 7890"
                className="flex-1"
              />
              {settings.smsNumber && (
                <Button variant="outline" onClick={handleVerifySMS} disabled={smsVerifying}>
                  {smsVerifying ? 'Verifying...' : 'Verify'}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable SMS</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive SMS notifications</p>
            </div>
            <Switch
              checked={settings.smsEnabled}
              onCheckedChange={(checked) => handleUpdate('smsEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Emergency Only</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Only send SMS for emergencies</p>
            </div>
            <Switch
              checked={settings.smsEmergencyOnly}
              onCheckedChange={(checked) => handleUpdate('smsEmergencyOnly', checked)}
            />
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-[#2d437a]">
            <Button variant="outline" onClick={handleTestSMS} disabled={isPending || !settings.smsNumber}>
              Send Test SMS
            </Button>
          </div>
        </div>
      </CardContainer>

      {/* Quiet Hours */}
      <CardContainer>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 dark:bg-[#1a2a57] rounded-lg">
            <MoonIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Quiet Hours</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Suppress notifications during these hours</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Quiet Hours</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Suppress notifications during quiet hours</p>
            </div>
            <Switch
              checked={settings.quietHoursEnabled}
              onCheckedChange={(checked) => handleUpdate('quietHoursEnabled', checked)}
            />
          </div>

          {settings.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quietStart">Start Time</Label>
                <Input
                  id="quietStart"
                  type="time"
                  value={settings.quietHoursStart || ''}
                  onChange={(e) => handleUpdate('quietHoursStart', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="quietEnd">End Time</Label>
                <Input
                  id="quietEnd"
                  type="time"
                  value={settings.quietHoursEnd || ''}
                  onChange={(e) => handleUpdate('quietHoursEnd', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-[#1a2a57] rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Preview:</strong> Quiet hours are {settings.quietHoursEnabled ? `set to ${quietHoursPreview}` : 'disabled'}
            </p>
          </div>
        </div>
      </CardContainer>
    </div>
  );
}
