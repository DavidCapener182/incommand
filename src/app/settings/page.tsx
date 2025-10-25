"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext'
import PWAStatus from '@/components/PWAStatus';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useNightMode } from '@/contexts/NightModeContext';
import { supabase } from '@/lib/supabase';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { StackedPanel } from '@/components/ui/StackedPanel';
import { SectionContainer, SectionHeader } from '@/components/ui/SectionContainer';
import { CardContainer } from '@/components/ui/CardContainer';
import { 
  UserIcon, 
  CogIcon, 
  ShieldCheckIcon, 
  BellIcon,
  MoonIcon,
  SunIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingOfficeIcon,
  KeyIcon,
  ArrowPathIcon,
  CheckIcon,
  DocumentTextIcon,
  ClockIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import InviteManagement from '@/components/InviteManagement';
import { useEventMembership } from '@/hooks/useEventMembership';

interface UserProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  company_id: string | null;
  phone?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
}

interface CompanyData {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  website?: string;
}

export default function GeneralSettingsPage() {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();
  const { isNightModeAlwaysOn, toggleNightModeAlwaysOn, isNightModeActive } = useNightMode();
  const { canAccessAdminFeatures, hasActiveMembership } = useEventMembership();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [compactNavigation, setCompactNavigation] = useState(false);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch company data if user has company_id
        if ((profileData as any)?.company_id) {
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', (profileData as any).company_id)
            .single();

          if (!companyError) setCompany(companyData);
        }

        // Get theme preference exclusively from centralized preferences
        if (preferences?.theme) {
          setDarkMode(preferences.theme === 'dark');
        }

        // Get current event ID
        const { data: currentEvent, error: eventError } = await supabase
          .from('events')
          .select('id')
          .eq('is_current', true)
          .single();

        if (!eventError && currentEvent) {
          setCurrentEventId((currentEvent as any).id);
        }

      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, preferences?.theme]);

  const updateProfile = async (field: string, value: any) => {
    if (!profile) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ [field]: value })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, [field]: value });
      setSuccess('Profile updated successfully');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.new.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      });

      if (error) throw error;

      setSuccess('Password updated successfully');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !darkMode;
      setDarkMode(newTheme);
      document.documentElement.classList.toggle('dark', newTheme);
      if (user) {
        await (supabase as any).from('user_preferences').upsert({
          user_id: user.id,
          theme: newTheme ? 'dark' : 'light',
          updated_at: new Date().toISOString()
        })
      }
    } catch (e) {
      console.error('Failed to persist theme preference', e)
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white dark:bg-[#23408e] rounded-2xl p-6 text-center">
          <div className="text-gray-500 dark:text-blue-100">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <StackedPanel className="space-y-6">
          <SectionContainer className="space-y-6">
            <SectionHeader
              title="General Settings"
              accent="indigo"
              description="Manage your account preferences and profile information."
            />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
          <p className="text-green-700 dark:text-green-300 text-sm">{success}</p>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
        {/* Profile Information */}
        <CardContainer className="p-4 sm:p-6 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-[#1a2a57] rounded-lg">
              <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Profile Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-2">First Name</label>
              <input 
                type="text" 
                value={profile?.first_name || ''}
                onChange={(e) => setProfile(profile ? { ...profile, first_name: e.target.value } : null)}
                onBlur={() => updateProfile('first_name', profile?.first_name)}
                className="input-mobile"
                placeholder="Your first name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-2">Last Name</label>
              <input 
                type="text" 
                value={profile?.last_name || ''}
                onChange={(e) => setProfile(profile ? { ...profile, last_name: e.target.value } : null)}
                onBlur={() => updateProfile('last_name', profile?.last_name)}
                className="input-mobile"
                placeholder="Your last name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-2">Email</label>
              <input 
                type="email" 
                value={profile?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-gray-100 dark:bg-[#1a2a57] text-gray-500 dark:text-blue-300 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-blue-300 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-2">Phone</label>
              <input 
                type="tel" 
                value={profile?.phone || ''}
                onChange={(e) => setProfile(profile ? { ...profile, phone: e.target.value } : null)}
                onBlur={() => updateProfile('phone', profile?.phone)}
                className="input-mobile"
                placeholder="Your phone number"
                inputMode="tel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-2">Role</label>
              <input 
                type="text" 
                value={profile?.role || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-gray-100 dark:bg-[#1a2a57] text-gray-500 dark:text-blue-300 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-blue-300 mt-1">Role is managed by administrators</p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-2">Bio</label>
            <textarea 
              rows={3}
              value={profile?.bio || ''}
              onChange={(e) => setProfile(profile ? { ...profile, bio: e.target.value } : null)}
              onBlur={() => updateProfile('bio', profile?.bio)}
              className="textarea-mobile"
              placeholder="Tell us about yourself..."
            />
          </div>
        </CardContainer>

        {/* Company Information */}
        {company && (
          <CardContainer className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 dark:bg-[#1a2a57] rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Organization</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-2">Company Name</label>
                <input 
                  type="text" 
                  value={company.name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-gray-100 dark:bg-[#1a2a57] text-gray-500 dark:text-blue-300 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-2">Industry</label>
                <input 
                  type="text" 
                  value={company.industry || 'Not specified'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-gray-100 dark:bg-[#1a2a57] text-gray-500 dark:text-blue-300 text-sm cursor-not-allowed"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-blue-300 mt-2">Company details are managed by administrators</p>
          </CardContainer>
        )}

        {/* Password Change */}
        <CardContainer className="p-4 sm:p-6 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 dark:bg-[#1a2a57] rounded-lg">
              <KeyIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Change Password</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-2">New Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="input-mobile pr-12"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="touch-target absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-blue-300" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 dark:text-blue-300" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-2">Confirm New Password</label>
              <input 
                type={showPassword ? "text" : "password"}
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                className="input-mobile"
                placeholder="Confirm new password"
              />
            </div>

            <button 
              onClick={updatePassword}
              disabled={saving || !passwordData.new || !passwordData.confirm}
              className="button-danger w-full sm:w-auto"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </CardContainer>

        {/* Preferences */}
        <CardContainer className="p-4 sm:p-6 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-[#1a2a57] rounded-lg">
              <CogIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Preferences</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <MoonIcon className="h-5 w-5 text-gray-600 dark:text-blue-300" />
                ) : (
                  <SunIcon className="h-5 w-5 text-gray-600 dark:text-blue-300" />
                )}
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Dark Mode</div>
                  <div className="text-sm text-gray-500 dark:text-blue-300">Switch between light and dark themes</div>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`touch-target relative inline-flex h-7 w-12 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <span
                  className={`inline-block h-5 w-5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform shadow-md ${
                    darkMode ? 'translate-x-6 sm:translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Night Mode Always On Setting */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <MoonIcon className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Night Mode Always On</div>
                  <div className="text-sm text-gray-500 dark:text-purple-300">Keep dark mode enabled for field use</div>
                </div>
              </div>
              <button
                onClick={toggleNightModeAlwaysOn}
                className={`touch-target relative inline-flex h-7 w-12 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${
                  isNightModeAlwaysOn ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                aria-label={isNightModeAlwaysOn ? 'Disable night mode always on' : 'Enable night mode always on'}
              >
                <span
                  className={`inline-block h-5 w-5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform shadow-md ${
                    isNightModeAlwaysOn ? 'translate-x-6 sm:translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Compact Navigation Setting */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Bars3Icon className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Compact Navigation</div>
                  <div className="text-sm text-gray-500 dark:text-green-300">Use icons-only navigation for more screen space</div>
                </div>
              </div>
              <button
                onClick={() => setCompactNavigation(!compactNavigation)}
                className={`touch-target relative inline-flex h-7 w-12 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${
                  compactNavigation ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                aria-label={compactNavigation ? 'Disable compact navigation' : 'Enable compact navigation'}
              >
                <span
                  className={`inline-block h-5 w-5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform shadow-md ${
                    compactNavigation ? 'translate-x-6 sm:translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BellIcon className="h-5 w-5 text-gray-600 dark:text-blue-300" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Email Notifications</div>
                  <div className="text-sm text-gray-500 dark:text-blue-300">Receive notifications via email</div>
                </div>
              </div>
              <button
                onClick={async () => {
                  const next = !emailNotifications
                  setEmailNotifications(next)
                  try {
                    if (user) {
                      const current = preferences?.notification_preferences
                      const updated = {
                        ...current,
                        email: {
                          ...(current?.email || { enabled: true, frequency: 'immediate', categories: { incidents: true, system_updates: true, reports: true, social_media: false } }),
                          enabled: next
                        }
                      }
                      await (supabase as any).from('user_preferences').upsert({
                        user_id: user.id,
                        notification_preferences: updated,
                        updated_at: new Date().toISOString()
                      })
                    }
                  } catch (e) {
                    console.error('Failed to persist email notifications', e)
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-gray-600 dark:text-blue-300" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Push Notifications</div>
                  <div className="text-sm text-gray-500 dark:text-blue-300">Receive browser push notifications</div>
                </div>
              </div>
              <button
                onClick={async () => {
                  const next = !pushNotifications
                  setPushNotifications(next)
                  try {
                    if (user) {
                      const current = preferences?.notification_preferences
                      const updated = {
                        ...current,
                        push: {
                          ...(current?.push || { enabled: true, sound: true, vibration: true, categories: { incidents: true, system_updates: true, reports: false, social_media: false } }),
                          enabled: next
                        }
                      }
                      await (supabase as any).from('user_preferences').upsert({
                        user_id: user.id,
                        notification_preferences: updated,
                        updated_at: new Date().toISOString()
                      })
                    }
                  } catch (e) {
                    console.error('Failed to persist push notifications', e)
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    pushNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </CardContainer>

        {/* Event Invites Management - Only show for admin users with active membership */}
        {canAccessAdminFeatures && hasActiveMembership && currentEventId && (
          <CardContainer className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-[#1a2a57] rounded-lg">
                <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Event Invites</h2>
            </div>
            <InviteManagement eventId={currentEventId} />
          </CardContainer>
        )}

        {/* PWA Status */}
        <PWAStatus />
        
        {/* Settings Navigation */}
        <CardContainer className="p-4 sm:p-6 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-[#1a2a57] rounded-lg">
              <CogIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <a href="/settings/preferences" className="touch-target flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#1a2a57] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2d437a] active:scale-[0.98] transition-all">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CogIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Preferences</div>
                <div className="text-sm text-gray-500 dark:text-blue-300">Customize your experience</div>
              </div>
            </a>

            <a href="/settings/notifications" className="touch-target flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#1a2a57] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2d437a] active:scale-[0.98] transition-all">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <BellIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Notifications</div>
                <div className="text-sm text-gray-500 dark:text-blue-300">Manage notification settings</div>
              </div>
            </a>

            <a href="/settings/notifications/templates" className="touch-target flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#1a2a57] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2d437a] active:scale-[0.98] transition-all">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Notification Templates</div>
                <div className="text-sm text-gray-500 dark:text-blue-300">Manage notification templates</div>
              </div>
            </a>

            <a href="/settings/notifications/scheduler" className="touch-target flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#1a2a57] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2d437a] active:scale-[0.98] transition-all">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                <ClockIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Notification Scheduler</div>
                <div className="text-sm text-gray-500 dark:text-blue-300">Schedule automated notifications</div>
              </div>
            </a>

            <a href="/settings/backup-restore" className="touch-target flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#1a2a57] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2d437a] active:scale-[0.98] transition-all">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
                <ArrowPathIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Backup & Restore</div>
                <div className="text-sm text-gray-500 dark:text-blue-300">Manage data backups</div>
              </div>
            </a>

          </div>
        </CardContainer>

        {/* Sync Status */}
        {preferences && (
          <CardContainer className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Preferences Sync</h2>
            </div>
            <div className="text-sm text-gray-600 dark:text-blue-300">
              Your preferences are synced across all devices
            </div>
          </CardContainer>
        )}

        {/* Account Actions */}
        <CardContainer className="p-4 sm:p-6 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-100 dark:bg-[#1a2a57] rounded-lg">
              <ShieldCheckIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Account Actions</h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 dark:bg-[#1a2a57] rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Export Data</div>
                <div className="text-sm text-gray-500 dark:text-blue-300">Download all your account data</div>
              </div>
              <button className="button-primary w-full sm:w-auto">
                Request Export
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div>
                <div className="font-medium text-red-900 dark:text-red-200">Delete Account</div>
                <div className="text-sm text-red-700 dark:text-red-300">Permanently delete your account and all data</div>
              </div>
              <button className="button-danger w-full sm:w-auto">
                Delete Account
              </button>
            </div>
          </div>
        </CardContainer>
      </div>
    </SectionContainer>
  </StackedPanel>
      </div>
    </PageWrapper>
  );
} 
