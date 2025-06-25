'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Utility to format date/time for logs table
function formatDateTime(ts: string | Date | undefined) {
  if (!ts) return '-';
  const date = typeof ts === 'string' ? new Date(ts) : ts;
  return date.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

export default function EventsSettingsPage() {
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [endingEvent, setEndingEvent] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [reenablingEventId, setReenablingEventId] = useState<string | null>(null);

  const fetchEvents = async (background = false) => {
    console.log('DEBUG: fetchEvents called. background:', background, 'at', new Date().toISOString());
    if (background) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    // Fetch all current events (should be 0 or 1, but handle >1)
    const { data: current, error: currentError } = await supabase
      .from('events')
      .select('*')
      .eq('is_current', true);
    if (currentError) {
      setError(currentError.message);
      setCurrentEvent(null);
      setSelectedEvent(null);
    } else if (!current || current.length === 0) {
      setCurrentEvent(null);
      setSelectedEvent(null);
    } else if (current.length > 1) {
      setError('Multiple current events found. Please resolve in admin.');
      setCurrentEvent(null);
      setSelectedEvent(null);
    } else {
      setCurrentEvent(current[0]);
      setSelectedEvent(current[0]);
    }
    // Fetch past events
    const { data: past, error: pastError } = await supabase
      .from('events')
      .select('*')
      .eq('is_current', false)
      .order('event_date', { ascending: false });
    setPastEvents(past || []);
    if (pastError) setError(pastError.message);
    if (background) {
      setIsRefreshing(false);
    } else {
      setLoading(false);
    }
  };

  const fetchLogs = async (eventId: string | null | undefined) => {
    console.log('DEBUG: fetchLogs called. eventId:', eventId, 'at', new Date().toISOString());
    if (!eventId) return setLogs([]);
    setLogsLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('incident_logs')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    setLogs(data || []);
    if (error) setError('Failed to fetch logs: ' + error.message);
    setLogsLoading(false);
  };

  useEffect(() => {
    console.log('DEBUG: useEffect for events/logs ran. currentEvent:', currentEvent, 'selectedEvent:', selectedEvent, 'at', new Date().toISOString());
    fetchEvents(false);
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchLogs(selectedEvent.id);
    } else {
      setLogs([]);
    }
  }, [selectedEvent, currentEvent]);

  const handleEndEvent = async () => {
    if (!currentEvent) return;
    setEndingEvent(true);
    setError(null);
    const { error: endError } = await supabase
      .from('events')
      .update({ is_current: false })
      .eq('id', currentEvent.id);
    setEndingEvent(false);
    if (endError) {
      setError('Failed to end event: ' + endError.message);
      return;
    }
    // Single full refresh after ending
    await fetchEvents(false);
    await fetchLogs(currentEvent?.id);
  };

  const handleReenableEvent = async (event: any) => {
    setReenablingEventId(event.id);
    setError(null);
    // Set all events to is_current=false first
    const { error: clearError } = await supabase
      .from('events')
      .update({ is_current: false })
      .neq('id', event.id);
    if (clearError) {
      setError('Failed to clear current event: ' + clearError.message);
      setReenablingEventId(null);
      return;
    }
    // Set selected event to is_current=true
    const { error: setCurrentError } = await supabase
      .from('events')
      .update({ is_current: true })
      .eq('id', event.id);
    setReenablingEventId(null);
    if (setCurrentError) {
      setError('Failed to re-enable event: ' + setCurrentError.message);
      return;
    }
    // Single full refresh after re-enabling
    await fetchEvents(false);
    await fetchLogs(event.id);
  };

  const handleDeleteEvent = async (event: any) => {
    alert(`Delete event ${event.event_name} functionality coming soon!`);
  };
  const handleDeleteLog = async (logId: string) => {
    setDeletingLogId(logId);
    setError(null);
    // Find the log in the logs state
    const log = logs.find((l: any) => l.id === logId);
    // If Attendance, delete from attendance_records by event_id and timestamp
    if (log && log.incident_type === 'Attendance') {
      await supabase
        .from('attendance_records')
        .delete()
        .eq('event_id', log.event_id)
        .eq('timestamp', log.timestamp);
    }
    const { error } = await supabase
      .from('incident_logs')
      .delete()
      .eq('id', logId);
    setDeletingLogId(null);
    if (error) {
      setError('Failed to delete log: ' + error.message);
      return;
    }
    // Refresh logs for selected event
    if (selectedEvent) {
      await fetchLogs(selectedEvent.id);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="bg-white shadow rounded-lg p-2 mb-6 w-full max-w-none mx-auto">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          Current Event
          {isRefreshing && <span className="ml-2 text-xs text-blue-500 animate-pulse">Refreshing…</span>}
        </h2>
        {loading ? (
          <div className="text-gray-500">Loading events...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : currentEvent ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-lg">{currentEvent.event_name}</div>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                onClick={handleEndEvent}
                disabled={endingEvent}
              >
                {endingEvent ? 'Ending...' : 'End Event'}
              </button>
            </div>
            <div className="mt-2">
              <h3 className="text-md font-semibold mb-2">Logs</h3>
              {logsLoading ? (
                <div className="text-gray-500">Loading logs...</div>
              ) : logs.length === 0 ? (
                <div className="text-gray-400">No logs found for this event.</div>
              ) : (
                <table className="min-w-full table-auto border-collapse w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 text-left">Log #</th>
                      <th className="px-2 py-1 text-left">Time</th>
                      <th className="px-2 py-1 text-left">From</th>
                      <th className="px-2 py-1 text-left">To</th>
                      <th className="px-2 py-1 text-left">Occurrence</th>
                      <th className="px-2 py-1 text-left">Type</th>
                      <th className="px-2 py-1 text-left">Action</th>
                      <th className="px-2 py-1 text-left">Status</th>
                      <th className="px-2 py-1 text-left"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log: any) => (
                      <tr key={log.id} className="border-b last:border-b-0">
                        <td className="px-2 py-1 font-mono text-xs">{log.log_number || log.id}</td>
                        <td className="px-2 py-1 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                        <td className="px-2 py-1">{log.callsign_from || '-'}</td>
                        <td className="px-2 py-1">{log.callsign_to || '-'}</td>
                        <td className="px-2 py-1 max-w-xs truncate" title={log.occurrence}>{log.occurrence}</td>
                        <td className="px-2 py-1">
                          <span className="inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-700 font-semibold">
                            {log.incident_type}
                          </span>
                        </td>
                        <td className="px-2 py-1 max-w-xs truncate" title={log.action_taken}>{log.action_taken}</td>
                        <td className="px-2 py-1">
                          {/* Attendance logs always show 'Logged', others show Open/Closed */}
                          {log.incident_type === 'Attendance' ? (
                            <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 font-semibold">Logged</span>
                          ) : log.is_closed ? (
                            <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-700 font-semibold">Closed</span>
                          ) : (
                            <span className="inline-block px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700 font-semibold">Open</span>
                          )}
                        </td>
                        <td className="px-2 py-1">
                          <button
                            className="text-red-500 hover:text-red-700 font-semibold disabled:opacity-50"
                            onClick={() => handleDeleteLog(log.id)}
                            disabled={deletingLogId === log.id}
                          >
                            {deletingLogId === log.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <div className="text-gray-400 italic">No current event.</div>
        )}
      </div>
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Past Events</h2>
        {loading ? (
          <div className="text-gray-500">Loading events...</div>
        ) : pastEvents.length === 0 ? (
          <div className="text-gray-400 italic">No past events found.</div>
        ) : (
          <div className="space-y-4">
            {pastEvents.map(event => (
              <div
                key={event.id}
                className={`border rounded p-4 ${selectedEvent && selectedEvent.id === event.id ? 'bg-blue-50' : 'bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold">{event.event_name}</div>
                  <div className="flex space-x-2">
                    <button
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      onClick={() => handleReenableEvent(event)}
                      disabled={reenablingEventId === event.id}
                    >
                      {reenablingEventId === event.id ? 'Re-enabling...' : 'Re-enable'}
                    </button>
                    <button
                      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      onClick={() => handleDeleteEvent(event)}
                    >
                      Delete
                    </button>
                    <button
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      onClick={() => setSelectedEvent(event)}
                    >
                      View Logs
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 