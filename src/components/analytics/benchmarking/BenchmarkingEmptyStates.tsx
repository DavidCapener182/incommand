import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/card'

interface BenchmarkingEmptyStatesProps {
  error?: string | null
  onRetry?: () => void
  className?: string
}

export function BenchmarkingEmptyState({ error, onRetry, className = '' }: BenchmarkingEmptyStatesProps) {
  if (error && error.toLowerCase().includes('no event selected')) {
    return (
      <Card className={`p-6 text-center ${className}`}>
        <ExclamationTriangleIcon className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Select an Event to Benchmark
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Choose an event in the analytics dashboard to compare its performance against similar venues.
        </p>
      </Card>
    )
  }

  return (
    <Card className={`p-6 text-center ${className}`}>
      <div className="text-gray-500 dark:text-gray-400">
        No benchmarking data available right now.
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Try Again
        </button>
      )}
    </Card>
  )
}

