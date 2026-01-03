// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef, Fragment, useCallback, useMemo } from 'react'
import IncidentTable from './IncidentTable'
import CurrentEvent from './CurrentEvent'
import EventCreationModal from './EventCreationModal'
import IncidentCreationModal, {
  incidentTypes,
} from './IncidentCreationModal'
import VenueOccupancy from './VenueOccupancy'
import { supabase } from '../lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import { useEventContext } from '../contexts/EventContext'
import type { Database } from '@/types/supabase'
import {
  UsersIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  CheckCircleIcon,
  UserGroupIcon,
  CalendarIcon,
  HeartIcon,
  ClipboardDocumentCheckIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  ShieldExclamationIcon,
  UserMinusIcon,
  BellAlertIcon,
  MegaphoneIcon,
  ArrowsRightLeftIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import WeatherCard from './WeatherCard'
import What3WordsSearchCard from './What3WordsSearchCard'
import SupportToolsFootball from '@/components/cards/football/SupportToolsFootball'
import FootballCard_LiveScore from '@/components/cards/football/FootballCard_LiveScore'
import TimeCard, { type EventTiming } from './TimeCard'

import { geocodeAddress } from '../utils/geocoding'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
// @ts-ignore-next-line
import Modal from 'react-modal'
import what3words from '@what3words/api'
import { Menu, Transition, Dialog } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import AttendanceModal from './AttendanceModal'
import { getIncidentTypeStyle } from '../utils/incidentStyles'
import MultiSelectFilter from './ui/MultiSelectFilter'
import { FilterState, filterIncidents, getUniqueIncidentTypes, getUniquePriorities, getUniqueStatuses } from '../utils/incidentFilters'
import Toast, { useToast } from './Toast'
import { AnimatePresence, motion } from 'framer-motion'
import NoEventSplash from './NoEventSplash'
// import StaffDeploymentCard from './StaffDeploymentCard'
import { useStaffAvailability } from '../hooks/useStaffAvailability'
import { logger } from '../lib/logger'
import IncidentSummaryBar, { type SummaryStatus } from './IncidentSummaryBar'
import { PageWrapper } from './layout/PageWrapper'
import { useIncidentSummary } from '@/contexts/IncidentSummaryContext'
import LogReviewReminder from './LogReviewReminder'
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor'
import AnalyticsKPICards from './analytics/AnalyticsKPICards'
import MiniTrendChart from './MiniTrendChart'
import RealtimeAlertBanner from './analytics/RealtimeAlertBanner'
import RealtimeStatusIndicator from './analytics/RealtimeStatusIndicator'
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics'
import ReadinessIndexCard from './analytics/ReadinessIndexCard'
import RadioAlertsWidget from './monitoring/RadioAlertsWidget'
// Accessibility imports
import SkipLinks from './SkipLinks'
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useScreenReader } from '@/hooks/useScreenReader'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FeatureGate } from '@/components/FeatureGate'
import { useUserPlan } from '@/hooks/useUserPlan'
import StatCardSkeleton from './dashboard/cards/StatCardSkeleton'
import TimeCardSkeleton from './dashboard/cards/TimeCardSkeleton'
import CardSkeleton from './dashboard/cards/CardSkeleton'
import StatCard from './dashboard/cards/StatCard'
import TopIncidentTypesCard from './dashboard/cards/TopIncidentTypesCard'

const EVENT_TYPES = [
  'Concerts',
  'Sports Events',
  'Conferences',
  'Festivals',
  'Exhibitions',
  'Theatre Shows',
  'Parades',
  'Ceremonies',
  'Community Gatherings',
  'Charity Event',
  'Corporate Event',
];

// Card components are now in separate files in ./dashboard/cards/

// Add a helper to fetch What3Words address via API route (to keep API key secret)
async function fetchWhat3Words(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(`/api/what3words?lat=${lat}&lon=${lon}`);
    const data = await res.json();
    return data.words ? data.words : null;
  } catch {
    return null;
  }
}

const w3wApiKey = process.env.NEXT_PUBLIC_WHAT3WORDS_API_KEY;
const w3wApi = w3wApiKey ? what3words(w3wApiKey) : null;
const w3wRegex = /^(?:\s*\/{0,3})?([a-zA-Z]+)\.([a-zA-Z]+)\.([a-zA-Z]+)$/;



// TopIncidentTypesCard is now in ./dashboard/cards/TopIncidentTypesCard.tsx



export default function Dashboard() {
  const { user } = useAuth();
  const { updateCounts } = useIncidentSummary()
  const { eventType, eventData, loading: eventLoading } = useEventContext()
  const userPlan = useUserPlan() || 'starter' // Default to starter if plan not loaded yet
  
  // Wait for EventContext to load before rendering event-specific content
  const isEventContextReady = !eventLoading && eventType !== null
  
  // ⚠️  CONCERT DASHBOARD IS PERMANENTLY LOCKED ⚠️
  // The concert dashboard section below must NEVER be modified.
  // It will always show the original 4 cards regardless of event type changes.
  
  // Performance monitoring
  const { startRenderMeasurement, endRenderMeasurement, trackError } = usePerformanceMonitor({
    onThresholdExceeded: (metric, value, threshold) => {
      console.warn(`[Dashboard] Performance threshold exceeded:`, { metric, value, threshold })
    }
  })
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({ types: [], statuses: [], priorities: [], query: '' })
  
  // Ensure filters always has all required properties
  const safeFilters = {
    types: filters.types || [],
    statuses: filters.statuses || [],
    priorities: filters.priorities || [],
    query: filters.query || ''
  }
  const activeSummaryStatus = useMemo<SummaryStatus | null>(() => {
    if (safeFilters.statuses.length !== 1) {
      return null
    }

    const status = String(safeFilters.statuses[0]).toLowerCase()
    if (status === 'open' || status === 'closed') {
      return status
    }
    if (status === 'in_progress' || status === 'in progress') {
      return 'in_progress'
    }

    return null
  }, [safeFilters.statuses])


  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false)
  
  // Listen for custom event to close incident modal (bypasses React state if stuck)
  useEffect(() => {
    const handleCloseIncidentModal = () => {
      setIsIncidentModalOpen(false)
    }
    window.addEventListener('closeIncidentModal', handleCloseIncidentModal)
    return () => {
      window.removeEventListener('closeIncidentModal', handleCloseIncidentModal)
    }
  }, [])
  const [initialIncidentType, setInitialIncidentType] = useState<
    string | undefined
  >(undefined)
  const [hasCurrentEvent, setHasCurrentEvent] = useState(false)
  const [currentEventId, setCurrentEventId] = useState<string | null>(null)
  const [currentEvent, setCurrentEvent] = useState<any | null>(null)
  
  // Real-time analytics for live updates
  const realtimeAnalytics = useRealtimeAnalytics({
    eventId: currentEvent?.id,
    updateInterval: 30000, // 30 seconds
    enableAlerts: true,
    alertThresholds: {
      incidentVolume: 5,
      responseTime: 15,
      qualityScore: 75,
      complianceRate: 90
    }
  })
  
  // Debug logging for currentEvent
  useEffect(() => {
    console.log('🔍 Dashboard currentEvent changed:', currentEvent)
  }, [currentEvent])
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number }>({
    lat: 51.5074,
    lon: -0.1278
  })
  const [incidents, setIncidents] = useState<any[]>([])
  const [incidentStats, setIncidentStats] = useState({
    total: 0,
    high: 0,
    open: 0,
    closed: 0,
    refusals: 0,
    ejections: 0,
    medicals: 0,
    other: 0,
    hasOpenHighPrio: false,
  })
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loadingCurrentEvent, setLoadingCurrentEvent] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Combined loading state - wait for both Dashboard and EventContext to be ready
  const isFullyReady = !loadingCurrentEvent && isEventContextReady
  
  // Debug logging to track event type in Dashboard
  console.log('🔍 Dashboard: Event type state', {
    eventType,
    eventLoading,
    loadingCurrentEvent,
    isEventContextReady,
    isFullyReady,
    currentEvent: currentEvent?.event_name
  })
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('en-GB'));
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  
  // Accessibility: Screen reader announcements
  const { announce } = useScreenReader({ politeness: 'polite' });

  // Handle event parameter from URL (for invite links)
  useEffect(() => {
    const eventId = searchParams?.get('event');
    if (eventId && eventId !== currentEventId) {
      console.log('Dashboard - Event ID from URL:', eventId);
      // Set the event ID and fetch the event details
      setCurrentEventId(eventId);
      fetchEventById(eventId);
    }
  }, [searchParams, currentEventId]);

  // Fetch event by ID (for invite links)
  const fetchEventById = async (eventId: string) => {
    try {
      console.log('Dashboard - Fetching event by ID:', eventId);
      setLoadingCurrentEvent(true);
      
      const { data: event, error } = await supabase
        .from<Database['public']['Tables']['events']['Row'], Database['public']['Tables']['events']['Update']>('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) {
        console.error('Dashboard - Error fetching event by ID:', error);
        setLoadingCurrentEvent(false);
        return;
      }

      if (event) {
        console.log('Dashboard - Event found:', event);
        setCurrentEvent(event);
        setHasCurrentEvent(true);
        
        // Fetch coordinates if venue address exists
        if (event.venue_address) {
          try {
            const coords = await geocodeAddress(event.venue_address);
            setCoordinates(coords);
          } catch (err) {
            console.error('Dashboard - Error geocoding venue address:', err);
          }
        }
        
        setLoadingCurrentEvent(false);
      } else {
        console.log('Dashboard - No event found with ID:', eventId);
        setLoadingCurrentEvent(false);
      }
    } catch (err) {
      console.error('Dashboard - Error in fetchEventById:', err);
      setLoadingCurrentEvent(false);
    }
  };

  // Accessibility: Global keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'n',
        description: 'Create new incident',
        action: () => {
          if (!isIncidentModalOpen) {
            setIsIncidentModalOpen(true)
            announce('Opening new incident form')
          }
        },
        disabled: !hasCurrentEvent
      },
      {
        key: '/',
        description: 'Focus search',
        action: () => {
          const searchInput = document.getElementById('search-input') as HTMLInputElement
          if (searchInput) {
            searchInput.focus()
            announce('Search focused')
          }
        }
      },
      {
        key: 'Escape',
        description: 'Close modal',
        action: () => {
          if (isIncidentModalOpen) {
            setIsIncidentModalOpen(false)
            announce('Incident form closed')
          } else if (isEventModalOpen) {
            setIsEventModalOpen(false)
            announce('Event form closed')
          } else if (showKeyboardShortcuts) {
            setShowKeyboardShortcuts(false)
            announce('Keyboard shortcuts closed')
          }
        }
      },
      {
        key: '?',
        shift: true,
        description: 'Show keyboard shortcuts',
        action: () => {
          setShowKeyboardShortcuts(!showKeyboardShortcuts)
          announce(showKeyboardShortcuts ? 'Keyboard shortcuts closed' : 'Keyboard shortcuts opened')
        }
      },
      {
        key: 'f',
        description: 'Toggle filters',
        action: () => {
          // This will be handled by IncidentTable's filter toggle
          announce('Filters toggled')
        }
      }
    ],
    enabled: true,
    preventDefault: true
  });
  const [timeSinceLastIncident, setTimeSinceLastIncident] = useState<string>('');
  const [eventTimings, setEventTimings] = useState<EventTiming[]>([]);
  const [countdown, setCountdown] = useState<string>('');
  const [nextEvent, setNextEvent] = useState<EventTiming | null>(null);
  const [previousEvent, setPreviousEvent] = useState<EventTiming | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOccupancyModalOpen, setIsOccupancyModalOpen] = useState(false);
  const [attendanceTimeline, setAttendanceTimeline] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentSlot, setCurrentSlot] = useState<EventTiming | null>(null);
  const [nextSlot, setNextSlot] = useState<EventTiming | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'board' | 'staff'>('table');
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
  
  // Staff availability hook
  const { stats: staffStats } = useStaffAvailability(currentEventId || '', 50);
  
  // Calculate urgent incidents count
  const urgentIncidentsCount = incidents.filter(incident => 
    incident.priority === 'urgent' && 
    incident.status !== 'closed' && 
    (!incident.assigned_staff_ids || incident.assigned_staff_ids.length === 0)
  ).length;
  
  // Toast notifications
  const { messages, addToast, removeToast } = useToast();

  // Add a state for showing the event creation modal if not already present
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  // Event types to cycle through
  const eventTypes = EVENT_TYPES;
  const [eventTypeIndex, setEventTypeIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setEventTypeIndex((i) => (i + 1) % EVENT_TYPES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleIncidentsLoaded = useCallback((data: any[]) => {
    const list = Array.isArray(data) ? data : []
    setIncidents(list)

    const summary = list.reduce(
      (acc: { open: number; in_progress: number; closed: number }, incident: any) => {
        const status = String(incident?.status ?? '').toLowerCase()
        const incidentType = String(incident?.incident_type ?? '').toLowerCase()
        
        // Skip Attendance incidents from status counting - they only count in total
        if (incidentType === 'attendance') {
          return acc
        }
        
        const isClosed = Boolean(incident?.is_closed) || status === 'closed' || status === 'resolved'
        const isInProgress = status === 'in_progress' || status === 'in progress'

        if (isClosed) {
          acc.closed += 1
        } else if (isInProgress) {
          acc.in_progress += 1
        } else {
          acc.open += 1
        }

        return acc
      },
      { open: 0, in_progress: 0, closed: 0 }
    )

    updateCounts(summary)
  }, [updateCounts])

  const handleSummaryFilter = useCallback((status: SummaryStatus | null) => {
    setFilters((prev) => {
      if (!status) {
        return { ...prev, statuses: [], priorities: [], types: [] }
      }

      const statusFilters = (() => {
        switch (status) {
          case 'open':
            return ['open', 'Open']
          case 'in_progress':
            return ['in_progress', 'in progress', 'In Progress']
          case 'closed':
            return ['closed', 'Closed', 'resolved', 'Resolved']
          default:
            return [status]
        }
      })()

      return {
        ...prev,
        statuses: statusFilters,
        priorities: [],
        types: [],
      }
    })
  }, [])

  const fetchCurrentEvent = useCallback(async () => {
    console.log('Fetching current event...');
    setIsRefreshing(true);
    setLoadingCurrentEvent(true);
    setCurrentEvent(null);
    
    try {
      // SECURITY: Always fetch with company_id filter for proper data isolation
      if (!companyId) {
        console.error('No company_id available - cannot fetch events');
        setError('User not associated with any company');
        setLoadingCurrentEvent(false);
        setIsRefreshing(false);
        return;
      }

      const { data, error } = await supabase
        .from<Database['public']['Tables']['events']['Row'], Database['public']['Tables']['events']['Update']>('events')
        .select('*, event_name, venue_name, event_type, event_description, support_acts')
        .eq('is_current', true)
        .eq('company_id', companyId)
        .single();

      if (data) {
        data.venue_name = data.venue_name
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        setCurrentEvent(data);
        setHasCurrentEvent(true);
        setCurrentEventId(data.id);
        if (data.venue_address) {
          try {
            const coords = await geocodeAddress(data.venue_address);
            setCoordinates(coords);
          } catch (error) {
            logger.error('Error geocoding address', error, { 
              component: 'Dashboard', 
              action: 'geocodeAddress',
              venueAddress: data.venue_address 
            });
            // Don't set error state for geocoding failures, just log them
          }
        } else {
          setHasCurrentEvent(false);
          setCurrentEventId(null);
        }
      } else {
        console.log('No event found for company_id:', companyId);
        setHasCurrentEvent(false);
        setCurrentEventId(null);
      }
    } catch (err) {
      logger.error('Unexpected error in fetchCurrentEvent', err, { 
        component: 'Dashboard', 
        action: 'fetchCurrentEvent',
        companyId 
      });
      setError('An unexpected error occurred');
    } finally {
      setLoadingCurrentEvent(false);
      setIsRefreshing(false);
    }
  }, [companyId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-GB'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate time since last incident and update recent incidents
  useEffect(() => {
    if (incidents && incidents.length > 0) {
      // Get the most recent incident - filter out non-countable incidents first, then get most recent
      const countableIncidents = incidents.filter(inc => !['Attendance', 'Sit Rep'].includes(inc.incident_type));
      if (countableIncidents.length === 0) {
        setTimeSinceLastIncident('No incidents');
        return;
      }
      
      // Sort by timestamp descending to get most recent (in case array isn't pre-sorted)
      const sortedIncidents = [...countableIncidents].sort((a, b) => {
        const timeA = new Date(a.timestamp || a.time_logged || a.created_at || 0).getTime();
        const timeB = new Date(b.timestamp || b.time_logged || b.created_at || 0).getTime();
        return timeB - timeA; // Descending order
      });
      
      const mostRecentIncident = sortedIncidents[0];
      // Try multiple timestamp fields to find the most recent valid one
      const lastIncidentTime = new Date(
        mostRecentIncident.timestamp || 
        mostRecentIncident.time_logged || 
        mostRecentIncident.time_of_occurrence || 
        mostRecentIncident.created_at || 
        Date.now()
      );
      const now = new Date();
      const timeDiff = now.getTime() - lastIncidentTime.getTime();
      
      // If timeDiff is negative or suspiciously large (> 1 year), the timestamp might be wrong
      if (timeDiff < 0 || timeDiff > 365 * 24 * 60 * 60 * 1000) {
        console.warn('Suspicious time difference for last incident:', { timeDiff, lastIncidentTime, mostRecentIncident });
        setTimeSinceLastIncident('Unknown');
        return;
      }
      
      // Calculate time since last incident
      const minutes = Math.floor(timeDiff / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      let timeString = '';
      if (days > 0) {
        timeString = `${days}d ${hours % 24}h ${minutes % 60}m`;
      } else if (hours > 0) {
        timeString = `${hours}h ${minutes % 60}m`;
      } else if (minutes > 0) {
        timeString = `${minutes}m`;
      } else {
        timeString = 'Just now';
      }
      
      setTimeSinceLastIncident(timeString);
      
      // Update recent incidents (last 3, excluding Attendance and Sit Rep) - use already sorted incidents
      const recentFiltered = sortedIncidents.slice(0, 3);
      setRecentIncidents(recentFiltered);
      
      // Dispatch incident summary to BottomNav - reuse countableIncidents already defined above
      const openIncidents = countableIncidents.filter(inc => !inc.is_closed).length;
      const totalIncidents = countableIncidents.length;
      const mostRecent = countableIncidents[0];
      const recentType = mostRecent ? mostRecent.incident_type : '';

      const summary = totalIncidents === 0
        ? 'No incidents'
        : openIncidents === 0
          ? `${totalIncidents} total incidents • All closed`
          : openIncidents === totalIncidents
            ? `${totalIncidents} open incidents • Latest: ${recentType}`
            : `${openIncidents} open / ${totalIncidents} total • Latest: ${recentType}`;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('updateIncidentSummary', { detail: summary }));
      }
      
      // Dispatch recent incidents for scrolling ticker
      const recentForTicker = incidents.filter(inc => !['Attendance', 'Sit Rep'].includes(inc.incident_type)).slice(0, 5).reverse(); // Get 5 most recent and reverse for logical order (oldest first)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('updateRecentIncidents', { detail: recentForTicker }));
      }
    } else {
      setTimeSinceLastIncident('No incidents');
      setRecentIncidents([]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('updateIncidentSummary', { detail: 'No incidents' }));
        window.dispatchEvent(new CustomEvent('updateRecentIncidents', { detail: [] }));
      }
    }
  }, [incidents]);

  useEffect(() => {
    if (nextEvent) {
      const calculateCountdown = () => {
        const now = new Date();
        const [hours, minutes] = nextEvent.time.split(':').map(Number);
        const eventTime = new Date(now);
        eventTime.setHours(hours, minutes, 0);
        if (eventTime < now) {
          eventTime.setDate(eventTime.getDate() + 1);
        }
        const diff = eventTime.getTime() - now.getTime();
        const hours_remaining = Math.floor(diff / (1000 * 60 * 60));
        const minutes_remaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds_remaining = Math.floor((diff % (1000 * 60)) / 1000);
        return `${hours_remaining}h ${minutes_remaining}m ${seconds_remaining}s`;
      };
      const countdownTimer = setInterval(() => setCountdown(calculateCountdown()), 1000);
      setCountdown(calculateCountdown());
      return () => clearInterval(countdownTimer);
    }
  }, [nextEvent]);

  useEffect(() => {
    const fetchEventTimings = async () => {
      setIsRefreshing(true);
      
      // SECURITY: Always fetch with company_id filter for proper data isolation
      if (!companyId) {
        console.error('No company_id available - cannot fetch event timings');
        setIsRefreshing(false);
        return;
      }

      console.log('Fetching event timings with company_id filter:', companyId);
      const { data: event, error } = await supabase
        .from<Database['public']['Tables']['events']['Row'], Database['public']['Tables']['events']['Update']>('events')
        .select('security_call_time, main_act_start_time, show_down_time, show_stop_meeting_time, doors_open_time, curfew_time, event_name, support_acts')
        .eq('is_current', true)
        .eq('company_id', companyId)
        .single();
      
      console.log('Event timings fetch result (with company_id filter):', { event, error });
      if (event) {
        const now = new Date();
        const currentTimeNumber = now.getHours() * 60 + now.getMinutes();
        let supportActs = [];
        if (event.support_acts) {
          try {
            supportActs = typeof event.support_acts === 'string' ? JSON.parse(event.support_acts) : event.support_acts;
          } catch (e) { console.error('Error parsing support acts:', e); supportActs = []; }
        }
        const showDownLabel = (eventType === 'football') ? 'Full Time' : 'Show Down'
        
        // For football events, strip the date from the event name for the schedule
        const eventNameForSchedule = eventType === 'football' 
          ? event.event_name.replace(/\s*-\s*\d{2}\/\d{2}\/\d{4}$/, '') // Remove " - DD/MM/YYYY" from end
          : event.event_name;
        
        const timings: EventTiming[] = [
          { title: eventType === 'football' ? 'Stewarding Call' : 'Security Call', time: event.security_call_time },
          { title: 'Show Stop Meeting', time: event.show_stop_meeting_time },
          { title: eventType === 'football' ? 'Turnstiles Open' : 'Doors Open', time: event.doors_open_time },
          ...supportActs.map((act: { act_name: string; start_time: string }) => ({ title: act.act_name, time: act.start_time })),
          { title: eventNameForSchedule, time: event.main_act_start_time },
          { title: showDownLabel, time: event.show_down_time },
          { title: 'Curfew', time: event.curfew_time }
        ].filter(timing => timing.time);
        const timingsWithMinutes = timings.map(timing => {
          const [hours, minutes] = timing.time.split(':').map(Number);
          return { ...timing, minutesSinceMidnight: hours * 60 + minutes };
        });
        // Find current and next slot
        const sortedTimings = timingsWithMinutes.sort((a, b) => a.minutesSinceMidnight - b.minutesSinceMidnight);
        // Find the minutesSinceMidnight for end-of-event (Show Down or Full Time)
        const showDownTiming = sortedTimings.find(t => t.title.toLowerCase().includes((showDownLabel || '').toLowerCase()));
        const showDownMinutes = showDownTiming ? showDownTiming.minutesSinceMidnight : null;
        // Filter out 'stand down', 'curfew', and 'show down' from timings for Happening Now
        const filteredTimings = sortedTimings.filter(t => {
          const title = t.title.toLowerCase();
          return !title.includes('stand down') && !title.includes('curfew') && !title.includes((showDownLabel || '').toLowerCase());
        });
        let current = null, next = null;
        for (let i = 0; i < filteredTimings.length; i++) {
          if (filteredTimings[i].minutesSinceMidnight > currentTimeNumber) {
            next = filteredTimings[i];
            current = i > 0 ? filteredTimings[i - 1] : filteredTimings[0];
            break;
          }
        }
        // If no next, last event is current
        if (!next && filteredTimings.length > 0) {
          current = filteredTimings[filteredTimings.length - 1];
        }
        
        // Determine if current event is actually happening now
        let isActuallyHappeningNow = false;
        if (current) {
          const eventTime = current.minutesSinceMidnight;
          const timeWindow = 30; // 30 minutes window before and after event time
          isActuallyHappeningNow = Math.abs(currentTimeNumber - eventTime) <= timeWindow;
        }
        
        // If current time is after or at Show Down, do not show any previous timings as Happening Now
        if (showDownMinutes !== null && currentTimeNumber >= showDownMinutes) {
          setCurrentSlot(null);
        } else {
          setCurrentSlot(current ? { 
            title: current.title, 
            time: current.time,
            isActuallyHappeningNow 
          } : null);
        }
        setNextSlot(next ? { title: next.title, time: next.time } : null);
        // For desktop, keep nextFiveTimings as before
        const futureTimings = sortedTimings.filter(t => t.minutesSinceMidnight > currentTimeNumber);
        const nextFiveTimings = futureTimings.slice(0, 5).map((t, i) => ({ ...t, isNext: i === 0 }));
        setEventTimings(nextFiveTimings);
      }
      setIsRefreshing(false);
    };
    fetchEventTimings();
    const refreshTimer = setInterval(fetchEventTimings, 60000);
    return () => clearInterval(refreshTimer);
  }, [companyId, eventType]);

  useEffect(() => {
    const fetchCompanyId = async () => {
      if (!user) {
        console.log('Dashboard: No user available yet');
        return;
      }
      console.log('Dashboard: Fetching company ID for user:', user.id, 'email:', user.email);
      
      // First, check if profile exists
      let { data: profile, error: profileError } = await supabase
        .from<Database['public']['Tables']['profiles']['Row'], Database['public']['Tables']['profiles']['Update']>('profiles')
        .select('company_id, role, company')
        .eq('id', user.id)
        .single();
      
      console.log('Dashboard: Profile fetch result:', { 
        profile, 
        profileError: profileError ? {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        } : null,
        userId: user.id,
        userEmail: user.email
      });
      
      // If profile doesn't exist, create it
      if (profileError && profileError.code === 'PGRST116') {
        console.log('Profile does not exist, creating one...');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            company: user.user_metadata?.company || 'Default Company',
            role: 'user',
          })
          .select('company_id, role, company')
          .single();
        
        if (createError) {
          console.error('Error creating profile:', createError);
          setError('Failed to create your profile. Please contact support.');
          return;
        }
        
        profile = newProfile;
        profileError = null;
      }
      
      // Handle profile fetch errors (other than "not found")
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Dashboard: Profile fetch error:', profileError);
        setError(`Failed to load your profile: ${profileError.message || 'Unknown error'}`);
        return;
      }
      
      // If profile exists but no company_id, try to find or create a company
      if (profile && !profile.company_id) {
        console.log('Dashboard: Profile exists but no company_id, attempting to resolve...');
        
        // Try to find a company by the profile's company name
        if (profile.company) {
          const { data: existingCompany, error: companySearchError } = await supabase
            .from('companies')
            .select('id')
            .eq('name', profile.company)
            .single();
          
          console.log('Dashboard: Company search result:', { existingCompany, companySearchError });
          
          if (existingCompany) {
            // Update profile with found company_id
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ company_id: existingCompany.id })
              .eq('id', user.id);
            
            if (!updateError) {
              console.log('Dashboard: Found and linked existing company:', existingCompany.id);
              setCompanyId(existingCompany.id);
              setUserRole(profile?.role || null);
              return;
            } else {
              console.error('Dashboard: Error updating profile with company_id:', updateError);
            }
          }
        }
        
        // Create a default company for the user via API route
        console.log('Dashboard: Creating default company for user via API...');
        try {
          const response = await fetch('/api/ensure-company', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Dashboard: Error creating company:', errorData);
            setError('Could not create a company for your account. Please contact support.');
            return;
          }
          
          const { company_id } = await response.json();
          
          if (!company_id) {
            console.error('Dashboard: No company_id returned from API');
            setError('Could not create a company for your account. Please contact support.');
            return;
          }
          
          console.log('Dashboard: Created and linked new company:', company_id);
          setCompanyId(company_id);
          setUserRole(profile?.role || null);
          return;
        } catch (fetchError) {
          console.error('Dashboard: Fetch error when creating company:', fetchError);
          setError('Network error while creating company. Please try again.');
          return;
        }
      }
      
      // Profile exists and has company_id
      if (profile?.company_id) {
        console.log('Dashboard: Setting company ID:', profile.company_id);
        setCompanyId(profile.company_id);
        setUserRole(profile.role || null);
      } else {
        console.error('Dashboard: Profile exists but company_id is null/undefined');
        setError('Your profile is missing a company association. Please contact support.');
      }
    };
    fetchCompanyId();
  }, [user]);

  useEffect(() => {
    if (companyId) {
      fetchCurrentEvent();
    }
  }, [companyId, fetchCurrentEvent]);

  // This effect will run when the incident data is passed up from the table
  useEffect(() => {
    if (incidents) {
      // Debug logging removed - too verbose, causing console spam
      // logger.debug('Sample incidents data', { 
      //   component: 'Dashboard', 
      //   action: 'incidentDataEffect',
      //   sampleIncidents: incidents.slice(0, 3).map(inc => ({
      //     id: inc.id,
      //     log_number: inc.log_number,
      //     incident_type: inc.incident_type,
      //     is_closed: inc.is_closed,
      //     status: inc.status,
      //     occurrence: inc.occurrence?.substring(0, 50) + '...'
      //   }))
      // });
      
      // Always use unfiltered incidents for stats - StatCards should show total counts
      const isCountable = (incident: any) => {
        // Exclude match flow logs from statistics
        if (incident.type === 'match_log') {
          return false
        }
        return !['Attendance', 'Sit Rep'].includes(incident.incident_type);
      }

      const countableIncidents = incidents.filter(isCountable);
      
      const highPriorityIncidentTypes = [
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
      const highPriorityIncidents = countableIncidents.filter(i => highPriorityIncidentTypes.includes(i.incident_type));
      
      const total = incidents.length; // Include all incidents (including Attendance) in total
      const high = highPriorityIncidents.length;
      const hasOpenHighPrio = highPriorityIncidents.some(i => !i.is_closed);
      const open = countableIncidents.filter(i => !i.is_closed).length;
      const closed = countableIncidents.filter(i => i.is_closed).length;
      const refusals = countableIncidents.filter(i => i.incident_type === 'Refusal').length;
      const ejections = countableIncidents.filter(i => i.incident_type === 'Ejection').length;
      const medicals = countableIncidents.filter(i => i.incident_type === 'Medical').length;
      const other = countableIncidents.filter(i => !['Refusal', 'Ejection', 'Medical'].includes(i.incident_type)).length;
      
      // Debug: Log the stats calculations
      logger.debug('Stats calculations', {
        total,
        closed,
        open,
        closedIncidents: countableIncidents.filter(i => i.is_closed).map(inc => ({
          id: inc.id,
          log_number: inc.log_number,
          is_closed: inc.is_closed,
          status: inc.status
        }))
      });
      
      setIncidentStats({
        total,
        high,
        open,
        closed,
        refusals,
        ejections,
        medicals,
        other,
        hasOpenHighPrio,
      });
    }
  }, [incidents]);

  const handleIncidentCreated = async () => {
    setIsIncidentModalOpen(false);
    // Force refresh as fallback - real-time subscription should handle it, but this ensures it appears
    // Use a small delay to allow the database insert to complete
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 500);
  };

  // Helper function to reset to Total view (no filters)
  const resetToTotal = () => {
    setFilters({ types: [], statuses: [], priorities: [], query: '' });
  };

  // Fetch attendance timeline when modal opens
  useEffect(() => {
    if (isOccupancyModalOpen && currentEventId) {
      (async () => {
        const { data, error } = await supabase
          .from<Database['public']['Tables']['attendance_records']['Row'], Database['public']['Tables']['attendance_records']['Update']>('attendance_records')
          .select('count, timestamp')
          .eq('event_id', currentEventId)
          .order('timestamp', { ascending: true });
        if (!error && data) setAttendanceTimeline(data);
      })();
    }
  }, [isOccupancyModalOpen, currentEventId]);

  // Special handling for david@incommand.uk - redirect to admin instead of showing event creation
  if (!currentEvent && user?.email === 'david@incommand.uk') {
    // Redirect to admin page for superadmin
    window.location.href = '/admin';
    return null;
  }

  // Splash screen if no current event
  if (!currentEvent) {
    return <NoEventSplash onEventCreated={fetchCurrentEvent} />;
  }

  return (
    <>
      {/* Desktop view - Bento Layout */}
      <section className="hidden md:block rounded-2xl p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* CurrentEvent - Large card, spans 4 columns */}
          <div className="flex flex-col h-full lg:col-span-4">
            <CurrentEvent
              currentTime={currentTime}
              currentEvent={currentEvent}
              loading={loadingCurrentEvent}
              error={error}
              onEventCreated={fetchCurrentEvent}
              eventTimings={eventTimings}
            />
          </div>

          {/* TimeCard - Medium card, spans 4 columns */}
          <div className="flex flex-col h-full lg:col-span-4">
            {loadingCurrentEvent ? (
              <TimeCardSkeleton />
            ) : (
              <TimeCard
                companyId={companyId}
                currentTime={currentTime}
                eventTimings={eventTimings}
                nextEvent={nextEvent}
                countdown={countdown}
                currentSlot={currentSlot}
                timeSinceLastIncident={timeSinceLastIncident}
              />
            )}
          </div>

          {/* ReadinessIndexCard - Medium card, spans 2 columns */}
          <div className="flex flex-col h-full lg:col-span-2">
            <ReadinessIndexCard eventId={currentEventId} className="h-full" />
          </div>

          {/* IncidentSummaryBar - Medium card, spans 2 columns */}
          <div className="flex flex-col h-full lg:col-span-2">
            <IncidentSummaryBar
              onFilter={handleSummaryFilter}
              activeStatus={activeSummaryStatus}
              className="h-full"
            />
          </div>
        </div>
      </section>
      
      <FeatureGate feature="event-dashboard" plan={userPlan} showUpgradeModal={true}>
        <PageWrapper>
          {/* Accessibility: Skip Links */}
          <SkipLinks />
        
        {/* Accessibility: Keyboard Shortcuts Help */}
        <KeyboardShortcutsHelp 
          isOpen={showKeyboardShortcuts} 
          onClose={() => setShowKeyboardShortcuts(false)} 
        />
        
        {/* Event Header - Sticky */}
        <div>
          {/* Mobile view */}
          <div className="md:hidden bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 transition-colors duration-300 -mt-2">
          {!isFullyReady && <p className="p-3">Loading event...</p>}
          {isFullyReady && currentEvent && (
            <div>
              <div className="flex justify-between items-center p-3">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 mr-2">Event</span>
                  <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {eventType === 'football' 
                      ? currentEvent.event_name.replace(/\s*-\s*\d{2}\/\d{2}\/\d{4}$/, '') // Remove " - DD/MM/YYYY" from end
                      : currentEvent.event_name
                    }
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-gray-900 dark:text-gray-100">{currentTime}</span>
                  <div className="text-xs text-orange-600 dark:text-orange-300 font-medium">
                    Last incident: {timeSinceLastIncident}
                  </div>
                </div>
              </div>
              <hr className="border-t border-gray-200" />
              {(currentSlot || nextSlot) ? (
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-b-lg">
                  {currentSlot ? (
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-200">
                        {currentSlot.isActuallyHappeningNow ? 'Happening Now' : 'Happening Next'}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentSlot.title}</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-100">{currentSlot.time}</span>
                    </div>
                  ) : <div />}
                  {nextSlot ? (
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-200">Up Next</span>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-100">{nextSlot.title}</span>
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-100">{nextSlot.time}</span>
                    </div>
                  ) : <div />}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center p-3">No timings available</p>
              )}
            </div>
          )}
          {isFullyReady && !currentEvent && (
            <div className="text-center py-4">
               <h3 className="text-sm font-medium text-gray-900">
                No Current Event
              </h3>
              <p className="text-sm text-gray-500">
                No event is currently selected. Create a new event to get started.
              </p>
            </div>
          )}
        </div>
      </div>

{/* Incident Dashboard */}
<div className="mb-3 rounded-2xl bg-gray-100/60 dark:bg-[#1a1f3d]/50 p-6 border border-gray-100 dark:border-gray-800">
  {/* Header */}
  <div className="mb-3 flex flex-col gap-3">
    <div>
      <h2
        className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
        data-tour="dashboard"
      >
        <span className="h-6 w-1.5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
        Incident Dashboard
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Track and manage security incidents in real time.
      </p>
    </div>
  </div>

  {/* Live Status + Alerts */}
  {currentEvent && (
    <div className="mt-3 flex flex-col gap-4 lg:flex-row">
      <div className="flex-1">
        <RealtimeStatusIndicator
          isConnected={realtimeAnalytics.isConnected}
          error={realtimeAnalytics.error}
          lastUpdated={realtimeAnalytics.data.lastUpdated}
          updateCount={realtimeAnalytics.data.updateCount}
          onRefresh={realtimeAnalytics.refresh}
        />
      </div>
      <div className="lg:w-96">
        <RealtimeAlertBanner
          alerts={realtimeAnalytics.alerts}
          onDismiss={realtimeAnalytics.dismissAlert}
          onClearAll={realtimeAnalytics.clearAlerts}
        />
      </div>
    </div>
  )}

  {/* Radio Alerts Widget */}
  {currentEvent && (
    <div className="mt-3">
      <RadioAlertsWidget eventId={currentEvent.id} />
    </div>
  )}

  {/* Dashboard Sections */}
  <div className="mt-3 space-y-3">
    {/* Mobile-only Venue Occupancy */}
    <div className="block md:hidden">
      <div className="mb-4">
        {!isFullyReady ? (
          <CardSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`card-depth flex w-full flex-col items-center justify-center ${eventType === 'football' ? 'h-[200px] cursor-default' : 'h-[130px] cursor-pointer'}`}
            onClick={eventType === 'football' ? undefined : () => setIsOccupancyModalOpen(true)}
          >
            {eventType === 'football' ? (
              <FootballCard_LiveScore className="h-full w-full" />
            ) : (
              <VenueOccupancy currentEventId={currentEventId} />
            )}
          </motion.div>
        )}
      </div>
    </div>
    {/* Operational Metrics */}
    <section className="hidden md:block rounded-2xl bg-gray-100/70 p-3 text-gray-900 transition-colors dark:bg-[#1a1f3d]/60 dark:text-white sm:p-4">
      <div className="sticky top-16 z-10 -mx-4 -mt-4 px-4 pt-4 pb-2 backdrop-blur-md bg-white/70 dark:bg-[#101426]/60 sm:-mx-5 sm:px-5 sm:pt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Operational Metrics
        </h3>
      </div>

      {/* Stat Grid */}
      <div className="hidden md:block pt-3 pb-4">
        <div className="mx-auto grid grid-cols-1 gap-px rounded-xl bg-border sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 items-stretch">
          {!isFullyReady ? (
            Array.from({ length: 8 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))
          ) : (
            <>
              <StatCard
                title="High Priority"
                value={incidentStats.high}
                icon={<ExclamationTriangleIcon className="h-4 w-4 text-red-400" />}
                isSelected={safeFilters.types.some(type =>
                  ['Ejection', 'Code Green', 'Code Black', 'Code Pink', 'Aggressive Behaviour', 'Missing Child/Person', 'Hostile Act', 'Counter-Terror Alert', 'Fire Alarm', 'Evacuation', 'Medical', 'Suspicious Behaviour', 'Queue Build-Up'].includes(type)
                )}
                onClick={() =>
                  setFilters(prev => ({
                    ...prev,
                    types: [
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
                      'Queue Build-Up',
                    ],
                    statuses: [],
                    priorities: [],
                  }))
                }
                isFilterable
                color="red"
                tooltip="High priority incident types including Medical, Ejection, Code alerts, etc."
                showPulse={incidentStats.hasOpenHighPrio}
                index={0}
                isFirst={true}
              />
              <StatCard
                title="Medicals"
                value={incidentStats.medicals}
                icon={<HeartIcon className="h-4 w-4 text-red-400" />}
                isSelected={safeFilters.types.includes('Medical')}
                onClick={() =>
                  setFilters(prev => ({
                    ...prev,
                    types: prev.types.includes('Medical')
                      ? prev.types.filter(t => t !== 'Medical')
                      : ['Medical'],
                  }))
                }
                isFilterable
                tooltip="Medical-related incidents."
                index={1}
              />
              <StatCard
                title="Open"
                value={incidentStats.open}
                icon={<FolderOpenIcon className="h-4 w-4 text-yellow-400" />}
                isSelected={safeFilters.statuses.includes('open')}
                onClick={() =>
                  setFilters(prev => ({
                    ...prev,
                    statuses: prev.statuses.includes('open')
                      ? prev.statuses.filter(s => s !== 'open')
                      : ['open'],
                    types: [],
                    priorities: [],
                  }))
                }
                isFilterable
                color="yellow"
                tooltip="Incidents that are currently open (is_closed = false)."
                index={2}
              />
              <StatCard
                title="Ejections"
                value={incidentStats.ejections}
                icon={<UsersIcon className="h-4 w-4 text-gray-400" />}
                isSelected={safeFilters.types.includes('Ejection')}
                onClick={() =>
                  setFilters(prev => ({
                    ...prev,
                    types: prev.types.includes('Ejection')
                      ? prev.types.filter(t => t !== 'Ejection')
                      : ['Ejection'],
                  }))
                }
                isFilterable
                tooltip="Incidents where someone was ejected."
                index={3}
              />
              <StatCard
                title="Refusals"
                value={incidentStats.refusals}
                icon={<UserGroupIcon className="h-4 w-4 text-gray-400" />}
                isSelected={safeFilters.types.includes('Refusal')}
                onClick={() =>
                  setFilters(prev => ({
                    ...prev,
                    types: prev.types.includes('Refusal')
                      ? prev.types.filter(t => t !== 'Refusal')
                      : ['Refusal'],
                  }))
                }
                isFilterable
                tooltip="Incidents where entry was refused."
                index={4}
              />
              <StatCard
                title="Total"
                value={incidentStats.total}
                icon={<ExclamationTriangleIcon className="h-4 w-4 text-gray-400" />}
                isSelected={
                  safeFilters.types.length + safeFilters.statuses.length + safeFilters.priorities.length === 0
                }
                onClick={resetToTotal}
                isFilterable
                tooltip="All incidents (excluding Attendance and Sit Reps)."
                index={5}
              />
              <StatCard
                title="Closed"
                value={incidentStats.closed}
                icon={<CheckCircleIcon className="h-4 w-4 text-green-400" />}
                isSelected={safeFilters.statuses.includes('closed')}
                onClick={() =>
                  setFilters(prev => ({
                    ...prev,
                    statuses: prev.statuses.includes('closed')
                      ? prev.statuses.filter(s => s !== 'closed')
                      : ['closed'],
                    types: [],
                    priorities: [],
                  }))
                }
                isFilterable
                color="green"
                tooltip="Incidents that have been closed (is_closed = true)."
                index={6}
              />
              <StatCard
                title="Other"
                value={incidentStats.other}
                icon={<QuestionMarkCircleIcon className="h-4 w-4 text-gray-400" />}
                isSelected={
                  safeFilters.types.length > 0 &&
                  !['Refusal', 'Ejection', 'Medical'].some(t => safeFilters.types.includes(t))
                }
                onClick={() => setFilters(prev => ({ ...prev, types: [] }))}
                isFilterable
                tooltip="All other incident types."
                index={7}
                isLast={true}
              />
            </>
          )}
        </div>
      </div>

      {currentEvent && (
        <div className="hidden md:block" data-tour="analytics">
          <AnalyticsKPICards eventId={currentEvent.id} className="mt-1.5 mb-1" />
        </div>
      )}
    </section>

    {/* Divider */}
    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-200/60 to-transparent dark:via-gray-700/40" />

    {/* Support Tools */}
    <section className="hidden md:block rounded-2xl bg-gray-100/70 p-3 text-gray-900 transition-colors dark:bg-[#1a1f3d]/60 dark:text-white sm:p-4">
      <div className="sticky top-16 z-10 -mx-4 -mt-4 px-4 pt-4 pb-2 backdrop-blur-md bg-white/70 dark:bg-[#101426]/60 sm:-mx-5 sm:px-5 sm:pt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Support Tools
        </h3>
      </div>

      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-200/60 to-transparent dark:via-gray-700/40 mb-2" />

      <div>

        {/* Desktop Grid - Event-Specific Dashboard */}
        <div className={`hidden md:grid grid-cols-2 gap-4 pt-2 ${eventType === 'concert' ? 'lg:grid-cols-4' : 'lg:grid-cols-4 xl:grid-cols-6'}`}>
          {!isFullyReady ? (
            Array.from({ length: eventType === 'concert' ? 4 : 5 }).map((_, index) => <CardSkeleton key={index} />)
          ) : eventType === 'concert' ? (
            /* 
              ⚠️  CONCERT DASHBOARD - PERMANENTLY LOCKED ⚠️
              This is the original concert dashboard layout that must remain unchanged.
              Concert events will ALWAYS use these exact 4 cards in this exact order.
            */
            <>
              {/* Card 1: VenueOccupancy - Clickable, opens modal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="col-span-1 h-[130px] cursor-pointer transition-all duration-300 hover:shadow-lg"
                onClick={() => setIsOccupancyModalOpen(true)}
              >
                <Card className="card-depth h-full shadow-sm dark:shadow-md hover:shadow-md transition-all duration-150">
                  <CardContent className="flex h-full flex-col items-center justify-center p-4">
                    <VenueOccupancy currentEventId={currentEventId} />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Card 2: WeatherCard - Always show, use placeholder if no venue_address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="col-span-1 h-[130px] transition-all duration-300 hover:shadow-lg"
              >
                {currentEvent?.venue_address ? (
                  <WeatherCard
                    lat={coordinates?.lat}
                    lon={coordinates?.lon}
                    locationName={currentEvent.venue_address}
                    eventDate={currentEvent.event_date ?? ''}
                    startTime={currentEvent.main_act_start_time ?? ''}
                    curfewTime={currentEvent.curfew_time ?? ''}
                  />
                ) : (
                  <Card className="card-depth h-full shadow-sm dark:shadow-md">
                    <CardContent className="flex h-full flex-col items-center justify-center p-4">
                      <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                        Weather data unavailable
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>

              {/* Card 3: What3WordsSearchCard - Wrapped in Card with specific props */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="col-span-1 h-[130px] cursor-pointer transition-all duration-300 hover:shadow-lg"
              >
                <Card className="card-depth h-full shadow-sm dark:shadow-md hover:shadow-md transition-all duration-150">
                  <CardContent className="flex h-full flex-col items-center justify-center p-4">
                    <What3WordsSearchCard
                      lat={coordinates.lat}
                      lon={coordinates.lon}
                      venueAddress={currentEvent?.venue_address || ''}
                      singleCard
                      largeLogo={false}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Card 4: TopIncidentTypesCard - Direct component with incident filtering */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="col-span-1 h-[130px] transition-all duration-300 hover:shadow-lg"
              >
                <TopIncidentTypesCard
                  incidents={incidents}
                  onTypeClick={(type: string) => {
                    setFilters(prev => ({ ...prev, types: type ? [type] : [] }));
                  }}
                  selectedType={safeFilters.types[0] || null}
                />
              </motion.div>
            </>
          ) : (
            /* Other Event Types - Dynamic Cards */
            <>
              {/* Football Event Cards */}
              {eventType === 'football' && (
                <>
                  <div className="col-span-full">
                    <SupportToolsFootball />
                  </div>
                  
                </>
              )}

              {/* Festival Event Cards */}
              {eventType === 'festival' && (
                <>
                          {/* Card 1: Multi-Stage - Match concert card style */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="col-span-1 h-[130px] transition-all duration-300 hover:shadow-lg"
                          >
                            <Card className="card-depth h-full shadow-sm dark:shadow-md hover:shadow-md transition-all duration-150">
                              <CardContent className="flex h-full flex-col items-center justify-center p-4">
                                <div className="text-center w-full">
                                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    0
                                  </div>
                                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Active Stages
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Multi-stage monitoring
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>

                          {/* Card 2: Crowd Flow - Match concert card style */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="col-span-1 h-[130px] transition-all duration-300 hover:shadow-lg"
                          >
                            <Card className="card-depth h-full shadow-sm dark:shadow-md hover:shadow-md transition-all duration-150">
                              <CardContent className="flex h-full flex-col items-center justify-center p-4">
                                <div className="text-center w-full">
                                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    0
                                  </div>
                                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Crowd Alerts
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Flow monitoring
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>

                          {/* Card 3: Incidents - Match concert card style */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="col-span-1 h-[130px] transition-all duration-300 hover:shadow-lg"
                          >
                            <Card className="card-depth h-full shadow-sm dark:shadow-md hover:shadow-md transition-all duration-150">
                              <CardContent className="flex h-full flex-col items-center justify-center p-4">
                                <div className="text-center w-full">
                                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    {incidentStats.open}
                                  </div>
                                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Open Incidents
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Active incidents
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>

                  {/* Card 4: Weather - Reuse exact same WeatherCard from concerts */}
                  {currentEvent?.venue_address && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <WeatherCard
                        lat={coordinates?.lat}
                        lon={coordinates?.lon}
                        locationName={currentEvent.venue_address}
                        eventDate={currentEvent.event_date ?? ''}
                        startTime={currentEvent.main_act_start_time ?? ''}
                        curfewTime={currentEvent.curfew_time ?? ''}
                      />
                    </motion.div>
                  )}
                </>
              )}

              {/* Parade Event Cards */}
              {eventType === 'parade' && (
                <>
                          {/* Card 1: Route Status - Match concert card style */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="col-span-1 h-[130px] transition-all duration-300 hover:shadow-lg"
                          >
                            <Card className="card-depth h-full shadow-sm dark:shadow-md hover:shadow-md transition-all duration-150">
                              <CardContent className="flex h-full flex-col items-center justify-center p-4">
                                <div className="text-center w-full">
                                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    0%
                                  </div>
                                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Route Progress
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Parade route status
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>

                          {/* Card 2: Public Safety - Match concert card style */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="col-span-1 h-[130px] transition-all duration-300 hover:shadow-lg"
                          >
                            <Card className="card-depth h-full shadow-sm dark:shadow-md hover:shadow-md transition-all duration-150">
                              <CardContent className="flex h-full flex-col items-center justify-center p-4">
                                <div className="text-center w-full">
                                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    0
                                  </div>
                                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Safety Incidents
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Public safety monitoring
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>

                          {/* Card 3: Crowd Flow - Match concert card style */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="col-span-1 h-[130px] transition-all duration-300 hover:shadow-lg"
                          >
                            <Card className="card-depth h-full shadow-sm dark:shadow-md hover:shadow-md transition-all duration-150">
                              <CardContent className="flex h-full flex-col items-center justify-center p-4">
                                <div className="text-center w-full">
                                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    0
                                  </div>
                                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Crowd Alerts
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Flow monitoring
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>

                  {/* Card 4: Weather - Reuse exact same WeatherCard from concerts */}
                  {currentEvent?.venue_address && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <WeatherCard
                        lat={coordinates?.lat}
                        lon={coordinates?.lon}
                        locationName={currentEvent.venue_address}
                        eventDate={currentEvent.event_date ?? ''}
                        startTime={currentEvent.main_act_start_time ?? ''}
                        curfewTime={currentEvent.curfew_time ?? ''}
                      />
                    </motion.div>
                  )}
                </>
              )}

              {/* Default/Unknown Event Type - Show Concert Cards */}
              {!['concert', 'football', 'festival', 'parade'].includes(eventType || '') && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="col-span-1 h-[130px] cursor-pointer transition-all duration-300 hover:shadow-lg"
                    onClick={() => setIsOccupancyModalOpen(true)}
                  >
                    <Card className="card-depth h-full shadow-sm dark:shadow-md hover:shadow-md transition-all duration-150">
                      <CardContent className="flex h-full flex-col items-center justify-center p-4">
                        <VenueOccupancy currentEventId={currentEventId} />
                      </CardContent>
                    </Card>
                  </motion.div>

                  {currentEvent?.venue_address && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <WeatherCard
                        lat={coordinates?.lat}
                        lon={coordinates?.lon}
                        locationName={currentEvent.venue_address}
                        eventDate={currentEvent.event_date ?? ''}
                        startTime={currentEvent.main_act_start_time ?? ''}
                        curfewTime={currentEvent.curfew_time ?? ''}
                      />
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="col-span-1 h-[130px] cursor-pointer transition-all duration-300 hover:shadow-lg"
                  >
                    <Card className="card-depth h-full shadow-sm dark:shadow-md hover:shadow-md transition-all duration-150">
                      <CardContent className="flex h-full flex-col items-center justify-center p-4">
                        <What3WordsSearchCard
                          lat={coordinates.lat}
                          lon={coordinates.lon}
                          venueAddress={currentEvent?.venue_address || ''}
                          singleCard
                          largeLogo={false}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="col-span-1 h-[130px] transition-all duration-300 hover:shadow-lg"
                  >
                    <TopIncidentTypesCard
                      incidents={incidents}
                      onTypeClick={(type: string) => {
                        setFilters(prev => ({ ...prev, types: type ? [type] : [] }));
                      }}
                      selectedType={safeFilters.types[0] || null}
                    />
                    </motion.div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  </div>
</div>


      {/* Incident Table and Staff Deployment */}
      <main 
        id="main-content" 
        className="mt-7 lg:mt-9 mb-6"
        role="main"
        aria-label="Incident logs"
        tabIndex={-1}
      >
        <Card className="rounded-2xl border border-border/60 shadow-sm bg-background dark:bg-[#101426] dark:border-[#1c2333]">
          <CardContent className="p-0">
            <IncidentTable
              key={refreshKey}
              filters={filters}
              onFiltersChange={setFilters}
              onDataLoaded={handleIncidentsLoaded}
              onToast={addToast}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              currentUser={user}
              currentEventId={currentEventId || undefined}
              currentEvent={currentEvent}
            />
          </CardContent>
        </Card>
        
        {/* Staff Deployment Overview hidden intentionally */}
      </main>

        <IncidentCreationModal
          isOpen={isIncidentModalOpen}
          onClose={() => setIsIncidentModalOpen(false)}
          onIncidentCreated={handleIncidentCreated}
          initialIncidentType={initialIncidentType}
        />

        {/* Venue Occupancy Modal */}
        <AttendanceModal isOpen={isOccupancyModalOpen} onClose={() => setIsOccupancyModalOpen(false)} currentEventId={currentEventId} />
        
        {/* Toast Notifications */}
        <Toast messages={messages} onRemove={removeToast} />

        {/* Log Review Reminder for Silver Commanders */}
        <LogReviewReminder />

        {/* Mobile FAB - New Incident (only show if there's an active event and no modals are open) */}
        {hasCurrentEvent && !showCreateEvent && !isIncidentModalOpen && (
          <div className="md:hidden fixed bottom-6 right-6 z-50" data-fab>
            <button
              onClick={() => setIsIncidentModalOpen(true)}
              className="w-12 h-12 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center touch-target"
              style={{ 
                backgroundColor: '#3b82f6',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
                background: '#3b82f6',
                opacity: '1',
                backgroundImage: 'none',
                backgroundBlendMode: 'normal',
                mixBlendMode: 'normal'
              }}
              aria-label="Create new incident"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        )}

    </PageWrapper>
    </FeatureGate>
    </>
  )
}
