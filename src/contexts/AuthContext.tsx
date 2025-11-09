// @ts-nocheck
'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import { useRouter, usePathname } from 'next/navigation'
import { AuthContextType, UserRole } from '../types/auth'
import { SystemSettings, UserPreferences, DEFAULT_USER_PREFERENCES, DEFAULT_SYSTEM_SETTINGS } from '../types/settings'
import type { Database } from '@/types/supabase'

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

const SESSION_TIMEOUT_MS = 16 * 60 * 60 * 1000
const SESSION_TIMEOUT_WARNING_OFFSET_MS = 30 * 60 * 1000
const SESSION_TIMEOUT_REASON = 'session-timeout'
const SESSION_START_STORAGE_PREFIX = 'incommand_session_start_'

const getSessionStartKey = (userId: string) => `${SESSION_START_STORAGE_PREFIX}${userId}`

const readSessionStartTimestamp = (userId: string): number | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null
    }

    const raw = window.localStorage.getItem(getSessionStartKey(userId))
    if (!raw) return null

    const value = Number(raw)
    return Number.isFinite(value) ? value : null
  } catch (error) {
    logger.error('Error reading session start timestamp', error, { component: 'AuthContext', action: 'readSessionStartTimestamp' });
    return null
  }
}

const writeSessionStartTimestamp = (userId: string, timestamp: number): void => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    window.localStorage.setItem(getSessionStartKey(userId), String(timestamp))
  } catch (error) {
    logger.error('Error writing session start timestamp', error, { component: 'AuthContext', action: 'writeSessionStartTimestamp' });
  }
}

const clearSessionStartTimestamp = (userId: string): void => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    window.localStorage.removeItem(getSessionStartKey(userId))
  } catch (error) {
    logger.error('Error clearing session start timestamp', error, { component: 'AuthContext', action: 'clearSessionStartTimestamp' });
  }
}

const getSessionStartFromUser = (session: Session): number => {
  const userId = session?.user?.id
  if (!userId) {
    return Date.now()
  }

  const stored = readSessionStartTimestamp(userId)
  if (stored !== null) {
    return stored
  }

  const lastSignIn = session?.user?.last_sign_in_at ? Date.parse(session.user.last_sign_in_at) : NaN
  const fallback = Number.isFinite(lastSignIn) ? lastSignIn : Date.now()

  writeSessionStartTimestamp(userId, fallback)
  return fallback
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
  const [showSessionTimeoutWarning, setShowSessionTimeoutWarning] = useState(false)
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const hasForcedLogoutRef = useRef(false)

  const loadSystemSettings = useCallback(async () => {
    try {
      // Get system settings - removed problematic singleton query
      const { data, error } = await supabase
        .from<any, any>('system_settings')
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
        .from<Database['public']['Tables']['user_preferences']['Row'], Database['public']['Tables']['user_preferences']['Update']>('user_preferences')
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
          .from<Database['public']['Tables']['profiles']['Row'], Database['public']['Tables']['profiles']['Update']>('profiles')
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

  // Define signOut before useEffect that uses it
  const signOut = useCallback(async (options?: { reason?: string, redirectTo?: string }) => {
    try {
      setShowSessionTimeoutWarning(false)
      // Clear cached role before signing out
      if (user?.id) {
        clearCachedRole(user.id)
        clearSessionStartTimestamp(user.id)
      }
      const redirectTarget = options?.redirectTo || (options?.reason ? `/login?reason=${options.reason}` : '/login')
      await supabase.auth.signOut()
      // Use window.location.href for immediate redirect to avoid route protection conflicts
      window.location.href = redirectTarget
    } catch (error) {
      logger.error('Error during sign out', error, { component: 'AuthContext', action: 'signOut' });
      // Fallback: redirect to login even if signOut fails
      const fallbackTarget = options?.redirectTo || (options?.reason ? `/login?reason=${options.reason}` : '/login')
      window.location.href = fallbackTarget
    }
  }, [user?.id])

  const forceLogoutDueToTimeout = useCallback(async () => {
    if (hasForcedLogoutRef.current) {
      return
    }
    hasForcedLogoutRef.current = true
    try {
      logger.info('Session timeout reached, signing user out', {
        component: 'AuthContext',
        action: 'forceLogoutDueToTimeout',
        userId: user?.id
      });
      await signOut({ reason: SESSION_TIMEOUT_REASON })
    } catch (error) {
      logger.error('Error forcing logout after session timeout', error, {
        component: 'AuthContext',
        action: 'forceLogoutDueToTimeout'
      });
      window.location.href = `/login?reason=${SESSION_TIMEOUT_REASON}`
    }
  }, [signOut, user?.id])

  useEffect(() => {
    let logoutTimeout: NodeJS.Timeout | null = null;
    let warningTimeout: NodeJS.Timeout | null = null;

    const clearSessionTimers = () => {
      if (logoutTimeout) {
        clearTimeout(logoutTimeout);
        logoutTimeout = null;
      }
      if (warningTimeout) {
        clearTimeout(warningTimeout);
        warningTimeout = null;
      }
    }

    const scheduleSessionTimers = (activeSession: Session) => {
      if (!activeSession?.user?.id) {
        return
      }

      clearSessionTimers()
      setShowSessionTimeoutWarning(false)
      hasForcedLogoutRef.current = false

      const sessionStart = getSessionStartFromUser(activeSession)
      const now = Date.now()
      const elapsed = now - sessionStart

      if (elapsed >= SESSION_TIMEOUT_MS) {
        clearSessionTimers()
        forceLogoutDueToTimeout().catch(error => {
          logger.error('Failed to force logout after detecting expired session during scheduling', error, {
            component: 'AuthContext',
            action: 'scheduleSessionTimers'
          });
        })
        return
      }

      const warningDelay = Math.max(SESSION_TIMEOUT_MS - SESSION_TIMEOUT_WARNING_OFFSET_MS - elapsed, 0)
      const logoutDelay = Math.max(SESSION_TIMEOUT_MS - elapsed, 0)

      if (warningDelay <= 0) {
        setShowSessionTimeoutWarning(true)
      } else {
        warningTimeout = setTimeout(() => {
          setShowSessionTimeoutWarning(true)
        }, warningDelay)
      }

      logoutTimeout = setTimeout(() => {
        clearSessionTimers()
        forceLogoutDueToTimeout().catch(error => {
          logger.error('Failed to force logout on session timeout', error, {
            component: 'AuthContext',
            action: 'logoutTimeout'
          });
        })
      }, logoutDelay)
    }

    // Check active sessions and sets the user
    const getInitialSession = async () => {
      let session: Session | null = null;
      try {
        console.log('[AuthContext] Starting initial session fetch...');
        const { data: { session: fetchedSession }, error } = await supabase.auth.getSession();
        session = fetchedSession;
        
        console.log('[AuthContext] Initial session fetch result', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          email: session?.user?.email,
          error: error?.message
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
          // Don't wait for system settings - load them in background
          loadSystemSettings().catch(err => {
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
          scheduleSessionTimers(session)
        } else {
          clearSessionTimers()
          setShowSessionTimeoutWarning(false)
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
        // Use Promise.allSettled to ensure all complete even if one fails
        await Promise.allSettled([
          fetchUserRole(session.user.id).catch(err => {
            console.error('[AuthContext] Error fetching user role:', err)
            setRole('user' as UserRole) // Fallback
          }),
          loadUserPreferences(session.user.id).catch(err => {
            console.error('[AuthContext] Error loading user preferences:', err)
          })
        ])
        scheduleSessionTimers(session)
      } else {
        console.log('[AuthContext] No session in auth state change, clearing user');
        clearSessionTimers()
        setShowSessionTimeoutWarning(false)
        setUser(null)
        setRole(null)
        setUserPreferences(null)
        hasForcedLogoutRef.current = false
        // Clear cached role when user logs out
        if (user?.id) {
          clearCachedRole(user.id)
          clearSessionStartTimestamp(user.id)
        }
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe();
      clearSessionTimers()
      hasForcedLogoutRef.current = false
    }
  }, [fetchUserRole, loadSystemSettings, loadUserPreferences, forceLogoutDueToTimeout, user?.id])

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

  const handleSessionTimeoutAcknowledge = () => {
    forceLogoutDueToTimeout().catch(error => {
      logger.error('Failed to handle session timeout acknowledgement', error, {
        component: 'AuthContext',
        action: 'handleSessionTimeoutAcknowledge'
      })
      window.location.href = `/login?reason=${SESSION_TIMEOUT_REASON}`
    })
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut, invalidateRoleCache, systemSettings, userPreferences, refreshSettings }}>
      <>
        {showSessionTimeoutWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg flex flex-col items-center max-w-sm text-center space-y-4">
              <p className="text-lg font-semibold">Session expiring soon</p>
              <p className="text-sm text-gray-700">
                For security, you&apos;ll be signed out after 16 hours of activity. Please save your work and sign in again to continue.
              </p>
              <button
                className="px-4 py-2 bg-[#2A3990] text-white rounded hover:bg-[#1e2a6a]"
                onClick={handleSessionTimeoutAcknowledge}
              >
                Sign in again
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
        signOut: async (options?: { reason?: string, redirectTo?: string }) => {
          logger.warn('signOut called but AuthContext not available', { component: 'AuthContext', action: 'useAuth' });
          const target = options?.redirectTo || (options?.reason ? `/login?reason=${options.reason}` : '/login')
          window.location.href = target
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
      signOut: async (options?: { reason?: string, redirectTo?: string }) => {
        logger.warn('signOut called but AuthContext not available', { component: 'AuthContext', action: 'useAuth' });
        const target = options?.redirectTo || (options?.reason ? `/login?reason=${options.reason}` : '/login')
        window.location.href = target
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
