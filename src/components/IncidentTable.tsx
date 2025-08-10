'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import IncidentDetailsModal from './IncidentDetailsModal'
import { RealtimeChannel } from '@supabase/supabase-js'
import { ArrowUpIcon, MapPinIcon, MagnifyingGlassIcon, XMarkIcon, ViewColumnsIcon, TableCellsIcon } from '@heroicons/react/24/outline'
import { ToastMessage } from './Toast'
import { CollaborationBoard } from './CollaborationBoard'
import { Incident } from '@/hooks/useIncidents'

const getIncidentTypeStyle = (type: string) => {
  switch(type) {
    case 'Ejection':
      return 'bg-red-100 text-red-800'
    case 'Refusal':
      return 'bg-yellow-100 text-yellow-800'
    case 'Code Green':
      return 'bg-green-100 text-green-800'
    case 'Code Purple':
      return 'bg-purple-100 text-purple-800'
    case 'Code White':
      return 'bg-gray-100 text-gray-800'
    case 'Code Black':
      return 'bg-black text-white'
    case 'Code Pink':
      return 'bg-pink-100 text-pink-800'
    case 'Attendance':
      return 'bg-gray-100 text-gray-800'
    case 'Aggressive Behaviour':
      return 'bg-orange-100 text-orange-800'
    case 'Queue Build-Up':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
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
  if (!incident.is_closed && incident.incident_type !== 'Attendance' && incident.incident_type !== 'Sit Rep') {
    return 'bg-yellow-50 hover:bg-yellow-100';
  }
  return 'hover:bg-gray-50';
};

// Global subscription tracking to prevent duplicates
const activeSubscriptions = new Map<string, boolean>();
const globalToastCallbacks = new Map<string, (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => void>();
const recentToasts = new Map<string, number>(); // Track recent toasts to prevent duplicates

// Add debugging
console.log('🔧 IncidentTable module loaded. Active subscriptions:', activeSubscriptions.size, 'Toast callbacks:', globalToastCallbacks.size);

export { getIncidentTypeStyle };
export default function IncidentTable({ 
  filter, 
  onDataLoaded, 
  onToast,
  viewMode = 'table',
  onViewModeChange,
  currentUser,
  currentEventId: propCurrentEventId
}: { 
  filter?: string; 
  onDataLoaded?: (data: Incident[]) => void; 
  onToast?: (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => void;
  viewMode?: 'table' | 'board';
  onViewModeChange?: (mode: 'table' | 'board') => void;
  currentUser?: any;
  currentEventId?: string;
}) {
  const componentId = useRef(Math.random().toString(36).substr(2, 9));
  console.log('🔧 IncidentTable component rendered. ID:', componentId.current, 'onToast available:', !!onToast);

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
  const [showBackToTop, setShowBackToTop] = useState(false)
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
      console.error('Error fetching incidents:', err);
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
      console.log('Cleaning up incident table subscription');
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    // Remove from active subscriptions map and global toast callbacks
    if (currentEventId) {
      const subscriptionKey = `incident_logs_${currentEventId}`;
      activeSubscriptions.delete(subscriptionKey);
      globalToastCallbacks.delete(subscriptionKey);
      console.log('🧹 Removed subscription and toast callback from active maps:', subscriptionKey);
    }
  };

  useEffect(() => {
    const checkCurrentEvent = async () => {
      console.log('🔍 CHECKING FOR CURRENT EVENT...');
      try {
        const { data: eventData } = await supabase
          .from('events')
          .select('id')
          .eq('is_current', true)
          .single();

        console.log('🔍 CURRENT EVENT DATA:', eventData);
        const newEventId = eventData?.id || null;
        console.log('🔍 SETTING CURRENT EVENT ID TO:', newEventId);
        setCurrentEventId(newEventId);
        console.log('🔍 CURRENT EVENT ID SET COMPLETE');
      } catch (err) {
        console.error('❌ ERROR CHECKING CURRENT EVENT:', err);
        setCurrentEventId(null);
      }
    };

    checkCurrentEvent();
  }, []);

  useEffect(() => {
    console.log('🔍 SUBSCRIPTION USEEFFECT TRIGGERED WITH:', currentEventId, 'TYPE:', typeof currentEventId);
    if (!currentEventId || typeof currentEventId !== 'string' || currentEventId.trim() === '') {
      console.log('❌ NO CURRENT EVENT ID - SKIPPING SUBSCRIPTION. VALUE:', currentEventId);
      return;
    }
    console.log('✅ CURRENT EVENT ID VALID - PROCEEDING WITH SUBSCRIPTION SETUP');

    // Check if there's already an active subscription for this event
    const subscriptionKey = `incident_logs_${currentEventId}`;
    console.log('🔍 Component', componentId.current, 'checking subscription for key:', subscriptionKey);
    console.log('🔍 Active subscriptions map:', Array.from(activeSubscriptions.keys()));
    console.log('🔍 Toast callbacks map:', Array.from(globalToastCallbacks.keys()));
    
    if (activeSubscriptions.has(subscriptionKey)) {
      console.log('⚠️ SUBSCRIPTION ALREADY EXISTS FOR EVENT:', currentEventId, '- SKIPPING DUPLICATE. Component:', componentId.current);
      // IMPORTANT: Don't overwrite existing toast callback to prevent duplicates
      console.log('🔒 KEEPING EXISTING TOAST CALLBACK TO PREVENT DUPLICATES. Component:', componentId.current);
      return;
    }



    // DO NOT call cleanup() here!

    // Mark this subscription as active and register toast callback
    activeSubscriptions.set(subscriptionKey, true);
    if (onToast) {
      globalToastCallbacks.set(subscriptionKey, onToast);
      console.log('📝 REGISTERED TOAST CALLBACK FOR NEW SUBSCRIPTION. Component:', componentId.current);
    }
    console.log('✅ Component', componentId.current, 'created new subscription for:', subscriptionKey);

    // Set up new subscription with a stable channel name
    console.log('🔗 SETTING UP SUPABASE SUBSCRIPTION FOR EVENT:', currentEventId);
    console.log('🔗 SUBSCRIPTION FILTER:', `event_id=eq.${currentEventId}`);
    
    // Basic connectivity verification
    console.log('🔧 Setting up real-time subscription for event', currentEventId);
    
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
          console.log('🔔 Real-time event:', payload.eventType, 'for incident', (payload.new as any)?.log_number || (payload.old as any)?.log_number);
          console.log('🔔 Event details:', payload.new || payload.old);
          console.log('🔔 onToast available:', !!onToastRef.current);
          
          setIncidents(prev => {
          let newIncidents: Incident[] = [];
          if (payload.eventType === 'INSERT') {
              newIncidents = [payload.new as Incident, ...prev];
              
              // Show toast for new incident using global callback
              const globalToastCallback = globalToastCallbacks.get(subscriptionKey);
              console.log('🔔 INSERT event received. Subscription key:', subscriptionKey);
              console.log('🔔 Global toast callback available:', !!globalToastCallback);
              console.log('🔔 All toast callbacks:', Array.from(globalToastCallbacks.keys()));
              
              if (globalToastCallback) {
                const incident = payload.new as Incident;
                
                // Create a unique key for this toast to prevent duplicates
                const toastKey = `${incident.log_number}-${incident.incident_type}-INSERT`;
                const now = Date.now();
                
                // Check if we've shown this toast recently (within 10 seconds)
                if (recentToasts.has(toastKey) && (now - recentToasts.get(toastKey)!) < 10000) {
                  console.log('🚫 DUPLICATE TOAST PREVENTED FOR:', incident.log_number);
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
                
                console.log('📢 SENDING TOAST FOR NEW INCIDENT:', incident.log_number, 'Type:', incident.incident_type);
                globalToastCallback({
                  type: isHighPriority ? 'warning' : 'info',
                  title: `New ${incident.incident_type} Incident`,
                  message: `Log ${incident.log_number}: ${incident.occurrence.substring(0, 80)}${incident.occurrence.length > 80 ? '...' : ''}`,
                  duration: isHighPriority ? 12000 : 8000, // Increased from 8000/5000 to 12000/8000
                });
                console.log('📢 TOAST SENT FOR NEW INCIDENT:', incident.log_number);
              } else {
                console.log('❌ NO GLOBAL TOAST CALLBACK FOUND FOR KEY:', subscriptionKey);
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
                      console.log('📢 TOAST SENT FOR STATUS CHANGE:', updated.log_number);
                    } else {
                      console.log('🚫 DUPLICATE STATUS TOAST PREVENTED FOR:', updated.log_number);
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
          console.log('✅ Real-time subscription active for event', currentEventId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error');
        }
      });

    // Add a timeout to check if subscription status is never called
    setTimeout(() => {
      console.log('⏰ CHECKING SUBSCRIPTION STATUS AFTER 5 SECONDS...');
      if (subscriptionRef.current) {
        console.log('📊 SUBSCRIPTION OBJECT EXISTS:', !!subscriptionRef.current);
        console.log('📊 SUBSCRIPTION STATE:', subscriptionRef.current.state);
      } else {
        console.log('❌ NO SUBSCRIPTION OBJECT FOUND AFTER 5 SECONDS');
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
    console.log('Toggling status for incident:', incident.id, 'New status:', newStatus);
    
    // Track this as a manual status change to prevent duplicate toast
    setManualStatusChanges(prev => new Set(prev).add(incident.id));
    
    // Optimistic update - immediately update the UI
    setIncidents(prev => 
      prev.map(inc => 
        inc.id === incident.id 
          ? { ...inc, is_closed: newStatus, status: newStatus ? 'closed' : 'open' }
          : inc
      )
    );
    
    try {
      const { error } = await supabase
        .from('incident_logs')
        .update({ 
          is_closed: newStatus,
          status: newStatus ? 'closed' : 'open',
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
      
      console.log('Status update successful');
      
      // Show toast notification for manual status change
      if (onToastRef.current) {
        onToastRef.current({
          type: newStatus ? 'success' : 'info',
          title: `Incident ${newStatus ? 'Closed' : 'Reopened'}`,
          message: `Log ${incident.log_number}: ${incident.incident_type}`,
          duration: 6000
        });
        console.log('📢 TOAST SENT FOR MANUAL STATUS CHANGE:', incident.log_number);
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
      console.error('Error updating incident status:', err);
      // Revert the optimistic update if there was an error
      setIncidents(prev => 
        prev.map(inc => 
          inc.id === incident.id 
            ? { ...inc, is_closed: incident.is_closed, status: incident.status }
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
  const filteredIncidents = incidents.filter(incident => {
    // First apply the existing filter logic
    let matchesFilter = true;
    if (filter) {
        if (filter === 'high') {
        matchesFilter = [
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
        ].includes(incident.incident_type);
      } else if (filter === 'open') {
        matchesFilter = !incident.is_closed && incident.status !== 'Logged' && incident.incident_type !== 'Sit Rep' && incident.incident_type !== 'Attendance';
      } else if (filter === 'closed') {
        matchesFilter = incident.is_closed && incident.status !== 'Logged' && incident.incident_type !== 'Sit Rep' && incident.incident_type !== 'Attendance';
      } else if (['Refusal', 'Ejection', 'Medical'].includes(filter)) {
        matchesFilter = incident.incident_type === filter;
      } else if (filter === 'Other') {
        matchesFilter = !['Refusal', 'Ejection', 'Medical', 'Attendance', 'Sit Rep'].includes(incident.incident_type);
      } else {
        // Handle exact incident type matches (for Top 3 Incident Types card)
        matchesFilter = incident.incident_type === filter;
      }
    }

    // Then apply search query filter
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      matchesSearch = 
        incident.incident_type.toLowerCase().includes(query) ||
        incident.occurrence.toLowerCase().includes(query) ||
        incident.action_taken.toLowerCase().includes(query) ||
        incident.callsign_from.toLowerCase().includes(query) ||
        incident.callsign_to.toLowerCase().includes(query) ||
        incident.log_number.toLowerCase().includes(query) ||
        (incident.is_closed ? 'closed' : 'open').includes(query);
    }

    return matchesFilter && matchesSearch;
  });

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
        if (incidents.length > 8 && tableContainerRef.current.scrollTop > 300) setShowBackToTop(true);
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
            </div>
          )}
          
          {/* Enhanced Last updated and live status - Right side */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-lg" title="Live Updates" />
                <span className="text-sm font-medium text-green-700 dark:text-green-200">Live</span>
                {lastUpdated && (
                  <span className="text-xs text-green-600 dark:text-green-300">
                    {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {searchQuery && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-2">
            <span className="font-medium text-blue-700 dark:text-blue-200">
              {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''} found
            </span>
            {filter && <span className="text-blue-600 dark:text-blue-300"> (filtered by {filter})</span>}
          </div>
        )}
      </div>

      {/* Conditional Rendering for Table/Board Views */}
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
          <div ref={tableContainerRef} className="md:hidden mt-6 space-y-4 px-2" style={{ overflowY: 'auto', position: 'relative' }}>
            {/* Enhanced Mobile Table Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-600 to-gray-700 dark:from-[#1e293b] dark:to-[#334155] flex items-center px-4 py-3 text-xs font-bold text-white dark:text-gray-100 uppercase tracking-wider rounded-t-2xl shadow-lg">
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
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
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
            
            {/* Enhanced Back to Top Button (Mobile) */}
            {showBackToTop && (
              <button
                className="fixed bottom-24 right-6 z-40 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 animate-fade-in transform hover:scale-110 transition-all duration-200"
                aria-label="Back to Top"
                tabIndex={0}
                onClick={() => { tableContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { tableContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                style={{ pointerEvents: 'auto' }}
              >
                <ArrowUpIcon className="h-7 w-7" />
              </button>
            )}
          </div>

          {/* Enhanced Desktop Table Layout */}
          <div ref={tableContainerRef} className="hidden md:flex flex-col mt-6" style={{ overflowY: 'auto', position: 'relative' }}>
            {/* Enhanced Desktop Table Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-600 to-gray-700 dark:from-[#1e293b] dark:to-[#334155] rounded-t-2xl shadow-lg">
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
            <div className="bg-white dark:bg-[#23408e] divide-y divide-gray-200 dark:divide-[#2d437a] rounded-b-2xl shadow-xl overflow-hidden">
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
                      <span className={`px-3 py-1 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm ${getIncidentTypeStyle(incident.incident_type)}`}>
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
                    <div className="flex items-center justify-end text-sm text-gray-600 dark:text-gray-300 pr-4">
                      {incident.incident_type === 'Attendance' ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-4 font-bold rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
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
            
            {/* Enhanced Back to Top Button (Desktop) */}
            {showBackToTop && (
              <button
                className="fixed bottom-24 right-6 z-40 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 animate-fade-in transform hover:scale-110 transition-all duration-200"
                aria-label="Back to Top"
                tabIndex={0}
                onClick={() => { tableContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { tableContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                style={{ pointerEvents: 'auto' }}
              >
                <ArrowUpIcon className="h-7 w-7" />
              </button>
            )}
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
    /* Board View */
    <div className="bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 p-6">
      <CollaborationBoard
        eventId={propCurrentEventId || currentEventId || ''}
        currentUser={currentUser}
        searchQuery={searchQuery}
        onIncidentSelect={(incident) => {
          // Handle incident selection - could open details modal
          console.log('Selected incident:', incident);
        }}
      />
    </div>
  )}
    </>
  )
} 