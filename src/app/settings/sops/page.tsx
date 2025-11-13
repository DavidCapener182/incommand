/**
 * SOP Management Page
 * Feature 2: Live Doctrine Assistant & Dynamic SOP Adjustment Engine
 * 
 * Settings page for managing SOP templates and event-specific SOPs
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/Toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import type { SOP, SOPCreateInput } from '@/types/sops'

export default function SOPsPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [sops, setSops] = useState<SOP[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSop, setSelectedSop] = useState<SOP | null>(null)
  const [filter, setFilter] = useState<'all' | 'templates' | 'active'>('all')

  useEffect(() => {
    fetchSOPs()
  }, [filter])

  const fetchSOPs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter === 'templates') {
        params.append('template_only', 'true')
      } else if (filter === 'active') {
        params.append('status', 'active')
      }

      const response = await fetch(`/api/sops?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch SOPs')
      }
      const data = await response.json()
      if (data.success) {
        setSops(data.sops || [])
      }
    } catch (err) {
      console.error('Error fetching SOPs:', err)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load SOPs',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sopId: string) => {
    if (!confirm('Are you sure you want to delete this SOP?')) return

    try {
      const response = await fetch(`/api/sops/${sopId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete SOP')
      }
      addToast({
        type: 'success',
        title: 'Success',
        message: 'SOP deleted successfully',
      })
      fetchSOPs()
    } catch (err) {
      console.error('Error deleting SOP:', err)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete SOP',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      suspended: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
      archived: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    }
    return (
      <Badge className={colors[status] || colors.draft}>{status.toUpperCase()}</Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    }
    return (
      <Badge className={colors[priority] || colors.normal}>{priority.toUpperCase()}</Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SOP Management</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage Standard Operating Procedures (SOPs) templates and event-specific SOPs
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create SOP
        </Button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilter('all')}
          >
          All SOPs
        </Button>
        <Button
            variant={filter === 'templates' ? 'primary' : 'outline'}
          onClick={() => setFilter('templates')}
        >
          Templates
        </Button>
        <Button
            variant={filter === 'active' ? 'primary' : 'outline'}
          onClick={() => setFilter('active')}
        >
          Active
        </Button>
      </div>

      {/* SOPs List */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">Loading SOPs...</div>
          </CardContent>
        </Card>
      ) : sops.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">No SOPs found</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Your First SOP
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sops.map((sop) => (
            <Card key={sop.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{sop.title}</CardTitle>
                    <CardDescription className="mt-1">{sop.sop_type}</CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    {getStatusBadge(sop.status)}
                    {getPriorityBadge(sop.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sop.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {sop.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span>Version {sop.version}</span>
                  <span>
                    {new Date(sop.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSop(sop)}
                    className="flex-1"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(sop.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal - Placeholder for now */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New SOP</CardTitle>
              <CardDescription>
                Create a new Standard Operating Procedure template or event-specific SOP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                SOP creation form will be implemented here. For now, use the API directly or
                create SOPs programmatically.
              </p>
              <div className="mt-4 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

