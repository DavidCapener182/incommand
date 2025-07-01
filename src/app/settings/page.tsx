"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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
  KeyIcon
} from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  company_id: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
        if (profileData?.company_id) {
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profileData.company_id)
            .single();

          if (!companyError) setCompany(companyData);
        }

        // Get theme preference from localStorage
        const savedTheme = localStorage.getItem('theme');
        setDarkMode(savedTheme === 'dark');

      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const updateProfile = async (field: string, value: any) => {
    if (!profile) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
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

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newTheme);
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
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900 dark:text-white">General Settings</h1>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <p className="text-green-700 dark:text-green-300 text-sm">{success}</p>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
        {/* Profile Information */}
        <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-[#2d437a]">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your phone number"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>

        {/* Company Information */}
        {company && (
          <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-[#2d437a]">
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
          </div>
        )}

        {/* Password Change */}
        <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-[#2d437a]">
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
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4 text-gray-400 dark:text-blue-300" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-gray-400 dark:text-blue-300" />
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm new password"
              />
            </div>

            <button 
              onClick={updatePassword}
              disabled={saving || !passwordData.new || !passwordData.confirm}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-[#2d437a]">
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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
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
                onClick={() => setEmailNotifications(!emailNotifications)}
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
                onClick={() => setPushNotifications(!pushNotifications)}
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
        </div>
        
        {/* Account Actions */}
        <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-[#2d437a]">
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
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                Request Export
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div>
                <div className="font-medium text-red-900 dark:text-red-200">Delete Account</div>
                <div className="text-sm text-red-700 dark:text-red-300">Permanently delete your account and all data</div>
              </div>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 