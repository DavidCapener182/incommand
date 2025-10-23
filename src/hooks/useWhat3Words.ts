'use client'

import { useCallback, useState } from 'react'

interface What3WordsCoordinates {
  lat: number
  lng: number
}

interface UseWhat3WordsResult {
  coordinates: What3WordsCoordinates | null
  isLoading: boolean
  error: string | null
  validate: (input: string) => Promise<boolean>
  reset: () => void
}

function normalizeInput(input: string): string {
  return input
    .trim()
    .replace(/^\/*/, '')
    .replace(/^what3words:/i, '')
    .replace(/^https?:\/\/w3w\.co\//i, '')
    .replace(/^\.+/, '')
    .replace(/\s+/g, '.')
    .replace(/\.+/g, '.')
    .toLowerCase()
}

export function useWhat3Words(): UseWhat3WordsResult {
  const [coordinates, setCoordinates] = useState<What3WordsCoordinates | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastValidated, setLastValidated] = useState<string | null>(null)

  const reset = useCallback(() => {
    setCoordinates(null)
    setError(null)
    setLastValidated(null)
  }, [])

  const validate = useCallback(async (rawInput: string) => {
    const normalized = normalizeInput(rawInput)

    // Skip validation for callsigns (single letters/numbers like A1, R2, etc.)
    if (normalized && /^[a-z0-9]{1,3}$/i.test(normalized)) {
      setCoordinates(null)
      setError(null)
      return false
    }

    if (!normalized || normalized.split('.').length !== 3) {
      setCoordinates(null)
      setError("Invalid address. Try 'filled.count.soap'")
      return false
    }

    if (normalized === lastValidated && coordinates) {
      return true
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/what3words?words=${encodeURIComponent(normalized)}`)
      if (!response.ok) {
        throw new Error(`Validation failed with status ${response.status}`)
      }

      const data = await response.json()
      const coords = data?.coordinates as What3WordsCoordinates | null

      if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
        setCoordinates(null)
        setError("Invalid address. Try 'filled.count.soap'")
        setLastValidated(null)
        return false
      }

      setCoordinates(coords)
      setLastValidated(normalized)
      setError(null)
      return true
    } catch (err) {
      console.error('Failed to validate what3words address', err)
      setCoordinates(null)
      setError("Invalid address. Try 'filled.count.soap'")
      setLastValidated(null)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [coordinates, lastValidated])

  return {
    coordinates,
    isLoading,
    error,
    validate,
    reset,
  }
}

export default useWhat3Words
