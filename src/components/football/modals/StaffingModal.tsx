'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StaffingData, StaffingRole } from '@/types/football'
import { 
  Plus, 
  Trash2, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Heart, 
  Shield, 
  Briefcase 
} from 'lucide-react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

interface StaffingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

// Internal Tab Props
interface StaffingTabProps {
  onSave?: () => void
}

// --- Helper: Icon Mapping ---
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    'heart': Heart,
    'shield': Shield,
    'users': Users,
  }
  const IconComponent = iconMap[iconName] || Users
  return <IconComponent className="w-5 h-5" />
}

// --- CURRENT TAB: ACTUAL NUMBERS ---
export function StaffingActual({ onSave }: StaffingTabProps) {
  const [context, setContext] = useState<{ companyId: string; eventId: string } | null>(null)
  const [contextLoading, setContextLoading] = useState(true)
  const [staffingData, setStaffingData] = useState<StaffingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [targetSettings, setTargetSettings] = useState({
    target_threshold: 90,
    alert_threshold: 85,
  })

  useEffect(() => {
    const resolveContext = async () => {
      setContextLoading(true)
      try {
        const [{ data: userResponse }, eventRes] = await Promise.all([
          supabase.auth.getUser(),
          fetch('/api/get-current-event'),
        ])
        const user = userResponse.user
        if (!user) return
        const eventJson = await eventRes.json()
        const eventId = eventJson?.event?.id
        if (!eventId) return
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single()
        if (!profile?.company_id) return
        setContext({ companyId: profile.company_id, eventId })
      } catch (error) {
        console.error('Failed to resolve staffing context', error)
      } finally {
        setContextLoading(false)
      }
    }
    resolveContext()
  }, [])

  const loadData = async (ctx: { companyId: string; eventId: string }) => {
    try {
      const res = await fetch(`/api/football/staffing?company_id=${ctx.companyId}&event_id=${ctx.eventId}`)
      if (res.ok) {
        const data = await res.json()
        setStaffingData({ roles: data.roles })
      }
    } catch (error) {
      console.error('Failed to load staffing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTargetSettings = async (ctx: { companyId: string; eventId: string }) => {
    try {
      const res = await fetch(
        `/api/football/settings?company_id=${ctx.companyId}&event_id=${ctx.eventId}&tool_type=staffing`
      )
      if (res.ok) {
        const data = await res.json()
        if (data.settings_json) {
          setTargetSettings({
            target_threshold: data.settings_json.target_threshold || 90,
            alert_threshold: data.settings_json.alert_threshold || 85,
          })
        }
      }
    } catch (error) {
      console.error('Failed to load target settings:', error)
    }
  }

  const getStatusForRole = (percentOfPlanned: number): { status: 'at-target' | 'near-target' | 'below-target', label: string, color: string } => {
    const targetThreshold = targetSettings.target_threshold
    const alertThreshold = targetSettings.alert_threshold

    if (percentOfPlanned >= targetThreshold) {
      return { status: 'at-target', label: 'At Target', color: 'green' }
    } else if (percentOfPlanned >= alertThreshold) {
      return { status: 'near-target', label: 'Near Target', color: 'amber' }
    } else {
      return { status: 'below-target', label: 'Below Target', color: 'red' }
    }
  }

  useEffect(() => {
    if (!context) return
    setLoading(true)
    loadData(context)
    loadTargetSettings(context)
  }, [context])

  const handleActualChange = async (roleId: string, actual: number) => {
    if (!staffingData || !context) return

    const updatedRoles = staffingData.roles.map(role =>
      role.id === roleId ? { ...role, actual } : role
    )
    
    setStaffingData({ roles: updatedRoles })

    try {
      await fetch('/api/football/staffing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-company-id': context.companyId,
          'x-event-id': context.eventId,
        },
        body: JSON.stringify({ roleId, actual }),
      })
    } catch (error) {
      console.error('Failed to auto-save actual staffing:', error)
    }
  }

  if (loading || contextLoading) return <div className="p-8 text-center text-slate-500">Loading staffing data...</div>
  if (!staffingData) return <div className="p-8 text-center text-red-500">Failed to load data</div>

  return (
    <div className="space-y-6 pr-2 pb-4">
      
      {/* Roles List */}
      <div className="space-y-4">
        {staffingData.roles.map((role) => {
          const variance = role.actual - role.planned
          const percentOfPlanned = role.planned > 0 ? (role.actual / role.planned) * 100 : 0
          const status = getStatusForRole(percentOfPlanned)
          
          return (
            <div key={role.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${role.color === 'blue' ? 'bg-blue-100 text-blue-600' : role.color === 'orange' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                     {getIconComponent(role.icon || 'users')}
                  </div>
                  <div>
                     <h4 className="font-bold text-slate-900">{role.name}</h4>
                     <span className="text-xs text-slate-500">{percentOfPlanned.toFixed(0)}% Deployed</span>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                   status.status === 'below-target' ? 'bg-red-100 text-red-700' :
                   status.status === 'near-target' ? 'bg-amber-100 text-amber-700' :
                   'bg-green-100 text-green-700'
                }`}>
                   {status.label}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 items-end">
                <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-slate-500 uppercase">Actual On Site</label>
                   <Input
                     type="number"
                     value={role.actual}
                     onChange={(e) => handleActualChange(role.id, parseInt(e.target.value) || 0)}
                     className="h-10 text-lg font-bold bg-slate-50 border-slate-200 focus:bg-white"
                     min="0"
                   />
                </div>
                
                <div className="space-y-1.5 text-right pb-2">
                   <span className="text-xs text-slate-400 uppercase font-bold">Target</span>
                   <div className="text-xl font-bold text-slate-700">{role.planned}</div>
                </div>
              </div>
              
              {/* Variance */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                 <span className="text-slate-400 font-medium">Variance</span>
                 <span className={`font-bold ${variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {variance > 0 ? '+' : ''}{variance} Staff
                 </span>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Total Summary */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex justify-between items-center">
        <div>
           <p className="text-xs font-bold text-slate-400 uppercase">Total Deployment</p>
           <p className="text-2xl font-bold text-slate-900">{staffingData.roles.reduce((sum, r) => sum + r.actual, 0)}</p>
        </div>
        <div className="text-right">
           <p className="text-xs font-bold text-slate-400 uppercase">Total Planned</p>
           <p className="text-xl font-semibold text-slate-600">{staffingData.roles.reduce((sum, r) => sum + r.planned, 0)}</p>
        </div>
      </div>
    </div>
  )
}

// --- SETUP TAB: CONFIGURATION ---
export function StaffingDeployment({ onSave }: StaffingTabProps) {
  const [context, setContext] = useState<{ companyId: string; eventId: string } | null>(null)
  const [contextLoading, setContextLoading] = useState(true)
  const [staffingData, setStaffingData] = useState<StaffingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newRole, setNewRole] = useState<Partial<StaffingRole>>({
    name: '',
    planned: 0,
    actual: 0,
    icon: 'users',
    color: 'blue',
  })
  const [targetSettings, setTargetSettings] = useState({
    target_threshold: 90,
    alert_threshold: 85,
  })

  const colorOptions = [
    { value: 'blue', label: 'Blue' },
    { value: 'orange', label: 'Orange' },
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
  ]

  const iconOptions = [
    { value: 'heart', label: 'Heart' },
    { value: 'shield', label: 'Shield' },
    { value: 'users', label: 'Users' },
  ]

  useEffect(() => {
    const resolveContext = async () => {
      setContextLoading(true)
      try {
        const [{ data: userResponse }, eventRes] = await Promise.all([
          supabase.auth.getUser(),
          fetch('/api/get-current-event'),
        ])
        const user = userResponse.user
        if (!user) return
        const eventJson = await eventRes.json()
        const eventId = eventJson?.event?.id
        if (!eventId) return
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single()
        if (!profile?.company_id) return
        setContext({ companyId: profile.company_id, eventId })
      } catch (error) {
        console.error('Failed to resolve staffing context', error)
      } finally {
        setContextLoading(false)
      }
    }
    resolveContext()
  }, [])

  const loadTargetSettings = async (ctx: { companyId: string; eventId: string }) => {
    try {
      const res = await fetch(
        `/api/football/settings?company_id=${ctx.companyId}&event_id=${ctx.eventId}&tool_type=staffing`
      )
      if (res.ok) {
        const data = await res.json()
        if (data.settings_json) {
          setTargetSettings({
            target_threshold: data.settings_json.target_threshold || 90,
            alert_threshold: data.settings_json.alert_threshold || 85,
          })
        }
      }
    } catch (error) { console.error(error) }
  }

  const loadData = async (ctx: { companyId: string; eventId: string }) => {
    try {
      const res = await fetch(`/api/football/staffing?company_id=${ctx.companyId}&event_id=${ctx.eventId}`)
      if (res.ok) {
        const data = await res.json()
        setStaffingData({ roles: data.roles })
      }
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  useEffect(() => {
    if (!context) return
    setLoading(true)
    loadData(context)
    loadTargetSettings(context)
  }, [context])

  const saveTargetSettings = async () => {
    if (!context) return
    try {
      await fetch(`/api/football/settings?company_id=${context.companyId}&event_id=${context.eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_type: 'staffing',
          settings_json: targetSettings,
        }),
      })
      alert('Settings saved')
    } catch (error) { console.error(error); alert('Failed to save') }
  }

  const addRole = async () => {
    if (!context || !newRole.name || !newRole.planned) return
    setSaving(true)
    try {
      const res = await fetch('/api/football/staffing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-company-id': context.companyId,
          'x-event-id': context.eventId,
        },
        body: JSON.stringify({
          action: 'create',
          data: {
            name: newRole.name,
            planned: newRole.planned,
            icon: newRole.icon || 'users',
            color: newRole.color || 'blue',
          },
        }),
      })
      if (!res.ok) throw new Error('Failed')
      await loadData(context)
      setNewRole({ name: '', planned: 0, actual: 0, icon: 'users', color: 'blue' })
    } catch (error) { console.error(error) } finally { setSaving(false) }
  }

  const removeRole = async (roleId: string) => {
    if (!context) return
    setSaving(true)
    try {
      await fetch('/api/football/staffing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-company-id': context.companyId,
          'x-event-id': context.eventId,
        },
        body: JSON.stringify({
          action: 'delete',
          data: { id: roleId },
        }),
      })
      await loadData(context)
    } catch (error) { console.error(error) } finally { setSaving(false) }
  }

  if (loading) return <div className="p-4 text-center">Loading...</div>
  if (!staffingData) return <div className="p-4 text-center text-red-600">Failed to load</div>

  return (
    <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-200px)] pr-2 pb-4">
      
      {/* Thresholds */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex justify-between items-start">
           <div>
             <h4 className="text-sm font-bold text-slate-800">KPI Thresholds</h4>
             <p className="text-xs text-slate-500 mt-1">Define success criteria percentages.</p>
           </div>
           <Button onClick={saveTargetSettings} size="sm" variant="outline" className="h-8 text-xs">Save Settings</Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded border border-slate-200">
            <label className="text-xs font-bold text-green-600 uppercase block mb-1">Target (Green)</label>
            <div className="flex items-center gap-2">
               <Input
                 type="number"
                 value={targetSettings.target_threshold}
                 onChange={(e) => setTargetSettings({ ...targetSettings, target_threshold: parseInt(e.target.value) || 90 })}
                 className="h-9"
               />
               <span className="text-sm font-medium text-slate-500">%</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <label className="text-xs font-bold text-amber-600 uppercase block mb-1">Alert (Amber)</label>
            <div className="flex items-center gap-2">
               <Input
                 type="number"
                 value={targetSettings.alert_threshold}
                 onChange={(e) => setTargetSettings({ ...targetSettings, alert_threshold: parseInt(e.target.value) || 85 })}
                 className="h-9"
               />
               <span className="text-sm font-medium text-slate-500">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Role */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 grid grid-cols-12 gap-3 items-end">
         <div className="col-span-4">
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Role Name</label>
            <Input placeholder="e.g. Security" value={newRole.name} onChange={e => setNewRole({...newRole, name: e.target.value})} className="bg-white h-9" />
         </div>
         <div className="col-span-3">
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Planned</label>
            <Input type="number" placeholder="0" value={newRole.planned} onChange={e => setNewRole({...newRole, planned: parseInt(e.target.value)})} className="bg-white h-9" />
         </div>
         <div className="col-span-3">
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Icon</label>
            <select 
              className="w-full h-9 rounded-md border border-slate-200 text-sm px-2 bg-white"
              value={newRole.icon}
              onChange={e => setNewRole({...newRole, icon: e.target.value})}
            >
               {iconOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
         </div>
         <div className="col-span-2">
            <Button onClick={addRole} disabled={!newRole.name} className="w-full h-9 text-xs">
               <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
         </div>
      </div>

      {/* Existing Roles */}
      <div className="space-y-3">
        {staffingData.roles.map((role) => (
           <div key={role.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg bg-slate-100 text-slate-600`}>
                    {getIconComponent(role.icon || 'users')}
                 </div>
                 <div>
                    <p className="font-bold text-sm text-slate-900">{role.name}</p>
                    <p className="text-xs text-slate-500">Target: {role.planned}</p>
                 </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeRole(role.id)} className="text-red-500 hover:bg-red-50 hover:text-red-700">
                 <Trash2 className="h-4 w-4" />
              </Button>
           </div>
        ))}
      </div>

    </div>
  )
}

// --- MAIN MODAL COMPONENT ---
export default function StaffingLevelsModal({ isOpen, onClose, onSave }: StaffingModalProps) {
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
                   <div className="p-2 bg-green-100 rounded-lg text-green-600">
                      <Briefcase className="h-5 w-5" />
                   </div>
                   <h2 className="text-lg font-bold text-slate-900">Staffing Levels</h2>
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
                      <TabsTrigger value="current" className="rounded-md text-xs font-bold uppercase tracking-wide">Live Numbers</TabsTrigger>
                      <TabsTrigger value="setup" className="rounded-md text-xs font-bold uppercase tracking-wide">Configuration</TabsTrigger>
                    </TabsList>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-white">
                    <TabsContent value="current" className="mt-0 h-full outline-none"><StaffingActual onSave={onSave} /></TabsContent>
                    <TabsContent value="setup" className="mt-0 h-full outline-none"><StaffingDeployment onSave={onSave} /></TabsContent>
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