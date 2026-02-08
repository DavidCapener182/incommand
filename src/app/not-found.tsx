import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 bg-[#f8fafc] dark:bg-[#111a33]">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Page not found</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          Sorry, we couldn&apos;t find that page.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
          The URL may be wrong or the page may have moved. Use the links below or the menu above to get back.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/incidents"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Incidents
          </Link>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  )
}

