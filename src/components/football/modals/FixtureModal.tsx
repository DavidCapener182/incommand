'use client'

import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FixtureChecklist, FixtureTask } from '@/types/football'
import { Plus, Trash2, CheckCircle, Clock, User, Filter } from 'lucide-react'

interface FixtureModalProps {
  onSave?: () => void
}

// Current Tab Component - Live Task Management
export function FixtureCurrent({ onSave }: FixtureModalProps) {
  const [fixtureChecklist, setFixtureChecklist] = useState<FixtureChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/football/fixture?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (res.ok) {
        const data = await res.json()
        setFixtureChecklist(data)
      }
    } catch (error) {
      console.error('Failed to load fixture data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    if (!fixtureChecklist) return

    const updatedTasks = fixtureChecklist.tasks.map(task =>
      task.id === taskId 
        ? { 
            ...task, 
            completed, 
            completedAt: completed ? new Date().toISOString() : undefined,
            completedBy: completed ? 'Current User' : undefined // TODO: Get from auth context
          } 
        : task
    )
    
    setFixtureChecklist({ ...fixtureChecklist, tasks: updatedTasks })

    // Auto-save task completion
    try {
      await fetch('/api/football/fixture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskId, 
          completed, 
          completedBy: 'Current User' // TODO: Get from auth context
        }),
      })
    } catch (error) {
      console.error('Failed to auto-save task completion:', error)
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  if (!fixtureChecklist) {
    return <div className="p-4 text-center text-red-600">Failed to load fixture data</div>
  }

  const filteredTasks = fixtureChecklist.tasks.filter(task => {
    if (filter === 'pending') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  const completedCount = fixtureChecklist.tasks.filter(t => t.completed).length
  const totalCount = fixtureChecklist.tasks.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Live matchday operational checklist. Click to mark tasks complete.
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({totalCount})
          </Button>
          <Button
            variant={filter === 'pending' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending ({totalCount - completedCount})
          </Button>
          <Button
            variant={filter === 'completed' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed ({completedCount})
          </Button>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Match Progress</span>
          <span className="text-sm text-muted-foreground">
            {completedCount} of {totalCount} tasks completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {progressPercent.toFixed(1)}% complete
        </div>
      </div>

      {/* Tasks list */}
      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`border rounded-lg p-4 transition-all ${
              task.completed 
                ? 'bg-green-50 border-green-200 opacity-75' 
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => handleTaskToggle(task.id, !task.completed)}
                className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  task.completed
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-gray-300 hover:border-green-500'
                }`}
              >
                {task.completed && <CheckCircle className="h-3 w-3" />}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{task.minute}&apos;</span>
                  <Badge variant="outline" className="text-xs">
                    {task.assignedRole || 'Unassigned'}
                  </Badge>
                </div>
                
                <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {task.description}
                </p>
                
                {task.completed && task.completedAt && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Completed at {new Date(task.completedAt).toLocaleTimeString()}</span>
                    {task.completedBy && (
                      <>
                        <User className="h-3 w-3 ml-2" />
                        <span>by {task.completedBy}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {filter === 'all' ? 'No tasks found' : `No ${filter} tasks`}
        </div>
      )}
    </div>
  )
}

// Setup Tab Component - Task Configuration
export function FixtureSetup({ onSave }: FixtureModalProps) {
  const [fixtureChecklist, setFixtureChecklist] = useState<FixtureChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newTask, setNewTask] = useState<Partial<FixtureTask>>({ 
    minute: 0, 
    description: '', 
    assignedRole: '', 
    completed: false 
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/football/fixture?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (res.ok) {
        const data = await res.json()
        setFixtureChecklist(data)
      }
    } catch (error) {
      console.error('Failed to load fixture data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!fixtureChecklist) return
    
    setSaving(true)
    try {
      await fetch('/api/football/fixture', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: fixtureChecklist.tasks }),
      })
      onSave?.()
    } catch (error) {
      console.error('Failed to save fixture checklist:', error)
    } finally {
      setSaving(false)
    }
  }

  const addTask = () => {
    if (!fixtureChecklist || !newTask.description || newTask.minute === 0) return

    const task: FixtureTask = {
      id: `task-${Date.now()}`,
      minute: newTask.minute || 0,
      description: newTask.description,
      assignedRole: newTask.assignedRole,
      completed: false,
    }

    const updatedTasks = [...fixtureChecklist.tasks, task].sort((a, b) => a.minute - b.minute)
    setFixtureChecklist({ ...fixtureChecklist, tasks: updatedTasks })
    setNewTask({ minute: 0, description: '', assignedRole: '', completed: false })
  }

  const removeTask = (taskId: string) => {
    if (!fixtureChecklist) return

    const updatedTasks = fixtureChecklist.tasks.filter(t => t.id !== taskId)
    setFixtureChecklist({ ...fixtureChecklist, tasks: updatedTasks })
  }

  const updateTask = (taskId: string, updates: Partial<FixtureTask>) => {
    if (!fixtureChecklist) return

    const updatedTasks = fixtureChecklist.tasks.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ).sort((a, b) => a.minute - b.minute)
    
    setFixtureChecklist({ ...fixtureChecklist, tasks: updatedTasks })
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  if (!fixtureChecklist) {
    return <div className="p-4 text-center text-red-600">Failed to load fixture data</div>
  }

  const roleOptions = ['Stewards', 'Police', 'Medical', 'Safety Officer', 'Response Team', 'Control Room', 'Unassigned']

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Configure matchday operational tasks. Changes require explicit save.
      </div>
      
      {/* Add new task */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-3">Add New Task</h4>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Minute (e.g., 15)"
            value={newTask.minute || ''}
            onChange={(e) => setNewTask({ ...newTask, minute: parseInt(e.target.value) || 0 })}
            min="0"
            max="120"
          />
          <select
            value={newTask.assignedRole || ''}
            onChange={(e) => setNewTask({ ...newTask, assignedRole: e.target.value })}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value="">Select Role</option>
            {roleOptions.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <Input
            placeholder="Task description"
            value={newTask.description || ''}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            className="col-span-2"
          />
          <Button onClick={addTask} disabled={!newTask.description || newTask.minute === 0}>
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </div>
      </div>
      
      {/* Tasks list */}
      <div className="space-y-2">
        {fixtureChecklist.tasks.map((task, index) => (
          <div key={task.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">#{index + 1}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Minute</label>
                <Input
                  type="number"
                  value={task.minute}
                  onChange={(e) => updateTask(task.id, { minute: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                  min="0"
                  max="120"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Assigned Role</label>
                <select
                  value={task.assignedRole || ''}
                  onChange={(e) => updateTask(task.id, { assignedRole: e.target.value })}
                  className="w-full px-2 py-1 border rounded text-sm mt-1"
                >
                  <option value="">Unassigned</option>
                  {roleOptions.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Description</label>
                <Input
                  value={task.description}
                  onChange={(e) => updateTask(task.id, { description: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeTask(task.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t pt-4">
        <div className="text-sm font-medium">
          Total Tasks: {fixtureChecklist.tasks.length}
        </div>
      </div>
    </div>
  )
}
