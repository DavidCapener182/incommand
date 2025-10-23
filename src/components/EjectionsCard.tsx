import { useCallback, useEffect, useState } from 'react'
import { UserMinusIcon } from '@heroicons/react/24/outline'

interface ApiResponse {
  total: number
  recent: number
  trend: 'up' | 'down' | 'stable'
}

interface EjectionStats {
  total: number;
  recent: number;
  trend: 'up' | 'down' | 'stable';
}

export default function EjectionsCard() {
  const [stats, setStats] = useState<EjectionStats>({
    total: 0,
    recent: 0,
    trend: 'stable'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/analytics/ejections')
      if (!response.ok) {
        throw new Error('Unable to load ejection statistics')
      }

      const data = (await response.json()) as ApiResponse
      setStats({
        total: data.total,
        recent: data.recent,
        trend: data.trend
      })
    } catch (err) {
      console.error('Error fetching ejection stats:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadStats])

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 transition-colors duration-300">
        <h2 className="text-lg font-semibold mb-2">Ejections</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (stats.trend === 'up') {
      return (
        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    if (stats.trend === 'down') {
      return (
        <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Ejections</h2>
          <p className="text-sm text-gray-500">Last 24 hours</p>
        </div>
        <div className="p-2 bg-red-50 rounded-full">
          <UserMinusIcon className="h-8 w-8 text-red-500" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Ejections</p>
          </div>
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <span className="text-sm text-gray-600">
              {stats.trend === 'up' ? 'Increasing' : stats.trend === 'down' ? 'Decreasing' : 'Stable'}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Recent (1h)</p>
            <p className="text-lg font-semibold">{stats.recent}</p>
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
