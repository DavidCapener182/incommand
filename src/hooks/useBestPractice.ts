import { useCallback, useMemo, useRef, useState } from 'react'
import { BestPracticeApiRequest, BestPracticeApiResponse, BestPracticePayload } from '@/types/bestPractice'

type State = 'idle' | 'loading' | 'success' | 'error'

export function useBestPractice() {
  const [state, setState] = useState<State>('idle')
  const [data, setData] = useState<BestPracticePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inFlightKey = useRef<string | null>(null)
  const lastRunAt = useRef<number>(0)

  const fetchBestPractice = useCallback(async (req: BestPracticeApiRequest): Promise<BestPracticePayload | null> => {
    const key = `${req.incidentType}|${(req.occurrence || '').slice(0, 100)}`
    // Debounce duplicate rapid calls (1.5s)
    const now = Date.now()
    if (inFlightKey.current === key && (now - lastRunAt.current) < 1500) return null
    inFlightKey.current = key
    lastRunAt.current = now

    setState('loading')
    setError(null)
    setData(null)
    try {
      const res = await fetch('/api/best-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      })
      const json = (await res.json()) as BestPracticeApiResponse
      if (json.bestPractice) {
        setData(json.bestPractice)
        setState('success')
        return json.bestPractice
      } else {
        setState('error')
        setError(json.reason || 'error')
        return null
      }
    } catch (e: any) {
      setState('error')
      setError(e?.message || 'error')
      return null
    }
  }, [])

  return { state, data, error, fetchBestPractice }
}


