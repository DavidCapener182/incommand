/**
 * Request deduplication utility to prevent duplicate API calls
 * Useful for parallel requests that might fetch the same data
 */

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
}

const pendingRequests = new Map<string, PendingRequest<any>>()
const CACHE_TTL = 5000 // 5 seconds - deduplicate requests within this window

/**
 * Deduplicates requests by caching in-flight promises
 * If the same request is made within the TTL window, returns the existing promise
 */
export function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  ttl: number = CACHE_TTL
): Promise<T> {
  const now = Date.now()
  const existing = pendingRequests.get(key)

  // Return existing promise if it's still valid
  if (existing && (now - existing.timestamp) < ttl) {
    return existing.promise
  }

  // Create new request
  const promise = requestFn()
    .then(result => {
      // Clean up after request completes
      pendingRequests.delete(key)
      return result
    })
    .catch(error => {
      // Clean up on error too
      pendingRequests.delete(key)
      throw error
    })

  pendingRequests.set(key, { promise, timestamp: now })

  return promise
}

/**
 * Clear all pending requests (useful for testing or cleanup)
 */
export function clearPendingRequests(): void {
  pendingRequests.clear()
}

/**
 * Get count of pending requests (useful for debugging)
 */
export function getPendingRequestCount(): number {
  return pendingRequests.size
}
