/**
 * Smart Caching Strategy
 * Implements efficient caching for API responses and data
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  key: string
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  staleWhileRevalidate?: boolean
  maxSize?: number // Maximum cache size
}

class SmartCache {
  private cache: Map<string, CacheEntry<any>>
  private maxSize: number
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  constructor(maxSize = 100) {
    this.cache = new Map()
    this.maxSize = maxSize
    
    // Load cache from localStorage if available
    if (typeof window !== 'undefined') {
      this.loadFromStorage()
      // Periodic cleanup only in browser
      this.startCleanup()
    }
  }

  /**
   * Get cached data
   */
  get<T>(key: string, options: CacheOptions = {}): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null

    const now = Date.now()
    
    // Check if expired
    if (now > entry.expiresAt) {
      if (!options.staleWhileRevalidate) {
        this.cache.delete(key)
        return null
      }
      // Return stale data but mark for revalidation
      return entry.data
    }

    return entry.data
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const now = Date.now()
    const ttl = options.ttl || this.DEFAULT_TTL

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      key
    }

    // Enforce max size with LRU eviction
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.findOldestKey()
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, entry)
    this.saveToStorage()
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
    this.saveToStorage()
  }

  /**
   * Invalidate multiple entries by prefix
   */
  invalidatePrefix(prefix: string): void {
    const keysToDelete: string[] = []
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    this.saveToStorage()
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear()
    this.saveToStorage()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredEntries++
      } else {
        validEntries++
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      validEntries,
      expiredEntries,
      utilizationPercent: Math.round((this.cache.size / this.maxSize) * 100)
    }
  }

  /**
   * Find oldest cache entry for LRU eviction
   */
  private findOldestKey(): string | null {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    return oldestKey
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    
    if (keysToDelete.length > 0) {
      this.saveToStorage()
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    // Cleanup every minute
    setInterval(() => this.cleanup(), 60 * 1000)
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const cacheArray = Array.from(this.cache.entries())
      const serialized = JSON.stringify(cacheArray)
      localStorage.setItem('smartCache', serialized)
    } catch (e) {
      console.warn('Failed to save cache to localStorage:', e)
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const serialized = localStorage.getItem('smartCache')
      if (!serialized) return

      const cacheArray = JSON.parse(serialized)
      this.cache = new Map(cacheArray)
      
      // Cleanup expired entries on load
      this.cleanup()
    } catch (e) {
      console.warn('Failed to load cache from localStorage:', e)
      this.cache = new Map()
    }
  }
}

// Create singleton instance
export const smartCache = new SmartCache(100)

// Cache key generators
export const cacheKeys = {
  incidents: (eventId?: string) => eventId ? `incidents:${eventId}` : 'incidents:all',
  incident: (id: string) => `incident:${id}`,
  staff: (eventId?: string) => eventId ? `staff:${eventId}` : 'staff:all',
  analytics: (eventId: string, metric: string) => `analytics:${eventId}:${metric}`,
  events: () => 'events:all',
  event: (id: string) => `event:${id}`,
  userPreferences: (userId: string) => `preferences:${userId}`,
  performance: (period: string) => `performance:${period}`
}

// React hook for smart caching
export function useSmartCache() {
  return {
    get: smartCache.get.bind(smartCache),
    set: smartCache.set.bind(smartCache),
    invalidate: smartCache.invalidate.bind(smartCache),
    invalidatePrefix: smartCache.invalidatePrefix.bind(smartCache),
    clear: smartCache.clear.bind(smartCache),
    getStats: smartCache.getStats.bind(smartCache),
    cacheKeys
  }
}

// Decorator for caching function results
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  options: CacheOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args)
    
    // Check cache first
    const cached = smartCache.get(key, options)
    if (cached !== null) {
      return cached
    }

    // Execute function and cache result
    const result = await fn(...args)
    smartCache.set(key, result, options)
    
    return result
  }) as T
}
