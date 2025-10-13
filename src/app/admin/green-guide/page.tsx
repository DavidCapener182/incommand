import React from 'react'

export default function AdminGreenGuidePage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Green Guide Tools</h1>
      <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-sm rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6">
        <p className="text-sm">If you can see this, the route is rendering correctly.</p>
        <div className="mt-3">
          <a href="/green-guide" target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">Open Green Guide (PDF)</a>
        </div>
      </div>
    </div>
  )
}


