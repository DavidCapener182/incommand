'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, StarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { pluginSystem, type Plugin } from '@/lib/plugins/pluginSystem'

const FEATURED_PLUGINS: Plugin[] = [
  {
    id: '1',
    name: 'Advanced Analytics Pro',
    version: '1.0.0',
    author: 'inCommand Team',
    description: 'Premium analytics dashboards and reporting',
    category: 'analytics',
    permissions: ['analytics:view', 'analytics:export'],
    price: 99,
    rating: 4.8,
    downloads: 1250,
    isVerified: true,
    entryPoint: 'analytics-pro/index.js'
  },
  {
    id: '2',
    name: 'AI Incident Predictor',
    version: '2.1.0',
    author: 'ML Solutions',
    description: 'Machine learning incident prediction',
    category: 'ai',
    permissions: ['incidents:read', 'analytics:view'],
    price: 149,
    rating: 4.9,
    downloads: 890,
    isVerified: true,
    entryPoint: 'ai-predictor/index.js'
  }
]

export default function MarketplacePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Plugin Marketplace</h1>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plugins..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Categories</option>
            <option value="analytics">Analytics</option>
            <option value="integration">Integration</option>
            <option value="ai">AI & ML</option>
            <option value="automation">Automation</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_PLUGINS.map(plugin => (
            <div key={plugin.id} className="bg-white dark:bg-gray-800 rounded-xl border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{plugin.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">by {plugin.author}</p>
                </div>
                {plugin.isVerified && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Verified</span>
                )}
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{plugin.description}</p>

              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  <span>{plugin.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>{plugin.downloads.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">${plugin.price}</span>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Install
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
