import { useCallback, useMemo, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { UserPreferences, DEFAULT_USER_PREFERENCES } from '../types/settings'
import { supabase } from '../lib/supabase'

// Debounce delay for preference updates (ms)
const DEBOUNCE_DELAY = 500

// Cache for pending updates to prevent conflicts
const pendingUpdates = new Map<string, NodeJS.Timeout>()

/**
 * Hook for accessing user preferences
 */
export const useUserPreferences = () => {
  const { userPreferences, refreshSettings, user } = useAuth()
  
  return {
    preferences: userPreferences,
    refreshPreferences: refreshSettings,
    isLoading: !userPreferences,
    hasPreferences: !!userPreferences,
  }
}

/**
 * Hook for updating individual user preferences with debouncing
 */
export const useUpdatePreference = () => {
  const { userPreferences, refreshSettings, user } = useAuth()
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const updatePreference = useCallback(async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    if (!user?.id) {
      throw new Error('User not authenticated')
    }
    
    if (!userPreferences) {
      throw new Error('User preferences not loaded')
    }
    
    // Clear any pending update for this key
    const pendingKey = `${user.id}-${key}`
    if (pendingUpdates.has(pendingKey)) {
      clearTimeout(pendingUpdates.get(pendingKey)!)
      pendingUpdates.delete(pendingKey)
    }
    
    // Create debounced update function
    const debouncedUpdate = async () => {
      try {
        // Update database
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            [key]: value,
            updated_at: new Date().toISOString(),
          })
        
        if (error) {
          throw new Error(`Failed to update preference: ${error.message}`)
        }
        
        // Refresh settings to get the latest data
        await refreshSettings()
        
        // Clear from pending updates
        pendingUpdates.delete(pendingKey)
        
        return { success: true }
      } catch (error) {
        console.error('Error updating preference:', error)
        // Refresh settings to revert any optimistic updates
        await refreshSettings()
        throw error
      }
    }
    
    // Set up debounced update
    const timeoutId = setTimeout(debouncedUpdate, DEBOUNCE_DELAY)
    pendingUpdates.set(pendingKey, timeoutId)
    
    // Return promise that resolves when update completes
    return new Promise((resolve, reject) => {
      const checkComplete = () => {
        if (!pendingUpdates.has(pendingKey)) {
          resolve({ success: true })
        } else {
          setTimeout(checkComplete, 100)
        }
      }
      checkComplete()
    })
  }, [user?.id, userPreferences, refreshSettings])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])
  
  return {
    updatePreference,
    isUpdating: pendingUpdates.size > 0,
  }
}

/**
 * Hook for syncing preferences across devices
 */
export const useSyncPreferences = () => {
  const { userPreferences, refreshSettings, user } = useAuth()
  const lastSyncRef = useRef<string>('')
  
  const syncPreferences = useCallback(async () => {
    if (!user?.id) return
    
    try {
      await refreshSettings()
      lastSyncRef.current = new Date().toISOString()
    } catch (error) {
      console.error('Error syncing preferences:', error)
      throw error
    }
  }, [user?.id, refreshSettings])
  
  const getLastSyncTime = useCallback(() => {
    return lastSyncRef.current
  }, [])
  
  return {
    syncPreferences,
    getLastSyncTime,
    lastSyncTime: lastSyncRef.current,
  }
}

/**
 * Hook for notification preferences
 */
export const useNotificationPreferences = () => {
  const { userPreferences } = useAuth()
  const { updatePreference } = useUpdatePreference()
  
  const notificationPrefs = useMemo(() => {
    return userPreferences?.notification_preferences || DEFAULT_USER_PREFERENCES.notification_preferences
  }, [userPreferences?.notification_preferences])
  
  const updateNotificationPreference = useCallback(async (
    path: string,
    value: any
  ) => {
    if (!userPreferences) return
    
    const updatedPrefs = { ...notificationPrefs }
    const keys = path.split('.')
    let current: any = updatedPrefs
    
    // Ensure nested objects exist
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
    
    await updatePreference('notification_preferences', updatedPrefs)
  }, [userPreferences, notificationPrefs, updatePreference])
  
  return {
    notificationPreferences: notificationPrefs,
    updateNotificationPreference,
    emailEnabled: notificationPrefs?.email?.enabled ?? false,
    pushEnabled: notificationPrefs?.push?.enabled ?? false,
    smsEnabled: notificationPrefs?.sms?.enabled ?? false,
    quietHours: notificationPrefs?.quiet_hours,
  }
}

/**
 * Hook for theme preferences
 */
export const useThemePreference = () => {
  const { userPreferences } = useAuth()
  const { updatePreference } = useUpdatePreference()
  
  const currentTheme = useMemo(() => {
    return userPreferences?.theme || DEFAULT_USER_PREFERENCES.theme
  }, [userPreferences?.theme])
  
  const setTheme = useCallback(async (theme: 'light' | 'dark' | 'auto') => {
    await updatePreference('theme', theme)
  }, [updatePreference])
  
  return {
    theme: currentTheme,
    setTheme,
    isDark: currentTheme === 'dark' || (currentTheme === 'auto' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches),
  }
}

/**
 * Hook for UI preferences
 */
export const useUIPreferences = () => {
  const { userPreferences } = useAuth()
  const { updatePreference } = useUpdatePreference()
  
  const uiPrefs = useMemo(() => {
    return userPreferences?.ui_preferences || DEFAULT_USER_PREFERENCES.ui_preferences
  }, [userPreferences?.ui_preferences])
  
  const updateUIPreference = useCallback(async (
    path: string,
    value: any
  ) => {
    if (!userPreferences) return
    
    const updatedPrefs = { ...uiPrefs }
    const keys = path.split('.')
    let current: any = updatedPrefs
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
    
    await updatePreference('ui_preferences', updatedPrefs)
  }, [userPreferences, uiPrefs, updatePreference])
  
  return {
    uiPreferences: uiPrefs,
    updateUIPreference,
    language: uiPrefs.language,
    timezone: uiPrefs.timezone,
    timeFormat: uiPrefs.time_format,
    compactMode: uiPrefs.compact_mode,
    animationsEnabled: uiPrefs.animations_enabled,
  }
}

/**
 * Hook for accessibility settings
 */
export const useAccessibilitySettings = () => {
  const { userPreferences } = useAuth()
  const { updatePreference } = useUpdatePreference()
  
  const accessibilitySettings = useMemo(() => {
    return userPreferences?.accessibility_settings || DEFAULT_USER_PREFERENCES.accessibility_settings
  }, [userPreferences?.accessibility_settings])
  
  const updateAccessibilitySetting = useCallback(async (
    path: string,
    value: any
  ) => {
    if (!userPreferences) return
    
    const updatedSettings = { ...accessibilitySettings }
    const keys = path.split('.')
    let current: any = updatedSettings
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
    
    await updatePreference('accessibility_settings', updatedSettings)
  }, [userPreferences, accessibilitySettings, updatePreference])
  
  return {
    accessibilitySettings,
    updateAccessibilitySetting,
    fontSize: accessibilitySettings.font_size,
    lineSpacing: accessibilitySettings.line_spacing,
    contrastRatio: accessibilitySettings.contrast_ratio,
    reduceMotion: accessibilitySettings.reduce_motion,
    screenReaderOptimized: accessibilitySettings.screen_reader_optimized,
  }
}

/**
 * Hook for privacy settings
 */
export const usePrivacySettings = () => {
  const { userPreferences } = useAuth()
  const { updatePreference } = useUpdatePreference()
  
  const privacySettings = useMemo(() => {
    return userPreferences?.privacy_settings || DEFAULT_USER_PREFERENCES.privacy_settings
  }, [userPreferences?.privacy_settings])
  
  const updatePrivacySetting = useCallback(async (
    path: string,
    value: any
  ) => {
    if (!userPreferences) return
    
    const updatedSettings = { ...privacySettings }
    const keys = path.split('.')
    let current: any = updatedSettings
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
    
    await updatePreference('privacy_settings', updatedSettings)
  }, [userPreferences, privacySettings, updatePreference])
  
  return {
    privacySettings,
    updatePrivacySetting,
    dataSharing: privacySettings.data_sharing,
    visibility: privacySettings.visibility,
    dataRetention: privacySettings.data_retention,
  }
}

/**
 * Hook for dashboard layout management
 */
export const useDashboardLayout = () => {
  const { userPreferences } = useAuth()
  const { updatePreference } = useUpdatePreference()
  
  const dashboardLayout = useMemo(() => {
    return userPreferences?.dashboard_layout || DEFAULT_USER_PREFERENCES.dashboard_layout
  }, [userPreferences?.dashboard_layout])
  
  const updateDashboardLayout = useCallback(async (newLayout: any) => {
    await updatePreference('dashboard_layout', {
      ...newLayout,
      last_modified: new Date().toISOString(),
    })
  }, [updatePreference])
  
  const updateWidget = useCallback(async (widgetId: string, widgetData: any) => {
    const updatedLayout = {
      ...dashboardLayout,
      widgets: {
        ...dashboardLayout.widgets,
        [widgetId]: widgetData,
      },
      last_modified: new Date().toISOString(),
    }
    
    await updatePreference('dashboard_layout', updatedLayout)
  }, [dashboardLayout, updatePreference])
  
  const removeWidget = useCallback(async (widgetId: string) => {
    const updatedWidgets = { ...dashboardLayout.widgets }
    delete updatedWidgets[widgetId]
    
    const updatedLayout = {
      ...dashboardLayout,
      widgets: updatedWidgets,
      last_modified: new Date().toISOString(),
    }
    
    await updatePreference('dashboard_layout', updatedLayout)
  }, [dashboardLayout, updatePreference])
  
  return {
    dashboardLayout,
    updateDashboardLayout,
    updateWidget,
    removeWidget,
    widgets: dashboardLayout.widgets,
    layoutVersion: dashboardLayout.layout_version,
    lastModified: dashboardLayout.last_modified,
  }
}
