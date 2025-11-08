// @ts-nocheck
"use client";
import React, { useState, useEffect, useTransition } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CardContainer } from '@/components/ui/CardContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';
import { updateProfile } from './actions';

interface UserProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  phone_number?: string | null;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export default function GeneralSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  useEffect(() => {
    const supabaseClient = supabase as any;

    const fetchProfile = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // If no user after auth loads, show error
      if (!user) {
        setError('You must be signed in to view your profile');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabaseClient
          .from('profiles')
          .select('id, email, first_name, last_name, role, phone_number')
          .eq('id', user.id)
          .maybeSingle();

        if (fetchError) {
          // If profile doesn't exist, create a basic one
          if (fetchError.code === 'PGRST116') {
            console.log('Profile not found, creating default profile');
            // Try to create a basic profile
            const { data: newProfile, error: createError } = await supabaseClient
              .from('profiles')
              .insert([{
                id: user.id,
                email: user.email,
                first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || '',
                last_name: user.user_metadata?.last_name || '',
              }])
              .select('id, email, first_name, last_name, role, phone_number')
              .maybeSingle();

            if (createError) {
              console.error('Failed to create profile:', createError);
              // If creation fails, try to fetch again (might have been created by trigger)
              await new Promise(resolve => setTimeout(resolve, 500)); // Wait a bit
              const { data: retryData, error: retryError } = await supabaseClient
                .from('profiles')
                .select('id, email, first_name, last_name, role, phone_number')
                .eq('id', user.id)
                .maybeSingle();

              if (retryError || !retryData) {
                throw new Error(`Failed to create or fetch profile: ${createError.message || retryError?.message || 'Unknown error'}`);
              }

              setProfile(retryData);
              setFormData({
                firstName: retryData.first_name || '',
                lastName: retryData.last_name || '',
                phone: retryData.phone_number || '',
              });
            } else if (newProfile) {
              setProfile(newProfile);
              setFormData({
                firstName: newProfile.first_name || '',
                lastName: newProfile.last_name || '',
                phone: newProfile.phone_number || '',
              });
            }
          } else {
            throw fetchError;
          }
        } else if (data) {
          setProfile(data);
          setFormData({
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            phone: data.phone_number || '',
          });
        }
      } catch (error: any) {
        console.error('Failed to load profile:', error);
        setError(error.message || 'Failed to load profile');
        addToast({
          type: 'error',
          title: 'Error',
          message: error.message || 'Failed to load profile',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, addToast]);

  // Track changes
  useEffect(() => {
    if (!profile) return;

        const changed =
          formData.firstName !== (profile.first_name || '') ||
          formData.lastName !== (profile.last_name || '') ||
          formData.phone !== (profile.phone_number || '');

    setHasChanges(changed);
  }, [formData, profile]);

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        if (value.length > 100) return 'First name must be less than 100 characters';
        return undefined;
      case 'lastName':
        if (!value.trim()) return 'Last name is required';
        if (value.length > 100) return 'Last name must be less than 100 characters';
        return undefined;
          case 'phone':
            if (value && value.length > 20) return 'Phone number must be less than 20 characters';
            return undefined;
      default:
        return undefined;
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Validate on blur
    const error = validateField(field, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: string) => {
    const value = formData[field as keyof typeof formData];
    const error = validateField(field, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    startTransition(async () => {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('firstName', formData.firstName);
      formDataToSubmit.append('lastName', formData.lastName);
      formDataToSubmit.append('phone', formData.phone);

      const result = await updateProfile(formDataToSubmit);

      if (result.error) {
        addToast({
          type: 'error',
          title: 'Error',
          message: result.error,
        });
      } else {
        // Optimistically update local state
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone_number: formData.phone || null,
              }
            : null
        );
        setHasChanges(false);
        setLastSaved(new Date());
        addToast({
          type: 'success',
          title: 'Success',
          message: 'Profile updated successfully',
        });
      }
    });
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <CardContainer>
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-blue-100">Loading profile...</div>
          </div>
        </CardContainer>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <CardContainer>
          <div className="text-center py-8">
            <ExclamationCircleIcon className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
            <div className="text-red-500 dark:text-red-400 font-medium mb-2">
              {error || 'Failed to load profile'}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please try refreshing the page or contact support if the problem persists.
            </p>
          </div>
        </CardContainer>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Sticky Save Bar */}
      {hasChanges && (
        <div className="sticky top-20 z-10 bg-white dark:bg-[#23408e] border border-gray-200 dark:border-[#2d437a] rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <ExclamationCircleIcon className="h-5 w-5 text-amber-500" />
              <span>You have unsaved changes</span>
            </div>
            <div className="flex items-center gap-3">
              {lastSaved && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
              <Button
                onClick={handleSubmit}
                disabled={isPending || Object.keys(errors).length > 0}
                variant="primary"
                size="md"
              >
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Information Card */}
      <CardContainer>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-[#1a2a57] rounded-lg">
            <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Profile Information</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Update your personal information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <Label htmlFor="firstName" className="mb-2">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                onBlur={() => handleBlur('firstName')}
                className={errors.firstName ? 'border-red-500' : ''}
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              />
              {errors.firstName && (
                <p id="firstName-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.firstName}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <Label htmlFor="lastName" className="mb-2">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                onBlur={() => handleBlur('lastName')}
                className={errors.lastName ? 'border-red-500' : ''}
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              />
              {errors.lastName && (
                <p id="lastName-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.lastName}
                </p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <Label htmlFor="email" className="mb-2">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.email || ''}
                disabled
                className="bg-gray-100 dark:bg-[#1a2a57] cursor-not-allowed"
                aria-label="Email address (cannot be changed)"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="mb-2">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                className={errors.phone ? 'border-red-500' : ''}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
                placeholder="+44 123 456 7890"
              />
              {errors.phone && (
                <p id="phone-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Role (read-only) */}
            <div>
              <Label htmlFor="role" className="mb-2">Role</Label>
              <Input
                id="role"
                type="text"
                value={profile.role || ''}
                disabled
                className="bg-gray-100 dark:bg-[#1a2a57] cursor-not-allowed"
                aria-label="User role (managed by administrators)"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Role is managed by administrators</p>
            </div>
          </div>

          {/* Save Button (shown when there are changes) */}
          {hasChanges && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#2d437a]">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    firstName: profile.first_name || '',
                    lastName: profile.last_name || '',
                    phone: profile.phone_number || '',
                  });
                  setErrors({});
                  setHasChanges(false);
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isPending || Object.keys(errors).length > 0}
              >
                {isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </CardContainer>
    </div>
  );
}
