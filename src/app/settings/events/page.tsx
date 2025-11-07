"use client"
import React, { useState, useEffect, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import InviteManagement from '@/components/InviteManagement';
import { useEventMembership } from '@/hooks/useEventMembership';
import { CardContainer } from '@/components/ui/CardContainer';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDaysIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';
import { endEvent, deleteLog } from '../actions';
import type { Database } from '@/types/supabase';

// Utility to format date/time for logs table
function formatDateTime(ts: string | Date | undefined) {
  if (!ts) return '-';
  const date = typeof ts === 'string' ? new Date(ts) : ts;
  return date.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

export default function EventsSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { canAccessAdminFeatures, hasActiveMembership } = useEventMembership();
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  const fetchEvents = async (background = false, userId?: string) => {
    const effectiveUserId = userId || user?.id;
    console.log('[EventsPage] fetchEvents called', {
      background,
      providedUserId: userId,
      contextUserId: user?.id,
      effectiveUserId,
      hasUser: !!user
    });
    
    logger.debug('Fetching events', { component: 'EventsSettingsPage', action: 'fetchEvents', background, userId: effectiveUserId });
    if (background) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    // Use provided userId or user from AuthContext
    if (!effectiveUserId) {
      console.error('[EventsPage] No effective user ID available', {
        providedUserId: userId,
        contextUserId: user?.id,
        hasUser: !!user
      });
      setError('Not authenticated');
      setCurrentEvent(null);
      setSelectedEvent(null);
      setPastEvents([]);
      if (background) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
      return;
    }

    console.log('[EventsPage] Fetching profile for user', { userId: effectiveUserId });
    const { data: profile, error: profileError } = await supabase
      .from<Database['public']['Tables']['profiles']['Row'], Database['public']['Tables']['profiles']['Update']>('profiles')
      .select('company_id')
      .eq('id', effectiveUserId)
      .single();

    if (profileError || !profile?.company_id) {
      console.error('[EventsPage] Failed to fetch profile', {
        error: profileError?.message,
        hasProfile: !!profile,
        companyId: profile?.company_id
      });
      setError('Failed to load user profile or company association');
      setCurrentEvent(null);
      setSelectedEvent(null);
      setPastEvents([]);
      if (background) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
      return;
    }

    console.log('[EventsPage] Profile loaded, fetching events', {
      userId: effectiveUserId,
      companyId: profile.company_id
    });

    // Fetch current events with company_id filter
    const { data: current, error: currentError } = await supabase
      .from<Database['public']['Tables']['events']['Row'], Database['public']['Tables']['events']['Update']>('events')
      .select('*')
      .eq('is_current', true)
      .eq('company_id', profile.company_id);
      
    console.log('[EventsPage] Current events fetched', {
      count: current?.length || 0,
      error: currentError?.message,
      events: current?.map(e => ({ id: e.id, name: e.event_name }))
    });
    
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
    // Fetch past events with company_id filter
    const { data: past, error: pastError } = await supabase
      .from<Database['public']['Tables']['events']['Row'], Database['public']['Tables']['events']['Update']>('events')
      .select('*')
      .eq('is_current', false)
      .eq('company_id', profile.company_id)
      .order('event_date', { ascending: false });
      
    console.log('[EventsPage] Past events fetched', {
      count: past?.length || 0,
      error: pastError?.message
    });
    
    setPastEvents(past || []);
    if (pastError) setError(pastError.message);
    if (background) {
      setIsRefreshing(false);
    } else {
      setLoading(false);
    }
    
    console.log('[EventsPage] fetchEvents completed', {
      hasCurrentEvent: !!currentEvent,
      pastEventsCount: past?.length || 0
    });
  };

  const fetchLogs = async (eventId: string | null | undefined) => {
    logger.debug('Fetching logs', { component: 'EventsSettingsPage', action: 'fetchLogs', eventId: eventId || undefined });
    if (!eventId) return setLogs([]);
    setLogsLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from<Database['public']['Tables']['incident_logs']['Row'], Database['public']['Tables']['incident_logs']['Update']>('incident_logs')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    setLogs(data || []);
    if (error) setError('Failed to fetch logs: ' + error.message);
    setLogsLoading(false);
  };

  useEffect(() => {
    console.log('[EventsPage] useEffect triggered', {
      authLoading,
      userId: user?.id,
      hasUser: !!user,
      userEmail: user?.email,
      timestamp: new Date().toISOString()
    });
    
    logger.debug('useEffect for events ran', { component: 'EventsSettingsPage', action: 'useEffect', authLoading, userId: user?.id, hasUser: !!user });
    
    // Wait for auth to finish loading before fetching events
    if (authLoading) {
      console.log('[EventsPage] Auth still loading, waiting...');
      return;
    }
    
    console.log('[EventsPage] Auth finished loading, checking user...', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email
    });
    
    // After auth finishes loading, verify user is available
    const checkAuthAndFetch = async () => {
      // Clear any previous errors when auth finishes loading
      setError(null);
      
      // Double-check session if user is not available from context
      if (!user || !user.id) {
        console.log('[EventsPage] User not in context, checking session directly...');
        // Try to get session directly as a fallback
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('[EventsPage] Session check result', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          sessionError: sessionError?.message,
          sessionExpiresAt: session?.expires_at
        });
        
        if (session?.user) {
          console.log('[EventsPage] User found via direct session check, fetching events...', {
            userId: session.user.id,
            email: session.user.email
          });
          logger.debug('User found via direct session check', { component: 'EventsSettingsPage', userId: session.user.id });
          // User exists in session, fetch events with session user ID
          fetchEvents(false, session.user.id);
          return;
        }
        
        // No user found in context or session
        console.error('[EventsPage] No user found in context or session', {
          authLoading,
          hasUser: !!user,
          hasSession: !!session,
          sessionError: sessionError?.message
        });
        logger.warn('No user found after auth loaded', { component: 'EventsSettingsPage', authLoading, hasUser: !!user, hasSession: !!session });
        setLoading(false);
        setError('Not authenticated');
        setCurrentEvent(null);
        setPastEvents([]);
        return;
      }
      
      // User is authenticated, fetch events
      console.log('[EventsPage] User authenticated via context, fetching events...', {
        userId: user.id,
        email: user.email
      });
      logger.debug('Fetching events after auth confirmed', { component: 'EventsSettingsPage', userId: user.id });
      fetchEvents(false);
    };
    
    checkAuthAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]); // Depend on full user object, not just user?.id

  useEffect(() => {
    if (selectedEvent) {
      fetchLogs(selectedEvent.id);
    } else {
      setLogs([]);
    }
  }, [selectedEvent]); // Only depend on selectedEvent, not currentEvent

  const handleEndEvent = async () => {
    console.log('[EventsPage] handleEndEvent called', {
      hasCurrentEvent: !!currentEvent,
      currentEventId: currentEvent?.id,
      hasUser: !!user,
      userId: user?.id,
      endingEvent,
      isPending
    });
    
    if (!currentEvent) {
      console.warn('[EventsPage] No current event to end');
      return;
    }
    
    if (!confirm('Are you sure you want to end this event? This action cannot be undone.')) {
      console.log('[EventsPage] User cancelled end event');
      return;
    }

    // Ensure user is authenticated before proceeding
    if (!user?.id) {
      console.error('[EventsPage] No user available to end event');
      addToast({
        type: 'error',
        title: 'Error',
        message: 'You must be signed in to end an event',
      });
      return;
    }

    console.log('[EventsPage] Starting end event process', {
      eventId: currentEvent.id,
      eventName: currentEvent.event_name,
      userId: user.id
    });

    setEndingEvent(true);
    setError(null);
    
    startTransition(async () => {
      try {
        console.log('[EventsPage] Calling endEvent server action', {
          eventId: currentEvent.id
        });
        const result = await endEvent(currentEvent.id);
        
        console.log('[EventsPage] endEvent result', {
          success: !!result.success,
          error: result.error
        });
        
        if (result.error) {
          console.error('[EventsPage] Error ending event', result.error);
          addToast({
            type: 'error',
            title: 'Error',
            message: result.error,
          });
          setError(result.error);
        } else {
          console.log('[EventsPage] Event ended successfully, refreshing events list');
          addToast({
            type: 'success',
            title: 'Success',
            message: 'Event ended successfully',
          });
          // Refresh events list - user should be authenticated at this point
          await fetchEvents(false);
        }
      } catch (error) {
        console.error('[EventsPage] Exception ending event', error);
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to end event',
        });
      } finally {
        setEndingEvent(false);
        console.log('[EventsPage] End event process completed');
      }
    });
  };

  const handleReenableEvent = async (event: any) => {
    setReenablingEventId(event.id);
    setError(null);
    // Set all events to is_current=false first
    const { error: clearError } = await (supabase as any)
      .from('events')
      .update({ is_current: false })
      .neq('id', event.id);
    if (clearError) {
      setError('Failed to clear current event: ' + clearError.message);
      setReenablingEventId(null);
      return;
    }
    // Set selected event to is_current=true
    const { error: setCurrentError } = await (supabase as any)
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
    if (showDeleteConfirm !== logId) {
      setShowDeleteConfirm(logId);
      return;
    }

    setDeletingLogId(logId);
    setShowDeleteConfirm(null);
    setError(null);
    
    startTransition(async () => {
      const result = await deleteLog(logId);
      
      if (result.error) {
        addToast({
          type: 'error',
          title: 'Error',
          message: result.error,
        });
        setError(result.error);
      } else {
        // Optimistically update UI
        setLogs(prevLogs => prevLogs.filter(log => log.id.toString() !== logId && log.id !== logId));
        addToast({
          type: 'success',
          title: 'Success',
          message: 'Log deleted successfully',
        });
        // Refresh from database
        if (selectedEvent) {
          await fetchLogs(selectedEvent.id);
        }
      }
      setDeletingLogId(null);
    });
  };

  // Pagination
  const paginatedLogs = logs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Current Event Card */}
      <CardContainer>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-[#1a2a57] rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Current Event</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your active event and view logs</p>
            </div>
          </div>
          {isRefreshing && (
            <span className="text-xs text-blue-500 dark:text-blue-300 animate-pulse">Refreshing…</span>
          )}
        </div>

        {authLoading || loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-blue-100">Loading events...</div>
          </div>
        ) : error && error === 'Not authenticated' ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
              Please refresh the page or sign in again.
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        ) : currentEvent ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{currentEvent.event_name}</h3>
                {currentEvent.event_date && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDateTime(currentEvent.event_date)}
                  </p>
                )}
              </div>
              {(() => {
                const buttonDisabled = endingEvent || isPending;
                console.log('[EventsPage] End Event button render', {
                  endingEvent,
                  isPending,
                  buttonDisabled,
                  hasCurrentEvent: !!currentEvent,
                  hasUser: !!user
                });
                return (
                  <Button
                    variant="destructive"
                    onClick={handleEndEvent}
                    disabled={buttonDisabled}
                    className={buttonDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    {buttonDisabled ? 'Ending...' : 'End Event'}
                  </Button>
                );
              })()}
            </div>

            {/* Logs Section */}
            <div className="border-t border-gray-200 dark:border-[#2d437a] pt-6">
              <h3 className="text-base font-semibold mb-4 text-gray-800 dark:text-blue-200">Recent Logs</h3>
              {logsLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-blue-100">Loading logs...</div>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 border border-gray-200 dark:border-[#2d437a] rounded-lg">
                  <CalendarDaysIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No logs for this event</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Timestamp</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedLogs.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">{log.incident_type || 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate">{log.details || log.occurrence || '-'}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatDateTime(log.timestamp || log.created_at)}</TableCell>
                            <TableCell className="text-right">
                              {showDeleteConfirm === log.id.toString() ? (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowDeleteConfirm(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteLog(log.id.toString())}
                                    disabled={deletingLogId === log.id.toString() || isPending}
                                  >
                                    Confirm
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteLog(log.id.toString())}
                                  disabled={deletingLogId === log.id.toString() || isPending}
                                >
                                  <TrashIcon className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-[#2d437a]">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {(currentPage - 1) * logsPerPage + 1} to {Math.min(currentPage * logsPerPage, logs.length)} of {logs.length} logs
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 border border-gray-200 dark:border-[#2d437a] rounded-lg">
            <CalendarDaysIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No current event</p>
          </div>
        )}
      </CardContainer>

      {/* Past Events Card */}
      <CardContainer>
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-blue-200">Past Events</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-blue-100">Loading events...</div>
          </div>
        ) : pastEvents.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 dark:border-[#2d437a] rounded-lg">
            <CalendarDaysIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No past events found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastEvents.map((event: any) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.event_name}</TableCell>
                    <TableCell>{formatDateTime(event.event_date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                          disabled={selectedEvent?.id === event.id}
                        >
                          {selectedEvent?.id === event.id ? 'Selected' : 'View Logs'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReenableEvent(event)}
                          disabled={reenablingEventId === event.id}
                        >
                          {reenablingEventId === event.id ? 'Re-enabling...' : 'Re-enable'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContainer>
    </div>
  );
} 