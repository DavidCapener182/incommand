'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StaffingData } from '@/types/football'
import { 
  Plus, Trash2, Users, Heart, Shield, XMarkIcon, Briefcase, Save
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface StaffingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

const getIconComponent = (name: string) => {
  const map: any = { heart: Heart, shield: Shield, users: Users }
  const Icon = map[name] || Users
  return <Icon className="w-4 h-4" />
}

// --- ACTUAL TAB ---
function StaffingActual({ onSave }: { onSave?: () => void }) {
  const [staffingData, setStaffingData] = useState<StaffingData | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
     const load = async () => {
       try {
          const { data: { user } } = await supabase.auth.getUser()
          if(!user) return
          const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
          const eventRes = await fetch('/api/get-current-event')
          const eventJson = await eventRes.json()
          if(profile?.company_id && eventJson?.event?.id) {
             const res = await fetch(`/api/football/staffing?company_id=${profile.company_id}&event_id=${eventJson.event.id}`)
             if(res.ok) setStaffingData({ roles: (await res.json()).roles })
          }
       } catch(e){} finally { setLoading(false) }
     }
     load()
  }, [])

  const handleActualChange = async (roleId: string, actual: number) => {
     if(!staffingData) return
     const updated = staffingData.roles.map(r => r.id === roleId ? {...r, actual} : r)
     setStaffingData({ roles: updated })
     // Auto-save logic would go here
     try {
        // const res = await fetch(...)
     } catch(e) {}
  }

  if (loading) return <div className="p-8 text-center text-slate-400 text-sm">Loading staffing...</div>
  if (!staffingData) return <div className="p-8 text-center text-red-500 text-sm">No data available</div>

  return (
    <div className="space-y-3 pr-2 pb-4 h-full overflow-y-auto custom-scrollbar flex flex-col">
       <div className="space-y-3 flex-1">
       {staffingData.roles.map((role) => {
          const pct = role.planned > 0 ? (role.actual / role.planned) * 100 : 0
          const statusColor = pct >= 90 ? 'bg-green-500' : pct >= 80 ? 'bg-amber-500' : 'bg-red-500'
          
          return (
            <div key={role.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-colors">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                     <div className={cn("p-2 rounded-lg", role.color === 'blue' ? 'bg-blue-50 text-blue-600' : role.color === 'orange' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600')}>
                        {getIconComponent(role.icon || 'users')}
                     </div>
                     <div>
                        <h4 className="font-bold text-slate-900 text-sm">{role.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                           <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${statusColor} transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
                           </div>
                           <span className="text-[10px] text-slate-500 font-medium">{pct.toFixed(0)}%</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">On Site</span>
                     <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200">
                        <input 
                          type="number" 
                          value={role.actual} 
                          onChange={e => handleActualChange(role.id, parseInt(e.target.value) || 0)} 
                          className="w-12 text-right font-bold text-slate-900 bg-transparent text-sm focus:outline-none" 
                        />
                        <span className="text-xs text-slate-400 font-medium px-1 border-l border-slate-200">
                          / {role.planned}
                        </span>
                     </div>
                  </div>
               </div>
            </div>
          )
       })}
       </div>
       
       <div className="mt-auto pt-4 bg-slate-50 rounded-xl border border-slate-200 p-4 flex justify-between items-center shrink-0">
          <div>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total Deployment</p>
             <p className="text-2xl font-bold text-slate-900 mt-0.5">{staffingData.roles.reduce((s, r) => s + r.actual, 0)}</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Target</p>
             <p className="text-xl font-semibold text-slate-600 mt-0.5">{staffingData.roles.reduce((s, r) => s + r.planned, 0)}</p>
          </div>
       </div>
    </div>
  )
}

// --- SETUP TAB ---
function StaffingSetup({ onSave }: { onSave?: () => void }) {
   const [staffingData, setStaffingData] = useState<StaffingData | null>(null)
   const [newRole, setNewRole] = useState({ name: '', planned: 0, icon: 'users', color: 'blue' })
   
   useEffect(() => {
     // Fetch logic here (similar to above)
     // For demo purposes, reusing empty state logic
     setStaffingData({ roles: [] }) 
   }, [])

   // Full implementation would duplicate the add/remove logic from FixtureSetup but adapted for roles
   return (
     <div className="p-4 text-center space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl grid grid-cols-12 gap-3 items-end text-left">
             <div className="col-span-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Role Name</label>
                <Input value={newRole.name} onChange={e => setNewRole({...newRole, name: e.target.value})} className="h-8 bg-white" />
             </div>
             <div className="col-span-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target</label>
                <Input type="number" value={newRole.planned} onChange={e => setNewRole({...newRole, planned: parseInt(e.target.value)})} className="h-8 bg-white" />
             </div>
             <div className="col-span-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Icon</label>
                <select className="w-full h-8 rounded-md border border-slate-200 text-xs px-2 bg-white" value={newRole.icon} onChange={e => setNewRole({...newRole, icon: e.target.value})}>
                   <option value="users">Users</option>
                   <option value="shield">Shield</option>
                   <option value="heart">Medical</option>
                </select>
             </div>
             <div className="col-span-2">
                <Button size="sm" className="w-full h-8 text-xs"><Plus className="w-3 h-3" /></Button>
             </div>
        </div>
        <p className="text-xs text-slate-400 italic">Existing roles list would appear here...</p>
     </div>
   )
}

// --- MAIN MODAL ---
export default function FootballCard_MedicalPolicing_Modal({ isOpen, onClose, onSave }: StaffingModalProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'current' | 'setup'>('current')

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9998]" />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-200 pointer-events-auto overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                   <div className="p-1.5 bg-green-100 rounded-lg text-green-600"><Briefcase className="h-4 w-4" /></div>
                   <h2 className="text-base font-bold text-slate-900">Staffing Levels</h2>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><XMarkIcon className="h-5 w-5" /></button>
              </div>

              {/* Tabs */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col h-full">
                  <div className="px-5 pt-3 shrink-0">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-lg">
                      <TabsTrigger value="current" className="rounded-md text-xs font-bold uppercase tracking-wide">Actual Numbers</TabsTrigger>
                      <TabsTrigger value="setup" className="rounded-md text-xs font-bold uppercase tracking-wide">Configuration</TabsTrigger>
                    </TabsList>
                  </div>
                  <div className="flex-1 overflow-hidden px-5 py-4">
                    <TabsContent value="current" className="h-full mt-0"><StaffingActual onSave={onSave} /></TabsContent>
                    <TabsContent value="setup" className="h-full mt-0"><StaffingSetup onSave={onSave} /></TabsContent>
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