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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-900">
              Incident Details - {incident?.log_number}
            </h2>
            {incident && incident.incident_type !== 'Sit Rep' && (
              <button
                onClick={handleStatusChange}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                  incident.is_closed
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                }`}
              >
                {incident.is_closed ? 'Closed' : 'Open'}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : (
          <div className="space-y-6">
            {/* Incident Details Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Details</h3>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="px-3 py-1 text-sm rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
                >
                  {editMode ? 'Cancel Edit' : 'Edit'}
                </button>
              </div>
              
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Occurrence</label>
                    <textarea
                      value={editedIncident.occurrence || ''}
                      onChange={(e) => setEditedIncident({ ...editedIncident, occurrence: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Action Taken</label>
                    <textarea
                      value={editedIncident.action_taken || ''}
                      onChange={(e) => setEditedIncident({ ...editedIncident, action_taken: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <button
                    onClick={handleSaveChanges}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Time</p>
                      <p className="mt-1">{new Date(incident?.timestamp || '').toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Type</p>
                      <p className="mt-1">{incident?.incident_type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">From</p>
                      <p className="mt-1">{incident?.callsign_from}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">To</p>
                      <p className="mt-1">{incident?.callsign_to}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Occurrence</p>
                    <p className="mt-1 whitespace-pre-wrap">{incident?.occurrence}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Action Taken</p>
                    <p className="mt-1 whitespace-pre-wrap">{incident?.action_taken}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Updates Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Updates</h3>
              <div className="space-y-4">
                {updates.map((update) => (
                  <div key={update.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{update.updated_by}</span>
                      <span>{new Date(update.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-2">{update.update_text}</p>
                  </div>
                ))}
                
                {/* New Update Input */}
                <div className="mt-4">
                  <textarea
                    value={newUpdate}
                    onChange={(e) => setNewUpdate(e.target.value)}
                    placeholder="Add an update..."
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                  />
                  <button
                    onClick={handleUpdateSubmit}
                    disabled={!newUpdate.trim()}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Add Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 