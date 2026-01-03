'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FixtureChecklist, FixtureTask } from '@/types/football'
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  User, 
  Filter, 
  ListTodo 
} from 'lucide-react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface FixtureModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

// Internal Prop Type for Sub-components
interface FixtureTabProps {
  onSave?: () => void
}

// --- CURRENT TAB: LIVE CHECKLIST ---
export function FixtureCurrent({ onSave }: FixtureTabProps) {
  const [fixtureChecklist, setFixtureChecklist] = useState<FixtureChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Using hardcoded IDs as per original snippet - replace with dynamic context if needed
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
            completedBy: completed ? 'Current User' : undefined 
          } 
        : task
    )
    
    setFixtureChecklist({ ...fixtureChecklist, tasks: updatedTasks })

    try {
      await fetch('/api/football/fixture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskId, 
          completed, 
          completedBy: 'Current User' 
        }),
      })
    } catch (error) {
      console.error('Failed to auto-save task completion:', error)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading checklist...</div>
  if (!fixtureChecklist) return <div className="p-8 text-center text-red-500">Failed to load fixture data</div>

  const filteredTasks = fixtureChecklist.tasks.filter(task => {
    if (filter === 'pending') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  const completedCount = fixtureChecklist.tasks.filter(t => t.completed).length
  const totalCount = fixtureChecklist.tasks.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="space-y-6 pr-2 pb-4">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div>
           <h4 className="text-sm font-bold text-slate-800">Match Progress</h4>
           <div className="flex items-center gap-2 mt-1">
              <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-xs text-slate-500 font-medium">{Math.round(progressPercent)}% Done</span>
           </div>
        </div>
        
        <div className="flex p-1 bg-slate-100 rounded-lg">
          {(['all', 'pending', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "group flex items-start gap-3 p-4 rounded-xl border transition-all duration-200",
              task.completed 
                ? "bg-slate-50 border-slate-200 opacity-75" 
                : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
            )}
          >
            <button
              onClick={() => handleTaskToggle(task.id, !task.completed)}
              className={cn(
                "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                task.completed
                  ? "bg-green-500 border-green-500 text-white"
                  : "border-slate-300 text-transparent hover:border-blue-500"
              )}
            >
              <CheckCircle className="w-3.5 h-3.5" strokeWidth={3} />
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant="outline" className={cn(
                  "text-[10px] font-mono",
                  task.minute < 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"
                )}>
                  {task.minute < 0 ? `T-${Math.abs(task.minute)}` : `T+${task.minute}`}
                </Badge>
                
                {task.assignedRole && (
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide bg-slate-100 px-1.5 py-0.5 rounded">
                    {task.assignedRole}
                  </span>
                )}
              </div>
              
              <p className={cn("text-sm font-medium leading-relaxed", task.completed ? "text-slate-500 line-through" : "text-slate-900")}>
                {task.description}
              </p>
              
              {task.completed && task.completedAt && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-green-600 font-medium">
                  <CheckCircle className="h-3 w-3" />
                  <span>Completed {new Date(task.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  {task.completedBy && <span className="text-green-600/70">• by {task.completedBy}</span>}
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <ListTodo className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No {filter} tasks found</p>
          </div>
        )}
      </div>
    </div>
  )
}

// --- SETUP TAB: CONFIGURATION ---
export function FixtureSetup({ onSave }: FixtureTabProps) {
  const [fixtureChecklist, setFixtureChecklist] = useState<FixtureChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newTask, setNewTask] = useState<Partial<FixtureTask>>({ 
    minute: 0, 
    description: '', 
    assignedRole: '', 
    completed: false 
  })
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; tasks: FixtureTask[] }>>([])
  const [templateName, setTemplateName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const roleOptions = ['Stewards', 'Police', 'Medical', 'Safety Officer', 'Response Team', 'Control Room', 'Unassigned']

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/football/settings?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001&tool_type=fixture')
      if (res.ok) {
        const data = await res.json()
        if (data.settings_json?.templates) setTemplates(data.settings_json.templates || [])
      }
    } catch (error) { console.error(error) }
  }

  const loadData = async () => {
    try {
      const res = await fetch('/api/football/fixture?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (res.ok) {
        const data = await res.json()
        setFixtureChecklist(data)
      }
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  useEffect(() => {
    loadData()
    loadTemplates()
  }, [])

  const saveTemplates = async (updatedTemplates: typeof templates) => {
    try {
      await fetch('/api/football/settings?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_type: 'fixture',
          settings_json: { templates: updatedTemplates }
        })
      })
      setTemplates(updatedTemplates)
      alert('Templates saved successfully')
    } catch (error) { console.error(error); alert('Failed to save templates') }
  }

  const saveAsTemplate = () => {
    if (!fixtureChecklist || !templateName.trim()) return alert('Enter template name')
    const newTemplate = {
      id: `template-${Date.now()}`,
      name: templateName.trim(),
      tasks: fixtureChecklist.tasks.map(t => ({ ...t, completed: false }))
    }
    saveTemplates([...templates, newTemplate])
    setTemplateName('')
  }

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template && fixtureChecklist) {
      setFixtureChecklist({
        ...fixtureChecklist,
        tasks: template.tasks.map(t => ({ ...t, completed: false }))
      })
      setSelectedTemplate(templateId)
    }
  }

  const deleteTemplate = (templateId: string) => {
    if (confirm('Delete template?')) {
      const updated = templates.filter(t => t.id !== templateId)
      saveTemplates(updated)
      if (selectedTemplate === templateId) setSelectedTemplate(null)
    }
  }

  const seedDefaultTasks = async () => {
    if (!fixtureChecklist) return
    const defaultTasks: FixtureTask[] = [
      { id: `task-${Date.now()}-1`, minute: -180, description: 'Final security briefing', assignedRole: 'Safety Officer', completed: false },
      { id: `task-${Date.now()}-5`, minute: -45, description: 'Open gates for early arrivals', assignedRole: 'Stewards', completed: false },
      { id: `task-${Date.now()}-8`, minute: -5, description: 'Final pre-match safety check', assignedRole: 'Safety Officer', completed: false },
      { id: `task-${Date.now()}-10`, minute: 30, description: 'Half-time security check', assignedRole: 'Security', completed: false },
      { id: `task-${Date.now()}-20`, minute: 90, description: 'End of match procedures', assignedRole: 'Control Room', completed: false },
    ]
    const updatedTasks = [...fixtureChecklist.tasks, ...defaultTasks].sort((a, b) => a.minute - b.minute)
    setFixtureChecklist({ ...fixtureChecklist, tasks: updatedTasks })
  }

  const addTask = () => {
    if (!fixtureChecklist || !newTask.description || newTask.minute === undefined) return
    const task: FixtureTask = {
      id: `task-${Date.now()}`,
      minute: newTask.minute || 0,
      description: newTask.description,
      assignedRole: newTask.assignedRole || 'Unassigned',
      completed: false,
    }
    const updatedTasks = [...fixtureChecklist.tasks, task].sort((a, b) => a.minute - b.minute)
    setFixtureChecklist({ ...fixtureChecklist, tasks: updatedTasks })
    setNewTask({ minute: 0, description: '', assignedRole: '', completed: false })
  }

  const removeTask = (taskId: string) => {
    if (!fixtureChecklist) return
    setFixtureChecklist({ ...fixtureChecklist, tasks: fixtureChecklist.tasks.filter(t => t.id !== taskId) })
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
    } catch (error) { console.error(error) } finally { setSaving(false) }
  }

  if (loading) return <div className="p-4 text-center">Loading...</div>
  if (!fixtureChecklist) return <div className="p-4 text-center text-red-600">Failed to load</div>

  return (
    <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-200px)] pr-2">
      
      {/* Templates Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex justify-between items-start">
           <div>
             <h4 className="text-sm font-bold text-slate-800">Templates & Defaults</h4>
             <p className="text-xs text-slate-500 mt-1">Manage reusable checklists.</p>
           </div>
           <Button onClick={seedDefaultTasks} variant="outline" size="sm" className="h-8 text-xs">
              <Plus className="h-3 w-3 mr-1.5" /> Add Defaults
           </Button>
        </div>
        
        <div className="flex gap-2">
           <Input 
             placeholder="Template name..." 
             value={templateName} 
             onChange={e => setTemplateName(e.target.value)} 
             className="h-9 text-sm bg-white" 
           />
           <Button onClick={saveAsTemplate} size="sm" disabled={!templateName.trim()} className="h-9">Save Current</Button>
        </div>

        {templates.length > 0 && (
           <div className="space-y-2 pt-2 border-t border-slate-200">
              {templates.map(t => (
                 <div key={t.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                    <span className="text-sm font-medium pl-2">{t.name}</span>
                    <div className="flex gap-2">
                       <Button onClick={() => loadTemplate(t.id)} size="sm" variant="ghost" className="h-7 text-xs">Load</Button>
                       <Button onClick={() => deleteTemplate(t.id)} size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                 </div>
              ))}
           </div>
        )}
      </div>

      {/* Task Editor */}
      <div className="space-y-4">
         <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl grid grid-cols-12 gap-3">
            <div className="col-span-2">
               <label className="text-xs font-semibold text-slate-500 uppercase">Min</label>
               <Input type="number" value={newTask.minute} onChange={e => setNewTask({...newTask, minute: parseInt(e.target.value)})} className="h-9 bg-white" />
            </div>
            <div className="col-span-3">
               <label className="text-xs font-semibold text-slate-500 uppercase">Role</label>
               <select 
                 className="w-full h-9 rounded-md border border-slate-200 text-sm px-2 bg-white"
                 value={newTask.assignedRole}
                 onChange={e => setNewTask({...newTask, assignedRole: e.target.value})}
               >
                 <option value="">Role...</option>
                 {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
               </select>
            </div>
            <div className="col-span-5">
               <label className="text-xs font-semibold text-slate-500 uppercase">Task</label>
               <Input placeholder="Description..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="h-9 bg-white" />
            </div>
            <div className="col-span-2 flex items-end">
               <Button onClick={addTask} disabled={!newTask.description} className="w-full h-9 text-xs">Add</Button>
            </div>
         </div>

         <div className="space-y-2">
            {fixtureChecklist.tasks.map((task, idx) => (
               <div key={task.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg group hover:border-blue-200 transition-colors">
                  <span className="text-xs font-mono font-medium text-slate-400 w-8">#{idx + 1}</span>
                  <div className="flex-1 grid grid-cols-12 gap-3 items-center">
                     <span className="col-span-2 text-sm font-bold text-slate-700">{task.minute}&apos;</span>
                     <span className="col-span-3 text-xs px-2 py-1 bg-slate-100 rounded text-slate-600 text-center truncate">{task.assignedRole}</span>
                     <span className="col-span-7 text-sm text-slate-800 truncate">{task.description}</span>
                  </div>
                  <button onClick={() => removeTask(task.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                     <Trash2 className="h-4 w-4" />
                  </button>
               </div>
            ))}
         </div>
      </div>
      
      <div className="sticky bottom-0 pt-4 border-t border-slate-100 bg-white flex justify-end">
         <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
         </Button>
      </div>

    </div>
  )
}

// --- MAIN MODAL COMPONENT ---
export default function FixtureChecklistModal({ isOpen, onClose, onSave }: FixtureModalProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'current' | 'setup'>('current')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9998]"
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-200 pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                   <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <ListTodo className="h-5 w-5" />
                   </div>
                   <h2 className="text-lg font-bold text-slate-900">Fixture Checklist</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'current' | 'setup')} className="flex flex-col h-full">
                  <div className="px-6 pt-4 shrink-0">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-lg">
                      <TabsTrigger value="current" className="rounded-md text-xs font-bold uppercase tracking-wide">Current Match</TabsTrigger>
                      <TabsTrigger value="setup" className="rounded-md text-xs font-bold uppercase tracking-wide">Configuration</TabsTrigger>
                    </TabsList>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-white">
                    <TabsContent value="current" className="mt-0 h-full outline-none"><FixtureCurrent onSave={onSave} /></TabsContent>
                    <TabsContent value="setup" className="mt-0 h-full outline-none"><FixtureSetup onSave={onSave} /></TabsContent>
                  </div>
                </Tabs>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
