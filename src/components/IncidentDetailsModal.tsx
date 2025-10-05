import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '../lib/supabase'
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
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline'
import PriorityBadge from './PriorityBadge'
import {
  getIncidentTypeStyle,
  getPriorityBorderClass,
  normalizePriority,
  type Priority,
} from '../utils/incidentStyles'
import { getIncidentTypeIcon } from '../utils/incidentIcons'

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
}

export default function IncidentDetailsModal({ isOpen, onClose, incidentId }: Props) {
  const isAdmin = useIsAdmin()
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

  const fetchAssignments = async () => {
    if (!currentEventId) return;
    
    try {
      const { data: assignmentsData } = await supabase
        .from('callsign_assignments')
        .select('callsign, staff_id, staff_name')
        .eq('event_id', currentEventId);

      if (assignmentsData) {
        const assignmentsMap: Record<string, string> = {};
        const shortToNameMap: Record<string, string> = {};
        
        assignmentsData.forEach(assignment => {
          if (assignment.callsign && assignment.staff_name) {
            assignmentsMap[assignment.callsign.toUpperCase()] = assignment.staff_name;
            shortToNameMap[assignment.callsign.toUpperCase()] = assignment.staff_name;
          }
        });
        
        setCallsignAssignments(assignmentsMap);
        setCallsignShortToName(shortToNameMap);
      }
    } catch (error) {
      console.error('Error fetching callsign assignments:', error);
    }
  };

  const getSignedUrl = async () => {
    if (!incident?.photo_url) return;
    
    try {
      const { data } = await supabase.storage
        .from('incident-photos')
        .createSignedUrl(incident.photo_url, 3600);
      
      if (data?.signedUrl) {
        setPhotoUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Error getting signed URL:', error);
    }
  };



  const fetchIncidentDetails = async () => {
    if (!incidentId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch incident details
      const { data: incidentData, error: incidentError } = await supabase
        .from('incident_logs')
        .select('*')
        .eq('id', incidentId)
        .single();

      if (incidentError) throw incidentError;

      setIncident(incidentData);
      setEditedIncident(incidentData);

      // Fetch updates
      const { data: updatesData, error: updatesError } = await supabase
        .from('incident_updates')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: false });

      if (updatesError) throw updatesError;

      setUpdates(updatesData || []);

      // Fetch additional data
      await Promise.all([
        fetchAssignments(),
        getSignedUrl()
      ]);

    } catch (err) {
      console.error('Error fetching incident details:', err);
      setError('Failed to load incident details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async () => {
    if (!newUpdate.trim() || !incident) return;

    try {
      const { error } = await supabase
        .from('incident_updates')
        .insert({
          incident_id: incident.id,
          update_text: newUpdate,
          updated_by: 'Event Control' // TODO: Use actual user
        });

      if (error) throw error;

      // Also append this update into the main log's action_taken so it shows on the log
      const normalizedNote = newUpdate.trim().replace(/\s+/g, ' ');
      const appendedAction = `Update: ${normalizedNote.replace(/\.$/, '')}.`;
      try {
        // Get current actions (fresh)
        const { data: current, error: selErr } = await supabase
          .from('incident_logs')
          .select('action_taken')
          .eq('id', incident.id)
          .single();
        if (selErr) throw selErr;
        const prevActions = (current?.action_taken as string) || '';
        const updatedActions = prevActions ? `${prevActions.trim()} ${appendedAction}` : appendedAction;
        const { error: updErr } = await supabase
          .from('incident_logs')
          .update({ action_taken: updatedActions, updated_at: new Date().toISOString() })
          .eq('id', incident.id);
        if (updErr) throw updErr;
        // Reflect locally
        setIncident(prev => prev ? { ...prev, action_taken: updatedActions } : prev);
      } catch (err) {
        console.error('Failed to append update to action_taken:', err);
      }

      setNewUpdate('');
      await fetchIncidentDetails();
    } catch (err) {
      console.error('Error adding update:', err);
      setError('Failed to add update');
    }
  };

  const handleSaveChanges = async () => {
    if (!incident) return;

    try {
      const { error } = await supabase
        .from('incident_logs')
        .update({
          occurrence: editedIncident.occurrence,
          action_taken: editedIncident.action_taken,
          callsign_from: editedIncident.callsign_from,
          callsign_to: editedIncident.callsign_to,
          updated_at: new Date().toISOString()
        })
        .eq('id', incident.id);

      if (error) throw error;

      // Add an update to the audit trail
      const { error: auditError } = await supabase
        .from('incident_updates')
        .insert({
          incident_id: incident.id,
          update_text: 'Incident details updated',
          updated_by: 'Event Control' // TODO: Use actual user
        });

      if (auditError) throw auditError;

      setEditMode(false);
      await fetchIncidentDetails();
    } catch (err) {
      console.error('Error saving changes:', err);
      setError('Failed to save changes');
    }
  };

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

  const getStatusIcon = (isClosed: boolean) => {
    return isClosed ? (
      <CheckCircleIcon className="h-5 w-5 text-green-600" />
    ) : (
      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
    );
  };

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">
                  Incident #{incident?.log_number}
                </h2>
                <p className="text-blue-100 text-sm">
                  {incident?.incident_type} • {new Date(incident?.timestamp || '').toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Status Badge */}
              {incident && incident.incident_type !== 'Sit Rep' && (
                <button
                  onClick={handleStatusChange}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105 ${
                    incident.is_closed
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  }`}
                >
                  {getStatusIcon(incident.is_closed)}
                  <span>{incident.is_closed ? 'Closed' : 'Open'}</span>
                </button>
              )}
              
              <button
                onClick={onClose}
                className="text-white hover:text-blue-100 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-10"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8 bg-red-50 rounded-lg">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <p className="text-lg font-semibold">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Main Details */}
              <div className="lg:col-span-3 space-y-4">
                {/* Incident Type & Priority */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Incident Information
                    </h3>
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span>{editMode ? 'Cancel' : 'Edit'}</span>
                    </button>
                  </div>
                  
                  {editMode ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Occurrence</label>
                        <textarea
                          value={editedIncident.occurrence || ''}
                          onChange={(e) => setEditedIncident({ ...editedIncident, occurrence: e.target.value })}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Callsign From</label>
                          <input
                            type="text"
                            value={editedIncident.callsign_from || ''}
                            onChange={(e) => setEditedIncident({ ...editedIncident, callsign_from: e.target.value })}
                            placeholder="e.g., A1, R2, PM"
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Callsign To</label>
                          <input
                            type="text"
                            value={editedIncident.callsign_to || ''}
                            onChange={(e) => setEditedIncident({ ...editedIncident, callsign_to: e.target.value })}
                            placeholder="e.g., Control, Medics, Security 1"
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Action Taken</label>
                        <textarea
                          value={editedIncident.action_taken || ''}
                          onChange={(e) => setEditedIncident({ ...editedIncident, action_taken: e.target.value })}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          rows={4}
                        />
                      </div>
                      <button
                        onClick={handleSaveChanges}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                      >
                        <CheckIcon className="h-5 w-5 inline mr-2" />
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`space-y-4 rounded-xl border p-4 ${
                        getPriorityBorderClass(incident?.priority as Priority)
                      } ${(() => {
                        if (!incident) return 'border-gray-200';
                        const status = String(incident.status ?? '').toLowerCase();
                        const normalizedPriority = normalizePriority(incident.priority as Priority);
                        const isHighPriority = normalizedPriority === 'high' || normalizedPriority === 'urgent';
                        const isOpenStatus = !incident.is_closed && (status === 'open' || status === 'logged' || status === '');
                        return isOpenStatus && isHighPriority
                          ? 'ring-2 ring-red-400 border-red-300 animate-pulse-border motion-reduce:animate-none shadow-md shadow-red-300/40'
                          : 'border-gray-200';
                      })()}`}
                    >
                      {/* Incident Type Badge */}
                      <div className="flex items-center gap-3">
                        {(() => {
                          const { icon: IncidentTypeIcon } = getIncidentTypeIcon(incident?.incident_type || '');
                          return (
                            <span className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-full ${getIncidentTypeStyle(incident?.incident_type || '')}`}>
                              <IncidentTypeIcon size={18} aria-hidden className="shrink-0" />
                              <span>{incident?.incident_type || 'Incident'}</span>
                            </span>
                          );
                        })()}
                        <PriorityBadge priority={incident?.priority} />
                      </div>

                      {/* Key Details Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <ClockIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Time</span>
                          </div>
                          <p className="text-gray-900 font-medium text-sm">
                            {new Date(incident?.timestamp || '').toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">From</span>
                          </div>
                          <p className="text-gray-900 font-medium text-sm">
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
                        
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">To</span>
                          </div>
                          <p className="text-gray-900 font-medium text-sm">
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
                        
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <MapPinIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Location</span>
                          </div>
                          <p className="text-gray-900 font-medium text-sm">
                            {incident?.what3words || 'Not specified'}
                          </p>
                        </div>
                      </div>

                      {/* Occurrence */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                          Occurrence
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="whitespace-pre-wrap text-gray-900 text-sm">
                            {(() => {
                              if (!incident?.occurrence) return 'No occurrence details provided.';
                              // Regex to find all what3words addresses
                              const regex = /(\/\/\/[a-zA-Z0-9]+\.[a-zA-Z0-9]+\.[a-zA-Z0-9]+)/g;
                              const parts = incident.occurrence.split(regex);
                              return parts.map((part, i) => {
                                if (regex.test(part)) {
                                  return (
                                    <span
                                      key={i}
                                      className="inline-flex items-center bg-blue-100 rounded px-2 py-1 mr-1 cursor-pointer hover:bg-blue-200 active:bg-blue-300 transition-colors font-mono text-blue-800 underline text-xs"
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
                      </div>

                      {/* Action Taken */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Action Taken
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="whitespace-pre-wrap text-gray-900 text-sm">
                            {incident?.action_taken || 'No action details provided.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Updates Timeline */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Updates & Audit Trail
                  </h3>
                  
                  <div className="space-y-3">
                    {updates.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <ChatBubbleLeftRightIcon className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                        <p>No updates yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {updates.map((update, index) => (
                          <div key={update.id} className="relative">
                            {/* Timeline line */}
                            {index < updates.length - 1 && (
                              <div className="absolute left-5 top-10 w-0.5 h-6 bg-gray-200"></div>
                            )}
                            
                            <div className="flex space-x-3">
                              {/* Timeline dot */}
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <UserIcon className="h-5 w-5 text-blue-600" />
                                </div>
                              </div>
                              
                              {/* Update content */}
                              <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {update.updated_by}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(update.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-gray-700 text-sm">{update.update_text}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* New Update Input */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Add Update</h4>
                      <textarea
                        value={newUpdate}
                        onChange={(e) => setNewUpdate(e.target.value)}
                        placeholder="Add an update to this incident..."
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        rows={3}
                      />
                      <button
                        onClick={handleUpdateSubmit}
                        disabled={!newUpdate.trim()}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        Add Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Assignment Info */}
                {incident?.assigned_staff_ids && incident.assigned_staff_ids.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Assigned Staff
                    </h3>
                    <div className="space-y-2">
                      {incident.assigned_staff_ids.map((staffId, index) => (
                        <div key={staffId} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {index + 1}
                            </span>
                          </div>
                          <span className="text-sm text-gray-700">Staff Member {index + 1}</span>
                          {incident.auto_assigned && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                              Auto
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dependencies */}
                {incident?.dependencies && incident.dependencies.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <ClipboardDocumentIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Dependencies
                    </h3>
                    <div className="space-y-2">
                      {incident.dependencies.map((depId, index) => (
                        <div key={depId} className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                          <span className="text-sm text-orange-800">Incident #{depId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photo Attachment */}
                {incident && incident.photo_url && photoUrl && isAdmin && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <PhotoIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Photo Attachment
                    </h3>
                    <div className="relative h-32">
                      <Image
                        src={photoUrl}
                        alt="Incident Attachment"
                        fill
                        className="object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setShowFullImage(true)}
                        onContextMenu={e => e.preventDefault()}
                        draggable={false}
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <PhotoIcon className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    
                    {showFullImage && (
                      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setShowFullImage(false)}>
                        <div className="relative max-h-[90vh] max-w-[90vw]">
                          <Image
                            src={photoUrl}
                            alt="Full Incident Attachment"
                            width={1920}
                            height={1080}
                            className="max-h-[90vh] max-w-[90vw] w-auto h-auto rounded-lg shadow-2xl object-contain"
                            onContextMenu={e => e.preventDefault()}
                            draggable={false}
                            unoptimized
                          />
                          <button
                            onClick={() => setShowFullImage(false)}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                          >
                            <XMarkIcon className="h-8 w-8" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
