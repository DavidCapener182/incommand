"use client"
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
    console.log('Attempting to delete log with ID:', logId, 'Type:', typeof logId);
    setDeletingLogId(logId);
    setError(null);
    
    try {
      // Find the log in the logs state
      const log = logs.find((l: any) => l.id === parseInt(logId) || l.id === logId);
      
      if (!log) {
        console.log('Log not found in state. Available logs:', logs.map(l => ({ id: l.id, type: typeof l.id })));
        setError('Log not found');
        setDeletingLogId(null);
        return;
      }

      console.log('Found log to delete:', log);

      // Convert logId to integer for database operations
      const numericLogId = parseInt(logId);

      // Delete related data first (in reverse order of dependencies)
      console.log('Deleting related data...');
      
      // Delete incident events
      const { error: eventsError } = await supabase
        .from('incident_events')
        .delete()
        .eq('incident_id', numericLogId);
      if (eventsError) console.log('Events deletion error:', eventsError);

      // Delete incident attachments
      const { error: attachmentsError } = await supabase
        .from('incident_attachments')
        .delete()
        .eq('incident_id', numericLogId);
      if (attachmentsError) console.log('Attachments deletion error:', attachmentsError);

      // Delete incident links (both directions)
      const { error: linksError } = await supabase
        .from('incident_links')
        .delete()
        .or(`incident_id.eq.${numericLogId},linked_incident_id.eq.${numericLogId}`);
      if (linksError) console.log('Links deletion error:', linksError);

      // Delete incident escalations
      const { error: escalationsError } = await supabase
        .from('incident_escalations')
        .delete()
        .eq('incident_id', numericLogId);
      if (escalationsError) console.log('Escalations deletion error:', escalationsError);

      // Delete incident updates
      const { error: updatesError } = await supabase
        .from('incident_updates')
        .delete()
        .eq('incident_id', numericLogId);
      if (updatesError) console.log('Updates deletion error:', updatesError);

      // Delete staff assignments
      const { error: assignmentsError } = await supabase
        .from('staff_assignments')
        .delete()
        .eq('incident_id', numericLogId);
      if (assignmentsError) console.log('Assignments deletion error:', assignmentsError);

      // If this is an attendance log, also delete from attendance_records
      if (log.incident_type === 'Attendance') {
        console.log('Deleting attendance record for event_id:', log.event_id, 'timestamp:', log.timestamp);
        const { error: attendanceError } = await supabase
          .from('attendance_records')
          .delete()
          .eq('event_id', log.event_id)
          .eq('timestamp', log.timestamp);
        
        if (attendanceError) {
          console.error('Error deleting attendance record:', attendanceError);
        } else {
          console.log('Successfully deleted attendance record');
        }
      }

      // Finally, delete the incident log itself
      console.log('Deleting main incident log...');
      const { error, count } = await supabase
        .from('incident_logs')
        .delete()
        .eq('id', numericLogId);

      console.log('Delete result:', { error, count });

      if (error) {
        console.error('Failed to delete log:', error);
        setError('Failed to delete log: ' + error.message);
        setDeletingLogId(null);
        return;
      }

      console.log('Log deleted successfully. Updating UI...');

      // Update local state immediately for better UX
      setLogs(prevLogs => {
        const filtered = prevLogs.filter(log => log.id !== numericLogId && log.id !== logId);
        console.log('Filtered logs:', filtered.length, 'from', prevLogs.length);
        return filtered;
      });
      
      // Also refresh from database to ensure consistency
      if (selectedEvent) {
        console.log('Refreshing logs from database...');
        await fetchLogs(selectedEvent.id);
      }
    } catch (error) {
      console.error('Error deleting log:', error);
      setError('Failed to delete log: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setDeletingLogId(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900 dark:text-white">Event Settings</h1>
      
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-sm rounded-2xl border border-gray-200 dark:border-[#2d437a] p-3 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-800 dark:text-blue-200 flex items-center gap-2">
            Current Event
            {isRefreshing && <span className="ml-2 text-xs text-blue-500 dark:text-blue-300 animate-pulse">Refreshing…</span>}
          </h2>
          {loading ? (
            <div className="text-gray-500 dark:text-blue-100">Loading events...</div>
          ) : error ? (
            <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>
          ) : currentEvent ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                <div className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">{currentEvent.event_name}</div>
                <button
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 disabled:opacity-50 transition-colors w-full sm:w-auto"
                  onClick={handleEndEvent}
                  disabled={endingEvent}
                >
                  {endingEvent ? 'Ending...' : 'End Event'}
                </button>
              </div>
              <div className="mt-2">
                <h3 className="text-sm sm:text-md font-semibold mb-2 text-gray-800 dark:text-blue-200">Logs</h3>
                {logsLoading ? (
                  <div className="text-gray-500 dark:text-blue-100">Loading logs...</div>
                ) : logs.length === 0 ? (
                  <div className="text-gray-400 dark:text-blue-300">No logs for this event.</div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full px-4 sm:px-0">
                      <table className="min-w-full border border-gray-200 dark:border-[#2d437a] rounded-lg overflow-hidden">
                        <thead className="bg-gray-100 dark:bg-[#1a2a57]">
                          <tr>
                            <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-blue-100 uppercase tracking-wider">Type</th>
                            <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-blue-100 uppercase tracking-wider">Details</th>
                            <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-blue-100 uppercase tracking-wider">Timestamp</th>
                            <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-blue-100 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-[#23408e] divide-y divide-gray-200 dark:divide-[#2d437a]">
                          {logs.map((log: any) => (
                            <tr key={log.id}>
                              <td className="px-2 sm:px-4 py-2 text-gray-900 dark:text-blue-100 font-medium text-sm">{log.incident_type}</td>
                              <td className="px-2 sm:px-4 py-2 text-gray-700 dark:text-blue-100 text-sm max-w-xs truncate">{log.details}</td>
                              <td className="px-2 sm:px-4 py-2 text-gray-700 dark:text-blue-100 text-sm whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                              <td className="px-2 sm:px-4 py-2">
                                <button
                                  className="px-2 sm:px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 text-xs disabled:opacity-50 transition-colors"
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
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-gray-400 dark:text-blue-300">No current event.</div>
          )}
        </div>
        
        <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-sm rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-blue-200">Past Events</h2>
          {loading ? (
            <div className="text-gray-500 dark:text-blue-100">Loading events...</div>
          ) : pastEvents.length === 0 ? (
            <div className="text-gray-400 dark:text-blue-300">No past events found.</div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full px-4 sm:px-0">
                <table className="min-w-full border border-gray-200 dark:border-[#2d437a] rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 dark:bg-[#1a2a57]">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-blue-100 uppercase tracking-wider">Event Name</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-blue-100 uppercase tracking-wider">Date</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-blue-100 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[#23408e] divide-y divide-gray-200 dark:divide-[#2d437a]">
                    {pastEvents.map((event: any) => (
                      <tr key={event.id}>
                        <td className="px-2 sm:px-4 py-2 text-gray-900 dark:text-blue-100 font-medium text-sm">{event.event_name}</td>
                        <td className="px-2 sm:px-4 py-2 text-gray-700 dark:text-blue-100 text-sm whitespace-nowrap">{formatDateTime(event.event_date)}</td>
                        <td className="px-2 sm:px-4 py-2">
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                            <button
                              className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-xs disabled:opacity-50 transition-colors"
                              onClick={() => setSelectedEvent(event)}
                              disabled={selectedEvent?.id === event.id}
                            >
                              {selectedEvent?.id === event.id ? 'Selected' : 'View Logs'}
                            </button>
                            <button
                              className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-xs disabled:opacity-50 transition-colors"
                              onClick={() => handleReenableEvent(event)}
                              disabled={reenablingEventId === event.id}
                            >
                              {reenablingEventId === event.id ? 'Re-enabling...' : 'Re-enable'}
                            </button>
                            <button
                              className="px-2 sm:px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 text-xs disabled:opacity-50 transition-colors"
                              onClick={() => handleDeleteEvent(event)}
                              disabled
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 