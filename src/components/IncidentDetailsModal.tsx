// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { supabase } from '../lib/supabase'
import type { Database } from '@/types/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useAuth } from '@/contexts/AuthContext'
import { useIsAdmin } from '@/hooks/useRole'
import { 
  XMarkIcon, 
  ClockIcon, 
  UserIcon, 
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  PencilIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  MapPinIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import PriorityBadge from './PriorityBadge'
import EscalationModal, { type EscalationResponse } from './EscalationModal'
import IncidentRevisionHistory from './IncidentRevisionHistory'
import IncidentAmendmentModal from './IncidentAmendmentModal'
import { cn } from '@/lib/utils'
import {
  getIncidentTypeStyle,
  getPriorityBorderClass,
  normalizePriority,
  type Priority,
} from '../utils/incidentStyles'
import { getIncidentTypeIcon } from '../utils/incidentIcons'
import { 
  formatDualTimestamp, 
} from '@/lib/auditableLogging'
import dynamic from 'next/dynamic'
import IncidentRadioMessages from './incidents/IncidentRadioMessages'

const DecisionLogger = dynamic(() => import('./decisions/DecisionLogger'), {
  ssr: false,
  loading: () => null,
})

interface Props {
  isOpen: boolean
  onClose: () => void
  incidentId: string | null
}

interface IncidentUpdate {
  id: string
  incident_id: string
  update_text: string
  updated_by: string
  created_at: string
}

interface Incident {
  id: string
  log_number: string
  timestamp: string
  callsign_from: string
  callsign_to: string
  occurrence: string
  incident_type: string
  action_taken: string
  is_closed: boolean
  created_at: string
  updated_at: string
  photo_url?: string
  status?: string
  priority?: string
  escalation_level?: number
  escalate_at?: string
  escalated?: boolean
  assigned_staff_ids?: string[]
  auto_assigned?: boolean
  dependencies?: string[]
  what3words?: string
  time_of_occurrence?: string
  time_logged?: string
  entry_type?: 'contemporaneous' | 'retrospective'
  retrospective_justification?: string
  logged_by_user_id?: string
  logged_by_callsign?: string
  is_amended?: boolean
  original_entry_id?: string
  // AI-generated fields
  ai_tags?: string[]
  risk_matrix_scores?: any
  log_quality_score?: number
  ethane_reports?: any
  generated_radio_script?: string
  translated_text?: string
  chronology?: any[]
}

export default function IncidentDetailsModal({ isOpen, onClose, incidentId }: Props) {
  const isAdmin = useIsAdmin()
  const { user } = useAuth()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [updates, setUpdates] = useState<IncidentUpdate[]>([])
  const [newUpdate, setNewUpdate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editedIncident, setEditedIncident] = useState<Partial<Incident>>({})
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const [callsignAssignments, setCallsignAssignments] = useState<Record<string, string>>({})
  const [callsignShortToName, setCallsignShortToName] = useState<Record<string, string>>({})
  const [currentEventId, setCurrentEventId] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [showFullImage, setShowFullImage] = useState(false)
  const [isEscalationModalOpen, setIsEscalationModalOpen] = useState(false)
  const [isAmendmentModalOpen, setIsAmendmentModalOpen] = useState(false)
  const [revisionCount, setRevisionCount] = useState(0)
  const [currentUserName, setCurrentUserName] = useState('Event Control')
  const [showDecisionLogger, setShowDecisionLogger] = useState(false)
  const [selectedField, setSelectedField] = useState<'occurrence' | 'action_taken' | null>(null)

  // --- 1. Logic & Effects (Unchanged) ---

  useEffect(() => {
    let cancelled = false
    const resolveDisplayName = async () => {
      if (!user?.id) {
        setCurrentUserName('Event Control')
        return
      }
      const metadataName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || (user.user_metadata?.display_name as string)
      if (metadataName) {
        setCurrentUserName(metadataName)
        return
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, full_name, callsign')
          .eq('id', user.id)
          .maybeSingle()
        if (cancelled) return
        if (error) throw error
        const profileName = data?.display_name || data?.full_name || data?.callsign || user.email || 'Event Control'
        setCurrentUserName(profileName)
      } catch (profileError) {
        if (!cancelled) setCurrentUserName(user.email || 'Event Control')
      }
    }
    resolveDisplayName()
    return () => { cancelled = true }
  }, [user?.id, user?.email, user?.user_metadata])

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Timestamp unavailable'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 'Timestamp unavailable' : date.toLocaleString()
  }

  const cleanup = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  };

  useEffect(() => {
    const fetchEvent = async () => {
      const { data: eventData } = await supabase.from('events').select('id').eq('is_current', true).single();
      setCurrentEventId(eventData?.id || null);
    };
    fetchEvent();
  }, []);

  const fetchAssignments = useCallback(async () => {
    if (!currentEventId) return;
    try {
      const { data: assignmentsData } = await supabase.from('callsign_assignments').select('callsign, staff_id, staff_name').eq('event_id', currentEventId);
      if (assignmentsData) {
        const assignmentsMap: Record<string, string> = {};
        const shortToNameMap: Record<string, string> = {};
        assignmentsData.forEach((assignment: any) => {
          if (assignment.callsign && assignment.staff_name) {
            assignmentsMap[assignment.callsign.toUpperCase()] = assignment.staff_name;
            shortToNameMap[assignment.callsign.toUpperCase()] = assignment.staff_name;
          }
        });
        setCallsignAssignments(assignmentsMap);
        setCallsignShortToName(shortToNameMap);
      }
    } catch (error) { console.error(error); }
  }, [currentEventId]);

  const getSignedUrl = useCallback(async (photoUrl?: string) => {
    const targetPhotoUrl = photoUrl ?? incident?.photo_url;
    if (!targetPhotoUrl) return;
    try {
      const { data } = await supabase.storage.from('incident-photos').createSignedUrl(targetPhotoUrl, 3600);
      if (data?.signedUrl) setPhotoUrl(data.signedUrl);
    } catch (error) { console.error(error); }
  }, [incident?.photo_url]);

  const fetchIncidentDetails = useCallback(async () => {
    if (!incidentId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: incidentData, error: incidentError } = await supabase.from('incident_logs').select('*').eq('id', Number(incidentId)).single();
      if (incidentError) throw incidentError;
      setIncident(incidentData as any);
      setEditedIncident(incidentData as any);

      if (incidentData?.is_amended) {
        const { count } = await supabase.from('incident_log_revisions').select('*', { count: 'exact', head: true }).eq('incident_log_id', Number(incidentId))
        setRevisionCount(count || 0)
      } else {
        setRevisionCount(0)
      }

      const { data: updatesData, error: updatesError } = await supabase.from('incident_updates').select('*').eq('incident_id', Number(incidentId)).order('created_at', { ascending: false });
      if (updatesError) throw updatesError;
      setUpdates((updatesData || []) as any);

      await Promise.all([fetchAssignments(), getSignedUrl(incidentData?.photo_url)]);
    } catch (err) {
      setError('Failed to load incident details');
    } finally {
      setLoading(false);
    }
  }, [incidentId, fetchAssignments, getSignedUrl]);

  useEffect(() => {
    if (isOpen && incidentId) {
      fetchIncidentDetails();
      cleanup();
      subscriptionRef.current = supabase.channel(`incident_${incidentId}_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incident_updates', filter: `incident_id=eq.${incidentId}` }, () => fetchIncidentDetails())
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'incident_logs', filter: `id=eq.${incidentId}` }, () => fetchIncidentDetails())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incident_log_revisions', filter: `incident_log_id=eq.${incidentId}` }, () => fetchIncidentDetails())
        .subscribe();
    }
    return cleanup;
  }, [isOpen, incidentId, fetchIncidentDetails]);

  const handleEscalationSuccess = (_escalation: EscalationResponse) => {
    setIncident((prev) => prev ? ({ ...prev, escalated: true, escalation_level: (prev.escalation_level ?? 0) + 1 }) : prev)
    setEditedIncident((prev) => ({ ...prev, escalated: true, escalation_level: (typeof prev.escalation_level === 'number' ? prev.escalation_level + 1 : (incident?.escalation_level ?? 0) + 1) }))
    fetchIncidentDetails();
    setIsEscalationModalOpen(false)
  }

  const handleUpdateSubmit = async () => {
    if (!newUpdate.trim() || !incident) return;
    try {
      const { error } = await supabase.from('incident_updates').insert({ incident_id: Number(incident.id), update_text: newUpdate, updated_by: currentUserName });
      if (error) throw error;
      
      const normalizedNote = newUpdate.trim().replace(/\s+/g, ' ');
      const appendedAction = `Update: ${normalizedNote.replace(/\.$/, '')}.`;
      try {
        const { data: current } = await supabase.from('incident_logs').select('action_taken').eq('id', Number(incident.id)).single();
        const prevActions = (current?.action_taken as string) || '';
        const updatedActions = prevActions ? `${prevActions.trim()} ${appendedAction}` : appendedAction;
        await supabase.from('incident_logs').update({ action_taken: updatedActions, updated_at: new Date().toISOString() }).eq('id', Number(incident.id));
        setIncident(prev => prev ? { ...prev, action_taken: updatedActions } : prev);
      } catch (err) { console.error(err); }

      setNewUpdate('');
      await fetchIncidentDetails();
    } catch (err) { setError('Failed to add update'); }
  };

  const handleSaveChanges = async () => {
    if (!incident) return;
    try {
      const { error } = await supabase.from('incident_logs').update({
          occurrence: editedIncident.occurrence,
          action_taken: editedIncident.action_taken,
          callsign_from: editedIncident.callsign_from,
          callsign_to: editedIncident.callsign_to,
          updated_at: new Date().toISOString()
        }).eq('id', Number(incident.id));
      if (error) throw error;
      await supabase.from('incident_updates').insert({ incident_id: Number(incident.id), update_text: 'Incident details updated', updated_by: currentUserName });
      setEditMode(false);
      await fetchIncidentDetails();
    } catch (err) { setError('Failed to save changes'); }
  };

  const handleStatusChange = async () => {
    if (!incident) return;
    try {
      const newStatus = !incident.is_closed;
      const { error: updateError } = await supabase.from('incident_logs').update({ is_closed: newStatus, updated_at: new Date().toISOString() }).eq('id', Number(incident.id));
      if (updateError) throw updateError;
      await supabase.from('incident_updates').insert({ incident_id: parseInt(incident.id), update_text: `Incident status changed to ${newStatus ? 'Closed' : 'Open'}`, updated_by: currentUserName });
      await fetchIncidentDetails();
    } catch (err) { setError('Failed to update incident status'); }
  };

  const handleTagClick = (tag: string, field: 'occurrence' | 'action_taken') => {
    if (!incident) return;
    setSelectedField(field);
    const currentValue = field === 'occurrence' 
      ? (editedIncident.occurrence || incident.occurrence || '') 
      : (editedIncident.action_taken || incident.action_taken || '');
    const tagToAdd = tag.startsWith('#') ? tag.substring(1) : tag;
    const newValue = currentValue.trim() ? `${currentValue.trim()} ${tagToAdd}` : tagToAdd;
    
    setEditedIncident({ ...editedIncident, [field]: newValue });
    setEditMode(true);
    setTimeout(() => setSelectedField(null), 500);
  };

  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'unset' } }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose() }
    if (isOpen) { document.addEventListener('keydown', handleEscape); return () => document.removeEventListener('keydown', handleEscape) }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // --- 2. Helper UI Components for this Modal ---
  
  const DetailItem = ({ icon: Icon, label, value, subtext }: any) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <div className="pl-5">
         <span className="text-sm font-semibold text-slate-900 block truncate" title={value}>{value || 'N/A'}</span>
         {subtext && <span className="text-[10px] text-slate-400 block truncate">{subtext}</span>}
      </div>
    </div>
  )

  const getStatusButton = (isClosed: boolean) => (
    <button
      onClick={handleStatusChange}
      className={cn(
        "flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm",
        isClosed
          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
          : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
      )}
    >
      {isClosed ? <CheckCircleIcon className="h-4 w-4" /> : <ExclamationTriangleIcon className="h-4 w-4" />}
      <span>{isClosed ? 'CLOSED' : 'OPEN'}</span>
    </button>
  )

  // --- 3. Render ---

  return typeof document !== 'undefined' ? createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-6xl h-[85vh] bg-[#F8FAFC] dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* --- HEADER --- */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-start justify-between shrink-0">
              
              {/* Title Block */}
              <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                       Log #{incident?.log_number}
                    </h2>
                    {incident && (
                      <div className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border", getIncidentTypeStyle(incident.incident_type))}>
                         {incident.incident_type}
                      </div>
                    )}
                    <PriorityBadge priority={incident?.priority} />
                 </div>
                 <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {incident?.time_of_occurrence ? (
                        formatDualTimestamp(
                          incident.time_of_occurrence, 
                          incident.time_logged, 
                          incident.entry_type as any
                        ).occurred
                    ) : formatDateTime(incident?.timestamp)}
                 </p>
              </div>

              {/* Actions Block */}
              <div className="flex items-center gap-2">
                 {incident && (
                   <button
                     onClick={() => setShowDecisionLogger(true)}
                     className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                   >
                     <ClipboardDocumentIcon className="h-4 w-4" />
                     Log Decision
                   </button>
                 )}
                 {incident && incident.incident_type !== 'Sit Rep' && getStatusButton(incident.is_closed)}
                 <div className="h-6 w-px bg-slate-200 mx-1" />
                 <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                    <XMarkIcon className="h-5 w-5" />
                 </button>
              </div>
            </div>

            {/* --- MAIN BODY --- */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              
              {/* LEFT COLUMN: Details */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#F8FAFC]">
                
                {loading ? (
                   <div className="flex justify-center items-center h-full">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                   </div>
                ) : error ? (
                   <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-center text-sm">
                     {error}
                   </div>
                ) : (
                   <>
                      {/* Radio Context */}
                      {incident && <IncidentRadioMessages incidentId={incident.id} eventId={currentEventId} />}

                      {/* Metadata Grid Card */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <DetailItem icon={ClockIcon} label="Occurred" value={formatDateTime(incident?.time_of_occurrence || incident?.timestamp)} />
                            <DetailItem 
                              icon={UserIcon} 
                              label="From" 
                              value={incident?.callsign_from} 
                              subtext={callsignShortToName[incident?.callsign_from?.toUpperCase() || ''] || 'Unknown Staff'} 
                            />
                            <DetailItem 
                              icon={UserIcon} 
                              label="To" 
                              value={incident?.callsign_to} 
                              subtext={callsignShortToName[incident?.callsign_to?.toUpperCase() || ''] || 'Control'} 
                            />
                            <DetailItem icon={MapPinIcon} label="Location" value={incident?.location || incident?.what3words || 'N/A'} />
                         </div>
                      </div>

                      {/* Edit / View Content */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                         <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                               <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                               Incident Record
                            </h3>
                            {!editMode && (
                              <button
                                onClick={() => setIsAmendmentModalOpen(true)}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                              >
                                <PencilIcon className="h-3 w-3" />
                                Amend Entry
                              </button>
                            )}
                         </div>
                         
                         <div className="p-5 space-y-6">
                            {editMode ? (
                               <div className="space-y-4">
                                  {/* Edit Mode Inputs */}
                                  <div>
                                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Occurrence</label>
                                     <textarea
                                        value={editedIncident.occurrence || ''}
                                        onChange={(e) => setEditedIncident({ ...editedIncident, occurrence: e.target.value })}
                                        className="w-full rounded-lg border-slate-200 text-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                                        rows={4}
                                     />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">From</label>
                                        <input value={editedIncident.callsign_from || ''} onChange={(e) => setEditedIncident({ ...editedIncident, callsign_from: e.target.value })} className="w-full rounded-lg border-slate-200 text-sm p-2" />
                                     </div>
                                     <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">To</label>
                                        <input value={editedIncident.callsign_to || ''} onChange={(e) => setEditedIncident({ ...editedIncident, callsign_to: e.target.value })} className="w-full rounded-lg border-slate-200 text-sm p-2" />
                                     </div>
                                  </div>
                                  <div>
                                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Action Taken</label>
                                     <textarea
                                        value={editedIncident.action_taken || ''}
                                        onChange={(e) => setEditedIncident({ ...editedIncident, action_taken: e.target.value })}
                                        className="w-full rounded-lg border-slate-200 text-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                                        rows={4}
                                     />
                                  </div>
                                  <div className="flex gap-2 pt-2">
                                     <button onClick={handleSaveChanges} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Changes</button>
                                     <button onClick={() => setEditMode(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                                  </div>
                               </div>
                            ) : (
                               <>
                                  {/* Read Only Mode */}
                                  <div>
                                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Occurrence</h4>
                                     <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-mono text-[13px]">
                                        {incident?.occurrence || 'No details provided.'}
                                     </div>
                                  </div>

                                  <div>
                                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Action Taken</h4>
                                     <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                                        {incident?.action_taken || 'No action recorded.'}
                                     </div>
                                  </div>
                               </>
                            )}
                         </div>
                      </div>

                      {/* Photo Attachment */}
                      {incident?.photo_url && photoUrl && (
                         <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                               <PhotoIcon className="h-4 w-4" /> Attachment
                            </h4>
                            <div className="relative h-48 w-full rounded-lg overflow-hidden group cursor-zoom-in border border-slate-100" onClick={() => setShowFullImage(true)}>
                               <Image src={photoUrl} alt="Evidence" fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </div>
                         </div>
                      )}

                      {/* Add Update Box */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                         <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-500" />
                            Add Update
                         </h4>
                         <div className="relative">
                            <textarea
                              value={newUpdate}
                              onChange={(e) => setNewUpdate(e.target.value)}
                              placeholder="Type a new update or note..."
                              className="w-full rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-blue-500 p-3 text-sm min-h-[80px] pr-12 resize-y"
                            />
                            <button
                              onClick={handleUpdateSubmit}
                              disabled={!newUpdate.trim()}
                              className="absolute bottom-3 right-3 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                               <PaperAirplaneIcon className="h-4 w-4" />
                            </button>
                         </div>
                      </div>
                   </>
                )}
              </div>

              {/* RIGHT COLUMN: Timeline Sidebar */}
              <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col h-full">
                 <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                       <ArrowPathIcon className="h-4 w-4 text-slate-500" />
                       Audit Trail
                    </h3>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white space-y-4">
                    {/* AI-Generated Tags */}
                    {incident?.ai_tags && incident.ai_tags.length > 0 && (
                      <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">AI Tags</h4>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {incident.ai_tags.map((tag, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <button
                                onClick={() => handleTagClick(tag, 'occurrence')}
                                className={cn(
                                  "px-2 py-1 text-[10px] font-medium rounded-md transition-colors cursor-pointer border",
                                  selectedField === 'occurrence' 
                                    ? "bg-blue-200 text-blue-800 border-blue-300" 
                                    : "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 border-blue-200"
                                )}
                                title="Click to add to Occurrence"
                              >
                                #{tag}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTagClick(tag, 'action_taken');
                                }}
                                className={cn(
                                  "px-1.5 py-0.5 text-[9px] font-medium rounded transition-colors cursor-pointer border",
                                  selectedField === 'action_taken'
                                    ? "bg-green-200 text-green-800 border-green-300"
                                    : "bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800 border-green-200"
                                )}
                                title="Add to Actions Taken"
                              >
                                +A
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                          Click tag to add to Occurrence, or +A to add to Actions Taken
                        </p>
                      </div>
                    )}

                    {/* Risk Matrix */}
                    {incident?.risk_matrix_scores && (
                      <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Risk Matrix</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-600">Level:</span>
                            <span className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded",
                              incident.risk_matrix_scores.level === 'High' ? 'bg-red-100 text-red-700' :
                              incident.risk_matrix_scores.level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            )}>
                              {incident.risk_matrix_scores.level}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-600">Score:</span>
                            <span className="text-xs font-semibold text-slate-800">{incident.risk_matrix_scores.score || 'N/A'}</span>
                          </div>
                          {incident.risk_matrix_scores.likelihood && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-600">Likelihood:</span>
                              <span className="text-xs text-slate-700">{incident.risk_matrix_scores.likelihood}/5</span>
                            </div>
                          )}
                          {incident.risk_matrix_scores.impact && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-600">Impact:</span>
                              <span className="text-xs text-slate-700">{incident.risk_matrix_scores.impact}/5</span>
                            </div>
                          )}
                          {incident.risk_matrix_scores.reasoning && (
                            <div className="mt-2 pt-2 border-t border-slate-200">
                              <p className="text-[10px] text-slate-500 leading-relaxed">{incident.risk_matrix_scores.reasoning}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ETHANE Report */}
                    {incident?.ethane_reports && (
                      <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">ETHANE Report</h4>
                        <div className="space-y-1.5 text-[10px]">
                          {incident.ethane_reports.E && (
                            <div>
                              <span className="font-bold text-slate-600">E:</span>
                              <span className="text-slate-700 ml-1">{incident.ethane_reports.E}</span>
                            </div>
                          )}
                          {incident.ethane_reports.T && (
                            <div>
                              <span className="font-bold text-slate-600">T:</span>
                              <span className="text-slate-700 ml-1">{incident.ethane_reports.T}</span>
                            </div>
                          )}
                          {incident.ethane_reports.H && (
                            <div>
                              <span className="font-bold text-slate-600">H:</span>
                              <span className="text-slate-700 ml-1">{incident.ethane_reports.H}</span>
                            </div>
                          )}
                          {incident.ethane_reports.A && (
                            <div>
                              <span className="font-bold text-slate-600">A:</span>
                              <span className="text-slate-700 ml-1">{incident.ethane_reports.A}</span>
                            </div>
                          )}
                          {incident.ethane_reports.N && (
                            <div>
                              <span className="font-bold text-slate-600">N:</span>
                              <span className="text-slate-700 ml-1">{incident.ethane_reports.N}</span>
                            </div>
                          )}
                          {incident.ethane_reports.E_services && (
                            <div>
                              <span className="font-bold text-slate-600">E-Services:</span>
                              <span className="text-slate-700 ml-1">{incident.ethane_reports.E_services}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Log Quality Score */}
                    {incident?.log_quality_score !== undefined && (
                      <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Log Quality</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all",
                                incident.log_quality_score >= 85 ? 'bg-green-500' :
                                incident.log_quality_score >= 75 ? 'bg-yellow-500' :
                                'bg-red-500'
                              )}
                              style={{ width: `${incident.log_quality_score}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700">{incident.log_quality_score}/100</span>
                        </div>
                      </div>
                    )}

                    {/* Revisions Block */}
                    {incident && <IncidentRevisionHistory incidentId={String(incident.id)} incident={incident as any} />}

                    {/* Updates Timeline */}
                    <div className="space-y-6 mt-4 relative">
                       {/* Vertical Line */}
                       {updates.length > 0 && <div className="absolute left-3.5 top-3 bottom-3 w-px bg-slate-200" />}

                       {updates.map((update) => (
                          <div key={update.id} className="relative flex gap-3 group">
                             {/* Dot */}
                             <div className="relative z-10 mt-1 h-7 w-7 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 group-hover:border-blue-400 transition-colors">
                                <div className="h-2 w-2 rounded-full bg-slate-400 group-hover:bg-blue-500 transition-colors" />
                             </div>
                             
                             {/* Content */}
                             <div className="flex-1 pb-1">
                                <div className="flex items-baseline justify-between mb-1">
                                   <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">
                                      {update.updated_by}
                                   </span>
                                   <span className="text-[10px] text-slate-400">
                                      {new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </span>
                                </div>
                                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 group-hover:border-slate-200 transition-colors leading-snug">
                                   {update.update_text}
                                </div>
                             </div>
                          </div>
                       ))}

                       {updates.length === 0 && (
                          <div className="text-center py-8 text-slate-400 text-xs italic">
                             No updates recorded yet.
                          </div>
                       )}
                    </div>
                 </div>
              </div>

            </div>
          </motion.div>

          {/* Image Modal */}
          {showFullImage && photoUrl && (
             <div className="fixed inset-0 z-[80] bg-black/95 flex items-center justify-center p-4" onClick={() => setShowFullImage(false)}>
                <button className="absolute top-4 right-4 text-white/70 hover:text-white"><XMarkIcon className="h-8 w-8" /></button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Full View" className="max-w-full max-h-full object-contain rounded-md" />
             </div>
          )}

          {/* Other Modals */}
          {incident && (
            <EscalationModal
              incidentId={String(incident.id)}
              incidentType={incident.incident_type}
              incidentPriority={incident.priority}
              isOpen={isEscalationModalOpen}
              onClose={() => setIsEscalationModalOpen(false)}
              onSuccess={handleEscalationSuccess}
            />
          )}
          {incident && (
            <IncidentAmendmentModal
              isOpen={isAmendmentModalOpen}
              onClose={() => setIsAmendmentModalOpen(false)}
              incident={incident as any}
              onAmendmentCreated={fetchIncidentDetails}
            />
          )}
          {incident && currentEventId && (
            <DecisionLogger
              eventId={currentEventId}
              isOpen={showDecisionLogger}
              onClose={() => setShowDecisionLogger(false)}
              onDecisionCreated={() => setShowDecisionLogger(false)}
              linkedIncidentIds={[Number(incident.id)]}
            />
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body
  ) : null
}