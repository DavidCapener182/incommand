import { supabase } from './supabase'
import { UserPreferences, SystemSettings } from '../types/settings'

// Conflict resolution strategies
export type ConflictResolutionStrategy = 'last-write-wins' | 'merge' | 'user-choice'

// Sync status types
export interface SyncStatus {
  isSyncing: boolean
  lastSyncTime: string | null
  conflicts: SettingsConflict[]
  errors: string[]
}

// Settings conflict interface
export interface SettingsConflict {
  key: string
  localValue: any
  remoteValue: any
  timestamp: string
  resolved: boolean
  resolution?: 'local' | 'remote' | 'merged'
}

// Settings change event
export interface SettingsChangeEvent {
  userId: string
  tableName: string
  recordId: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  timestamp: string
}

// Debounce delay for sync operations
const SYNC_DEBOUNCE_DELAY = 1000

// Cache for pending sync operations
const pendingSyncs = new Map<string, NodeJS.Timeout>()

/**
 * Detect conflicts between local and remote settings
 */
export async function detectConflicts(
  userId: string,
  localPreferences: UserPreferences,
  remotePreferences: UserPreferences
): Promise<SettingsConflict[]> {
  const conflicts: SettingsConflict[] = []
  
  // Compare key preference fields
  const fieldsToCompare = [
    'theme',
    'notification_preferences',
    'ui_preferences',
    'accessibility_settings',
    'privacy_settings'
  ]
  
  for (const field of fieldsToCompare) {
    const localValue = localPreferences[field as keyof UserPreferences]
    const remoteValue = remotePreferences[field as keyof UserPreferences]
    
    if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
      conflicts.push({
        key: field,
        localValue,
        remoteValue,
        timestamp: new Date().toISOString(),
        resolved: false
      })
    }
  }
  
  return conflicts
}

/**
 * Resolve conflicts using specified strategy
 */
export function resolveConflicts(
  conflicts: SettingsConflict[],
  strategy: ConflictResolutionStrategy,
  userChoices?: Record<string, 'local' | 'remote' | 'merged'>
): { resolvedPreferences: Partial<UserPreferences>; resolvedConflicts: SettingsConflict[] } {
  const resolvedPreferences: Partial<UserPreferences> = {}
  const resolvedConflicts = conflicts.map(conflict => ({ ...conflict }))
  
  for (const conflict of resolvedConflicts) {
    let resolution: 'local' | 'remote' | 'merged'
    
    switch (strategy) {
      case 'last-write-wins':
        // Use the most recent value based on timestamp
        resolution = new Date(conflict.timestamp) > new Date(conflict.remoteValue?.updated_at || 0) 
          ? 'local' 
          : 'remote'
        break
        
      case 'merge':
        // Merge the values intelligently
        resolution = 'merged'
        break
        
      case 'user-choice':
        // Use user's explicit choice
        resolution = userChoices?.[conflict.key] || 'local'
        break
        
      default:
        resolution = 'local'
    }
    
    conflict.resolved = true
    conflict.resolution = resolution
    
    // Apply the resolution
    switch (resolution) {
      case 'local':
        resolvedPreferences[conflict.key as keyof UserPreferences] = conflict.localValue
        break
        
      case 'remote':
        resolvedPreferences[conflict.key as keyof UserPreferences] = conflict.remoteValue
        break
        
      case 'merged':
        resolvedPreferences[conflict.key as keyof UserPreferences] = mergeValues(
          conflict.localValue,
          conflict.remoteValue
        )
        break
    }
  }
  
  return { resolvedPreferences, resolvedConflicts }
}

/**
 * Merge two values intelligently
 */
function mergeValues(localValue: any, remoteValue: any): any {
  if (typeof localValue !== typeof remoteValue) {
    return remoteValue // Use remote if types don't match
  }
  
  if (typeof localValue === 'object' && localValue !== null && remoteValue !== null) {
    if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
      // Merge arrays by combining unique items
      return Array.from(new Set([...localValue, ...remoteValue]))
    } else {
      // Merge objects by combining properties
      return { ...localValue, ...remoteValue }
    }
  }
  
  // For primitive values, use remote value
  return remoteValue
}

/**
 * Sync settings with debouncing
 */
export async function syncSettings(
  userId: string,
  preferences: Partial<UserPreferences>,
  strategy: ConflictResolutionStrategy = 'last-write-wins'
): Promise<{ success: boolean; conflicts: SettingsConflict[]; error?: string }> {
  // If offline, queue for later
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && (window.navigator as any).onLine === false) {
      enqueueOfflineSync(userId, preferences, strategy)
      return { success: false, conflicts: [], error: 'offline' }
    }
  } catch {}
  // Clear any pending sync for this user
  const pendingKey = `sync_${userId}`
  if (pendingSyncs.has(pendingKey)) {
    clearTimeout(pendingSyncs.get(pendingKey)!)
    pendingSyncs.delete(pendingKey)
  }
  
  return new Promise((resolve) => {
    const timeoutId = setTimeout(async () => {
      try {
        const result = await attemptSyncWithRetry(userId, preferences, strategy)
        resolve(result)
      } catch (error) {
        console.error('Settings sync error:', error)
        const message = (error as any)?.message || ''
        if (/permission/i.test(message)) {
          resolve({ success: false, conflicts: [], error: 'permission' })
        } else if (/network|timeout|fetch/i.test(message)) {
          resolve({ success: false, conflicts: [], error: 'network' })
        } else if (/validation|schema/i.test(message)) {
          resolve({ success: false, conflicts: [], error: 'validation' })
        } else {
          resolve({ success: false, conflicts: [], error: 'unknown' })
        }
      } finally {
        pendingSyncs.delete(pendingKey)
      }
    }, SYNC_DEBOUNCE_DELAY)
    
    pendingSyncs.set(pendingKey, timeoutId)
  })
}

// Retry helper with exponential backoff
async function attemptSyncWithRetry(
  userId: string,
  preferences: Partial<UserPreferences>,
  strategy: ConflictResolutionStrategy,
  maxRetries: number = 3
): Promise<{ success: boolean; conflicts: SettingsConflict[]; error?: string }> {
  let attempt = 0
  let backoff = 500
  let lastError: any = null
  while (attempt <= maxRetries) {
    try {
      const { data: remotePreferences, error: fetchError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

      if (!remotePreferences) {
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            ...preferences,
            updated_at: new Date().toISOString()
          })
        if (insertError) throw insertError
        return { success: true, conflicts: [] }
      }

      const conflicts = await detectConflicts(userId, preferences as UserPreferences, remotePreferences)
      if (conflicts.length === 0) {
        const { error: updateError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: userId,
            ...preferences,
            updated_at: new Date().toISOString()
          })
        if (updateError) throw updateError
        return { success: true, conflicts: [] }
      }

      const { resolvedPreferences, resolvedConflicts } = resolveConflicts(conflicts, strategy)
      const { error: saveError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...resolvedPreferences,
          updated_at: new Date().toISOString()
        })
      if (saveError) throw saveError
      return { success: true, conflicts: resolvedConflicts }
    } catch (err: any) {
      lastError = err
      try {
        if (typeof window !== 'undefined' && (window.navigator as any).onLine === false) {
          enqueueOfflineSync(userId, preferences, strategy)
          return { success: false, conflicts: [], error: 'offline' }
        }
      } catch {}
      if (attempt === maxRetries) break
      // For validation or permission errors, do not retry
      const msg = (err?.message || '').toLowerCase()
      if (msg.includes('permission') || msg.includes('validation')) break
      await new Promise(r => setTimeout(r, backoff))
      backoff = Math.min(backoff * 2, 4000)
      attempt++
    }
  }
  const msg = (lastError?.message || '').toLowerCase()
  if (msg.includes('permission')) return { success: false, conflicts: [], error: 'permission' }
  if (msg.includes('validation')) return { success: false, conflicts: [], error: 'validation' }
  if (msg.includes('network') || msg.includes('timeout') || msg.includes('fetch')) return { success: false, conflicts: [], error: 'network' }
  return { success: false, conflicts: [], error: 'unknown' }
}

// Offline queue support
const OFFLINE_QUEUE_KEY = 'settings_offline_queue'

function enqueueOfflineSync(
  userId: string,
  preferences: Partial<UserPreferences>,
  strategy: ConflictResolutionStrategy
) {
  try {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY)
    const queue = raw ? JSON.parse(raw) as any[] : []
    queue.push({ userId, preferences, strategy, enqueuedAt: new Date().toISOString() })
    window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
  } catch {}
}

export async function flushOfflineQueue() {
  try {
    if (typeof window === 'undefined') return
    if ((window.navigator as any).onLine === false) return
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY)
    if (!raw) return
    const queue = JSON.parse(raw) as Array<{ userId: string; preferences: Partial<UserPreferences>; strategy: ConflictResolutionStrategy; enqueuedAt?: string }>
    const remaining: typeof queue = []
    const now = Date.now()
    for (const item of queue) {
      // Drop items older than 7 days to avoid indefinite accumulation
      const ageMs = item.enqueuedAt ? (now - Date.parse(item.enqueuedAt)) : 0
      if (ageMs > 7 * 24 * 60 * 60 * 1000) continue
      const res = await attemptSyncWithRetry(item.userId, item.preferences, item.strategy)
      if (!res.success) remaining.push(item)
    }
    if (remaining.length === 0) {
      window.localStorage.removeItem(OFFLINE_QUEUE_KEY)
    } else {
      // Keep queue bounded
      const bounded = remaining.slice(-200)
      window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(bounded))
    }
  } catch {}
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushOfflineQueue()
  })
}

/**
 * Set up real-time sync for settings changes
 */
export function setupRealtimeSync(
  userId: string,
  onSettingsChange: (event: SettingsChangeEvent) => void
): () => void {
  const subscription = supabase
    .channel('settings_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_preferences',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        const newRow = (payload as any).new as any
        const oldRow = (payload as any).old as any
        const evt: SettingsChangeEvent = {
          userId: newRow?.user_id || oldRow?.user_id,
          tableName: 'user_preferences',
          recordId: newRow?.id || oldRow?.id,
          operation: (payload as any).eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          timestamp: new Date().toISOString()
        }
        
        onSettingsChange(evt)
      }
    )
    .subscribe()
  
  // Return unsubscribe function
  return () => {
    subscription.unsubscribe()
  }
}

/**
 * Validate settings before sync
 */
export function validateSettings(settings: Partial<UserPreferences>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validate theme
  if (settings.theme && !['light', 'dark', 'auto'].includes(settings.theme)) {
    errors.push('Invalid theme value')
  }
  
  // Validate notification preferences
  if (settings.notification_preferences) {
    const np = settings.notification_preferences
    
    if (np.email && typeof np.email.enabled !== 'boolean') {
      errors.push('Invalid email notification enabled value')
    }
    
    if (np.push && typeof np.push.enabled !== 'boolean') {
      errors.push('Invalid push notification enabled value')
    }
    
    if (np.sms && typeof np.sms.enabled !== 'boolean') {
      errors.push('Invalid SMS notification enabled value')
    }
  }
  
  // Validate UI preferences
  if (settings.ui_preferences) {
    const up = settings.ui_preferences
    
    if (up.time_format && !['12h', '24h'].includes(up.time_format)) {
      errors.push('Invalid time format value')
    }
    
    if (up.compact_mode !== undefined && typeof up.compact_mode !== 'boolean') {
      errors.push('Invalid compact mode value')
    }
  }
  
  // Validate accessibility settings
  if (settings.accessibility_settings) {
    const as = settings.accessibility_settings
    
    if (as.font_size && !['small', 'medium', 'large', 'extra_large'].includes(as.font_size)) {
      errors.push('Invalid font size value')
    }
    
    if (as.line_spacing && !['tight', 'normal', 'loose'].includes(as.line_spacing)) {
      errors.push('Invalid line spacing value')
    }
    
    if (as.contrast_ratio && !['normal', 'high', 'maximum'].includes(as.contrast_ratio)) {
      errors.push('Invalid contrast ratio value')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Migrate settings to new schema version
 */
export function migrateSettings(
  settings: any,
  fromVersion: string,
  toVersion: string
): { migratedSettings: any; migrationNotes: string[] } {
  const migrationNotes: string[] = []
  let migratedSettings = { ...settings }
  
  // Example migration: v1.0 to v1.1
  if (fromVersion === '1.0' && toVersion === '1.1') {
    // Add new fields with defaults
    if (!migratedSettings.ui_preferences) {
      migratedSettings.ui_preferences = {
        language: 'en',
        timezone: 'UTC',
        date_format: 'MM/DD/YYYY',
        time_format: '12h',
        compact_mode: false,
        animations_enabled: true,
        auto_refresh_interval: 30000,
        sidebar_collapsed: false,
        color_scheme: 'default'
      }
      migrationNotes.push('Added default UI preferences')
    }
    
    if (!migratedSettings.accessibility_settings) {
      migratedSettings.accessibility_settings = {
        font_size: 'medium',
        line_spacing: 'normal',
        contrast_ratio: 'normal',
        reduce_motion: false,
        screen_reader_optimized: false,
        keyboard_navigation: true,
        focus_indicators: true
      }
      migrationNotes.push('Added default accessibility settings')
    }
  }
  
  // Example migration: v1.1 to v1.2
  if (fromVersion === '1.1' && toVersion === '1.2') {
    // Rename fields or restructure data
    if (migratedSettings.notification_preferences?.email_frequency) {
      migratedSettings.notification_preferences.email.frequency = 
        migratedSettings.notification_preferences.email_frequency
      delete migratedSettings.notification_preferences.email_frequency
      migrationNotes.push('Moved email_frequency to email.frequency')
    }
  }
  
  return { migratedSettings, migrationNotes }
}

/**
 * Get sync status for a user
 */
export async function getSyncStatus(userId: string): Promise<SyncStatus> {
  try {
    // Get last sync time from audit logs
    const { data: lastSync } = await supabase
      .from('settings_audit_logs')
      .select('created_at')
      .eq('user_id', userId)
      .eq('table_name', 'user_preferences')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    // Check for pending syncs
    const isSyncing = pendingSyncs.has(`sync_${userId}`)
    
    return {
      isSyncing,
      lastSyncTime: lastSync?.created_at || null,
      conflicts: [],
      errors: []
    }
  } catch (error) {
    console.error('Error getting sync status:', error)
    return {
      isSyncing: false,
      lastSyncTime: null,
      conflicts: [],
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Clear all pending syncs (useful for cleanup)
 */
export function clearPendingSyncs(): void {
  for (const entry of pendingSyncs.entries()) {
    const [key, timeoutId] = entry as [string, NodeJS.Timeout]
    clearTimeout(timeoutId)
  }
  pendingSyncs.clear()
}

/**
 * Batch sync multiple settings at once
 */
export async function batchSyncSettings(
  userId: string,
  settingsUpdates: Array<{ key: string; value: any }>,
  strategy: ConflictResolutionStrategy = 'last-write-wins'
): Promise<{ success: boolean; conflicts: SettingsConflict[]; errors: string[] }> {
  const errors: string[] = []
  const allConflicts: SettingsConflict[] = []
  
  try {
    // Get current preferences
    const { data: currentPreferences, error: fetchError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }
    
    // Prepare batch update
    const batchUpdate: Partial<UserPreferences> = {
      ...currentPreferences,
      updated_at: new Date().toISOString()
    }
    
    // Apply updates and detect conflicts
    for (const { key, value } of settingsUpdates) {
      const currentValue = currentPreferences?.[key as keyof UserPreferences]
      
      if (JSON.stringify(currentValue) !== JSON.stringify(value)) {
        allConflicts.push({
          key,
          localValue: value,
          remoteValue: currentValue,
          timestamp: new Date().toISOString(),
          resolved: false
        })
      }
      
      batchUpdate[key as keyof UserPreferences] = value
    }
    
    // Resolve conflicts
    const { resolvedPreferences, resolvedConflicts } = resolveConflicts(allConflicts, strategy)
    
    // Save resolved preferences
    const { error: saveError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...resolvedPreferences,
        updated_at: new Date().toISOString()
      })
    
    if (saveError) throw saveError
    
    return {
      success: true,
      conflicts: resolvedConflicts,
      errors
    }
    
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    return {
      success: false,
      conflicts: allConflicts,
      errors
    }
  }
}
