'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchIncidentSOPSteps } from '@/services/sopService'
import type { IncidentSOPStep } from '@/types/sop'

export function useIncidentSOP(incidentType: string | null | undefined) {
  const [steps, setSteps] = useState<IncidentSOPStep[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!incidentType) {
      setSteps([])
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const result = await fetchIncidentSOPSteps(incidentType)
      setSteps(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load SOP'
      setError(message)
      setSteps([])
    } finally {
      setIsLoading(false)
    }
  }, [incidentType])

  useEffect(() => {
    load()
  }, [load])

  return {
    steps,
    isLoading,
    error,
    refresh: load
  }
}

export default useIncidentSOP
