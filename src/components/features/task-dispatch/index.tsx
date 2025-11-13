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
import { RealtimeChannel, type RealtimePostgresChangesPayload } from '@supabase/supabase-js'
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
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  assigned_to: string | null
  assigned_staff_name?: string
  created_by: string | null
  due_date: string | null
  completed_at: string | null
  location: { lat?: number; lng?: number; address?: string } | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface StaffMember {
  id: string
  full_name: string
  callsign?: string | null
}

export default function TaskDispatch() {
  const { user } = useAuth()
  const { eventData } = useEventContext()
  const supabaseClient = supabase as any
  const { addToast, messages, removeToast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
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
    location: '',
    notes: '',
  })

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!eventData?.id) return

    try {
      const { data, error } = await supabaseClient
        .from('tasks')
        .select(`
          *,
          assigned_staff:staff!tasks_assigned_to_fkey(full_name, callsign)
        `)
        .eq('event_id', eventData.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const tasksWithStaff = (data || []).map((task: any) => ({
        ...task,
        assigned_staff_name: task.assigned_staff?.full_name || null,
      }))

      setTasks(tasksWithStaff)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load tasks',
      })
    } finally {
      setLoading(false)
    }
  }, [eventData?.id, addToast])

  // Fetch staff
  const fetchStaff = useCallback(async () => {
    if (!eventData?.id) return

    try {
      const { data, error } = await supabaseClient
        .from('staff')
        .select('id, full_name, callsign')
        .eq('event_id', eventData.id)
        .eq('active', true)
        .order('full_name')

      if (error) throw error
      setStaff(data || [])
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }, [eventData?.id])

  // Setup real-time subscription with toast notifications
  useEffect(() => {
    if (!eventData?.id) return

    // Cleanup existing subscription
    if (subscriptionRef.current) {
      supabaseClient.removeChannel(subscriptionRef.current)
    }

    const channel = supabaseClient
        .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `event_id=eq.${eventData.id}`,
        },
          (payload: RealtimePostgresChangesPayload<Task>) => {
          console.log('Task change received:', payload)
          
          // Show toast notifications for real-time updates
          if (payload.eventType === 'INSERT') {
            const newTask = payload.new as Task
            addToast({
              type: 'info',
              title: 'New Task Created',
              message: `${newTask.title}${newTask.assigned_to ? ' - Assigned' : ' - Unassigned'}`,
              duration: 5000,
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = payload.new as Task
            const oldTask = payload.old as Task
            
            // Notify on status changes
            if (oldTask.status !== updatedTask.status) {
              if (updatedTask.status === 'completed') {
                addToast({
                  type: 'success',
                  title: 'Task Completed',
                  message: `${updatedTask.title} has been completed`,
                  duration: 5000,
                })
              } else if (updatedTask.status === 'in_progress') {
                addToast({
                  type: 'info',
                  title: 'Task Started',
                  message: `${updatedTask.title} is now in progress`,
                  duration: 4000,
                })
              }
            }
            
            // Notify on assignment changes
            if (oldTask.assigned_to !== updatedTask.assigned_to && updatedTask.assigned_to) {
              addToast({
                type: 'info',
                title: 'Task Assigned',
                message: `${updatedTask.title} has been assigned`,
                duration: 4000,
              })
            }
          }
          
          fetchTasks()
        }
      )
      .subscribe()

    subscriptionRef.current = channel

    return () => {
      if (subscriptionRef.current) {
        supabaseClient.removeChannel(subscriptionRef.current)
      }
    }
    }, [eventData?.id, fetchTasks, addToast, supabaseClient])

  useEffect(() => {
    fetchTasks()
    fetchStaff()
  }, [fetchTasks, fetchStaff])

  // Create task
  const handleCreateTask = async () => {
    if (!formData.title.trim() || !eventData?.id || !user?.id) return

    try {
      // Get company_id from user profile
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) {
        throw new Error('Company not found')
      }

      const { error } = await supabaseClient.from('tasks').insert({
        company_id: profile.company_id,
        event_id: eventData.id,
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        assigned_to: formData.assigned_to && formData.assigned_to !== 'unassigned' ? formData.assigned_to : null,
        due_date: formData.due_date || null,
        location: formData.location || null,
        notes: formData.notes || null,
        created_by: user.id,
        status: formData.assigned_to && formData.assigned_to !== 'unassigned' ? 'assigned' : 'open',
      })

      if (error) throw error

      // Send notification to assigned staff member if task was assigned
        if (formData.assigned_to && formData.assigned_to !== 'unassigned') {
          try {
            const assignedStaff = staff.find(s => s.id === formData.assigned_to) as (StaffMember & { email?: string }) | undefined
            if (assignedStaff?.email) {
            // Find user profile by email
            const { data: profile } = await supabaseClient
              .from('profiles')
              .select('id')
              .eq('email', assignedStaff.email)
              .single()

            if (profile?.id) {
              await supabaseClient
                .from('notifications')
                .insert({
                  user_id: profile.id,
                  title: 'New Task Assigned',
                  message: `You have been assigned: ${formData.title}`,
                  type: 'task_assignment',
                  data: {
                    task_title: formData.title,
                    priority: formData.priority,
                  },
                  read: false,
                })
            }
          }
        } catch (notifError) {
          console.error('Error sending task assignment notification:', notifError)
          // Don't fail task creation if notification fails
        }
      }

      addToast({
        type: 'success',
        title: 'Task Created',
        message: formData.assigned_to && formData.assigned_to !== 'unassigned'
          ? `Task created and assigned to ${staff.find(s => s.id === formData.assigned_to)?.full_name || 'staff member'}`
          : 'Task has been created successfully',
      })

      setIsCreateModalOpen(false)
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: 'unassigned',
        due_date: '',
        location: '',
        notes: '',
      })
      fetchTasks()
    } catch (error) {
      console.error('Error creating task:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to create task',
      })
    }
  }

  // Update task
  const handleUpdateTask = async () => {
    if (!selectedTask || !formData.title.trim()) return

    try {
      const { error } = await supabaseClient
        .from('tasks')
        .update({
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          assigned_to: formData.assigned_to && formData.assigned_to !== 'unassigned' ? formData.assigned_to : null,
          due_date: formData.due_date || null,
          location: formData.location || null,
          notes: formData.notes || null,
        })
        .eq('id', selectedTask.id)

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Task Updated',
        message: 'Task has been updated successfully',
      })

      setIsEditModalOpen(false)
      setSelectedTask(null)
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: 'unassigned',
        due_date: '',
        location: '',
        notes: '',
      })
      fetchTasks()
    } catch (error) {
      console.error('Error updating task:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update task',
      })
    }
  }

  // Open edit modal
  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assigned_to: task.assigned_to || 'unassigned',
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
      location: typeof task.location === 'string' ? task.location : task.location?.address || '',
      notes: task.notes || '',
    })
    setIsEditModalOpen(true)
  }

  // Update task status
  const handleUpdateStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const updateData: any = { status: newStatus }
      
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
        updateData.completed_by = user?.id

        // Optionally create incident log entry for completed tasks
        // Uncomment the code below if you want tasks to create incident log entries when completed
        /*
        try {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('company_id')
            .eq('id', user?.id)
            .single()

          if (profile?.company_id && eventData?.id) {
            await supabaseClient.from('incident_logs').insert({
              company_id: profile.company_id,
              event_id: eventData.id,
              incident_type: 'Task Completion',
              occurrence: `Task completed: ${task.title}${task.description ? ` - ${task.description}` : ''}`,
              timestamp: new Date().toISOString(),
              logged_by_user_id: user?.id,
              status: 'closed',
              priority: task.priority === 'urgent' ? 'high' : task.priority === 'high' ? 'medium' : 'low',
            })
          }
        } catch (logError) {
          console.error('Error creating incident log entry for completed task:', logError)
          // Don't fail task completion if log creation fails
        }
        */
      }

      const { error } = await supabaseClient
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Task Updated',
        message: `Task marked as ${newStatus.replace('_', ' ')}`,
      })

      fetchTasks()
    } catch (error) {
      console.error('Error updating task:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update task',
      })
    }
  }

  // Assign task
  const handleAssignTask = async (taskId: string, staffId: string | null) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const { error } = await supabaseClient
        .from('tasks')
        .update({
          assigned_to: staffId,
          status: staffId ? 'assigned' : 'open',
        })
        .eq('id', taskId)

      if (error) throw error

      // Send notification to assigned staff member
      if (staffId) {
        try {
            const assignedStaff = staff.find(s => s.id === staffId) as (StaffMember & { email?: string }) | undefined
              if (assignedStaff?.email) {
            // Find user profile by email
            const { data: profile } = await supabaseClient
              .from('profiles')
              .select('id')
              .eq('email', assignedStaff.email)
              .single()

            if (profile?.id) {
              await supabaseClient
                .from('notifications')
                .insert({
                  user_id: profile.id,
                  title: 'New Task Assigned',
                  message: `You have been assigned: ${task.title}`,
                  type: 'task_assignment',
                  data: {
                    task_id: taskId,
                    task_title: task.title,
                    priority: task.priority,
                  },
                  read: false,
                })
            }
          }
        } catch (notifError) {
          console.error('Error sending task assignment notification:', notifError)
          // Don't fail the assignment if notification fails
        }
      }

      addToast({
        type: 'success',
        title: 'Task Assigned',
        message: staffId 
          ? `Task assigned to ${staff.find(s => s.id === staffId)?.full_name || 'staff member'}` 
          : 'Task unassigned',
      })

      fetchTasks()
    } catch (error) {
      console.error('Error assigning task:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to assign task',
      })
    }
  }

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const { error } = await supabaseClient.from('tasks').delete().eq('id', taskId)

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Task Deleted',
        message: 'Task has been deleted',
      })

      fetchTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete task',
      })
    }
  }

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
      case 'assigned':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
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
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
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

                    {task.notes && (
                      <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-600 dark:text-gray-400">
                        <strong>Notes:</strong> {task.notes}
                      </div>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                      {task.assigned_staff_name && (
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-4 w-4" />
                          <span>{task.assigned_staff_name}</span>
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

                    {/* Complete button - visible for all non-completed, non-cancelled tasks */}
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

                    {/* Status-specific actions */}
                    {task.status === 'open' && (
                    <Select
                      value={task.assigned_to || 'unassigned'}
                      onValueChange={(value) => {
                        handleAssignTask(task.id, value === 'unassigned' ? null : value)
                      }}
                    >
                      <SelectTrigger
                        className="w-[180px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                          <SelectValue placeholder="Assign to..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {staff.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.full_name} {s.callsign && `(${s.callsign})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {task.status === 'assigned' && (
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
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} {s.callsign && `(${s.callsign})`}
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

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Task location or address"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes/Comments</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add notes or comments about this task"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={!formData.title.trim()}>
              Create Task
            </Button>
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
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} {s.callsign && `(${s.callsign})`}
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

            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Task location or address"
              />
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes/Comments</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add notes or comments about this task"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditModalOpen(false)
              setSelectedTask(null)
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTask} disabled={!formData.title.trim()}>
              Update Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notifications */}
      <Toast messages={messages} onRemove={removeToast} />
    </div>
  )
}
