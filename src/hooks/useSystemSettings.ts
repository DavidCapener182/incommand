import { useContext, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from './useRole'
import { SystemSettings, FeatureFlags, FeatureFlagKey } from '../types/settings'
import { supabase } from '../lib/supabase'

/**
 * Hook for accessing system-wide settings
 */
export const useSystemSettings = () => {
  let auth: any;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available in useSystemSettings:', error);
    auth = { systemSettings: null, refreshSettings: async () => {} };
  }
  const systemSettings: SystemSettings | null = auth?.systemSettings ?? null
  const refreshSettings: () => Promise<void> = auth?.refreshSettings ?? (async () => {})

  return {
    systemSettings,
    refreshSettings,
    isLoading: systemSettings === null,
  }
}

/**
 * Hook for checking if maintenance mode is active
 */
export const useMaintenanceMode = () => {
  let auth: any;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available in useMaintenanceMode:', error);
    auth = { systemSettings: null };
  }
  const { systemSettings } = auth;
  
  return useMemo(() => ({
    isMaintenanceMode: systemSettings?.maintenance_mode || false,
    maintenanceMessage: systemSettings?.maintenance_message || 'System is under maintenance. Please try again later.',
  }), [systemSettings])
}

/**
 * Hook for checking specific feature flags
 */
export const useFeatureFlag = (flagName: FeatureFlagKey) => {
  let auth: any;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available in useFeatureFlag:', error);
    auth = { systemSettings: null };
  }
  const { systemSettings } = auth;
  
  return useMemo(() => {
    if (!systemSettings?.feature_flags) return false
    return systemSettings.feature_flags[flagName] || false
  }, [systemSettings, flagName])
}

/**
 * Hook for checking multiple feature flags at once
 */
export const useFeatureFlags = (flagNames: FeatureFlagKey[]) => {
  let auth: any;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available in useFeatureFlags:', error);
    auth = { systemSettings: null };
  }
  const { systemSettings } = auth;
  
  return useMemo(() => {
    if (!systemSettings?.feature_flags) {
      return flagNames.reduce((acc, flag) => ({ ...acc, [flag]: false }), {})
    }
    
    return flagNames.reduce((acc, flag) => ({
      ...acc,
      [flag]: systemSettings.feature_flags[flag] || false
    }), {})
  }, [systemSettings, flagNames])
}

/**
 * Hook for updating system settings (admin only)
 */
export const useUpdateSystemSettings = () => {
  let auth: any;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available in useUpdateSystemSettings:', error);
    auth = { systemSettings: null, refreshSettings: async () => {} };
  }
  const { systemSettings, refreshSettings } = auth;
  const { isAdmin } = useRole()
  
  const updateSystemSettings = useCallback(async (
    updates: Partial<Pick<SystemSettings, 'maintenance_mode' | 'maintenance_message' | 'feature_flags' | 'notification_settings' | 'platform_config'>>
  ) => {
    if (!isAdmin) {
      throw new Error('Insufficient permissions to update system settings')
    }
    
    if (!systemSettings) {
      throw new Error('System settings not loaded')
    }
    
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          maintenance_mode: updates.maintenance_mode ?? systemSettings.maintenance_mode,
          maintenance_message: updates.maintenance_message ?? systemSettings.maintenance_message,
          feature_flags: updates.feature_flags ?? systemSettings.feature_flags,
          notification_settings: updates.notification_settings ?? systemSettings.notification_settings,
          platform_config: updates.platform_config ?? systemSettings.platform_config,
          updated_at: new Date().toISOString(),
        })
      
      if (error) {
        throw new Error(`Failed to update system settings: ${error.message}`)
      }
      
      // Refresh settings to get the latest data
      await refreshSettings()
      
      return { success: true }
    } catch (error) {
      console.error('Error updating system settings:', error)
      throw error
    }
  }, [isAdmin, systemSettings, refreshSettings])
  
  const updateFeatureFlag = useCallback(async (flagName: FeatureFlagKey, enabled: boolean) => {
    if (!systemSettings) {
      throw new Error('System settings not loaded')
    }
    
    const updatedFeatureFlags = {
      ...systemSettings.feature_flags,
      [flagName]: enabled
    }
    
    return updateSystemSettings({ feature_flags: updatedFeatureFlags })
  }, [systemSettings, updateSystemSettings])
  
  const toggleMaintenanceMode = useCallback(async (enabled: boolean, message?: string) => {
    return updateSystemSettings({
      maintenance_mode: enabled,
      maintenance_message: message || systemSettings?.maintenance_message || 'System is under maintenance. Please try again later.'
    })
  }, [updateSystemSettings, systemSettings])
  
  return {
    updateSystemSettings,
    updateFeatureFlag,
    toggleMaintenanceMode,
    canUpdate: isAdmin,
  }
}

/**
 * Hook for getting platform configuration
 */
export const usePlatformConfig = () => {
  let auth: any;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available in usePlatformConfig:', error);
    auth = { systemSettings: null };
  }
  const { systemSettings } = auth;
  
  return useMemo(() => ({
    maxFileUploadSize: systemSettings?.platform_config?.max_file_upload_size || 10485760, // 10MB default
    sessionTimeout: systemSettings?.platform_config?.session_timeout || 3600, // 1 hour default
    maxLoginAttempts: systemSettings?.platform_config?.max_login_attempts || 5,
    maintenanceWindow: systemSettings?.platform_config?.maintenance_window,
    featureRollout: systemSettings?.platform_config?.feature_rollout,
  }), [systemSettings])
}

/**
 * Hook for getting system notification settings
 */
export const useSystemNotificationSettings = () => {
  let auth: any;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available in useSystemNotificationSettings:', error);
    auth = { systemSettings: null };
  }
  const { systemSettings } = auth;
  
  return useMemo(() => ({
    emailEnabled: systemSettings?.notification_settings?.email_enabled || true,
    pushEnabled: systemSettings?.notification_settings?.push_enabled || true,
    smsEnabled: systemSettings?.notification_settings?.sms_enabled || false,
    quietHours: systemSettings?.notification_settings?.quiet_hours || {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    defaultTemplates: systemSettings?.notification_settings?.default_templates || {},
  }), [systemSettings])
}

/**
 * Hook for checking if a feature is available for the current user
 */
export const useFeatureAvailability = (featureName: string) => {
  let auth: any;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available in useFeatureAvailability:', error);
    auth = { systemSettings: null, user: null };
  }
  const { systemSettings, user } = auth;
  
  return useMemo(() => {
    if (!systemSettings?.platform_config?.feature_rollout) {
      return true // If no rollout config, feature is available to all
    }
    
    const rollout = systemSettings.platform_config.feature_rollout[featureName]
    if (!rollout) {
      return true // If no specific rollout config, feature is available to all
    }
    
    if (!rollout.enabled) {
      return false // Feature is disabled
    }
    
    // Check if user is in target users list
    if (rollout.target_users && rollout.target_users.length > 0) {
      return user?.id ? rollout.target_users.includes(user.id) : false
    }
    
    // Check rollout percentage (simple hash-based check)
    if (rollout.rollout_percentage < 100) {
      if (!user?.id) return false
      
      // Simple hash-based rollout check
      const hash = user.id.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)
      const percentage = Math.abs(hash) % 100
      
      return percentage < rollout.rollout_percentage
    }
    
    return true
  }, [systemSettings, user])
}
