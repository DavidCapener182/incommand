'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
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
    logger.error('Error reading cached role', error, { component: 'AuthContext', action: 'getCachedRole' });
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
    logger.error('Error caching role', error, { component: 'AuthContext', action: 'setCachedRole' });
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
    logger.error('Error clearing cached role', error, { component: 'AuthContext', action: 'clearCachedRole' });
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

  const loadSystemSettings = useCallback(async () => {
    try {
      // Get system settings - removed problematic singleton query
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        logger.error('Failed to load system settings', error, { component: 'AuthContext', action: 'loadSystemSettings' });
        // Use default settings as fallback
        setSystemSettings({
          id: 'default',
          ...DEFAULT_SYSTEM_SETTINGS,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        return
      }

      if (!data) {
        // No settings row yet; set defaults in memory (optionally create it later)
        setSystemSettings({
          id: 'default',
          ...DEFAULT_SYSTEM_SETTINGS,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      } else {
        setSystemSettings({
          id: 'current',
          maintenance_mode: (data as any)?.maintenance_mode || false,
          maintenance_message: (data as any)?.maintenance_message || DEFAULT_SYSTEM_SETTINGS.maintenance_message,
          feature_flags: (data as any)?.feature_flags || DEFAULT_SYSTEM_SETTINGS.feature_flags,
          default_user_role: (data as any)?.default_user_role || DEFAULT_SYSTEM_SETTINGS.default_user_role,
          notification_settings: (data as any)?.notification_settings || DEFAULT_SYSTEM_SETTINGS.notification_settings,
          platform_config: (data as any)?.platform_config || DEFAULT_SYSTEM_SETTINGS.platform_config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    } catch (error) {
      logger.error('Error loading system settings', error, { component: 'AuthContext', action: 'loadSystemSettings' });
      // Use default settings as fallback
      setSystemSettings({
        id: 'default',
        ...DEFAULT_SYSTEM_SETTINGS,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
  }, [])

  const loadUserPreferences = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        logger.error('Failed to load user preferences', error, { component: 'AuthContext', action: 'loadUserPreferences', userId });
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
        theme: (data as any)?.theme || DEFAULT_USER_PREFERENCES.theme,
        dashboard_layout: (data as any)?.dashboard_layout || DEFAULT_USER_PREFERENCES.dashboard_layout,
        notification_preferences: (data as any)?.notification_preferences || DEFAULT_USER_PREFERENCES.notification_preferences,
        ui_preferences: (data as any)?.ui_preferences || DEFAULT_USER_PREFERENCES.ui_preferences,
        accessibility_settings: (data as any)?.accessibility_settings || DEFAULT_USER_PREFERENCES.accessibility_settings,
        privacy_settings: (data as any)?.privacy_settings || DEFAULT_USER_PREFERENCES.privacy_settings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } catch (error) {
      logger.error('Error loading user preferences', error, { component: 'AuthContext', action: 'loadUserPreferences', userId });
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
  }, [])

  const refreshSettings = useCallback(async () => {
    await loadSystemSettings()
    if (user?.id) {
      await loadUserPreferences(user.id)
    }
  }, [loadSystemSettings, loadUserPreferences, user?.id])

  const fetchUserRole = useCallback(async (userId: string) => {
    const maxRetries = 3
    let retryCount = 0
    
    const attemptFetch = async (): Promise<UserRole | null> => {
      try {
        // Check cache first
        const cachedRole = getCachedRole(userId)
        if (cachedRole) {
          logger.debug('Using cached role', { component: 'AuthContext', action: 'fetchUserRole', userId, role: cachedRole });
          return cachedRole
        }

        logger.debug('Fetching role for user', { component: 'AuthContext', action: 'fetchUserRole', userId });
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()

        if (error) {
          logger.error('Error fetching user role', error, { component: 'AuthContext', action: 'fetchUserRole', userId });
          
          // Handle specific error types
          if (error.code === 'PGRST116') {
            // No rows returned - user profile doesn't exist
            logger.warn('User profile not found, using default role', { component: 'AuthContext', action: 'fetchUserRole', userId });
            return 'user' as UserRole // Default fallback role
          }
          
          if (error.code === 'PGRST301') {
            // Multiple rows returned - data inconsistency
            logger.error('Data inconsistency: multiple profiles found for user', { component: 'AuthContext', action: 'fetchUserRole', userId });
            throw new Error('Data inconsistency detected')
          }
          
          // Network or database errors
          throw error
        }
        
        const userRole = data?.role as UserRole | null
        logger.debug('Role fetched successfully', { component: 'AuthContext', action: 'fetchUserRole', userId, role: userRole });
        
        // Cache the role if it exists
        if (userRole) {
          setCachedRole(userId, userRole)
        }
        
        return userRole
      } catch (error) {
        logger.error(`Error fetching user role (attempt ${retryCount + 1})`, error, { component: 'AuthContext', action: 'fetchUserRole', userId, attempt: retryCount + 1 });
        
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
        logger.debug('Setting role in state', { component: 'AuthContext', action: 'fetchUserRole', userId, role });
        setRole(role)
        return
      } catch (error) {
        retryCount++
        
        if (retryCount >= maxRetries) {
          logger.error(`Failed to fetch user role after ${maxRetries} attempts`, error, { component: 'AuthContext', action: 'fetchUserRole', userId, attempts: maxRetries });
          
          // Final fallback strategy
          if (error instanceof Error) {
            if (error.message.includes('network') || error.message.includes('timeout')) {
              logger.warn('Network error detected, using default role', { component: 'AuthContext', action: 'fetchUserRole', userId });
              setRole('user' as UserRole)
              return
            }
          }
          
          // Set default role and continue
          logger.warn('Using default role due to persistent errors', { component: 'AuthContext', action: 'fetchUserRole', userId });
          setRole('user' as UserRole)
          return
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      }
    }
  }, [])

  useEffect(() => {
    let logoutTimeout: NodeJS.Timeout | null = null;
    let stayLoggedInTimeout: NodeJS.Timeout | null = null;

    // Check active sessions and sets the user
    const getInitialSession = async () => {
      let session: Session | null = null;
      try {
        console.log('[AuthContext] Starting initial session fetch...');
        // Get session with hard timeout protection to avoid infinite loading
        // Increased timeout to 15 seconds to give more time for network issues
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<any>((resolve) =>
            setTimeout(() => {
              console.warn('[AuthContext] Session fetch timed out after 15s, proceeding without session. onAuthStateChange will handle auth updates.');
              resolve({ data: { session: null }, error: { message: 'Session fetch timeout' } })
            }, 15000)
          )
        ])
        session = result?.data?.session || null
        
        console.log('[AuthContext] Initial session fetch result', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          error: result?.error?.message
        });
        
        if (session?.user) {
          console.log('[AuthContext] Setting user from initial session', {
            userId: session.user.id,
            email: session.user.email
          });
          setUser(session.user)
          // Use Promise.allSettled to ensure all complete even if one fails
          await Promise.allSettled([
            fetchUserRole(session.user.id).catch(err => {
              console.error('Error fetching user role:', err)
              setRole('user' as UserRole) // Fallback
            }),
            loadSystemSettings().catch(err => {
              console.error('Error loading system settings:', err)
            }),
            loadUserPreferences(session.user.id).catch(err => {
              console.error('Error loading user preferences:', err)
            })
          ])
        } else {
          console.log('[AuthContext] No session found initially, waiting for onAuthStateChange');
          await loadSystemSettings().catch(err => {
            console.error('Error loading system settings:', err)
          })
        }
      } catch (error) {
        console.error('[AuthContext] Error in getInitialSession:', error)
        // Always set loading to false even on error
      } finally {
        console.log('[AuthContext] Setting loading to false');
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
    }

    getInitialSession()

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[AuthContext] Auth state changed', {
        event: _event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        email: session?.user?.email
      });
      
      if (session?.user) {
        console.log('[AuthContext] Setting user from auth state change', {
          userId: session.user.id,
          email: session.user.email
        });
        setUser(session.user)
        await Promise.all([
          fetchUserRole(session.user.id),
          loadUserPreferences(session.user.id)
        ])
      } else {
        console.log('[AuthContext] No session in auth state change, clearing user');
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
  }, [fetchUserRole, loadSystemSettings, loadUserPreferences, user?.id])

  // Temporarily disable route protection
  /*
  useEffect(() => {
    if (!loading) {
      if (!user and pathname !== '/login') {
        router.push('/login')
      } else if (user and pathname === '/login') {
        router.push('/incidents')
      }
    }
  }, [user, loading, pathname, router])
  */

  const invalidateRoleCache = () => {
    if (user?.id) {
      clearCachedRole(user.id)
      logger.debug('Role cache invalidated for user', { component: 'AuthContext', action: 'invalidateRoleCache', userId: user.id });
    }
  }

  const signOut = async () => {
    try {
      // Clear cached role before signing out
      if (user?.id) {
        clearCachedRole(user.id)
      }
      await supabase.auth.signOut()
      // Use window.location.href for immediate redirect to avoid route protection conflicts
      window.location.href = '/login'
    } catch (error) {
      logger.error('Error during sign out', error, { component: 'AuthContext', action: 'signOut' });
      // Fallback: redirect to login even if signOut fails
      window.location.href = '/login'
    }
  }

  const handleStayLoggedIn = () => {
    setShowStayLoggedIn(false);
    window.location.reload(); // Refresh session
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut, invalidateRoleCache, systemSettings, userPreferences, refreshSettings }}>
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
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  try {
    const context = useContext(AuthContext)
    if (context === undefined) {
      logger.warn('useAuth called outside of AuthProvider', { component: 'AuthContext', action: 'useAuth' });
      // Return a safe fallback instead of throwing
      return {
        user: null,
        role: null,
        loading: true,
        signOut: async () => {
          logger.warn('signOut called but AuthContext not available', { component: 'AuthContext', action: 'useAuth' });
          window.location.href = '/login'
        },
        invalidateRoleCache: () => {
          logger.warn('invalidateRoleCache called but AuthContext not available', { component: 'AuthContext', action: 'useAuth' });
        },
        systemSettings: null,
        userPreferences: null,
        refreshSettings: async () => {
          logger.warn('refreshSettings called but AuthContext not available', { component: 'AuthContext', action: 'useAuth' });
        },
      }
    }
    return context
  } catch (error) {
    logger.error('Error in useAuth', error, { component: 'AuthContext', action: 'useAuth' });
    // Return a safe fallback
    return {
      user: null,
      role: null,
      loading: true,
      signOut: async () => {
        logger.warn('signOut called but AuthContext not available', { component: 'AuthContext', action: 'useAuth' });
        window.location.href = '/login'
      },
      invalidateRoleCache: () => {
        logger.warn('invalidateRoleCache called but AuthContext not available', { component: 'AuthContext', action: 'useAuth' });
      },
      systemSettings: null,
      userPreferences: null,
      refreshSettings: async () => {
        logger.warn('refreshSettings called but AuthContext not available', { component: 'AuthContext', action: 'useAuth' });
      },
    }
  }
} 
