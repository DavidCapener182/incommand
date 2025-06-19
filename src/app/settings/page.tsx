'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import SupabaseTest from '../../components/SupabaseTest'
import { useAuth } from '../../contexts/AuthContext'

interface Event {
  id: string
  event_name: string
  start_datetime: string
  end_datetime: string
  is_current: boolean
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showEndEventConfirm, setShowEndEventConfirm] = useState(false)
  const [showReactivateConfirm, setShowReactivateConfirm] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  // Fetch company_id and role on mount
  useEffect(() => {
    const fetchCompanyIdAndRole = async () => {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        setError('You must be authenticated to view events.');
        setLoading(false);
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', session.user.id)
        .single();
      if (profileError || !profile?.company_id) {
        setError('Could not determine your company. Please check your profile.');
        setLoading(false);
        return;
      }
      setCompanyId(profile.company_id);
      setRole(profile.role || null);
    };
    fetchCompanyIdAndRole();
  }, []);

  const fetchEvents = async (company_id: string) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('company_id', company_id)
        .order('start_datetime', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (companyId) fetchEvents(companyId)
  }, [companyId])

  const setCurrentEvent = async (eventId: string) => {
    try {
      if (!companyId) return;
      // First, set all events to not current for this company
      await supabase
        .from('events')
        .update({ is_current: false })
        .eq('company_id', companyId)
        .neq('id', 'dummy')

      // Then set the selected event as current
      const { error } = await supabase
        .from('events')
        .update({ 
          is_current: true,
          end_datetime: null // Clear the end datetime when reactivating
        })
        .eq('id', eventId)
        .eq('company_id', companyId)

      if (error) throw error
      setShowReactivateConfirm(null)
      if (companyId) fetchEvents(companyId) // Refresh the list
    } catch (error) {
      console.error('Error setting current event:', error)
    }
  }

  const handleEndEvent = async () => {
    if (!currentEvent || !companyId) return

    try {
      const { error } = await supabase
        .from('events')
        .update({ 
          is_current: false,
          end_datetime: new Date().toISOString()
        })
        .eq('id', currentEvent.id)
        .eq('company_id', companyId)

      if (error) throw error
      
      setShowEndEventConfirm(false)
      if (companyId) fetchEvents(companyId) // Refresh the list
    } catch (err) {
      console.error('Error ending event:', err)
    }
  }

  const formatDateRange = (start: string, end: string | null) => {
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : null
    
    if (!endDate) {
      return `Started ${startDate.toLocaleDateString('en-GB')}`
    }
    return `${startDate.toLocaleDateString('en-GB')} to ${endDate.toLocaleDateString('en-GB')}`
  }

  const currentEvent = events.find(event => event.is_current)
  const pastEvents = events.filter(event => !event.is_current)

  // Fetch logs for current event if admin
  useEffect(() => {
    const fetchLogs = async () => {
      if (!role || role !== 'admin' || !currentEvent) return;
      setLogsLoading(true);
      const { data, error } = await supabase
        .from('incident_logs')
        .select('*')
        .eq('event_id', currentEvent.id)
        .order('created_at', { ascending: false });
      setLogs(data || []);
      setLogsLoading(false);
    };
    fetchLogs();
  }, [role, events]);

  const handleDeleteLog = async (logId: string) => {
    if (role !== 'admin') return;
    setDeleting(true);
    try {
      // Get the log details first to check if it's an attendance log
      const { data: log } = await supabase
        .from('incident_logs')
        .select('*')
        .eq('id', logId)
        .single();

      if (log && log.incident_type === 'Attendance') {
        // Extract the count from the occurrence
        const count = parseInt(log.occurrence.match(/\d+/)?.[0] || '0');
        if (count > 0) {
          // Delete the corresponding attendance record
          await supabase
            .from('attendance_records')
            .delete()
            .eq('event_id', log.event_id)
            .eq('count', count)
            .eq('timestamp', log.created_at);
        }
      }

      // Delete the log itself
      await supabase.from('incident_logs').delete().eq('id', logId);
      setLogs(logs => logs.filter(l => l.id !== logId));
    } catch (err) {
      alert('Error deleting log: ' + ((err as Error).message || String(err)));
    } finally {
      setDeleting(false);
    }
  };

  // Delete all event data (admin only)
  const handleDeleteEvent = async (eventId: string) => {
    if (role !== 'admin') return;
    setDeleting(true)
    try {
      // Delete attendance records
      await supabase.from('attendance_records').delete().eq('event_id', eventId)
      // Delete support acts
      await supabase.from('support_acts').delete().eq('event_id', eventId)
      // Delete callsign assignments
      await supabase.from('callsign_assignments').delete().eq('event_id', eventId)
      // Delete callsign roles
      await supabase.from('callsign_roles').delete().eq('event_id', eventId)
      // Delete event callsigns
      await supabase.from('event_callsigns').delete().eq('event_id', eventId)
      // Get all incident ids for this event
      const { data: incidents } = await supabase.from('incident_logs').select('id').eq('event_id', eventId)
      const incidentIds = (incidents || []).map((i: any) => i.id)
      if (incidentIds.length > 0) {
        // Delete incident_events
        await supabase.from('incident_events').delete().in('incident_id', incidentIds)
        // Delete incident_attachments
        await supabase.from('incident_attachments').delete().in('incident_id', incidentIds)
        // Delete incident_links (both directions)
        await supabase.from('incident_links').delete().in('incident_id', incidentIds)
        await supabase.from('incident_links').delete().in('linked_incident_id', incidentIds)
      }
      // Delete incident logs
      await supabase.from('incident_logs').delete().eq('event_id', eventId)
      // Finally, delete the event
      await supabase.from('events').delete().eq('id', eventId)
      setShowDeleteConfirm(null)
      if (companyId) fetchEvents(companyId)
    } catch (err) {
      alert('Error deleting event: ' + ((err as Error).message || String(err)))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* System Status Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">System Status</h2>
            <SupabaseTest />
          </div>

          {/* Current Event Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Current Event</h2>
            {currentEvent ? (
              <div className="bg-white shadow rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold">{currentEvent.event_name}</h3>
                    <p className="text-gray-600">
                      {formatDateRange(currentEvent.start_datetime, currentEvent.end_datetime)}
                    </p>
                <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active Event
                      </span>
                  <button
                    onClick={() => setShowEndEventConfirm(true)}
                  className="ml-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    End Event
                  </button>
              </div>
            ) : (
              <p className="text-gray-600">No current event found.</p>
            )}
          </div>

          {/* Past Events Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Past Events</h2>
            {loading ? (
              <p className="text-gray-600">Loading events...</p>
            ) : pastEvents.length > 0 ? (
              <div className="space-y-4">
                {pastEvents.map(event => (
                  <div
                    key={event.id}
                    className="bg-white shadow rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="text-lg font-semibold">{event.event_name}</h3>
                      <p className="text-gray-600">
                        {formatDateRange(event.start_datetime, event.end_datetime)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setShowReactivateConfirm(event.id)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        Reactivate Event
                      </button>
                      {role === 'admin' && (
                        <button
                          onClick={() => setShowDeleteConfirm(event.id)}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                        >
                          Delete Event
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No past events found</p>
            )}
          </div>

          {/* Logs for Current Event */}
          {role === 'admin' && currentEvent && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Logs for Current Event</h2>
              {logsLoading ? (
                <p className="text-gray-600">Loading logs...</p>
              ) : logs.length > 0 ? (
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border-b">Type</th>
                      <th className="px-4 py-2 border-b">Occurrence</th>
                      <th className="px-4 py-2 border-b">Created</th>
                      <th className="px-4 py-2 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td className="px-4 py-2 border-b">{log.incident_type}</td>
                        <td className="px-4 py-2 border-b">{log.occurrence}</td>
                        <td className="px-4 py-2 border-b">{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</td>
                        <td className="px-4 py-2 border-b">
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                            disabled={deleting}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600">No logs found for this event.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* End Event Confirmation Modal */}
      {showEndEventConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">End Current Event?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to end {currentEvent?.event_name}? This will move it to past events.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEndEventConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEndEvent}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                End Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Event Confirmation Modal */}
      {showReactivateConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reactivate Event?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to reactivate {events.find(e => e.id === showReactivateConfirm)?.event_name}? 
              {currentEvent && " This will end the current event."}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReactivateConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => setCurrentEvent(showReactivateConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Reactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Event Confirmation Modal */}
      {typeof showDeleteConfirm === 'string' ? (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Event?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to <span className="font-bold text-red-600">permanently delete</span> <span className="font-semibold">{events.find(e => e.id === showDeleteConfirm)?.event_name}</span> and all its data? This cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (typeof showDeleteConfirm === 'string') handleDeleteEvent(showDeleteConfirm);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
} 