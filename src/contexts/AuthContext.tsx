'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { AuthContextType, UserRole } from '../types/auth'
import { SystemSettings, UserPreferences, DEFAULT_USER_PREFERENCES, DEFAULT_SYSTEM_SETTINGS } from '../types/settings'

// Role cache interface
interface RoleCache {
  role: UserRole
  timestamp: number
  userId: string
}

// Cache TTL in milliseconds (5 minutes)
const ROLE_CACHE_TTL = 5 * 60 * 1000

// Cache key for session storage
const getRoleCacheKey = (userId: string) => `user_role_${userId}`

// Helper functions for role caching
const getCachedRole = (userId: string): UserRole | null => {
  try {
    // Check if sessionStorage is available (SSR safety)
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return null
    }
    
    const cached = sessionStorage.getItem(getRoleCacheKey(userId))
    if (!cached) return null
    
    const cache: RoleCache = JSON.parse(cached)
    const now = Date.now()
    
    // Check if cache is still valid
    if (now - cache.timestamp < ROLE_CACHE_TTL && cache.userId === userId) {
      return cache.role
    }
    
    // Cache expired, remove it
    sessionStorage.removeItem(getRoleCacheKey(userId))
    return null
  } catch (error) {
    console.error('Error reading cached role:', error)
    return null
  }
}

const setCachedRole = (userId: string, role: UserRole): void => {
  try {
    // Check if sessionStorage is available (SSR safety)
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return
    }
    
    const cache: RoleCache = {
      role,
      timestamp: Date.now(),
      userId
    }
    sessionStorage.setItem(getRoleCacheKey(userId), JSON.stringify(cache))
  } catch (error) {
    console.error('Error caching role:', error)
  }
}

const clearCachedRole = (userId: string): void => {
  try {
    // Check if sessionStorage is available (SSR safety)
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return
    }
    
    sessionStorage.removeItem(getRoleCacheKey(userId))
  } catch (error) {
    console.error('Error clearing cached role:', error)
  }
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
  invalidateRoleCache: () => {},
  systemSettings: null,
  userPreferences: null,
  refreshSettings: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [showStayLoggedIn, setShowStayLoggedIn] = useState(false)
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const loadSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_system_settings')
        .single()

      if (error) {
        console.error('Error loading system settings:', error)
        // Use default settings as fallback
        setSystemSettings({
          id: 'default',
          ...DEFAULT_SYSTEM_SETTINGS,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        return
      }

      setSystemSettings({
        id: 'current',
        maintenance_mode: data.maintenance_mode || false,
        maintenance_message: data.maintenance_message || DEFAULT_SYSTEM_SETTINGS.maintenance_message,
        feature_flags: data.feature_flags || DEFAULT_SYSTEM_SETTINGS.feature_flags,
        default_user_role: data.default_user_role || DEFAULT_SYSTEM_SETTINGS.default_user_role,
        notification_settings: data.notification_settings || DEFAULT_SYSTEM_SETTINGS.notification_settings,
        platform_config: data.platform_config || DEFAULT_SYSTEM_SETTINGS.platform_config,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error loading system settings:', error)
      // Use default settings as fallback
      setSystemSettings({
        id: 'default',
        ...DEFAULT_SYSTEM_SETTINGS,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
  }

  const loadUserPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_preferences', { user_uuid: userId })
        .single()

      if (error) {
        console.error('Error loading user preferences:', error)
        // Create default preferences for user
        const defaultPrefs: UserPreferences = {
          id: 'default',
          user_id: userId,
          ...DEFAULT_USER_PREFERENCES,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setUserPreferences(defaultPrefs)
        return
      }

      setUserPreferences({
        id: 'current',
        user_id: userId,
        theme: data.theme || DEFAULT_USER_PREFERENCES.theme,
        dashboard_layout: data.dashboard_layout || DEFAULT_USER_PREFERENCES.dashboard_layout,
        notification_preferences: data.notification_preferences || DEFAULT_USER_PREFERENCES.notification_preferences,
        ui_preferences: data.ui_preferences || DEFAULT_USER_PREFERENCES.ui_preferences,
        accessibility_settings: data.accessibility_settings || DEFAULT_USER_PREFERENCES.accessibility_settings,
        privacy_settings: data.privacy_settings || DEFAULT_USER_PREFERENCES.privacy_settings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error loading user preferences:', error)
      // Use default preferences as fallback
      const defaultPrefs: UserPreferences = {
        id: 'default',
        user_id: userId,
        ...DEFAULT_USER_PREFERENCES,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setUserPreferences(defaultPrefs)
    }
  }

  const refreshSettings = async () => {
    await loadSystemSettings()
    if (user?.id) {
      await loadUserPreferences(user.id)
    }
  }

  const fetchUserRole = async (userId: string) => {
    const maxRetries = 3
    let retryCount = 0
    
    const attemptFetch = async (): Promise<UserRole | null> => {
      try {
        // Check cache first
        const cachedRole = getCachedRole(userId)
        if (cachedRole) {
          console.log('AuthContext - Using cached role:', cachedRole)
          return cachedRole
        }

        console.log('AuthContext - Fetching role for user:', userId)
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()

        console.log('AuthContext - Role data:', data)
        console.log('AuthContext - Role error:', error)

        if (error) {
          console.error('Error fetching user role:', error)
          
          // Handle specific error types
          if (error.code === 'PGRST116') {
            // No rows returned - user profile doesn't exist
            console.warn('User profile not found, creating default role')
            return 'user' as UserRole // Default fallback role
          }
          
          if (error.code === 'PGRST301') {
            // Multiple rows returned - data inconsistency
            console.error('Data inconsistency: multiple profiles found for user')
            throw new Error('Data inconsistency detected')
          }
          
          // Network or database errors
          throw error
        }
        
        const userRole = data?.role as UserRole | null
        console.log('AuthContext - Setting role to:', userRole)
        console.log('AuthContext - User ID:', userId)
        console.log('AuthContext - Raw data:', data)
        
        // Cache the role if it exists
        if (userRole) {
          setCachedRole(userId, userRole)
        }
        
        return userRole
      } catch (error) {
        console.error(`Error fetching user role (attempt ${retryCount + 1}):`, error)
        
        // Don't retry for certain error types
        if (error instanceof Error) {
          if (error.message === 'Data inconsistency detected') {
            throw error // Don't retry data inconsistency errors
          }
        }
        
        throw error
      }
    }
    
    while (retryCount < maxRetries) {
      try {
        const role = await attemptFetch()
        console.log('AuthContext - Setting role in state:', role)
        setRole(role)
        return
      } catch (error) {
        retryCount++
        
        if (retryCount >= maxRetries) {
          console.error(`Failed to fetch user role after ${maxRetries} attempts:`, error)
          
          // Final fallback strategy
          if (error instanceof Error) {
            if (error.message.includes('network') || error.message.includes('timeout')) {
              console.warn('Network error detected, using cached role if available')
              const cachedRole = getCachedRole(userId)
              if (cachedRole) {
                setRole(cachedRole)
                return
              }
            }
          }
          
          // Set a default role as last resort
          console.warn('Using default role as fallback')
          setRole('user' as UserRole)
          
          // Show user-facing error message (could be implemented with a toast notification)
          // For now, we'll just log it
          console.error('Role fetch failed. Please refresh the page or contact support if the issue persists.')
        } else {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000)
          console.log(`Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
  }

  useEffect(() => {
    let logoutTimeout: NodeJS.Timeout | null = null;
    let stayLoggedInTimeout: NodeJS.Timeout | null = null;

    // Check active sessions and sets the user
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await Promise.all([
          fetchUserRole(session.user.id),
          loadSystemSettings(),
          loadUserPreferences(session.user.id)
        ])
      } else {
        await loadSystemSettings()
      }
      setLoading(false)

      if (session) {
        // Supabase session.expires_at is UNIX timestamp (seconds)
        const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + 12 * 60 * 60 * 1000;
        const sessionStart = expiresAt - 12 * 60 * 60 * 1000;
        const now = Date.now();
        const ms12Hours = 12 * 60 * 60 * 1000;
        const ms11_5Hours = 11.5 * 60 * 60 * 1000;
        const timeElapsed = now - sessionStart;
        const timeToPrompt = ms11_5Hours - timeElapsed > 0 ? ms11_5Hours - timeElapsed : 0;
        const timeToLogout = ms12Hours - timeElapsed > 0 ? ms12Hours - timeElapsed : 0;

        if (timeToPrompt > 0) {
          stayLoggedInTimeout = setTimeout(() => setShowStayLoggedIn(true), timeToPrompt);
        }
        if (timeToLogout > 0) {
          logoutTimeout = setTimeout(() => signOut(), timeToLogout);
        }
      }
    }

    getInitialSession()

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        await Promise.all([
          fetchUserRole(session.user.id),
          loadUserPreferences(session.user.id)
        ])
      } else {
        setUser(null)
        setRole(null)
        setUserPreferences(null)
        // Clear cached role when user logs out
        if (user?.id) {
          clearCachedRole(user.id)
        }
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe();
      if (logoutTimeout) clearTimeout(logoutTimeout);
      if (stayLoggedInTimeout) clearTimeout(stayLoggedInTimeout);
    }
  }, [])

  // Temporarily disable route protection
  /*
  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login') {
        router.push('/login')
      } else if (user && pathname === '/login') {
        router.push('/incidents')
      }
    }
  }, [user, loading, pathname, router])
  */

  const invalidateRoleCache = () => {
    if (user?.id) {
      clearCachedRole(user.id)
      console.log('AuthContext - Role cache invalidated for user:', user.id)
    }
  }

  const signOut = async () => {
    try {
      // Clear cached role before signing out
      if (user?.id) {
        clearCachedRole(user.id)
      }
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error during sign out:', error)
      // Fallback: redirect to login even if signOut fails
      router.push('/login')
    }
  }

  const handleStayLoggedIn = () => {
    setShowStayLoggedIn(false);
    window.location.reload(); // Refresh session
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut, invalidateRoleCache, systemSettings, userPreferences, refreshSettings }}>
      {!loading && (
        <>
          {showStayLoggedIn && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg flex flex-col items-center">
                <p className="mb-4 text-lg font-semibold">Stay logged in?</p>
                <button
                  className="px-4 py-2 bg-[#2A3990] text-white rounded hover:bg-[#1e2a6a]"
                  onClick={handleStayLoggedIn}
                >
                  Yes, stay logged in
                </button>
              </div>
            </div>
          )}
          {children}
        </>
      )}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  try {
    const context = useContext(AuthContext)
    if (context === undefined) {
      console.error('useAuth called outside of AuthProvider')
      // Return a safe fallback instead of throwing
      return {
        user: null,
        role: null,
        loading: true,
        signOut: async () => {
          console.warn('signOut called but AuthContext not available')
          window.location.href = '/login'
        },
        invalidateRoleCache: () => {
          console.warn('invalidateRoleCache called but AuthContext not available')
        },
        systemSettings: null,
        userPreferences: null,
        refreshSettings: async () => {
          console.warn('refreshSettings called but AuthContext not available')
        },
      }
    }
    return context
  } catch (error) {
    console.error('Error in useAuth:', error)
    // Return a safe fallback
    return {
      user: null,
      role: null,
      loading: true,
      signOut: async () => {
        console.warn('signOut called but AuthContext not available')
        window.location.href = '/login'
      },
      invalidateRoleCache: () => {
        console.warn('invalidateRoleCache called but AuthContext not available')
      },
      systemSettings: null,
      userPreferences: null,
      refreshSettings: async () => {
        console.warn('refreshSettings called but AuthContext not available')
      },
    }
  }
} 