'use client'

/**
 * Offline Mode Feature
 * Allow offline data capture, syncing once reconnected.
 * Available on: Command, Enterprise plans
 * Status: Implemented 2025-01-08
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useOffline } from '@/hooks/useOffline'
import { offlineSyncManager, type OfflineOperation } from '@/lib/offlineSync'
import { useToast } from '@/components/Toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
  import {
    WifiIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    TrashIcon,
    ExclamationCircleIcon,
  } from '@heroicons/react/24/outline'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function OfflineMode() {
  const {
    isOnline,
    isServiceWorkerReady,
    hasPendingSync,
    syncStatus,
    lastSyncTime,
    triggerSync,
    getPendingSyncCount,
  } = useOffline()
  const { showToast } = useToast()

  const [queueStatus, setQueueStatus] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  })
  const [pendingOperations, setPendingOperations] = useState<OfflineOperation[]>([])
  const [failedOperations, setFailedOperations] = useState<OfflineOperation[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  // Fetch queue status
  const fetchQueueStatus = useCallback(async () => {
    if (!offlineSyncManager) return

    try {
      const status = await offlineSyncManager.getQueueStatus()
      setQueueStatus(status)

      // Get pending operations
      const pending = await offlineSyncManager.db!.offlineQueue
        .where('status')
        .equals('pending')
        .toArray()
      setPendingOperations(pending as OfflineOperation[])

      // Get failed operations
      const failed = await offlineSyncManager.db!.offlineQueue
        .where('status')
        .equals('failed')
        .toArray()
      setFailedOperations(failed as OfflineOperation[])
    } catch (error) {
      console.error('Error fetching queue status:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueueStatus()
    const interval = setInterval(fetchQueueStatus, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [fetchQueueStatus])

  // Manual sync
  const handleManualSync = async () => {
    if (!isOnline) {
      showToast({
        type: 'error',
        title: 'Offline',
        message: 'Cannot sync while offline',
      })
      return
    }

    setSyncing(true)
    try {
      if (offlineSyncManager) {
        await offlineSyncManager.triggerManualSync()
        showToast({
          type: 'success',
          title: 'Sync Started',
          message: 'Syncing offline data...',
        })
        setTimeout(() => {
          fetchQueueStatus()
          setSyncing(false)
        }, 2000)
      } else {
        await triggerSync()
        setSyncing(false)
      }
    } catch (error) {
      console.error('Sync failed:', error)
      showToast({
        type: 'error',
        title: 'Sync Failed',
        message: 'Failed to sync offline data',
      })
      setSyncing(false)
    }
  }

  // Retry failed operation
  const handleRetryOperation = async (operationId: number) => {
    if (!offlineSyncManager) return

    try {
      await offlineSyncManager.db!.offlineQueue.update(operationId, {
        status: 'pending',
        retryCount: 0,
        error: undefined,
      })
      showToast({
        type: 'success',
        title: 'Operation Queued',
        message: 'Operation will be retried on next sync',
      })
      fetchQueueStatus()
    } catch (error) {
      console.error('Error retrying operation:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to retry operation',
      })
    }
  }

  // Delete operation
  const handleDeleteOperation = async (operationId: number) => {
    if (!confirm('Are you sure you want to delete this operation?')) return

    if (!offlineSyncManager) return

    try {
      await offlineSyncManager.db!.offlineQueue.delete(operationId)
      showToast({
        type: 'success',
        title: 'Operation Deleted',
        message: 'Operation has been removed from queue',
      })
      fetchQueueStatus()
    } catch (error) {
      console.error('Error deleting operation:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete operation',
      })
    }
  }

  // Clear completed operations
  const handleClearCompleted = async () => {
    if (!offlineSyncManager) return

    try {
      await offlineSyncManager.clearCompletedOperations()
      showToast({
        type: 'success',
        title: 'Cleared',
        message: 'Completed operations cleared',
      })
      fetchQueueStatus()
    } catch (error) {
      console.error('Error clearing completed:', error)
    }
  }

  const getOperationTypeLabel = (type: string) => {
    switch (type) {
      case 'incident_create':
        return 'Create Incident'
      case 'incident_update':
        return 'Update Incident'
      case 'photo_upload':
        return 'Upload Photo'
      case 'notification_send':
        return 'Send Notification'
      default:
        return type
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const totalPending = queueStatus.pending + queueStatus.processing
  const hasFailed = queueStatus.failed > 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Offline Mode</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage offline data capture and synchronization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isOnline
                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                : 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-500 animate-pulse' : 'bg-orange-500'
              }`}
            />
            <span className="text-sm font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          {isOnline && totalPending > 0 && (
            <Button onClick={handleManualSync} disabled={syncing}>
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {queueStatus.pending}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Processing</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {queueStatus.processing}
                </p>
              </div>
              <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {queueStatus.completed}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {queueStatus.failed}
                </p>
              </div>
              <XCircleIcon className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Worker Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Worker Status</CardTitle>
          <CardDescription>Offline capability and sync status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Service Worker
              </span>
              <Badge
                className={
                  isServiceWorkerReady
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }
              >
                {isServiceWorkerReady ? 'Ready' : 'Not Ready'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Connection Status
              </span>
              <Badge
                className={
                  isOnline
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                }
              >
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            {lastSyncTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Last Sync
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {lastSyncTime.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Operations */}
      {pendingOperations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Operations</CardTitle>
            <CardDescription>
              Operations waiting to be synced when online
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingOperations.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="font-medium">
                      {getOperationTypeLabel(op.type)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(op.priority)}>
                        {op.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(op.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{op.retryCount}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => op.id && handleDeleteOperation(op.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Failed Operations */}
      {failedOperations.length > 0 && (
        <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
              Failed Operations
            </CardTitle>
            <CardDescription>
              Operations that failed to sync. Review and retry or delete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedOperations.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="font-medium">
                      {getOperationTypeLabel(op.type)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(op.priority)}>
                        {op.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-red-600 dark:text-red-400 max-w-xs truncate">
                      {op.error || 'Unknown error'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(op.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isOnline && op.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetryOperation(op.id!)}
                          >
                            Retry
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => op.id && handleDeleteOperation(op.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {totalPending === 0 && failedOperations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              All Synced
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No pending or failed operations. All offline data has been synchronized.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                How Offline Mode Works
              </h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• Data created while offline is stored locally</li>
                <li>• When connection is restored, data syncs automatically</li>
                <li>• Failed operations can be retried manually</li>
                <li>• High priority operations sync first</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
