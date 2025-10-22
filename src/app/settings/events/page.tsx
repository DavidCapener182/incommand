"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import InviteManagement from '@/components/InviteManagement';
import { useEventMembership } from '@/hooks/useEventMembership';

// Utility to format date/time for logs table
function formatDateTime(ts: string | Date | undefined) {
  if (!ts) return '-';
  const date = typeof ts === 'string' ? new Date(ts) : ts;
  return date.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

export default function EventsSettingsPage() {
  const { canAccessAdminFeatures, hasActiveMembership } = useEventMembership();
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
    logger.debug('Fetching events', { component: 'EventsSettingsPage', action: 'fetchEvents', background });
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
    logger.debug('Fetching logs', { component: 'EventsSettingsPage', action: 'fetchLogs', eventId: eventId || undefined });
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
    logger.debug('useEffect for events ran', { component: 'EventsSettingsPage', action: 'useEffect' });
    fetchEvents(false);
  }, []); // Only run once on mount

  useEffect(() => {
    if (selectedEvent) {
      fetchLogs(selectedEvent.id);
    } else {
      setLogs([]);
    }
  }, [selectedEvent]); // Only depend on selectedEvent, not currentEvent

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
    logger.debug('Attempting to delete log', { component: 'EventsSettingsPage', action: 'handleDeleteLog', logId, logIdType: typeof logId });
    setDeletingLogId(logId);
    setError(null);
    
    try {
      // Find the log in our state
      const log = logs.find(l => l.id.toString() === logId || l.id === logId);
      
      if (!log) {
        logger.debug('Log not found in state', { component: 'EventsSettingsPage', action: 'handleDeleteLog', availableLogs: logs.map(l => ({ id: l.id, type: typeof l.id })) });
        setError('Log not found');
        setDeletingLogId(null);
        return;
      }

      logger.debug('Found log to delete', { component: 'EventsSettingsPage', action: 'handleDeleteLog', log });

      // Convert logId to integer for database operations
      const numericLogId = parseInt(logId);

      // Delete related data first (in reverse order of dependencies)
      logger.debug('Deleting related data', { component: 'EventsSettingsPage', action: 'handleDeleteLog' });
      
      // Delete incident events
      const { error: eventsError } = await supabase
        .from('incident_events')
        .delete()
        .eq('incident_id', numericLogId);
      if (eventsError) logger.debug('Events deletion error', { component: 'EventsSettingsPage', action: 'handleDeleteLog', error: eventsError });

      // Delete incident attachments
      const { error: attachmentsError } = await supabase
        .from('incident_attachments')
        .delete()
        .eq('incident_id', numericLogId);
      if (attachmentsError) logger.debug('Attachments deletion error', { component: 'EventsSettingsPage', action: 'handleDeleteLog', error: attachmentsError });

      // Delete incident links (both directions)
      const { error: linksError } = await supabase
        .from('incident_links')
        .delete()
        .or(`incident_id.eq.${numericLogId},linked_incident_id.eq.${numericLogId}`);
      if (linksError) logger.debug('Links deletion error', { component: 'EventsSettingsPage', action: 'handleDeleteLog', error: linksError });

      // Delete incident escalations
      const { error: escalationsError } = await supabase
        .from('incident_escalations')
        .delete()
        .eq('incident_id', numericLogId);
      if (escalationsError) logger.debug('Escalations deletion error', { component: 'EventsSettingsPage', action: 'handleDeleteLog', error: escalationsError });

      // Delete incident updates
      const { error: updatesError } = await supabase
        .from('incident_updates')
        .delete()
        .eq('incident_id', numericLogId);
      if (updatesError) logger.debug('Updates deletion error', { component: 'EventsSettingsPage', action: 'handleDeleteLog', error: updatesError });

      // Delete staff assignments
      const { error: assignmentsError } = await supabase
        .from('incident_staff_assignments')
        .delete()
        .eq('incident_id', numericLogId);
      if (assignmentsError) logger.debug('Assignments deletion error', { component: 'EventsSettingsPage', action: 'handleDeleteLog', error: assignmentsError });

      // If this is an attendance log, also delete from attendance_records
      if (log.incident_type === 'Attendance') {
        logger.debug('Deleting attendance record', { component: 'EventsSettingsPage', action: 'handleDeleteLog', eventId: log.event_id, timestamp: log.timestamp });
        const { error: attendanceError } = await supabase
          .from('attendance_records')
          .delete()
          .eq('event_id', log.event_id)
          .eq('timestamp', log.timestamp);
        
        if (attendanceError) {
          logger.error('Error deleting attendance record', attendanceError, { component: 'EventsSettingsPage', action: 'handleDeleteLog' });
        } else {
          logger.debug('Successfully deleted attendance record', { component: 'EventsSettingsPage', action: 'handleDeleteLog' });
        }
      }

      // Finally, delete the incident log itself
      logger.debug('Deleting main incident log', { component: 'EventsSettingsPage', action: 'handleDeleteLog' });
      const { error, count } = await supabase
        .from('incident_logs')
        .delete()
        .eq('id', numericLogId);

      logger.debug('Delete result', { component: 'EventsSettingsPage', action: 'handleDeleteLog', error, count });

      if (error) {
        logger.error('Failed to delete log', error, { component: 'EventsSettingsPage', action: 'handleDeleteLog' });
        setError('Failed to delete log: ' + error.message);
        setDeletingLogId(null);
        return;
      }

      logger.debug('Log deleted successfully. Updating UI', { component: 'EventsSettingsPage', action: 'handleDeleteLog' });

      // Update local state immediately for better UX
      setLogs(prevLogs => {
        const filtered = prevLogs.filter(log => log.id !== numericLogId && log.id !== logId);
        logger.debug('Filtered logs', { component: 'EventsSettingsPage', action: 'handleDeleteLog', filteredCount: filtered.length, originalCount: prevLogs.length });
        return filtered;
      });
      
      // Also refresh from database to ensure consistency
      if (selectedEvent) {
        logger.debug('Refreshing logs from database', { component: 'EventsSettingsPage', action: 'handleDeleteLog' });
        await fetchLogs(selectedEvent.id);
      }
    } catch (error) {
      logger.error('Error deleting log', error, { component: 'EventsSettingsPage', action: 'handleDeleteLog' });
      setError('Failed to delete log: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setDeletingLogId(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900 dark:text-white">Event Settings</h1>
      
      <div className="space-y-4 sm:space-y-6">
        <div className="card-depth text-gray-900 dark:text-gray-100 p-3 sm:p-6">
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

        {/* Event Invites Management - Only show for admin users with active membership */}
        {canAccessAdminFeatures && hasActiveMembership && currentEvent && (
          <div className="card-depth text-gray-900 dark:text-gray-100 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-[#1a2a57] rounded-lg">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Event Invites</h2>
            </div>
            <InviteManagement eventId={currentEvent.id} />
          </div>
        )}
        
        <div className="card-depth text-gray-900 dark:text-gray-100 p-4 sm:p-6">
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