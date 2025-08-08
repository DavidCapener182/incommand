import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

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
}

export default function IncidentDetailsModal({ isOpen, onClose, incidentId }: Props) {
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
  const [role, setRole] = useState<string | null>(null)

  // Cleanup function to handle unsubscribe
  const cleanup = () => {
    if (subscriptionRef.current) {
      console.log('Cleaning up incident details subscription');
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen && incidentId) {
      fetchIncidentDetails();

      // Clean up any existing subscription
      cleanup();

      // Set up new subscription
      subscriptionRef.current = supabase
        .channel(`incident_${incidentId}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'incident_updates',
            filter: `incident_id=eq.${incidentId}`
          },
          () => {
            fetchIncidentDetails();
          }
        )
        .subscribe();
    }

    // Cleanup on unmount or when modal closes
    return cleanup;
  }, [isOpen, incidentId]);

  useEffect(() => {
    // Fetch current event id
    const fetchEvent = async () => {
      const { data: eventData } = await supabase
        .from('events')
        .select('id')
        .eq('is_current', true)
        .single();
      setCurrentEventId(eventData?.id || null);
    };
    fetchEvent();
  }, []);

  useEffect(() => {
    if (!currentEventId) return;
    const fetchAssignments = async () => {
      const { data: roles } = await supabase
        .from('callsign_roles')
        .select('id, short_code, callsign')
        .eq('event_id', currentEventId);
      const { data: assignments } = await supabase
        .from('callsign_assignments')
        .select('callsign_role_id, assigned_name')
        .eq('event_id', currentEventId);
      const idToShort: Record<string, string> = {};
      const idToCallsign: Record<string, string> = {};
      roles?.forEach((r) => {
        idToShort[r.id] = r.short_code;
        idToCallsign[r.id] = r.callsign;
      });
      const shortToName: Record<string, string> = {};
      const callsignToName: Record<string, string> = {};
      assignments?.forEach((a) => {
        const short = idToShort[a.callsign_role_id];
        const cs = idToCallsign[a.callsign_role_id];
        if (short) shortToName[short.toUpperCase()] = a.assigned_name;
        if (cs) callsignToName[cs.toUpperCase()] = a.assigned_name;
      });
      setCallsignAssignments(callsignToName);
      setCallsignShortToName(shortToName);
    };
    fetchAssignments();
  }, [currentEventId]);

  useEffect(() => {
    if (!incident || !incident.photo_url || typeof incident.photo_url !== 'string') {
      setPhotoUrl(null);
      return;
    }
    // Fetch signed URL for the image
    const getSignedUrl = async () => {
      const { data } = await supabase.storage.from('incident-photos').createSignedUrl(incident.photo_url as string, 60 * 60);
      setPhotoUrl(data?.signedUrl || null);
    };
    getSignedUrl();
  }, [incident]);

  useEffect(() => {
    // Fetch user role (assume AuthContext or similar is available)
    const fetchRole = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setRole(data?.role || null);
    };
    fetchRole();
  }, []);

  const fetchIncidentDetails = async () => {
    if (!incidentId) return

    try {
      setLoading(true)
      // Fetch incident details
      const { data: incidentData, error: incidentError } = await supabase
        .from('incident_logs')
        .select('*')
        .eq('id', incidentId)
        .single()

      if (incidentError) throw incidentError

      // Fetch incident updates
      const { data: updatesData, error: updatesError } = await supabase
        .from('incident_updates')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: true })

      if (updatesError) throw updatesError

      setIncident(incidentData)
      setEditedIncident(incidentData)
      setUpdates(updatesData || [])
    } catch (err) {
      console.error('Error fetching incident details:', err)
      setError('Failed to load incident details')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSubmit = async () => {
    if (!incidentId || !newUpdate.trim()) return

    try {
      const { error } = await supabase
        .from('incident_updates')
        .insert({
          incident_id: incidentId,
          update_text: newUpdate.trim(),
          updated_by: 'Event Control' // TODO: Use actual user
        })

      if (error) throw error

      setNewUpdate('')
      await fetchIncidentDetails()
    } catch (err) {
      console.error('Error adding update:', err)
      setError('Failed to add update')
    }
  }

  const handleSaveChanges = async () => {
    if (!incidentId || !editedIncident) return

    try {
      const { error } = await supabase
        .from('incident_logs')
        .update({
          ...editedIncident,
          updated_at: new Date().toISOString()
        })
        .eq('id', incidentId)

      if (error) throw error

      // Add an update to track the edit
      await supabase
        .from('incident_updates')
        .insert({
          incident_id: incidentId,
          update_text: 'Incident details updated',
          updated_by: 'Event Control' // TODO: Use actual user
        })

      setEditMode(false)
      await fetchIncidentDetails()
    } catch (err) {
      console.error('Error saving changes:', err)
      setError('Failed to save changes')
    }
  }

  const handleStatusChange = async () => {
    if (!incident) return;

    try {
      const newStatus = !incident.is_closed;
      
      // Update the incident status
      const { error: updateError } = await supabase
        .from('incident_logs')
        .update({
          is_closed: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', incident.id);

      if (updateError) throw updateError;

      // Add an update to the audit trail
      const { error: auditError } = await supabase
        .from('incident_updates')
        .insert({
          incident_id: incident.id,
          update_text: `Incident status changed to ${newStatus ? 'Closed' : 'Open'}`,
          updated_by: 'Event Control' // TODO: Use actual user
        });

      if (auditError) throw auditError;

      await fetchIncidentDetails();
    } catch (err) {
      console.error('Error updating incident status:', err);
      setError('Failed to update incident status');
    }
  };

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative mx-auto mt-8 w-full max-w-6xl rounded-3xl border border-gray-200 dark:border-[#2d437a] bg-white dark:bg-[#23408e] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-6 py-5 border-b border-gray-200 dark:border-[#2d437a] bg-white/90 dark:bg-[#23408e]/90 backdrop-blur-sm rounded-t-3xl">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Incident Details
              <span className="ml-2 font-semibold text-gray-500 dark:text-gray-300">- {incident?.log_number}</span>
            </h2>
            {incident && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-[#182447] text-gray-700 dark:text-gray-100 border border-gray-200 dark:border-[#2d437a]">
                {incident.incident_type}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {incident && incident.incident_type !== 'Sit Rep' && (
              <button
                onClick={handleStatusChange}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all ${
                  incident.is_closed
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700'
                }`}
              >
                {incident.is_closed ? 'Closed' : 'Open'}
              </button>
            )}
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 dark:border-[#2d437a] text-gray-600 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a2a57] transition-colors"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-6 font-medium">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Details Card */}
              <div className="bg-white dark:bg-[#23408e] rounded-2xl border border-gray-200 dark:border-[#2d437a] shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#2d437a]">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Details</h3>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="px-3 py-1 text-xs rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition-colors"
                  >
                    {editMode ? 'Cancel Edit' : 'Edit'}
                  </button>
                </div>
                <div className="p-5">
                  {editMode ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Occurrence</label>
                        <textarea
                          value={editedIncident.occurrence || ''}
                          onChange={(e) => setEditedIncident({ ...editedIncident, occurrence: e.target.value })}
                          className="mt-1 block w-full rounded-xl border-2 border-gray-200 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Action Taken</label>
                        <textarea
                          value={editedIncident.action_taken || ''}
                          onChange={(e) => setEditedIncident({ ...editedIncident, action_taken: e.target.value })}
                          className="mt-1 block w-full rounded-xl border-2 border-gray-200 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          rows={4}
                        />
                      </div>
                      <button
                        onClick={handleSaveChanges}
                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-300">Time</p>
                          <p className="mt-1 text-gray-900 dark:text-gray-100 font-medium">{new Date(incident?.timestamp || '').toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-300">Type</p>
                          <p className="mt-1 text-gray-900 dark:text-gray-100 font-medium">{incident?.incident_type}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-300">From</p>
                          <p className="mt-1 text-gray-900 dark:text-gray-100">
                            <span
                              title={
                                incident?.callsign_from &&
                                (callsignShortToName[incident.callsign_from.toUpperCase()] ||
                                  callsignAssignments[incident.callsign_from.toUpperCase()] ||
                                  undefined)
                              }
                              className="underline decoration-dotted cursor-help"
                            >
                              {incident?.callsign_from}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-300">To</p>
                          <p className="mt-1 text-gray-900 dark:text-gray-100">
                            <span
                              title={
                                incident?.callsign_to &&
                                (callsignShortToName[incident.callsign_to.toUpperCase()] ||
                                  callsignAssignments[incident.callsign_to.toUpperCase()] ||
                                  undefined)
                              }
                              className="underline decoration-dotted cursor-help"
                            >
                              {incident?.callsign_to}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-300">Occurrence</p>
                        <p className="mt-1 whitespace-pre-wrap text-gray-900 dark:text-gray-100 leading-relaxed">
                          {(() => {
                            if (!incident?.occurrence) return null;
                            const regex = /(\/\/\/[a-zA-Z0-9]+\.[a-zA-Z0-9]+\.[a-zA-Z0-9]+)/g;
                            const parts = incident.occurrence.split(regex);
                            return parts.map((part, i) => {
                              if (regex.test(part)) {
                                return (
                                  <span
                                    key={i}
                                    className="inline-flex items-center bg-blue-50 dark:bg-blue-900/30 rounded px-1 mr-1 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-mono text-blue-700 dark:text-blue-200 underline"
                                    title="Click to copy what3words address"
                                    onClick={() => navigator.clipboard.writeText(part)}
                                    tabIndex={0}
                                    role="button"
                                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { navigator.clipboard.writeText(part); } }}
                                  >
                                    {part}
                                  </span>
                                );
                              } else {
                                return <span key={i}>{part}</span>;
                              }
                            });
                          })()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-300">Action Taken</p>
                        <p className="mt-1 whitespace-pre-wrap text-gray-900 dark:text-gray-100 leading-relaxed">{incident?.action_taken}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Updates / Timeline Card */}
              <div className="bg-white dark:bg-[#23408e] rounded-2xl border border-gray-200 dark:border-[#2d437a] shadow-sm">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-[#2d437a]">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Updates</h3>
                </div>
                <div className="p-5 space-y-4">
                  {/* Timeline-style updates */}
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    {updates.map((update, idx) => (
                      <div key={update.id} className="relative pl-5">
                        {/* line */}
                        {idx !== updates.length - 1 && (
                          <span className="absolute left-2 top-2 bottom-[-8px] w-px bg-gray-200 dark:bg-[#2d437a]" />
                        )}
                        {/* dot */}
                        <span className="absolute left-0 top-1 h-3 w-3 rounded-full bg-blue-500 shadow" />
                        <div className="rounded-xl border border-gray-200 dark:border-[#2d437a] bg-white dark:bg-[#182447] p-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-300">
                            <span className="font-medium">{update.updated_by}</span>
                            <span>{new Date(update.created_at).toLocaleString()}</span>
                          </div>
                          <p className="mt-2 text-gray-800 dark:text-gray-100 text-sm leading-relaxed">{update.update_text}</p>
                        </div>
                      </div>
                    ))}
                    {updates.length === 0 && (
                      <div className="text-sm text-gray-500 dark:text-gray-300">No updates yet.</div>
                    )}
                  </div>

                  {/* Add Update */}
                  <div className="pt-2 border-t border-gray-200 dark:border-[#2d437a]">
                    <textarea
                      value={newUpdate}
                      onChange={(e) => setNewUpdate(e.target.value)}
                      placeholder="Add an update..."
                      className="w-full rounded-2xl border-2 border-gray-200 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={3}
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={handleUpdateSubmit}
                        disabled={!newUpdate.trim()}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                      >
                        Add Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo */}
              {incident && incident.photo_url && photoUrl && ['admin','supervisor','manager'].includes((role||'').toLowerCase()) && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">Photo Attachment</p>
                  <img
                    src={photoUrl}
                    alt="Incident Attachment"
                    className="h-24 rounded-lg border border-gray-200 dark:border-[#2d437a] cursor-pointer select-none shadow-sm"
                    style={{ pointerEvents: 'auto', userSelect: 'none' }}
                    onClick={() => setShowFullImage(true)}
                    onContextMenu={e => e.preventDefault()}
                    draggable={false}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Full image overlay */}
        {showFullImage && (
          <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center" onClick={() => setShowFullImage(false)}>
            <img
              src={photoUrl || ''}
              alt="Full Incident Attachment"
              className="max-h-[80vh] max-w-[90vw] rounded-xl shadow-2xl"
              onContextMenu={e => e.preventDefault()}
              draggable={false}
            />
          </div>
        )}
      </div>
    </div>
  )
} 