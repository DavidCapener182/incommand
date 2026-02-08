// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '@/types/supabase'
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
  // Match flow log fields
  type?: string // 'match_log', 'incident', etc.
  category?: string // 'football', 'concert', etc.
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

// Module load logging removed - too verbose

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
  // Render logging removed - was causing console spam due to infinite loop

  // Safety check for filters prop
  const safeFilters = useMemo(
    () => filters || { types: [], statuses: [], priorities: [], query: '' },
    [filters]
  );

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [internalEventId, setInternalEventId] = useState<string | null>(null)

  const effectiveEventId = useMemo(() => {
    const incomingId =
      typeof propCurrentEventId === 'string' && propCurrentEventId.trim().length > 0
        ? propCurrentEventId
        : null
    return incomingId ?? internalEventId
  }, [propCurrentEventId, internalEventId])
  
  // Real-time revision tracking
  const { revisionCount } = useLogRevisions(effectiveEventId, (notification) => {
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
  const fetchBestPracticeRef = useRef(fetchBestPractice)
  useEffect(() => {
    fetchBestPracticeRef.current = fetchBestPractice
  }, [fetchBestPractice])

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
  const [showMatchFlowLogs, setShowMatchFlowLogs] = useState(true) // Show match flow logs by default
  const tableColumnWidths = useMemo(
    () => ({
      log: 'w-20 sm:w-24 lg:w-28',
      callsign: 'w-24 sm:w-28 lg:w-32',
      type: 'w-28 sm:w-32 lg:w-36',
      status: 'w-28 sm:w-32',
      occurrence: 'min-w-[220px] sm:min-w-[260px] lg:min-w-[360px]',
      action: 'min-w-[200px] sm:min-w-[240px] lg:min-w-[320px]',
    }),
    []
  )
  
  // Performance monitoring - warnings disabled to reduce console noise
  const { startRenderMeasurement, endRenderMeasurement, trackError } = usePerformanceMonitor({
    onThresholdExceeded: (metric, value, threshold) => {
      // Performance warnings disabled - was causing console spam
      // Only log in development if needed for debugging severe issues (>500ms)
      if (process.env.NODE_ENV === 'development' && metric === 'renderTime' && value > 500) {
        console.warn(`[IncidentTable] Severe performance issue:`, { metric, value, threshold })
      }
    }
  })
  

  // Use refs to avoid stale closures in the subscription
  const manualStatusChangesRef = useRef<Set<number>>(new Set())
  const onToastRef = useRef(onToast)
  const onDataLoadedRef = useRef(onDataLoaded)
  const fetchIncidentsRef = useRef<(() => Promise<void>) | null>(null)
  
  // Keep refs in sync with props/callbacks
  useEffect(() => {
    onToastRef.current = onToast
  }, [onToast])
  
  useEffect(() => {
    onDataLoadedRef.current = onDataLoaded
  }, [onDataLoaded])

  useEffect(() => {
    manualStatusChangesRef.current = manualStatusChanges
  }, [manualStatusChanges])
  
  // Create a reusable fetchIncidents function using refs to avoid dependency issues
  const fetchIncidents = useCallback(async () => {
    const eventId = effectiveEventId
    if (!eventId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from<Database['public']['Tables']['incident_logs']['Row'], Database['public']['Tables']['incident_logs']['Update']>('incident_logs')
        .select('*')
        .eq('event_id', eventId)
        .order('log_number', { ascending: false });

      if (error) throw error;
      const mappedIncidents = (data || []).map(incident => ({
        ...incident,
        status: incident.status || 'open',
        entry_type: incident.entry_type as 'contemporaneous' | 'retrospective' | undefined,
        retrospective_justification: incident.retrospective_justification || undefined,
        logged_by_user_id: incident.logged_by_user_id || undefined,
        logged_by_callsign: incident.logged_by_callsign ?? undefined,
        is_amended: incident.is_amended ?? undefined,
        original_entry_id: incident.original_entry_id?.toString() || undefined,
        type: incident.type || 'incident',
        category: incident.category || undefined,
      }))
      
      setIncidents(mappedIncidents);
      setLastUpdated(new Date());
      
      if (onDataLoadedRef.current) {
        onDataLoadedRef.current(mappedIncidents);
      }
    } catch (err) {
      logger.error('Error fetching incidents', err, { component: 'IncidentTable', action: 'fetchIncidents', eventId: eventId || undefined });
      setError('Failed to fetch incidents');
      trackError(err instanceof Error ? err : new Error('Failed to fetch incidents'), 'fetchIncidents');
    } finally {
      setLoading(false);
    }
  }, [effectiveEventId, trackError])

  // Set the ref after fetchIncidents is defined
  useEffect(() => {
    fetchIncidentsRef.current = fetchIncidents
  }, [fetchIncidents])

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

  // Cleanup function - stable callback that doesn't need to be in dependencies
  const performCleanup = useCallback((eventId: string | null) => {
    if (subscriptionRef.current) {
      logger.debug('Cleaning up incident table subscription', { component: 'IncidentTable', action: 'cleanup', eventId: eventId || undefined });
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    // Remove from active subscriptions map and global toast callbacks
    if (eventId) {
      const subscriptionKey = `incident_logs_${eventId}`;
      activeSubscriptions.delete(subscriptionKey);
      globalToastCallbacks.delete(subscriptionKey);
      logger.debug('Removed subscription and toast callback from active maps', { component: 'IncidentTable', action: 'cleanup', subscriptionKey });
    }
  }, [])

  useEffect(() => {
    // If an effective event ID already exists (from parent or prior fetch), skip
    if (effectiveEventId) {
      return
    }

    // Ensure we only query once the user context is ready (prevents unauthenticated requests)
    if (!currentUser?.id) {
      logger.debug('Skipping checkCurrentEvent until user is available', { component: 'IncidentTable', action: 'checkCurrentEvent' })
      return
    }

    const checkCurrentEvent = async () => {
      logger.debug('Checking for current event', { component: 'IncidentTable', action: 'checkCurrentEvent' });
      try {
        const { data: eventData, error } = await supabase
          .from<Database['public']['Tables']['events']['Row'], Database['public']['Tables']['events']['Update']>('events')
          .select('id')
          .eq('is_current', true)
          .maybeSingle();

        if (error) {
          logger.error('Error checking current event', error, { component: 'IncidentTable', action: 'checkCurrentEvent' });
          setInternalEventId(null);
          return;
        }

        const newEventId = eventData?.id || null;
        logger.debug('Setting internal event ID', { component: 'IncidentTable', action: 'checkCurrentEvent', eventId: newEventId || undefined });
        setInternalEventId(newEventId);
      } catch (err) {
        logger.error('Error checking current event', err, { component: 'IncidentTable', action: 'checkCurrentEvent' });
        setInternalEventId(null);
      }
    };

    checkCurrentEvent();
  }, [effectiveEventId, currentUser?.id]);

  useEffect(() => {
    logger.debug('Subscription useEffect triggered', { component: 'IncidentTable', action: 'subscriptionEffect', currentEventId: effectiveEventId, eventIdType: typeof effectiveEventId });
    if (!effectiveEventId || typeof effectiveEventId !== 'string' || effectiveEventId.trim() === '') {
      logger.debug('No current event ID - skipping subscription', { component: 'IncidentTable', action: 'subscriptionEffect', currentEventId: effectiveEventId });
      return;
    }
    logger.debug('Current event ID valid - proceeding with subscription setup', { component: 'IncidentTable', action: 'subscriptionEffect', currentEventId: effectiveEventId });

    // Check if there's already an active subscription for this event
    const subscriptionKey = `incident_logs_${effectiveEventId}`;
    logger.debug('Checking subscription', { component: 'IncidentTable', action: 'subscriptionEffect', componentId: componentId.current, subscriptionKey });
    
    if (activeSubscriptions.has(subscriptionKey)) {
      logger.debug('Subscription already exists for event - skipping duplicate', { component: 'IncidentTable', action: 'subscriptionEffect', currentEventId: effectiveEventId, componentId: componentId.current });
      // IMPORTANT: Don't overwrite existing toast callback to prevent duplicates
      logger.debug('Keeping existing toast callback to prevent duplicates', { component: 'IncidentTable', action: 'subscriptionEffect', componentId: componentId.current });
      return;
    }



    // DO NOT call cleanup() here!

    // Mark this subscription as active and register toast callback
    activeSubscriptions.set(subscriptionKey, true);
    if (onToastRef.current) {
      globalToastCallbacks.set(subscriptionKey, onToastRef.current);
      logger.debug('Registered toast callback for new subscription', { component: 'IncidentTable', action: 'subscriptionEffect', componentId: componentId.current });
    }
    logger.debug('Created new subscription for', { component: 'IncidentTable', action: 'subscriptionEffect', subscriptionKey });

    // Set up new subscription with a stable channel name
    logger.debug('Setting up Supabase subscription for event', { component: 'IncidentTable', action: 'subscriptionEffect', currentEventId: effectiveEventId });
    logger.debug('Subscription filter', { component: 'IncidentTable', action: 'subscriptionEffect', filter: `event_id=eq.${effectiveEventId}` });
    
    // Basic connectivity verification
    logger.debug('Setting up real-time subscription for event', { component: 'IncidentTable', action: 'subscriptionEffect', currentEventId: effectiveEventId });
    
    subscriptionRef.current = supabase
      .channel(`incident_logs_${effectiveEventId}`)
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'incident_logs',
          filter: `event_id=eq.${effectiveEventId}`
        },
        (payload) => {
          logger.debug('Real-time event received', { component: 'IncidentTable', action: 'subscriptionEffect', eventType: payload.eventType, incidentLogNumber: (payload.new as any)?.log_number || (payload.old as any)?.log_number });
        logger.debug('Event details', { component: 'IncidentTable', action: 'subscriptionEffect', details: payload.new || payload.old });
        logger.debug('onToast available', { component: 'IncidentTable', action: 'subscriptionEffect', available: !!onToastRef.current });
          
          setIncidents(prev => {
          let newIncidents: Incident[] = [];
          if (payload.eventType === 'INSERT') {
              // Map all fields to match fetchIncidents structure
              const newIncidentData = payload.new as any;
              const newIncident: Incident = {
                ...newIncidentData,
                status: newIncidentData.status || 'open',
                entry_type: newIncidentData.entry_type as 'contemporaneous' | 'retrospective' | undefined,
                retrospective_justification: newIncidentData.retrospective_justification || undefined,
                logged_by_user_id: newIncidentData.logged_by_user_id || undefined,
                logged_by_callsign: newIncidentData.logged_by_callsign ?? undefined,
                is_amended: newIncidentData.is_amended ?? undefined,
                original_entry_id: newIncidentData.original_entry_id?.toString() || undefined,
                type: newIncidentData.type || 'incident',
                category: newIncidentData.category || undefined,
              };
              
              // Check if this incident already exists (prevent duplicates)
              const exists = prev.some(inc => inc.id === newIncident.id);
              if (!exists) {
                newIncidents = [newIncident, ...prev];
              } else {
                // If it exists, update it instead of adding duplicate
                newIncidents = prev.map(inc => inc.id === newIncident.id ? newIncident : inc);
              }
              
              // Trigger a refetch to ensure we have the latest data (debounced)
              // This handles cases where real-time events might arrive out of order or be missed
              if (fetchIncidentsRef.current) {
                setTimeout(() => {
                  fetchIncidentsRef.current?.();
                }, 500);
              }
              
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
                if (featureFlags.best_practice_enabled && incident.incident_type !== 'Attendance' && incident.incident_type !== 'Sit Rep' && fetchBestPracticeRef.current) {
                  // show spinner toast
                  globalToastCallback({
                    type: 'info',
                    title: 'Finding best practice…',
                    message: 'Consulting Green Guide',
                    duration: 3000
                  })
                  // async call
                  fetchBestPracticeRef.current({
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
                  const updated = { 
                    ...incident, 
                    ...payload.new,
                    // Ensure type and category fields are preserved
                    type: (payload.new as any).type || incident.type || 'incident',
                    category: (payload.new as any).category || incident.category || undefined,
                  };
                  
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
          logger.debug('Real-time subscription active for event', { component: 'IncidentTable', action: 'subscriptionEffect', currentEventId: effectiveEventId });
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Real-time subscription error', { component: 'IncidentTable', action: 'subscriptionEffect', currentEventId: effectiveEventId });
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

    // Fetch incidents when event ID is available
    fetchIncidents();

    return () => {
      // Cleanup using stable callback with current eventId
      performCleanup(effectiveEventId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveEventId]); // Only depend on effectiveEventId - fetchIncidents is stable relative to it

  // Separate useEffect for onDataLoaded callback to avoid stale closures
  useEffect(() => {
    if (onDataLoadedRef.current && incidents.length > 0) {
      onDataLoadedRef.current(incidents);
    }
  }, [incidents]);

  // Fetch callsign assignments for tooltips
  useEffect(() => {
    if (!effectiveEventId) return;
    const fetchAssignments = async () => {
      // Get all roles
      const { data: roles } = await supabase
        .from<any, any>('callsign_positions')
        .select('id, short_code, callsign')
        .eq('event_id', effectiveEventId);
      // Get all assignments
      const { data: assignments } = await supabase
        .from<any, any>('callsign_assignments')
        .select('callsign_role_id, assigned_name')
        .eq('event_id', effectiveEventId);
      // Build mapping
      const idToShort: Record<string, string> = {};
      const idToCallsign: Record<string, string> = {};
      roles?.forEach((r) => {
        idToShort[r.id] = r.short_code || '';
        idToCallsign[r.id] = r.callsign;
      });
      const shortToName: Record<string, string> = {};
      const callsignToName: Record<string, string> = {};
      assignments?.forEach((a) => {
        if (a.callsign_role_id) {
          const short = idToShort[a.callsign_role_id];
          const cs = idToCallsign[a.callsign_role_id];
          if (short && a.assigned_name) shortToName[short.toUpperCase()] = a.assigned_name;
          if (cs && a.assigned_name) callsignToName[cs.toUpperCase()] = a.assigned_name;
        }
      });
      setCallsignAssignments(callsignToName);
      setCallsignShortToName(shortToName);
    };
    fetchAssignments();
  }, [effectiveEventId]);

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
        .from<Database['public']['Tables']['incident_logs']['Row'], Database['public']['Tables']['incident_logs']['Update']>('incident_logs')
        .update({ 
          is_closed: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', incident.id);
      if (error) throw error;
      
      // Add an update to track the status change
      await supabase
        .from<any, any>('incident_updates')
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
  // Separate match flow logs from regular incidents for filtering
  const regularIncidents = incidents.filter(incident => (incident.type || 'incident') !== 'match_log')
  const matchFlowLogs = incidents.filter(incident => (incident.type || 'incident') === 'match_log')
  
  // Debug logging removed - too verbose, causing console spam
  
  // Filter regular incidents
  const filteredRegularIncidents: Incident[] = filterIncidents<Incident>(regularIncidents, { ...safeFilters, query: searchQuery })
  
  // Filter match flow logs (if enabled)
  const filteredMatchFlowLogs: Incident[] = useMemo(() => {
    if (!showMatchFlowLogs) {
      return []
    }
    return filterIncidents<Incident>(matchFlowLogs, { ...safeFilters, query: searchQuery })
  }, [matchFlowLogs, safeFilters, searchQuery, showMatchFlowLogs])
  
  // Filtered counts tracking removed - was causing excessive logging
  
  // Combine filtered incidents (match flow logs appear after regular incidents)
  const filteredIncidents: Incident[] = useMemo(
    () => [...filteredRegularIncidents, ...filteredMatchFlowLogs],
    [filteredMatchFlowLogs, filteredRegularIncidents]
  )

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

  // Sort incidents: Strictly by log number descending (highest to lowest)
  // Handle both "LOG-XXX" and "event-XXX" formats by extracting the numeric part
  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    // Extract numeric part from log_number (handles both "LOG-082" and "event-082" formats)
    const extractNumber = (logNum: string): number => {
      const match = logNum.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    };
    
    const numA = extractNumber(a.log_number);
    const numB = extractNumber(b.log_number);
    
    // If both have valid numbers, sort numerically
    if (numA > 0 && numB > 0) {
      return numB - numA; // Descending order
    }
    
    // Fallback to string comparison if numbers can't be extracted
    return b.log_number.localeCompare(a.log_number, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Determine if we should use virtualized table (for large datasets)
  const shouldUseVirtualized = useMemo(() => {
    return sortedIncidents.length > 100 // Use virtualized table for 100+ incidents
  }, [sortedIncidents.length])

  const chronologicalIncidents = useMemo(() => {
    return [...filteredIncidents].sort((a, b) => 
      a.log_number.localeCompare(b.log_number, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [filteredIncidents]);

  const normalizedSelectedPriorities = useMemo(
    () => safeFilters.priorities.map((priority) => normalizePriority(priority as Priority)),
    [safeFilters.priorities]
  );

  const handlePriorityToggle = useCallback(
    (target: NormalizedPriority) => {
      if (!onFiltersChange) return;

      const shouldRemove = normalizedSelectedPriorities.includes(target);
      const updatedPriorities = shouldRemove
        ? safeFilters.priorities.filter(
            (priority) => normalizePriority(priority as Priority) !== target
          )
        : [...safeFilters.priorities, target];

      onFiltersChange({ ...safeFilters, priorities: updatedPriorities });
    },
    [safeFilters, normalizedSelectedPriorities, onFiltersChange]
  );

  const handleClearPriorityFilters = useCallback(() => {
    if (!onFiltersChange) return;
    onFiltersChange({ ...safeFilters, priorities: [] });
  }, [safeFilters, onFiltersChange]);

  // Performance monitoring - measure render time (mount/unmount only)
  useEffect(() => {
    startRenderMeasurement()
    return () => {
      endRenderMeasurement('IncidentTable')
    }
  }, [endRenderMeasurement, startRenderMeasurement])

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
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-100/65 p-3 shadow-[0_24px_50px_-36px_rgba(15,23,42,0.45)] ring-1 ring-white/80 dark:border-incommand-border/70 dark:bg-gradient-to-b dark:from-incommand-surface dark:to-incommand-tertiary-dark dark:ring-white/5 md:p-4">
      {/* Enhanced Search Bar and Last Updated */}
      <div className="relative mb-3 rounded-xl border border-slate-200/90 bg-white/85 p-3 shadow-sm dark:border-incommand-border/60 dark:bg-incommand-surface-muted/65">
        {/* Mobile: Enhanced Search Bar Above Everything */}
        <div className="mb-2 block md:hidden">
          <EnhancedSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onFilterChange={onFiltersChange}
            placeholder="Search incidents by type, callsign, or description..."
            showSuggestions={true}
          />
        </div>

        {/* Desktop: Enhanced Search Bar, View Toggle, and Last Updated */}
        <div className="mb-2 hidden items-center justify-between gap-4 md:flex">
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
            <div className="card-control flex items-center rounded-xl border border-slate-200 bg-white p-1 dark:border-incommand-border/60 dark:bg-incommand-surface-alt/80">
              <motion.button
                onClick={() => onViewModeChange('table')}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 touch-target ${
                  viewMode === 'table' ? 'bg-incommand-brand-mobile text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <TableCellsIcon className="h-4 w-4" /> Table
              </motion.button>
              <motion.button
                onClick={() => onViewModeChange('board')}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 touch-target ${
                  viewMode === 'board' ? 'bg-incommand-brand-mobile text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
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
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm dark:border-incommand-border/70 dark:bg-incommand-quaternary-dark dark:text-slate-300">
                <span className="font-semibold">Updated:</span> {lastUpdated.toLocaleTimeString('en-GB', { 
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
        <div className="mb-2 block md:hidden">
          {lastUpdated && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-medium text-slate-600 dark:border-incommand-border/60 dark:bg-incommand-surface-alt/70 dark:text-slate-300">
              <span className="font-semibold">Updated:</span> {lastUpdated.toLocaleTimeString('en-GB', {
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
          <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Filter incidents by priority">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600 dark:text-gray-300">Priority</span>
            {PRIORITY_FILTER_OPTIONS.map((priorityOption) => {
              const isActive = normalizedSelectedPriorities.includes(priorityOption);
              const config = getPriorityDisplayConfig(priorityOption);
              
              // Get badge style based on priority
              const getBadgeStyle = (priority: string) => {
                switch (priority) {
                  case 'urgent':
                    return 'bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/10 text-red-500 border-red-600/60'
                  case 'high':
                    return 'bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/10 text-red-500 border-red-600/60'
                  case 'medium':
                    return 'bg-amber-600/10 dark:bg-amber-600/20 hover:bg-amber-600/10 text-amber-500 border-amber-600/60'
                  case 'low':
                    return 'bg-emerald-600/10 dark:bg-emerald-600/20 hover:bg-emerald-600/10 text-emerald-500 border-emerald-600/60'
                  default:
                    return 'bg-gray-600/10 dark:bg-gray-600/20 hover:bg-gray-600/10 text-gray-500 border-gray-600/60'
                }
              }
              
              const getDotColor = (priority: string) => {
                switch (priority) {
                  case 'urgent':
                  case 'high':
                    return 'bg-red-500'
                  case 'medium':
                    return 'bg-amber-500'
                  case 'low':
                    return 'bg-emerald-500'
                  default:
                    return 'bg-gray-500'
                }
              }
              
              const badgeStyle = getBadgeStyle(priorityOption);
              const dotColor = getDotColor(priorityOption);
              
              const buttonClasses = [
                'flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
                badgeStyle,
                !isActive && 'opacity-60',
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
                  <div className={`h-1.5 w-1.5 rounded-full ${dotColor} mr-2`} />
                  <span>{config.label}</span>
                </button>
              );
            })}
            {safeFilters.priorities.length > 0 && (
              <button
                type="button"
                onClick={handleClearPriorityFilters}
                className="text-xs font-semibold text-blue-600 dark:text-blue-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                Clear
              </button>
            )}
            {/* Match Flow Logs Toggle */}
            {matchFlowLogs.length > 0 && (
              <>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 ml-2">Match Flow</span>
                <motion.button
                  onClick={() => setShowMatchFlowLogs(!showMatchFlowLogs)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    showMatchFlowLogs
                      ? 'bg-incommand-brand-mobile text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-pressed={showMatchFlowLogs}
                >
                  <span>⚽</span>
                  <span>{showMatchFlowLogs ? 'Show' : 'Hide'} Match Flow</span>
                </motion.button>
              </>
            )}
          </div>
        )}

        {/* Removed extra filters block since Types moved inline above */}

        {searchQuery && (
          <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50/90 px-4 py-2 text-sm text-gray-600 dark:border-blue-700 dark:bg-blue-900/20 dark:text-gray-300">
            <span className="font-medium text-blue-700 dark:text-blue-200">
              {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''} found
            </span>
            {((safeFilters.types?.length || 0) + (safeFilters.statuses?.length || 0) + (safeFilters.priorities?.length || 0)) > 0 && (
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
            <div className="mt-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-gray-50 to-blue-50 p-12 text-center shadow-xl transition-colors duration-300 dark:border-incommand-border dark:from-incommand-surface-elevated dark:to-incommand-primary-dark">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No incidents to display</h3>
              <p className="text-gray-600 dark:text-gray-300">When incidents are logged, they will appear here in real-time.</p>
            </div>
          ) : shouldUseVirtualized ? (
            /* Virtualized Table for Large Datasets */
            <div className="mt-2 flex flex-col gap-6 overflow-hidden lg:flex-row lg:items-start">
              <div className="w-full lg:flex-1">
                {/* Regular Incident List for Desktop */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm dark:border-incommand-border/60 dark:bg-incommand-surface/85">
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
                        {sortedIncidents.map((incident) => {
                          const isMatchFlowLog = incident.type === 'match_log'
                          return (
                          <div
                            key={incident.id}
                            className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                              isMatchFlowLog ? 'bg-gray-50/50 dark:bg-gray-800/50 opacity-75' : ''
                            }`}
                            onClick={() => handleIncidentClick(incident)}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                {isMatchFlowLog ? (
                                  <span className="text-lg" title="Match Flow Log">⚽</span>
                                ) : (
                                  (() => {
                                    const iconConfig = getIncidentTypeIcon(incident.incident_type)
                                    const IconComponent = iconConfig.icon
                                    return <IconComponent className="w-5 h-5 text-gray-400" />
                                  })()
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className={`font-mono text-sm font-medium ${
                                    isMatchFlowLog ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                                  }`}>
                                    {incident.log_number}
                                  </span>
                                  {!isMatchFlowLog && <PriorityBadge priority={incident.priority} />}
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(incident.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {isMatchFlowLog && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">Match Flow</span>
                                  )}
                                </div>
                                <p className={`text-sm leading-tight ${
                                  isMatchFlowLog ? 'text-gray-600 dark:text-gray-300' : 'text-gray-800 dark:text-gray-100'
                                }`}>
                                  {incident.occurrence.length > 100 
                                    ? `${incident.occurrence.substring(0, 100)}...` 
                                    : incident.occurrence
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                          )
                        })}
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
        <div className="mt-2 flex flex-col gap-6 overflow-hidden lg:flex-row lg:items-start">
          {/* Main Content */}
          <div className="w-full lg:flex-1">
          {/* Enhanced Mobile Card Layout with Pull-to-Refresh */}
          <div 
            className="relative mt-4 flex-1 space-y-3 overflow-hidden overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/90 px-1 scroll-smooth dark:border-incommand-border/60 dark:bg-incommand-surface-alt/85 md:hidden"
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
            <div className="sticky top-0 z-10 flex items-center border-b border-border/60 bg-slate-50/95 px-3 py-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur-sm dark:bg-incommand-table-header/95 dark:text-gray-300 sm:text-xs">
              <div className="basis-[50%]">Log #</div>
              <div className="basis-[50%] text-right">Status</div>
            </div>
            
            {sortedIncidents.map((incident) => {
              const isMatchFlowLog = incident.type === 'match_log'
              const priorityBorderClass = getPriorityBorderClass(incident.priority as Priority)
              const { icon: IncidentTypeIcon } = getIncidentTypeIcon(incident.incident_type)

              return (
              <motion.div
                key={incident.id}
                className={`card-table-row relative cursor-pointer touch-target ${priorityBorderClass} ${getRowStyle(incident)} ${
                  isMatchFlowLog 
                    ? 'bg-gray-50/50 dark:bg-gray-800/50 opacity-75 border-gray-300 dark:border-gray-600' 
                    : isHighPriorityAndOpen(incident)
                    ? 'ring-2 ring-red-400 border-red-300 z-20 animate-pulse-bg motion-reduce:animate-none'
                    : 'border-gray-200 dark:border-incommand-border active:border-blue-400 dark:active:border-blue-500'
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
                      <span className={`text-sm font-semibold ${
                        isMatchFlowLog ? 'text-gray-500 dark:text-gray-400' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {(() => {
                          const match = incident.log_number.match(/(\d{3,})$/);
                          return match ? match[1] : incident.log_number;
                        })()}
                      </span>
                      {isMatchFlowLog ? (
                        <span className="text-base" title="Match Flow Log">⚽</span>
                      ) : (
                        <IncidentTypeIcon size={16} aria-hidden className="w-4 h-4 text-gray-400" />
                      )}
                      <span className={`text-xs ${
                        isMatchFlowLog ? 'text-gray-400 dark:text-gray-500 italic' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {incident.incident_type}
                        {isMatchFlowLog && ' (Match Flow)'}
                      </span>
                      {isHighPriorityAndOpen(incident) && !isMatchFlowLog && (
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
                      {!isMatchFlowLog && incident.incident_type !== 'Attendance' && (
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
                      ) : isMatchFlowLog ? (
                        // Match flow logs are always logged - show informational badge
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-400 text-white shadow-sm">
                          Match Flow
                        </span>
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
                    <div className="space-y-2 border-t border-gray-200 dark:border-incommand-border pt-2">
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
            className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-incommand-border/60 dark:bg-incommand-surface-alt/90 md:block"
            style={{
              height: 'calc(100vh - 260px)'
            }}
          >
            <div className="h-full overflow-auto">
              <table className="w-full min-w-[960px] caption-bottom text-sm table-auto">
                <thead className="sticky top-0 z-30 border-b border-border/60 bg-slate-50/95 shadow-sm backdrop-blur-sm dark:bg-incommand-table-header/95">
                  <tr className="hover:bg-transparent border-none">
                    <th className={`h-12 px-4 py-3 text-center align-middle text-sm font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider border-b border-border/60 border-r border-border/30 ${tableColumnWidths.log}`}>Log</th>
                    <th className={`h-12 px-4 py-3 text-center align-middle text-sm font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider border-b border-border/60 border-r border-border/30 ${tableColumnWidths.callsign}`}>From</th>
                    <th className={`h-12 px-4 py-3 text-center align-middle text-sm font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider border-b border-border/60 border-r border-border/30 ${tableColumnWidths.callsign}`}>To</th>
                    <th className={`h-12 px-4 py-3 text-left align-middle text-sm font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider border-b border-border/60 border-r border-border/30 ${tableColumnWidths.occurrence}`}>Occurrence</th>
                    <th className={`h-12 px-4 py-3 text-center align-middle text-sm font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider border-b border-border/60 border-r border-border/30 ${tableColumnWidths.type}`}>Type</th>
                    <th className={`h-12 px-4 py-3 text-left align-middle text-sm font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider border-b border-border/60 border-r border-border/30 ${tableColumnWidths.action}`}>Action</th>
                    <th className={`h-12 px-4 py-3 text-center align-middle text-sm font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider border-b border-border/60 ${tableColumnWidths.status}`}>Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-incommand-surface divide-y divide-gray-200 dark:divide-incommand-border">
                {sortedIncidents.map((incident, idx) => {
                  const isMatchFlowLog = incident.type === 'match_log'
                  const priorityBorderClass = getPriorityBorderClass(incident.priority as Priority)
                  const { icon: IncidentTypeIcon } = getIncidentTypeIcon(incident.incident_type)
                  const isGoalType = /goal/i.test(incident.incident_type || '')
                  let rowColor = getRowStyle(incident);
                  if (rowColor === 'hover:bg-gray-50') {
                    rowColor = idx % 2 === 0 ? 'bg-white dark:bg-incommand-surface hover:bg-gray-50 dark:hover:bg-incommand-hover' : 'bg-gray-50 dark:bg-incommand-surface-row hover:bg-gray-100 dark:hover:bg-incommand-surface-row-alt';
                  }
                  // Match flow logs get grey styling
                  if (isMatchFlowLog) {
                    rowColor = 'bg-gray-50/50 dark:bg-gray-800/50 opacity-75'
                  }
                  return (
                    <tr
                      key={incident.id} 
                      className={`cursor-pointer border border-transparent ${priorityBorderClass} ${rowColor} ${
                        isMatchFlowLog 
                          ? 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50 border-gray-300 dark:border-gray-600' 
                          : isHighPriorityAndOpen(incident)
                          ? 'ring-2 ring-red-400 border-red-300 z-20 animate-pulse-bg motion-reduce:animate-none transition-colors duration-200'
                          : 'hover:bg-muted/40 dark:hover:bg-incommand-surface-elevated/60 transition-colors duration-200 hover:border-blue-300 dark:hover:border-blue-500'
                      }`}
                      onClick={(e) => {
                        // Only open modal if not clicking on a button
                        if (!(e.target as HTMLElement).closest('button')) {
                          handleIncidentClick(incident);
                        }
                      }}
                    >
                      <td className={`px-4 py-3 align-middle text-xs text-gray-600 dark:text-gray-300 border-r border-border/30 ${tableColumnWidths.log}`}>
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex items-center gap-1 justify-center">
                            {isHighPriorityAndOpen(incident) && !isMatchFlowLog && (
                              <MapPinIcon className="h-3 w-3 text-red-500 animate-pulse" title="Pinned: High Priority Open" />
                            )}
                            <span className={`px-1.5 py-0.5 rounded-lg font-mono text-xs font-bold ${
                              isMatchFlowLog 
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400' 
                                : 'bg-blue-100 dark:bg-blue-900'
                            }`}>
                              {(() => {
                                const match = incident.log_number.match(/(\d{3,})$/);
                                return match ? match[1] : incident.log_number;
                              })()}
                            </span>
                          </div>
                          <div className={`text-xs font-medium text-center bg-transparent ${
                            isMatchFlowLog ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {new Date(incident.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 py-3 align-middle text-xs text-gray-600 dark:text-gray-300 text-center border-r border-border/30 ${tableColumnWidths.callsign}`}>
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
                      <td className={`px-4 py-3 align-middle text-xs text-gray-600 dark:text-gray-300 text-center border-r border-border/30 ${tableColumnWidths.callsign}`}>
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
                      <td className={`px-4 py-3 align-middle text-xs leading-relaxed border-r border-border/30 ${tableColumnWidths.occurrence} ${
                        isMatchFlowLog ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-300'
                      }`} style={{
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
                      <td className={`px-4 py-3 align-middle text-xs text-gray-600 dark:text-gray-300 text-center border-r border-border/30 ${tableColumnWidths.type}`}>
                        <div className="flex items-center justify-center">
                          {isMatchFlowLog ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full shadow-sm bg-gray-400 text-white">
                              {isGoalType && <span>⚽</span>}
                              <span>{incident.incident_type}</span>
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full shadow-sm ${getIncidentTypeStyle(incident.incident_type)}`}>
                              <IncidentTypeIcon size={14} aria-hidden className="shrink-0" />
                              <span>{incident.incident_type}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`px-4 py-3 align-middle text-xs text-gray-600 dark:text-gray-300 leading-relaxed border-r border-border/30 ${tableColumnWidths.action}`} style={{
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
                      <td className={`px-4 py-3 align-middle text-center ${tableColumnWidths.status}`}>
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
                eventId={effectiveEventId || ''}
                currentUser={currentUser}
                searchQuery={searchQuery}
                incidents={incidents}
                loading={loading}
                error={error}
                filters={safeFilters}
                updateIncident={async (id, updates) => {
                  // Find the incident and update it
                  const incident = incidents.find(inc => inc.id.toString() === id);
                  if (!incident) return;

                  // Convert dependencies from string[] to number[] if present
                  const processedUpdates: any = {
                    ...updates
                  };
                  
                  if (updates.dependencies) {
                    processedUpdates.dependencies = updates.dependencies.map(dep => parseInt(dep));
                  }

                  // Update the incident in the database
                  const { error: updateError } = await supabase
                    .from<Database['public']['Tables']['incident_logs']['Row'], Database['public']['Tables']['incident_logs']['Update']>('incident_logs')
                    .update(processedUpdates)
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

// Export supported event types for conditional rendering
export const supportedEventTypes = ['concert', 'festival']; 
