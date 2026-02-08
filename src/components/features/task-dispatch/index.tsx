'use client'

/**
 * Task Dispatch & Assignment Feature
 * Allocate and monitor field staff tasks in real time.
 * Available on: Operational, Command, Enterprise plans
 * Status: Implemented 2025-01-08
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useEventContext } from '@/contexts/EventContext'
import { useAuth } from '@/contexts/AuthContext'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useToast } from '@/components/Toast'
import Toast from '@/components/Toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  PlusIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface Task {
  id: string
  event_id: string
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  assigned_to: string | null
  assigned_by: string | null
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

interface ProfileOption {
  id: string
  full_name: string | null
  email?: string | null
}

export default function TaskDispatch() {
  const { user } = useAuth()
  const { eventData } = useEventContext()
  const supabaseClient = supabase as any
  const { addToast, messages, removeToast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [profiles, setProfiles] = useState<ProfileOption[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const subscriptionRef = useRef<RealtimeChannel | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    assigned_to: 'unassigned',
    due_date: '',
  })

  // Fetch tasks via API
  const fetchTasks = useCallback(async () => {
    if (!eventData?.id) return

    try {
      const res = await fetch(`/api/v1/tasks?event_id=${eventData.id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch')
      setTasks(data.tasks ?? [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
      addToast({ type: 'error', title: 'Error', message: 'Failed to load tasks' })
    } finally {
      setLoading(false)
    }
  }, [eventData?.id, addToast])

  // Fetch profiles (company members) for assignment
  const fetchProfiles = useCallback(async () => {
    try {
      const { data: profile } = await supabaseClient.from('profiles').select('company_id').eq('id', user?.id).single()
      if (!profile?.company_id) return
      const { data } = await supabaseClient.from('profiles').select('id, full_name, email').eq('company_id', profile.company_id).order('full_name', { nullsFirst: false })
      setProfiles(data || [])
    } catch (error) {
      console.error('Error fetching profiles:', error)
    }
  }, [user?.id, supabaseClient])

  // Setup real-time subscription
  useEffect(() => {
    if (!eventData?.id) return
    if (subscriptionRef.current) supabaseClient.removeChannel(subscriptionRef.current)
    const channel = supabaseClient
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `event_id=eq.${eventData.id}` }, () => {
        fetchTasks()
      })
      .subscribe()
    subscriptionRef.current = channel
    return () => { subscriptionRef.current && supabaseClient.removeChannel(subscriptionRef.current) }
  }, [eventData?.id, fetchTasks, supabaseClient])

  useEffect(() => {
    fetchTasks()
    fetchProfiles()
  }, [fetchTasks, fetchProfiles])

  const handleCreateTask = async () => {
    if (!formData.title.trim() || !eventData?.id) return
    try {
      const res = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventData.id,
          title: formData.title.trim(),
          description: formData.description || null,
          priority: formData.priority,
          assigned_to: formData.assigned_to && formData.assigned_to !== 'unassigned' ? formData.assigned_to : null,
          due_date: formData.due_date || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create task')
      addToast({ type: 'success', title: 'Task Created', message: 'Task has been created.' })
      setIsCreateModalOpen(false)
      setFormData({ title: '', description: '', priority: 'medium', assigned_to: 'unassigned', due_date: '' })
      fetchTasks()
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to create task' })
    }
  }

  const handleUpdateTask = async () => {
    if (!selectedTask || !formData.title.trim()) return
    try {
      const res = await fetch(`/api/v1/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          assigned_to: formData.assigned_to !== 'unassigned' ? formData.assigned_to : null,
          due_date: formData.due_date || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      addToast({ type: 'success', title: 'Task Updated', message: 'Task has been updated.' })
      setIsEditModalOpen(false)
      setSelectedTask(null)
      setFormData({ title: '', description: '', priority: 'medium', assigned_to: 'unassigned', due_date: '' })
      fetchTasks()
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to update task' })
    }
  }

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assigned_to: task.assigned_to || 'unassigned',
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      addToast({ type: 'success', title: 'Task Updated', message: `Task marked as ${newStatus.replace('_', ' ')}` })
      fetchTasks()
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to update task' })
    }
  }

  const handleAssignTask = async (taskId: string, userId: string | null) => {
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: userId }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      addToast({ type: 'success', title: 'Task Assigned', message: userId ? 'Task assigned.' : 'Task unassigned.' })
      fetchTasks()
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to assign task' })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      addToast({ type: 'success', title: 'Task Deleted', message: 'Task has been deleted.' })
      fetchTasks()
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to delete task' })
    }
  }

  const getAssigneeName = (assignedTo: string | null) =>
    assignedTo ? profiles.find(p => p.id === assignedTo)?.full_name ?? 'Assigned' : null

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === 'all') return true
    return task.status === statusFilter
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Dispatch</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Allocate and monitor field staff tasks in real time
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create your first task
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card 
              key={task.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleEditTask(task)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {task.title}
                      </h3>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                      {getAssigneeName(task.assigned_to) && (
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-4 w-4" />
                          <span>{getAssigneeName(task.assigned_to)}</span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>{new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Edit button - always visible */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditTask(task)
                      }}
                      title="Edit task"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>

                    {task.status !== 'completed' && task.status !== 'cancelled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpdateStatus(task.id, 'completed')
                        }}
                        title="Mark as complete"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}

                    {task.status === 'pending' && (
                      <Select
                        value={task.assigned_to || 'unassigned'}
                        onValueChange={(value) => handleAssignTask(task.id, value === 'unassigned' ? null : value)}
                      >
                        <SelectTrigger className="w-[180px]" onClick={(e) => e.stopPropagation()}>
                          <SelectValue placeholder="Assign to..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {profiles.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.full_name || p.email || p.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {task.status === 'pending' && task.assigned_to && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpdateStatus(task.id, 'in_progress')
                        }}
                      >
                        Start
                      </Button>
                    )}

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTask(task.id)
                      }}
                      title="Delete task"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>

                    {task.status === 'completed' && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Task Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create a new task to assign to field staff
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Task['priority']) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assigned_to">Assign To</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name || p.email || p.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={!formData.title.trim()}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details, add comments, or change assignment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Task['priority']) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-assigned_to">Assign To</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name || p.email || p.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-due_date">Due Date</Label>
              <Input
                id="edit-due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setSelectedTask(null) }}>Cancel</Button>
            <Button onClick={handleUpdateTask} disabled={!formData.title.trim()}>Update Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notifications */}
      <Toast messages={messages} onRemove={removeToast} />
    </div>
  )
}
