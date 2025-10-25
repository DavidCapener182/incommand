'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import IncidentDetailsModal from './IncidentDetailsModal'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useLogRevisions } from '../hooks/useLogRevisions'
import { ArrowUpIcon, MapPinIcon, MagnifyingGlassIcon, XMarkIcon, ViewColumnsIcon, TableCellsIcon, ArrowPathIcon, ClockIcon } from '@heroicons/react/24/outline'
import { ToastMessage } from './Toast'
import { CollaborationBoard } from './CollaborationBoard'
import {
  getIncidentTypeStyle,
  getPriorityBorderClass,
  getPriorityChipClass,
  getPriorityDisplayConfig,
  normalizePriority,
  type NormalizedPriority,
  type Priority,
} from '../utils/incidentStyles'
import { FilterState, filterIncidents } from '../utils/incidentFilters'
import { motion, AnimatePresence } from 'framer-motion'
import PriorityBadge from './PriorityBadge'
import { getIncidentTypeIcon } from '../utils/incidentIcons'
import IncidentStatsSidebar from './IncidentStatsSidebar'
import VirtualizedList from './VirtualizedList'
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor'
import { SkeletonIncidentTable, LoadingSpinner } from './ui/LoadingStates'
// import VirtualizedIncidentTable from './VirtualizedIncidentTable'
import EnhancedSearch from './EnhancedSearch'
import { useBestPractice } from '@/hooks/useBestPractice'
import { featureFlags } from '@/config/featureFlags'
import { BestPracticePayload } from '@/types/bestPractice'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
  priority?: string
  resolved_at?: string | null
  responded_at?: string | null
  updated_at?: string | null
  // Auditable logging fields
  time_of_occurrence?: string
  time_logged?: string
  entry_type?: 'contemporaneous' | 'retrospective'
  retrospective_justification?: string
  logged_by_user_id?: string
  logged_by_callsign?: string
  is_amended?: boolean
  original_entry_id?: string
}

const PRIORITY_FILTER_OPTIONS: NormalizedPriority[] = ['urgent', 'high', 'medium', 'low']

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
  currentEvent,
  onFiltersChange
}: {
  filters: FilterState;
  onDataLoaded?: (data: Incident[]) => void;
  onToast?: (toast: Omit<ToastMessage, 'id'>) => void;
  viewMode?: 'table' | 'board' | 'staff';
  onViewModeChange?: (mode: 'table' | 'board' | 'staff') => void;
  currentUser?: any;
  currentEventId?: string;
  currentEvent?: any;
  onFiltersChange?: (filters: FilterState) => void;
}) {
  const componentId = useRef(Math.random().toString(36).substr(2, 9));
  logger.debug('IncidentTable component rendered', { component: 'IncidentTable', action: 'render', componentId: componentId.current, onToastAvailable: !!onToast });

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentEventId, setCurrentEventId] = useState<string | undefined>(undefined)
  
  // Real-time revision tracking
  const { revisionCount } = useLogRevisions(currentEventId ?? null, (notification) => {
    // Show toast for new revisions
    if (onToast) {
      onToast({
        type: 'info',
        title: '📋 Log Revision Created',
        message: `${notification.changedBy} updated ${notification.fieldChanged} in a log entry`,
        duration: 6000
      })
    }
  })
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const [callsignAssignments, setCallsignAssignments] = useState<Record<string, string>>({})
  const [callsignShortToName, setCallsignShortToName] = useState<Record<string, string>>({})
  const [expandedIncidentId, setExpandedIncidentId] = useState<number | null>(null)
  const { state: bpState, data: bpData, fetchBestPractice } = useBestPractice()

  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [manualStatusChanges, setManualStatusChanges] = useState<Set<number>>(new Set())

  // Mobile gesture support
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullToRefreshDistance, setPullToRefreshDistance] = useState(0)
  const [swipedIncidentId, setSwipedIncidentId] = useState<number | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  
  // Performance monitoring
  const { startRenderMeasurement, endRenderMeasurement, trackError } = usePerformanceMonitor({
    onThresholdExceeded: (metric, value, threshold) => {
      console.warn(`[IncidentTable] Performance threshold exceeded:`, { metric, value, threshold })
    }
  })
  

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
      setIncidents(
        (data || []).map(incident => ({
          ...incident,
          status: incident.status || 'open',
          entry_type: incident.entry_type as 'contemporaneous' | 'retrospective' | undefined,
          retrospective_justification: incident.retrospective_justification || undefined,
          logged_by_user_id: incident.logged_by_user_id || undefined
        }))
      );
      setLastUpdated(new Date());
      if (onDataLoaded) {
        onDataLoaded(
          (data || []).map(incident => ({
            ...incident,
            status: incident.status || 'open',
            entry_type: incident.entry_type as 'contemporaneous' | 'retrospective' | undefined,
            retrospective_justification: incident.retrospective_justification || undefined,
            logged_by_user_id: incident.logged_by_user_id || undefined
          }))
        );
      }
    } catch (err) {
      logger.error('Error fetching incidents', err, { component: 'IncidentTable', action: 'fetchIncidents', eventId: currentEventId || undefined });
      setError('Failed to fetch incidents');
      trackError(err instanceof Error ? err : new Error('Failed to fetch incidents'), 'fetchIncidents');
    } finally {
      setLoading(false);
    }
  }, [currentEventId, onDataLoaded, trackError]);
  
  // Keep refs in sync with state/props
  useEffect(() => {
    manualStatusChangesRef.current = manualStatusChanges
  }, [manualStatusChanges])
  
  useEffect(() => {
    onToastRef.current = onToast
  }, [onToast])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const updateMatch = () => setIsMobile(mediaQuery.matches)

    updateMatch()

    const listener = (event: MediaQueryListEvent) => setIsMobile(event.matches)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', listener)
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(listener)
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', listener)
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(listener)
      }
    }
  }, [])

  useEffect(() => {
    if (!isMobile) return
    if (viewMode !== 'table' && onViewModeChange) {
      onViewModeChange('table')
    }
  }, [isMobile, onViewModeChange, viewMode])

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

        const newEventId = eventData?.id ?? undefined;
        logger.debug('Setting current event ID', { component: 'IncidentTable', action: 'checkCurrentEvent', eventId: newEventId });
        setCurrentEventId(newEventId);
      } catch (err) {
        logger.error('Error checking current event', err, { component: 'IncidentTable', action: 'checkCurrentEvent' });
        setCurrentEventId(undefined);
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

                // Trigger Best-Practice flow (non-blocking)
                if (featureFlags.best_practice_enabled && incident.incident_type !== 'Attendance' && incident.incident_type !== 'Sit Rep') {
                  // show spinner toast
                  globalToastCallback({
                    type: 'info',
                    title: 'Finding best practice…',
                    message: 'Consulting Green Guide',
                    duration: 3000
                  })
                  // async call
                  fetchBestPractice({
                    incidentId: String(incident.id),
                    incidentType: incident.incident_type,
                    occurrence: incident.occurrence,
                    eventId: incident.event_id
                  }).then((bp) => {
                    // bp is the returned BestPracticePayload from fetchBestPractice
                    if (!bp) return
                    const riskType = bp.risk_level === 'high' ? 'error' : bp.risk_level === 'medium' ? 'warning' : 'info'
                    // Add small delay to prevent conflict with spinner toast
                    setTimeout(() => {
                      globalToastCallback({
                        type: riskType as any,
                        title: `Best practice: ${incident.incident_type}`,
                        message: bp.summary,
                        duration: 10000 // Show Green Guide best practices for 10 seconds
                      })
                    }, 500)
                  }).catch(() => {/* silent */})
                }
                logger.debug('Toast sent for new incident', { component: 'IncidentTable', action: 'subscriptionEffect', incidentLogNumber: incident.log_number });
        } else {
          logger.debug('No global toast callback found for key', { component: 'IncidentTable', action: 'subscriptionEffect', subscriptionKey });
        }
          } else if (payload.eventType === 'UPDATE') {
              newIncidents = prev.map(incident => {
                if (incident.id === payload.new.id) {
                  const updated = { ...incident, ...payload.new };
                  
                  const globalToastCallback = globalToastCallbacks.get(subscriptionKey);
                  
                  // Check for amendment (is_amended changed from false to true)
                  const wasAmended = !incident.is_amended && updated.is_amended;
                  
                  if (globalToastCallback) {
                    // Show toast for new amendments
                    if (wasAmended) {
                      const amendmentToastKey = `${updated.log_number}-AMENDED-${Date.now()}`;
                      const now = Date.now();
                      
                      if (!recentToasts.has(amendmentToastKey) || (now - recentToasts.get(amendmentToastKey)!) >= 10000) {
                        recentToasts.set(amendmentToastKey, now);
                        
                        globalToastCallback({
                          type: 'warning',
                          title: '📝 Log Amended',
                          message: `Log ${updated.log_number} has been amended. Review the audit trail for details.`,
                          duration: 8000,
                          urgent: true
                        });
                        logger.debug('Toast sent for log amendment', { component: 'IncidentTable', action: 'subscriptionEffect', incidentLogNumber: updated.log_number });
                      }
                    }
                    // Show toast for status change only if it wasn't a manual change and not an amendment
                    else if (incident.is_closed !== updated.is_closed && !manualStatusChangesRef.current.has(incident.id)) {
                      const statusToastKey = `${updated.log_number}-${updated.incident_type}-STATUS-${updated.is_closed}`;
                      const now = Date.now();
                      
                      if (!recentToasts.has(statusToastKey) || (now - recentToasts.get(statusToastKey)!) >= 10000) {
                        recentToasts.set(statusToastKey, now);
                        
                        globalToastCallback({
                          type: updated.is_closed ? 'success' : 'info',
                          title: `Incident ${updated.is_closed ? 'Closed' : 'Reopened'}`,
                          message: `Log ${updated.log_number}: ${updated.incident_type}`,
                          duration: 6000
                        });
                        logger.debug('Toast sent for status change', { component: 'IncidentTable', action: 'subscriptionEffect', incidentLogNumber: updated.log_number });
                      } else {
                        logger.debug('Duplicate status toast prevented for', { component: 'IncidentTable', action: 'subscriptionEffect', incidentLogNumber: updated.log_number });
                      }
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
        .from('callsign_positions')
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

  // Mobile gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent, incidentId?: number) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setTouchEnd(null)
    
    if (incidentId) {
      setSwipedIncidentId(incidentId)
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return
    
    const touch = e.touches[0]
    const distanceX = touch.clientX - touchStart.x
    const distanceY = touch.clientY - touchStart.y
    
    // Pull-to-refresh logic
    if (touchStart.y < 100 && distanceY > 0) {
      const pullDistance = Math.min(distanceY * 0.5, 100)
      setPullToRefreshDistance(pullDistance)
    }
    
    // Swipe logic for incident cards
    if (swipedIncidentId && Math.abs(distanceX) > Math.abs(distanceY)) {
      const swipeDistance = Math.max(-100, Math.min(100, distanceX))
      setSwipeOffset(swipeDistance)
    }
  }, [touchStart, swipedIncidentId])

  const handleTouchEnd = useCallback(async (e: React.TouchEvent) => {
    if (!touchStart) return
    
    const touch = e.changedTouches[0]
    const distanceX = touch.clientX - touchStart.x
    const distanceY = touch.clientY - touchStart.y
    
    // Pull-to-refresh trigger
    if (touchStart.y < 100 && distanceY > 80) {
      setIsRefreshing(true)
      await fetchIncidents()
      setTimeout(() => setIsRefreshing(false), 1000)
    }
    
    // Swipe actions for incident cards
    if (swipedIncidentId && Math.abs(distanceX) > 50) {
      const incident = incidents.find(inc => inc.id === swipedIncidentId)
      if (incident) {
        if (distanceX > 50) {
          // Swipe right - open incident details
          handleIncidentClick(incident)
        } else if (distanceX < -50) {
          // Swipe left - toggle status
          await toggleIncidentStatus(incident, e as any)
        }
      }
    }
    
    // Reset states
    setTouchStart(null)
    setTouchEnd(null)
    setPullToRefreshDistance(0)
    setSwipedIncidentId(null)
    setSwipeOffset(0)
  }, [touchStart, swipedIncidentId, incidents, fetchIncidents])

  // Enhanced touch targets for mobile
  const getTouchTargetClass = (baseClass: string) => {
    return `${baseClass} touch-target min-h-[44px] min-w-[44px] flex items-center justify-center`
  }

  // Filter incidents based on the filter prop and search query
  const filteredIncidents: Incident[] = filterIncidents<Incident>(incidents, { ...filters, query: searchQuery });

  // Helper function to check if incident is high priority and open
  const isHighPriorityAndOpen = (incident: Incident) => {
    const status = String(incident.status ?? '').toLowerCase()
    const isClosedOrInProgress =
      incident.is_closed ||
      status === 'closed' ||
      status === 'resolved' ||
      status === 'in_progress' ||
      status === 'in progress'

    if (
      isClosedOrInProgress ||
      incident.incident_type === 'Sit Rep' ||
      incident.incident_type === 'Attendance'
    ) {
      return false
    }

    const normalizedPriority = normalizePriority(incident.priority as Priority)
    const isHighPriority = normalizedPriority === 'high' || normalizedPriority === 'urgent'
    const isOpenStatus = status === 'open' || status === 'logged' || status === ''

    return isHighPriority && isOpenStatus
  }

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

  // Determine if we should use virtualized table (for large datasets)
  const shouldUseVirtualized = useMemo(() => {
    return sortedIncidents.length > 100 // Use virtualized table for 100+ incidents
  }, [sortedIncidents.length])

  const chronologicalIncidents = useMemo(() => {
    return [...filteredIncidents].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [filteredIncidents]);

  const normalizedSelectedPriorities = useMemo(
    () => filters.priorities.map((priority) => normalizePriority(priority as Priority)),
    [filters.priorities]
  );

  const handlePriorityToggle = useCallback(
    (target: NormalizedPriority) => {
      if (!onFiltersChange) return;

      const shouldRemove = normalizedSelectedPriorities.includes(target);
      const updatedPriorities = shouldRemove
        ? filters.priorities.filter(
            (priority) => normalizePriority(priority as Priority) !== target
          )
        : [...filters.priorities, target];

      onFiltersChange({ ...filters, priorities: updatedPriorities });
    },
    [filters, normalizedSelectedPriorities, onFiltersChange]
  );

  const handleClearPriorityFilters = useCallback(() => {
    if (!onFiltersChange) return;
    onFiltersChange({ ...filters, priorities: [] });
  }, [filters, onFiltersChange]);

  // Performance monitoring - measure render time (mount/unmount only)
  useEffect(() => {
    startRenderMeasurement()
    return () => {
      endRenderMeasurement('IncidentTable')
    }
  }, [])

  // Show Back to Top if many incidents and scrolled down
  useEffect(() => {
    const handleScroll = () => {
      if (tableContainerRef.current) {
        // Handle scroll logic here if needed
      }
    };
    const ref = tableContainerRef.current;
    if (ref && sortedIncidents.length > 15) {
      ref.addEventListener('scroll', handleScroll);
      return () => ref.removeEventListener('scroll', handleScroll);
    }
  }, [incidents.length, sortedIncidents.length]);

  if (loading) {
    return <SkeletonIncidentTable rows={8} />
  }

  return (
    <div className="flex flex-col h-full overflow-hidden mb-0">
      {/* Enhanced Search Bar and Last Updated */}
      <div className="mb-2 relative">
        {/* Mobile: Enhanced Search Bar Above Everything */}
        <div className="block md:hidden mb-2">
          <EnhancedSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onFilterChange={onFiltersChange}
            placeholder="Search incidents by type, callsign, or description..."
            showSuggestions={true}
          />
        </div>

        {/* Desktop: Enhanced Search Bar, View Toggle, and Last Updated */}
        <div className="hidden md:flex items-center justify-between gap-4 mb-2">
          {/* Desktop Enhanced Search Bar - Left */}
          <div className="flex-1 max-w-md">
            <EnhancedSearch
              value={searchQuery}
              onChange={setSearchQuery}
              onFilterChange={onFiltersChange}
              placeholder="Search incidents..."
              showSuggestions={true}
              className="text-sm"
            />
          </div>

          {/* View Toggle - Center */}
          {onViewModeChange && (
            <div className="card-control flex items-center p-1">
              <motion.button
                onClick={() => onViewModeChange('table')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 touch-target ${
                  viewMode === 'table' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <TableCellsIcon className="h-4 w-4" /> Table
              </motion.button>
              <motion.button
                onClick={() => onViewModeChange('board')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 touch-target ${
                  viewMode === 'board' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ViewColumnsIcon className="h-4 w-4" /> Board
              </motion.button>
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

        {/* Mobile: Last Updated */}
        <div className="block md:hidden mb-2">
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
        
        {onFiltersChange && (
          <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label="Filter incidents by priority">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Priority</span>
            {PRIORITY_FILTER_OPTIONS.map((priorityOption) => {
              const isActive = normalizedSelectedPriorities.includes(priorityOption);
              const config = getPriorityDisplayConfig(priorityOption);
              const Icon = config.icon;
              const buttonClasses = [
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
                getPriorityChipClass(priorityOption, isActive),
                isActive ? 'shadow-md' : 'hover:shadow-sm',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={priorityOption}
                  type="button"
                  onClick={() => handlePriorityToggle(priorityOption)}
                  className={buttonClasses}
                  aria-pressed={isActive}
                >
                  <Icon size={18} aria-hidden />
                  <span>{config.label}</span>
                </button>
              );
            })}
            {filters.priorities.length > 0 && (
              <button
                type="button"
                onClick={handleClearPriorityFilters}
                className="text-xs font-semibold text-blue-600 dark:text-blue-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Removed extra filters block since Types moved inline above */}

        {searchQuery && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-2">
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
          ) : shouldUseVirtualized ? (
            /* Virtualized Table for Large Datasets */
            <div className="flex flex-col lg:flex-row gap-6 mt-2 overflow-hidden lg:items-start">
              <div className="w-full lg:flex-1">
                {/* Regular Incident List for Desktop */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="max-h-[600px] overflow-y-auto">
                    {sortedIncidents.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-gray-400 dark:text-gray-500 mb-4">
                          <ClockIcon className="h-12 w-12 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No incidents yet</h3>
                        <p className="text-gray-500 dark:text-gray-400">Incidents will appear here as they&apos;re logged</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedIncidents.map((incident) => (
                          <div
                            key={incident.id}
                            className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                            onClick={() => handleIncidentClick(incident)}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                {(() => {
                                  const iconConfig = getIncidentTypeIcon(incident.incident_type)
                                  const IconComponent = iconConfig.icon
                                  return <IconComponent className="w-5 h-5 text-gray-400" />
                                })()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                                    {incident.log_number}
                                  </span>
                                  <PriorityBadge priority={incident.priority} />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(incident.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-800 dark:text-gray-100 leading-tight">
                                  {incident.occurrence.length > 100 
                                    ? `${incident.occurrence.substring(0, 100)}...` 
                                    : incident.occurrence
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Stats Sidebar */}
              <div className="hidden lg:block w-64 flex-shrink-0">
                <IncidentStatsSidebar 
                  incidents={sortedIncidents}
                />
              </div>
            </div>
          ) : (
        <div className="flex flex-col lg:flex-row gap-6 mt-2 overflow-hidden lg:items-start">
          {/* Main Content */}
          <div className="w-full lg:flex-1">
          {/* Enhanced Mobile Card Layout with Pull-to-Refresh */}
          <div 
            className="md:hidden mt-4 space-y-3 px-1 border border-gray-200 dark:border-[#2d437a] rounded-xl overflow-y-auto scroll-smooth relative flex-1"
            style={{ height: 'calc(100vh - 200px)' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Pull-to-Refresh Indicator */}
            <AnimatePresence>
              {pullToRefreshDistance > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700"
                  style={{ transform: `translateY(${pullToRefreshDistance}px)` }}
                >
                  <motion.div
                    animate={{ rotate: isRefreshing ? 360 : 0 }}
                    transition={{ duration: isRefreshing ? 1 : 0, repeat: isRefreshing ? Infinity : 0 }}
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400"
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
                    </span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Mobile Table Header */}
            <div className="sticky top-0 z-10 bg-[#f8f9fb] dark:bg-[#1a1f2d] flex items-center px-3 py-2.5 text-[10px] sm:text-xs font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider shadow-sm border-b border-border/60">
              <div className="basis-[50%]">Log #</div>
              <div className="basis-[50%] text-right">Status</div>
            </div>
            
            {sortedIncidents.map((incident) => {
              const priorityBorderClass = getPriorityBorderClass(incident.priority as Priority)
              const { icon: IncidentTypeIcon } = getIncidentTypeIcon(incident.incident_type)

              return (
              <motion.div
                key={incident.id}
                className={`card-table-row relative cursor-pointer touch-target ${priorityBorderClass} ${getRowStyle(incident)} ${
                  isHighPriorityAndOpen(incident)
                    ? 'ring-2 ring-red-400 shadow-xl shadow-red-500/50 z-20 animate-pulse-border motion-reduce:animate-none border-red-300'
                    : 'border-gray-200 dark:border-[#2d437a] active:border-blue-400 dark:active:border-blue-500'
                }`}
                style={{
                  transform: swipedIncidentId === incident.id ? `translateX(${swipeOffset}px)` : 'translateX(0)'
                }}
                onTouchStart={(e) => handleTouchStart(e, incident.id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
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
                <div className="absolute right-2 top-2 flex gap-1.5 items-center z-10">
                  {incident.entry_type === 'retrospective' && (
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-semibold" title="Retrospective entry">
                      🕓
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  {/* Top Row: Log # + Icon + Type Name (Left), Time (Center), Status Chips (Right) */}
                  <div className="flex items-center justify-between w-full">
                    {/* Left Group: Log #, Icon, Type Name, Priority Pin */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {(() => {
                          const match = incident.log_number.match(/(\d{3,})$/);
                          return match ? match[1] : incident.log_number;
                        })()}
                      </span>
                      <IncidentTypeIcon size={16} aria-hidden className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{incident.incident_type}</span>
                      {isHighPriorityAndOpen(incident) && (
                        <MapPinIcon className="h-4 w-4 text-red-500 animate-pulse" title="Pinned: High Priority Open" />
                      )}
                    </div>

                    {/* Center: Time */}
                    <div className="flex-grow text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400 bg-transparent">
                        {new Date(incident.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Right Group: Status Chips - Fixed spacing to prevent overlap */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {incident.incident_type !== 'Attendance' && (
                        <PriorityBadge priority={incident.priority} />
                      )}
                      {incident.is_amended && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="px-2 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm"
                          title="This log has been amended"
                        >
                          AMENDED
                        </motion.span>
                      )}
                      {incident.incident_type === 'Attendance' ? (
                        // Hide "Logged" chip for Attendance incidents
                        null
                      ) : (
                        // Hide "Closed" chip, only show "Open" chip
                        !incident.is_closed && (
                          <motion.span
                            className="px-2 py-1 rounded-full text-xs font-bold cursor-pointer shadow-sm transition-all duration-200 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white active:from-yellow-600 active:to-yellow-700"
                            onClick={e => { e.stopPropagation(); toggleIncidentStatus(incident, e); }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Open
                          </motion.span>
                        )
                      )}
                    </div>
                  </div>
                  
                  {/* Compact Occurrence Section */}
                  <div className="text-xs uppercase tracking-wide text-gray-600 mb-0.5">
                    Occurrence
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-100 leading-tight">
                    {incident.occurrence}
                  </p>
                  
                  {expandedIncidentId === incident.id && (
                    <div className="space-y-2 border-t border-gray-200 dark:border-[#2d437a] pt-2">
                      <div>
                        <span className="text-xs uppercase tracking-wide text-gray-600 mb-0.5">Full Occurrence</span>
                        <p className="text-sm text-gray-800 dark:text-gray-100 leading-tight">{incident.occurrence}</p>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wide text-gray-600 mb-0.5">Action Taken</span>
                        <p className="text-sm text-gray-800 dark:text-gray-100 leading-tight">{incident.action_taken}</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <span className="text-xs uppercase tracking-wide text-gray-600 mb-0.5">From</span>
                          <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">{incident.callsign_from}</p>
                        </div>
                        <div className="flex-1">
                          <span className="text-xs uppercase tracking-wide text-gray-600 mb-0.5">To</span>
                          <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">{incident.callsign_to}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              )
            })}
            

          </div>

          {/* Enhanced Desktop Table Layout */}
          <div
            ref={tableContainerRef}
            className="hidden md:block border border-gray-200 dark:border-[#2d437a] rounded-2xl"
            style={{
              height: 'calc(100vh - 260px)',
              overflow: 'hidden'
            }}
          >
            <div 
              className="overflow-auto"
              style={{
                height: '100%'
              }}
            >
              <table className="w-full caption-bottom text-sm table-fixed">
                <thead className="sticky top-0 z-30 bg-[#f8f9fb] dark:bg-[#1a1f2d] shadow-sm border-b border-border/60">
                  <tr className="hover:bg-transparent border-none">
                    <th className="h-12 px-4 py-3 text-center align-middle text-sm font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider w-[3%] border-b border-border/60 border-r border-border/30">LOG</th>
                    <th className="h-12 px-4 py-3 text-center align-middle text-sm font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider w-[5%] border-b border-border/60 border-r border-border/30">From</th>
                    <th className="h-12 px-4 py-3 text-center align-middle text-sm font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider w-[5%] border-b border-border/60 border-r border-border/30">To</th>
                    <th className="h-12 px-4 py-3 text-left align-middle text-sm font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider w-[48%] xl:flex-grow border-b border-border/60 border-r border-border/30">Occurrence</th>
                    <th className="h-12 px-4 py-3 text-center align-middle text-sm font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider w-[8%] border-b border-border/60 border-r border-border/30">Type</th>
                    <th className="h-12 px-4 py-3 text-left align-middle text-sm font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider w-[23%] xl:flex-grow border-b border-border/60 border-r border-border/30">Action</th>
                    <th className="h-12 px-4 py-3 text-center align-middle text-sm font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider w-[8%] border-b border-border/60">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#23408e] divide-y divide-gray-200 dark:divide-[#2d437a]">
                {sortedIncidents.map((incident, idx) => {
                  const priorityBorderClass = getPriorityBorderClass(incident.priority as Priority)
                  const { icon: IncidentTypeIcon } = getIncidentTypeIcon(incident.incident_type)
                  let rowColor = getRowStyle(incident);
                  if (rowColor === 'hover:bg-gray-50') {
                    rowColor = idx % 2 === 0 ? 'bg-white dark:bg-[#23408e] hover:bg-gray-50 dark:hover:bg-[#1a2a57]' : 'bg-gray-50 dark:bg-[#1a2a57] hover:bg-gray-100 dark:hover:bg-[#182447]';
                  }
                  return (
                    <tr
                      key={incident.id} 
                      className={`cursor-pointer border border-transparent ${priorityBorderClass} ${rowColor} hover:bg-muted/40 dark:hover:bg-[#1a2a57]/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                        isHighPriorityAndOpen(incident)
                          ? 'ring-2 ring-red-400 shadow-2xl shadow-red-500/70 z-20 animate-pulse-border motion-reduce:animate-none border-red-300'
                          : 'hover:border-blue-300 dark:hover:border-blue-500'
                      }`}
                      onClick={(e) => {
                        // Only open modal if not clicking on a button
                        if (!(e.target as HTMLElement).closest('button')) {
                          handleIncidentClick(incident);
                        }
                      }}
                    >
                      <td className="p-4 align-middle text-xs text-gray-600 dark:text-gray-300 border-r border-border/30">
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex items-center gap-1 justify-center">
                            {isHighPriorityAndOpen(incident) && (
                              <MapPinIcon className="h-3 w-3 text-red-500 animate-pulse" title="Pinned: High Priority Open" />
                            )}
                            <span className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded-lg font-mono text-xs font-bold">
                              {(() => {
                                const match = incident.log_number.match(/(\d{3,})$/);
                                return match ? match[1] : incident.log_number;
                              })()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium text-center bg-transparent">
                            {new Date(incident.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle text-xs text-gray-600 dark:text-gray-300 text-center border-r border-border/30">
                        <div className="max-w-[80px] mx-auto">
                          <span
                            title={callsignShortToName[incident.callsign_from?.toUpperCase()] || callsignAssignments[incident.callsign_from?.toUpperCase()] || undefined}
                            className="underline decoration-dotted cursor-help font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              lineHeight: '1.3',
                              textAlign: 'center'
                            }}
                          >
                            {incident.callsign_from}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle text-xs text-gray-600 dark:text-gray-300 text-center border-r border-border/30">
                        <div className="max-w-[80px] mx-auto">
                          <span
                            title={callsignShortToName[incident.callsign_to?.toUpperCase()] || callsignAssignments[incident.callsign_to?.toUpperCase()] || undefined}
                            className="underline decoration-dotted cursor-help font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              lineHeight: '1.3',
                              textAlign: 'center'
                            }}
                          >
                            {incident.callsign_to}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle text-xs text-gray-600 dark:text-gray-300 leading-relaxed border-r border-border/30" style={{
                        lineHeight: '1.3',
                        maxHeight: '2.6em',
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
                      </td>
                      <td className="p-4 align-middle text-xs text-gray-600 dark:text-gray-300 text-center border-r border-border/30">
                        <div className="flex items-center justify-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full shadow-sm ${getIncidentTypeStyle(incident.incident_type)}`}>
                            <IncidentTypeIcon size={14} aria-hidden className="shrink-0" />
                            <span>{incident.incident_type}</span>
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle text-xs text-gray-600 dark:text-gray-300 leading-relaxed border-r border-border/30" style={{
                        lineHeight: '1.3',
                        maxHeight: '2.6em',
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
                      </td>
                      <td className="p-4 align-middle text-center">
                        <div className="flex flex-col items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                          <div className="flex flex-wrap gap-1.5 items-center justify-center">
                            <PriorityBadge priority={incident.priority} />
                            {incident.entry_type === 'retrospective' && (
                              <motion.span 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-full font-semibold" 
                                title="Retrospective entry"
                              >
                                🕓
                              </motion.span>
                            )}
                            {incident.is_amended && (
                              <motion.span 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold" 
                                title="This log has been amended"
                              >
                                AMENDED
                              </motion.span>
                            )}
                          </div>
                          {incident.incident_type === 'Attendance' ? (
                            // Hide "Logged" chip for Attendance incidents (desktop/tablet only)
                            null
                          ) : (
                            // Hide "Closed" chip, only show "Open" chip
                            !incident.is_closed && (
                              <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => { e.stopPropagation(); toggleIncidentStatus(incident, e); }}
                                className="px-2 py-0.5 inline-flex text-xs font-bold rounded-full shadow-sm transition-all duration-200 transform hover:scale-105 touch-target bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Open
                              </motion.button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
          
          {isDetailsModalOpen && selectedIncidentId && (
            <IncidentDetailsModal
              isOpen={isDetailsModalOpen}
              incidentId={selectedIncidentId}
              onClose={handleCloseModal}
            />
          )}
          </div>
        </div>
          )}
        
        {/* Stats Sidebar - Below table on smaller screens, hidden on desktop */}
        <div className="block lg:hidden mt-6">
          <IncidentStatsSidebar 
            incidents={sortedIncidents}
          />
        </div>
        </>
      ) : viewMode === 'board' ? (
        isMobile ? (
          <div className="mt-6 rounded-3xl border border-dashed border-blue-300 bg-blue-50/60 p-6 text-center text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
            Board view is available on larger screens.
          </div>
        ) : (
          <>
            {/* Board View */}
            <div className="card-depth h-[700px] p-6 shadow-3">
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
        )
    ) : (
      <>
        <div className="flex items-center justify-center h-64 text-gray-500">
          Timeline view has been temporarily removed
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
    </div>
  )
} 
