'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import IncidentDetailsModal from './IncidentDetailsModal'
import { RealtimeChannel } from '@supabase/supabase-js'
import { ArrowUpIcon, MapPinIcon, MagnifyingGlassIcon, XMarkIcon, ViewColumnsIcon, TableCellsIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { ToastMessage } from './Toast'
import { CollaborationBoard } from './CollaborationBoard'
import { getIncidentTypeStyle, getSeverityBorderClass } from '../utils/incidentStyles'
import { FilterState, filterIncidents } from '../utils/incidentFilters'

interface Incident {
  id: number
  log_number: string
  timestamp: string
  callsign_from: string
  callsign_to: string
  occurrence: string
  incident_type: string
  action_taken: string
  is_closed: boolean
  event_id: string
  status: string
}

const getRowStyle = (incident: Incident) => {
  const highPriorityTypes = [
    'Ejection',
    'Code Green',
    'Code Black',
    'Code Pink',
    'Aggressive Behaviour',
    'Missing Child/Person',
    'Hostile Act',
    'Counter-Terror Alert',
    'Fire Alarm',
    'Evacuation',
    'Medical',
    'Suspicious Behaviour',
    'Queue Build-Up' // Consider filtering for severe/urgent only in future
  ];
  if (highPriorityTypes.includes(incident.incident_type)) {
    return 'bg-red-50 hover:bg-red-100';
  }
  const priority = (incident as any).priority as string | undefined;
  if (!incident.is_closed && priority) {
    const p = priority.toLowerCase();
    if (p === 'urgent' || p === 'high') return 'bg-red-50 hover:bg-red-100';
    if (p === 'medium') return 'bg-yellow-50 hover:bg-yellow-100';
  }
  if (!incident.is_closed && incident.incident_type !== 'Attendance' && incident.incident_type !== 'Sit Rep') {
    return 'bg-yellow-50 hover:bg-yellow-100';
  }
  return 'hover:bg-gray-50';
};

// Global subscription tracking to prevent duplicates
const activeSubscriptions = new Map<string, boolean>();
const globalToastCallbacks = new Map<string, (toast: Omit<ToastMessage, 'id'>) => void>();
const recentToasts = new Map<string, number>(); // Track recent toasts to prevent duplicates

// Add debugging
logger.debug('IncidentTable module loaded', { component: 'IncidentTable', action: 'moduleLoad', activeSubscriptions: activeSubscriptions.size, toastCallbacks: globalToastCallbacks.size });

export default function IncidentTable({ 
  filters, 
  onDataLoaded, 
  onToast,
  viewMode = 'table',
  onViewModeChange,
  currentUser,
  currentEventId: propCurrentEventId,
  onFiltersChange
}: { 
  filters: FilterState; 
  onDataLoaded?: (data: Incident[]) => void; 
  onToast?: (toast: Omit<ToastMessage, 'id'>) => void;
  viewMode?: 'table' | 'board' | 'staff';
  onViewModeChange?: (mode: 'table' | 'board' | 'staff') => void;
  currentUser?: any;
  currentEventId?: string;
  onFiltersChange?: (filters: FilterState) => void;
}) {
  const componentId = useRef(Math.random().toString(36).substr(2, 9));
  logger.debug('IncidentTable component rendered', { component: 'IncidentTable', action: 'render', componentId: componentId.current, onToastAvailable: !!onToast });

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentEventId, setCurrentEventId] = useState<string | null>(null)
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const [callsignAssignments, setCallsignAssignments] = useState<Record<string, string>>({})
  const [callsignShortToName, setCallsignShortToName] = useState<Record<string, string>>({})
  const [expandedIncidentId, setExpandedIncidentId] = useState<number | null>(null)

  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [manualStatusChanges, setManualStatusChanges] = useState<Set<number>>(new Set())

  // Use refs to avoid stale closures in the subscription
  const manualStatusChangesRef = useRef<Set<number>>(new Set())
  const onToastRef = useRef(onToast)
  
  // Create a reusable fetchIncidents function
  const fetchIncidents = useCallback(async () => {
    if (!currentEventId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('incident_logs')
        .select('*')
        .eq('event_id', currentEventId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
      setLastUpdated(new Date());
      if (onDataLoaded) {
        onDataLoaded(data || []);
      }
    } catch (err) {
      logger.error('Error fetching incidents', err, { component: 'IncidentTable', action: 'fetchIncidents', eventId: currentEventId || undefined });
      setError('Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  }, [currentEventId, onDataLoaded]);
  
  // Keep refs in sync with state/props
  useEffect(() => {
    manualStatusChangesRef.current = manualStatusChanges
  }, [manualStatusChanges])
  
  useEffect(() => {
    onToastRef.current = onToast
  }, [onToast])

  // Cleanup function to handle unsubscribe
  const cleanup = () => {
    if (subscriptionRef.current) {
      logger.debug('Cleaning up incident table subscription', { component: 'IncidentTable', action: 'cleanup', eventId: currentEventId || undefined });
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    // Remove from active subscriptions map and global toast callbacks
    if (currentEventId) {
      const subscriptionKey = `incident_logs_${currentEventId}`;
      activeSubscriptions.delete(subscriptionKey);
      globalToastCallbacks.delete(subscriptionKey);
      logger.debug('Removed subscription and toast callback from active maps', { component: 'IncidentTable', action: 'cleanup', subscriptionKey });
    }
  };

  useEffect(() => {
    const checkCurrentEvent = async () => {
      logger.debug('Checking for current event', { component: 'IncidentTable', action: 'checkCurrentEvent' });
      try {
        const { data: eventData } = await supabase
          .from('events')
          .select('id')
          .eq('is_current', true)
          .single();

        const newEventId = eventData?.id || null;
        logger.debug('Setting current event ID', { component: 'IncidentTable', action: 'checkCurrentEvent', eventId: newEventId });
        setCurrentEventId(newEventId);
      } catch (err) {
        logger.error('Error checking current event', err, { component: 'IncidentTable', action: 'checkCurrentEvent' });
        setCurrentEventId(null);
      }
    };

    checkCurrentEvent();
  }, []);

  useEffect(() => {
    logger.debug('Subscription useEffect triggered', { component: 'IncidentTable', action: 'subscriptionEffect', currentEventId, eventIdType: typeof currentEventId });
    if (!currentEventId || typeof currentEventId !== 'string' || currentEventId.trim() === '') {
      logger.debug('No current event ID - skipping subscription', { component: 'IncidentTable', action: 'subscriptionEffect', currentEventId });
      return;
    }
    logger.debug('Current event ID valid - proceeding with subscription setup', { component: 'IncidentTable', action: 'subscriptionEffect', currentEventId });

    // Check if there's already an active subscription for this event
    const subscriptionKey = `incident_logs_${currentEventId}`;
    logger.debug('Checking subscription', { component: 'IncidentTable', action: 'subscriptionEffect', componentId: componentId.current, subscriptionKey });
    
    if (activeSubscriptions.has(subscriptionKey)) {
      logger.debug('Subscription already exists for event - skipping duplicate', { component: 'IncidentTable', action: 'subscriptionEffect', currentEventId, componentId: componentId.current });
      // IMPORTANT: Don't overwrite existing toast callback to prevent duplicates
      logger.debug('Keeping existing toast callback to prevent duplicates', { component: 'IncidentTable', action: 'subscriptionEffect', componentId: componentId.current });
      return;
    }



    // DO NOT call cleanup() here!

    // Mark this subscription as active and register toast callback
    activeSubscriptions.set(subscriptionKey, true);
    if (onToast) {
      globalToastCallbacks.set(subscriptionKey, onToast);
      logger.debug('Registered toast callback for new subscription', { component: 'IncidentTable', action: 'subscriptionEffect', componentId: componentId.current });
    }
    logger.debug('Created new subscription for', { component: 'IncidentTable', action: 'subscriptionEffect', subscriptionKey });

    // Set up new subscription with a stable channel name
    logger.debug('Setting up Supabase subscription for event', { component: 'IncidentTable', action: 'subscriptionEffect', currentEventId });
    logger.debug('Subscription filter', { component: 'IncidentTable', action: 'subscriptionEffect', filter: `event_id=eq.${currentEventId}` });
    
    // Basic connectivity verification
    logger.debug('Setting up real-time subscription for event', { component: 'IncidentTable', action: 'subscriptionEffect', currentEventId });
    
    subscriptionRef.current = supabase
      .channel(`incident_logs_${currentEventId}`)
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'incident_logs',
          filter: `event_id=eq.${currentEventId}`
        },
        (payload) => {
          logger.debug('Real-time event received', { component: 'IncidentTable', action: 'subscriptionEffect', eventType: payload.eventType, incidentLogNumber: (payload.new as any)?.log_number || (payload.old as any)?.log_number });
        logger.debug('Event details', { component: 'IncidentTable', action: 'subscriptionEffect', details: payload.new || payload.old });
        logger.debug('onToast available', { component: 'IncidentTable', action: 'subscriptionEffect', available: !!onToastRef.current });
          
          setIncidents(prev => {
          let newIncidents: Incident[] = [];
          if (payload.eventType === 'INSERT') {
              newIncidents = [payload.new as Incident, ...prev];
              
              // Show toast for new incident using global callback
              const globalToastCallback = globalToastCallbacks.get(subscriptionKey);
              logger.debug('INSERT event received. Subscription key', { component: 'IncidentTable', action: 'subscriptionEffect', subscriptionKey });
        logger.debug('Global toast callback available', { component: 'IncidentTable', action: 'subscriptionEffect', available: !!globalToastCallback });
        logger.debug('All toast callbacks', { component: 'IncidentTable', action: 'subscriptionEffect', keys: Array.from(globalToastCallbacks.keys()) });
              
              if (globalToastCallback) {
                const incident = payload.new as Incident;
                
                // Create a unique key for this toast to prevent duplicates
                const toastKey = `${incident.log_number}-${incident.incident_type}-INSERT`;
                const now = Date.now();
                
                // Check if we've shown this toast recently (within 10 seconds)
                if (recentToasts.has(toastKey) && (now - recentToasts.get(toastKey)!) < 10000) {
                  logger.debug('Duplicate toast prevented for', { component: 'IncidentTable', action: 'subscriptionEffect', incidentLogNumber: incident.log_number });
                  return newIncidents; // Early return to prevent duplicate toast
                }
                
                // Mark this toast as sent
                recentToasts.set(toastKey, now);
                
                // Clean up old toast records (older than 30 seconds)
                Array.from(recentToasts.entries()).forEach(([key, timestamp]) => {
                  if (now - timestamp > 30000) {
                    recentToasts.delete(key);
                  }
                });
                
                const isHighPriority = [
                  'Ejection', 'Code Green', 'Code Black', 'Code Pink', 'Aggressive Behaviour',
                  'Missing Child/Person', 'Hostile Act', 'Counter-Terror Alert', 'Fire Alarm',
                  'Evacuation', 'Medical', 'Suspicious Behaviour'
                ].includes(incident.incident_type);
                
                logger.debug('Sending toast for new incident', { component: 'IncidentTable', action: 'subscriptionEffect', incidentLogNumber: incident.log_number, incidentType: incident.incident_type });
                globalToastCallback({
                  type: isHighPriority ? 'warning' : 'info',
                  title: `New ${incident.incident_type} Incident`,
                  message: `Log ${incident.log_number}: ${incident.occurrence.substring(0, 80)}${incident.occurrence.length > 80 ? '...' : ''}`,
                  duration: isHighPriority ? 12000 : 8000, // Increased from 8000/5000 to 12000/8000
                  urgent: isHighPriority
                });
                logger.debug('Toast sent for new incident', { component: 'IncidentTable', action: 'subscriptionEffect', incidentLogNumber: incident.log_number });
        } else {
          logger.debug('No global toast callback found for key', { component: 'IncidentTable', action: 'subscriptionEffect', subscriptionKey });
        }
          } else if (payload.eventType === 'UPDATE') {
              newIncidents = prev.map(incident => {
                if (incident.id === payload.new.id) {
                  const updated = { ...incident, ...payload.new };
                  
                  // Show toast for status change only if it wasn't a manual change
                  const globalToastCallback = globalToastCallbacks.get(subscriptionKey);
                  if (globalToastCallback && incident.is_closed !== updated.is_closed && !manualStatusChangesRef.current.has(incident.id)) {
                    // Create a unique key for this status change toast to prevent duplicates
                    const statusToastKey = `${updated.log_number}-${updated.incident_type}-STATUS-${updated.is_closed}`;
                    const now = Date.now();
                    
                    // Check if we've shown this status change toast recently (within 10 seconds)
                    if (!recentToasts.has(statusToastKey) || (now - recentToasts.get(statusToastKey)!) >= 10000) {
                      // Mark this toast as sent
                      recentToasts.set(statusToastKey, now);
                      
                      globalToastCallback({
                        type: updated.is_closed ? 'success' : 'info',
                        title: `Incident ${updated.is_closed ? 'Closed' : 'Reopened'}`,
                        message: `Log ${updated.log_number}: ${updated.incident_type}`,
                        duration: 6000 // Increased from 4000 to 6000
                      });
                      logger.debug('Toast sent for status change', { component: 'IncidentTable', action: 'subscriptionEffect', incidentLogNumber: updated.log_number });
                      } else {
                        logger.debug('Duplicate status toast prevented for', { component: 'IncidentTable', action: 'subscriptionEffect', incidentLogNumber: updated.log_number });
                      }
                  }
                  
                  return updated;
                }
                return incident;
              });
          } else if (payload.eventType === 'DELETE') {
              newIncidents = prev.filter(incident => incident.id !== payload.old.id);
          }
            return newIncidents;
          });
          setLastUpdated(new Date());
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.debug('Real-time subscription active for event', { component: 'IncidentTable', action: 'subscriptionEffect', currentEventId });
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Real-time subscription error', { component: 'IncidentTable', action: 'subscriptionEffect', currentEventId });
        }
      });

    // Add a timeout to check if subscription status is never called
    setTimeout(() => {
      logger.debug('Checking subscription status after 5 seconds', { component: 'IncidentTable', action: 'subscriptionEffect' });
        if (subscriptionRef.current) {
          logger.debug('Subscription object exists', { component: 'IncidentTable', action: 'subscriptionEffect', exists: !!subscriptionRef.current, state: subscriptionRef.current.state });
        } else {
          logger.debug('No subscription object found after 5 seconds', { component: 'IncidentTable', action: 'subscriptionEffect' });
        }
    }, 5000);

    fetchIncidents();

    return () => {
      cleanup();
      // Also clean up on unmount
      if (currentEventId) {
        const subscriptionKey = `incident_logs_${currentEventId}`;
        activeSubscriptions.delete(subscriptionKey);
        globalToastCallbacks.delete(subscriptionKey);
      }
    };
  }, [currentEventId]);

  // Separate useEffect for onDataLoaded callback to avoid stale closures
  useEffect(() => {
    if (onDataLoaded && incidents.length > 0) {
      onDataLoaded(incidents);
    }
  }, [incidents, onDataLoaded]);

  // Fetch callsign assignments for tooltips
  useEffect(() => {
    if (!currentEventId) return;
    const fetchAssignments = async () => {
      // Get all roles
      const { data: roles } = await supabase
        .from('callsign_roles')
        .select('id, short_code, callsign')
        .eq('event_id', currentEventId);
      // Get all assignments
      const { data: assignments } = await supabase
        .from('callsign_assignments')
        .select('callsign_role_id, assigned_name')
        .eq('event_id', currentEventId);
      // Build mapping
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

  const toggleIncidentStatus = async (incident: Incident, e: React.MouseEvent) => {
    e.stopPropagation();
    if (incident.incident_type === 'Attendance') return;
    
    const newStatus = !incident.is_closed;
    logger.debug('Toggling status for incident', { component: 'IncidentTable', action: 'toggleIncidentStatus', incidentId: incident.id, newStatus });
    
    // Track this as a manual status change to prevent duplicate toast
    setManualStatusChanges(prev => new Set(prev).add(incident.id));
    
    // Optimistic update - immediately update the UI
    setIncidents(prev => 
      prev.map(inc => 
        inc.id === incident.id 
          ? { ...inc, is_closed: newStatus }
          : inc
      )
    );
    
    try {
      const { error } = await supabase
        .from('incident_logs')
        .update({ 
          is_closed: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', incident.id);
      if (error) throw error;
      
      // Add an update to track the status change
      await supabase
        .from('incident_updates')
        .insert({
          incident_id: incident.id,
          update_text: `Incident status changed to ${newStatus ? 'Closed' : 'Open'}`,
          updated_by: 'Event Control'
        });
      
      logger.debug('Status update successful', { component: 'IncidentTable', action: 'toggleIncidentStatus', incidentId: incident.id });
      
      // Show toast notification for manual status change
      if (onToastRef.current) {
        onToastRef.current({
          type: newStatus ? 'success' : 'info',
          title: `Incident ${newStatus ? 'Closed' : 'Reopened'}`,
          message: `Log ${incident.log_number}: ${incident.incident_type}`,
          duration: 6000
        });
        logger.debug('Toast sent for manual status change', { component: 'IncidentTable', action: 'toggleIncidentStatus', incidentLogNumber: incident.log_number });
      }
      
      // Remove from manual changes after a delay to allow real-time event to be filtered
      setTimeout(() => {
        setManualStatusChanges(prev => {
          const newSet = new Set(prev);
          newSet.delete(incident.id);
          return newSet;
        });
      }, 1000);
    } catch (err) {
      logger.error('Error updating incident status', err, { component: 'IncidentTable', action: 'toggleIncidentStatus', incidentId: incident.id });
      // Revert the optimistic update if there was an error
      setIncidents(prev => 
        prev.map(inc => 
          inc.id === incident.id 
            ? { ...inc, is_closed: incident.is_closed }
            : inc
        )
      );
      // Remove from manual changes if error occurred
      setManualStatusChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(incident.id);
        return newSet;
      });
    }
  };

  const handleIncidentClick = (incident: Incident) => {
    // Don't do anything for attendance incidents
    if (incident.incident_type === 'Attendance') return;
    
    setSelectedIncidentId(incident.id.toString());
    setIsDetailsModalOpen(true);
  }

  const handleCloseModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedIncidentId(null)
  }

  // Filter incidents based on the filter prop and search query
  const filteredIncidents: Incident[] = filterIncidents<Incident>(incidents, { ...filters, query: searchQuery });

  // Helper function to check if incident is high priority and open
  const isHighPriorityAndOpen = (incident: Incident) => {
    const highPriorityTypes = [
      'Ejection',
      'Code Green',
      'Code Black',
      'Code Pink',
      'Aggressive Behaviour',
      'Missing Child/Person',
      'Hostile Act',
      'Counter-Terror Alert',
      'Fire Alarm',
      'Evacuation',
      'Medical',
      'Suspicious Behaviour',
      'Queue Build-Up'
    ];
    return !incident.is_closed && 
           incident.status !== 'Logged' && 
           incident.incident_type !== 'Sit Rep' && 
           incident.incident_type !== 'Attendance' &&
           highPriorityTypes.includes(incident.incident_type);
  };

  // Sort incidents: Pin open high priority incidents to the top, then chronological order
  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    const aIsHighPriorityOpen = isHighPriorityAndOpen(a);
    const bIsHighPriorityOpen = isHighPriorityAndOpen(b);
    
    // If both are high priority and open, or both are not, sort by timestamp (newest first)
    if (aIsHighPriorityOpen === bIsHighPriorityOpen) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    
    // High priority open incidents go to the top
    return aIsHighPriorityOpen ? -1 : 1;
  });

  // Show Back to Top if many incidents and scrolled down
  useEffect(() => {
    const handleScroll = () => {
      if (tableContainerRef.current) {

      }
    };
    const ref = tableContainerRef.current;
    if (ref && sortedIncidents.length > 15) {
      ref.addEventListener('scroll', handleScroll);
      return () => ref.removeEventListener('scroll', handleScroll);
    }
  }, [incidents.length, sortedIncidents.length]);

  if (loading) {
    return (
      <div className="mt-4 bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 transition-colors duration-300">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Enhanced Search Bar and Last Updated */}
      <div className="mb-6 relative">
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Enhanced Search Bar - Left side */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-300" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search incidents by type, callsign, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-12 py-4 border-2 border-gray-200 dark:border-[#2d437a] rounded-2xl leading-5 bg-white dark:bg-[#182447] placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 shadow-lg hover:shadow-xl transition-all duration-200"
            />
            {searchQuery && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
          
          {/* View Toggle - Center */}
          {onViewModeChange && (
            <div className="flex items-center bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-[#2d437a]/50 p-1">
              <button
                onClick={() => onViewModeChange('table')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'table' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <TableCellsIcon className="h-4 w-4" /> Table
              </button>
              <button
                onClick={() => onViewModeChange('board')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'board' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <ViewColumnsIcon className="h-4 w-4" /> Board
              </button>
              {/* Staff toggle hidden intentionally */}
            </div>
          )}
          
          {/* Last Updated Timestamp - Right side */}
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Last Updated:</span> {lastUpdated.toLocaleTimeString('en-GB', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Removed extra filters block since Types moved inline above */}

        {searchQuery && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-2">
            <span className="font-medium text-blue-700 dark:text-blue-200">
              {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''} found
            </span>
            {(filters && (filters.types.length + filters.statuses.length + filters.priorities.length) > 0) && (
              <span className="text-blue-600 dark:text-blue-300"> (filters active)</span>
            )}
          </div>
        )}
      </div>



      {/* Conditional Rendering for Table/Board/Staff Views */}
      {viewMode === 'table' ? (
        <>
          {/* Enhanced Empty State */}
          {sortedIncidents.length === 0 ? (
            <div className="mt-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-[#1a2a57] dark:to-[#23408e] shadow-2xl rounded-3xl border border-gray-200 dark:border-[#2d437a] p-12 text-center transition-colors duration-300">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No incidents to display</h3>
              <p className="text-gray-600 dark:text-gray-300">When incidents are logged, they will appear here in real-time.</p>
            </div>
          ) : (
        <>
          {/* Enhanced Mobile Card Layout */}
          <div ref={tableContainerRef} className="md:hidden mt-6 space-y-4 px-2 border border-gray-200 dark:border-[#2d437a] rounded-2xl overflow-hidden scroll-smooth" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {/* Enhanced Mobile Table Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-600 to-gray-700 dark:from-[#1e293b] dark:to-[#334155] flex items-center px-4 py-3 text-xs font-bold text-white dark:text-gray-100 uppercase tracking-wider shadow-sm border-b border-gray-200 dark:border-[#2d437a]">
              <div className="basis-[28%]">Log #</div>
              <div className="basis-[24%] text-center">Type</div>
              <div className="basis-[24%] text-center">Time</div>
              <div className="basis-[24%] text-right">Status</div>
            </div>
            
            {sortedIncidents.map((incident) => (
              <div
                key={incident.id}
                className={`bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer ${getRowStyle(incident)} ${
                  isHighPriorityAndOpen(incident) 
                    ? 'ring-2 ring-red-400 shadow-2xl shadow-red-500/70 z-20 relative animate-pulse-glow border-red-300' 
                    : 'border-gray-200 dark:border-[#2d437a] hover:border-blue-300 dark:hover:border-blue-500'
                }`}
                style={{
                  ...(isHighPriorityAndOpen(incident) && {
                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(220, 38, 38, 0.2), 0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    animation: 'pulse-glow 3s ease-in-out infinite'
                  })
                }}
                onClick={(e) => {
                  // Only expand/collapse if not clicking on a button
                  if (!(e.target as HTMLElement).closest('button')) {
                    if (incident.incident_type === 'Attendance') {
                      // For attendance incidents, just expand/collapse
                      setExpandedIncidentId(expandedIncidentId === incident.id ? null : incident.id);
                    } else {
                      // For non-attendance incidents, open the modal
                      handleIncidentClick(incident);
                    }
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View details for log ${incident.log_number}`}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if (incident.incident_type === 'Attendance') {
                      setExpandedIncidentId(expandedIncidentId === incident.id ? null : incident.id);
                    } else {
                      handleIncidentClick(incident);
                    }
                  }
                }}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="basis-[28%] font-bold text-blue-700 dark:text-blue-300 text-sm truncate flex items-center gap-2">
                      {isHighPriorityAndOpen(incident) && (
                        <MapPinIcon className="h-4 w-4 text-red-500 animate-pulse" title="Pinned: High Priority Open" />
                      )}
                      <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-lg">
                        {(() => {
                          const match = incident.log_number.match(/(\d{3,})$/);
                          return match ? match[1] : incident.log_number;
                        })()}
                      </span>
                    </div>
                    <div className="basis-[24%] flex items-center justify-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold mx-auto text-center shadow-sm ${getIncidentTypeStyle(incident.incident_type)} dark:bg-gray-700 dark:text-gray-100`}>
                        {incident.incident_type}
                      </span>
                    </div>
                    <div className="basis-[24%] text-xs text-gray-500 dark:text-gray-300 flex items-center justify-center font-medium">
                      {new Date(incident.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="basis-[24%] flex items-center justify-end">
                      {incident.incident_type === 'Attendance' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm">
                          Logged
                        </span>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer shadow-sm transition-all duration-200 ${
                            incident.is_closed 
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700' 
                              : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700'
                          }`}
                          onClick={e => { e.stopPropagation(); toggleIncidentStatus(incident, e); }}
                        >
                          {incident.is_closed ? 'Closed' : 'Open'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {expandedIncidentId === incident.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2d437a] space-y-3">
                      <div className="bg-gray-50 dark:bg-[#182447] rounded-xl p-3">
                        <span className="block text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mb-1">Occurrence</span>
                        <span className="block text-sm text-gray-700 dark:text-gray-100 leading-relaxed">{incident.occurrence}</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-[#182447] rounded-xl p-3">
                        <span className="block text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mb-1">Action Taken</span>
                        <span className="block text-sm text-gray-700 dark:text-gray-100 leading-relaxed">{incident.action_taken}</span>
                      </div>
                      <div className="flex gap-4 bg-gray-50 dark:bg-[#182447] rounded-xl p-3">
                        <div className="flex-1">
                          <span className="block text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mb-1">From</span>
                          <span className="block text-sm text-gray-700 dark:text-gray-100 font-medium">{incident.callsign_from}</span>
                        </div>
                        <div className="flex-1">
                          <span className="block text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mb-1">To</span>
                          <span className="block text-sm text-gray-700 dark:text-gray-100 font-medium">{incident.callsign_to}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            

          </div>

          {/* Enhanced Desktop Table Layout */}
          <div ref={tableContainerRef} className="hidden md:flex flex-col mt-6 border border-gray-200 dark:border-[#2d437a] rounded-2xl overflow-hidden scroll-smooth" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
            {/* Enhanced Desktop Table Header */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-gray-600 to-gray-700 dark:from-[#1e293b] dark:to-[#334155] shadow-sm border-b border-gray-200 dark:border-[#2d437a]">
              <div className="grid items-center w-full" style={{ gridTemplateColumns: '5% 5% 8% 8% 29% 8% 29% 7%' }}>
                <div className="px-4 py-4 text-left text-xs font-bold text-white dark:text-gray-100 uppercase tracking-wider">Log</div>
                <div className="px-4 py-4 text-left text-xs font-bold text-white dark:text-gray-100 uppercase tracking-wider">Time</div>
                <div className="px-4 py-4 text-left text-xs font-bold text-white dark:text-gray-100 uppercase tracking-wider">From</div>
                <div className="px-4 py-4 text-left text-xs font-bold text-white dark:text-gray-100 uppercase tracking-wider">To</div>
                <div className="px-4 py-4 text-left text-xs font-bold text-white dark:text-gray-100 uppercase tracking-wider">Occurrence</div>
                <div className="px-4 py-4 text-left text-xs font-bold text-white dark:text-gray-100 uppercase tracking-wider">Type</div>
                <div className="px-4 py-4 text-left text-xs font-bold text-white dark:text-gray-100 uppercase tracking-wider">Action</div>
                <div className="py-4 text-right text-xs font-bold text-white dark:text-gray-100 uppercase tracking-wider pr-4">Status</div>
              </div>
            </div>
            
            {/* Enhanced Desktop Table Body */}
            <div className="bg-white dark:bg-[#23408e] divide-y divide-gray-200 dark:divide-[#2d437a]">
              {sortedIncidents.map((incident, idx) => {
                let rowColor = getRowStyle(incident);
                if (rowColor === 'hover:bg-gray-50') {
                  rowColor = idx % 2 === 0 ? 'bg-white dark:bg-[#23408e] hover:bg-gray-50 dark:hover:bg-[#1a2a57]' : 'bg-gray-50 dark:bg-[#1a2a57] hover:bg-gray-100 dark:hover:bg-[#182447]';
                }
                return (
                  <div
                    key={incident.id} 
                    className={`grid items-center px-0 py-3 cursor-pointer ${rowColor} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-lg mx-2 my-1 ${
                      isHighPriorityAndOpen(incident) 
                        ? 'ring-2 ring-red-400 shadow-2xl shadow-red-500/70 z-20 relative animate-pulse-glow border border-red-300' 
                        : 'border border-transparent hover:border-blue-300 dark:hover:border-blue-500'
                    }`}
                    style={{ 
                      gridTemplateColumns: '5% 5% 8% 8% 29% 8% 29% 7%',
                      minHeight: '56px',
                      ...(isHighPriorityAndOpen(incident) && {
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(220, 38, 38, 0.2), 0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        animation: 'pulse-glow 3s ease-in-out infinite'
                      })
                    }}
                    onClick={(e) => {
                      // Only open modal if not clicking on a button
                      if (!(e.target as HTMLElement).closest('button')) {
                        handleIncidentClick(incident);
                      }
                    }}
                  >
                    <div className="px-4 text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {isHighPriorityAndOpen(incident) && (
                        <MapPinIcon className="h-4 w-4 text-red-500 animate-pulse" title="Pinned: High Priority Open" />
                      )}
                      <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-lg font-mono">
                        {(() => {
                          const match = incident.log_number.match(/(\d{3,})$/);
                          return match ? match[1] : incident.log_number;
                        })()}
                      </span>
                    </div>
                    <div className="px-4 text-sm text-gray-600 dark:text-gray-300 flex items-center font-medium">
                      {new Date(incident.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="px-4 text-sm text-gray-600 dark:text-gray-300 flex items-center">
                      <span
                        title={callsignShortToName[incident.callsign_from?.toUpperCase()] || callsignAssignments[incident.callsign_from?.toUpperCase()] || undefined}
                        className="underline decoration-dotted cursor-help font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                      >
                        {incident.callsign_from}
                      </span>
                    </div>
                    <div className="px-4 text-sm text-gray-600 dark:text-gray-300 flex items-center">
                      <span
                        title={callsignShortToName[incident.callsign_to?.toUpperCase()] || callsignAssignments[incident.callsign_to?.toUpperCase()] || undefined}
                        className="underline decoration-dotted cursor-help font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                      >
                        {incident.callsign_to}
                      </span>
                    </div>
                    <div className="px-4 text-sm text-gray-600 dark:text-gray-300 flex items-center leading-relaxed" style={{
                      lineHeight: '1.5',
                      maxHeight: '3em',
                      overflow: 'hidden',
                      wordWrap: 'break-word',
                      hyphens: 'auto'
                    }}>
                      <span style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {incident.occurrence}
                      </span>
                    </div>
                  <div className="px-4 text-sm text-gray-600 dark:text-gray-300 flex items-center">
                      <span className={`px-3 py-1 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm ${getIncidentTypeStyle(incident.incident_type)} ${getSeverityBorderClass((incident as any).priority)}`}>
                        {incident.incident_type}
                      </span>
                    </div>
                    <div className="px-4 text-sm text-gray-600 dark:text-gray-300 flex items-center leading-relaxed" style={{
                      lineHeight: '1.5',
                      maxHeight: '3em',
                      overflow: 'hidden',
                      wordWrap: 'break-word',
                      hyphens: 'auto'
                    }}>
                      <span style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {incident.action_taken}
                      </span>
                    </div>
                   <div className={`flex items-center justify-end text-sm text-gray-600 dark:text-gray-300 pr-4`}>
                      {incident.incident_type === 'Attendance' ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-4 font-bold rounded-full bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm">
                          Logged
                        </span>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleIncidentStatus(incident, e); }}
                          className={`px-3 py-1 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm transition-all duration-200 transform hover:scale-105 ${
                            incident.is_closed 
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700' 
                              : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700'
                          }`}
                        >
                          {incident.is_closed ? 'Closed' : 'Open'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            

          </div>
          
          {isDetailsModalOpen && selectedIncidentId && (
            <IncidentDetailsModal
              isOpen={isDetailsModalOpen}
              incidentId={selectedIncidentId}
              onClose={handleCloseModal}
            />
          )}
        </>
      )}
    </>
  ) : (
    <>
      {/* Board View */}
      <div className="h-[600px] bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 p-6">
        <CollaborationBoard
          eventId={propCurrentEventId || currentEventId || ''}
          currentUser={currentUser}
          searchQuery={searchQuery}
          incidents={incidents}
          loading={loading}
          error={error}
          filters={filters}
          updateIncident={async (id, updates) => {
            // Find the incident and update it
            const incident = incidents.find(inc => inc.id.toString() === id);
            if (!incident) return;
            
            // Update the incident in the database
            const { error: updateError } = await supabase
              .from('incident_logs')
              .update(updates)
              .eq('id', incident.id);
            
            if (updateError) {
              throw updateError;
            }
            
            // Refresh the incidents list
            await fetchIncidents();
          }}
          onIncidentSelect={(incident) => {
            // Open the incident details modal when an incident is clicked on the board
            handleIncidentClick(incident);
          }}
        />
      </div>
      
      {/* Incident Details Modal for Board View */}
      {isDetailsModalOpen && selectedIncidentId && (
        <IncidentDetailsModal
          isOpen={isDetailsModalOpen}
          incidentId={selectedIncidentId}
          onClose={handleCloseModal}
        />
      )}
    </>
  )}
    </>
  )
} 