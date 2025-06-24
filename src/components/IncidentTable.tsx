'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import IncidentDetailsModal from './IncidentDetailsModal'
import { RealtimeChannel } from '@supabase/supabase-js'
import { ArrowUpIcon } from '@heroicons/react/24/outline'

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
  const highPriorityTypes = ['Ejection', 'Code Green', 'Code Black', 'Code Pink', 'Aggressive Behaviour'];
  if (highPriorityTypes.includes(incident.incident_type)) {
    return 'bg-red-50 hover:bg-red-100';
  }
  if (!incident.is_closed && incident.incident_type !== 'Attendance' && incident.incident_type !== 'Sit Rep') {
    return 'bg-yellow-50 hover:bg-yellow-100';
  }
  return 'hover:bg-gray-50';
};

export default function IncidentTable({ filter, onDataLoaded }: { filter?: string; onDataLoaded?: (data: Incident[]) => void; }) {
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

  // Cleanup function to handle unsubscribe
  const cleanup = () => {
    if (subscriptionRef.current) {
      console.log('Cleaning up incident table subscription');
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  };

  useEffect(() => {
    const checkCurrentEvent = async () => {
      try {
        const { data: eventData } = await supabase
          .from('events')
          .select('id')
          .eq('is_current', true)
          .single();

        setCurrentEventId(eventData?.id || null);
      } catch (err) {
        console.error('Error checking current event:', err);
        setCurrentEventId(null);
      }
    };

    checkCurrentEvent();
  }, []);

  useEffect(() => {
    if (!currentEventId) return;

    const fetchIncidents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('incident_logs')
          .select('*')
          .eq('event_id', currentEventId)
          .order('timestamp', { ascending: false });

        if (error) throw error;
        setIncidents(data || []);
        if (onDataLoaded) {
          onDataLoaded(data || []);
        }
      } catch (err) {
        console.error('Error fetching incidents:', err);
        setError('Failed to fetch incidents');
      } finally {
        setLoading(false);
      }
    };

    // Clean up any existing subscription
    cleanup();

    // Set up new subscription with more specific filter
    subscriptionRef.current = supabase
      .channel(`incident_logs_${currentEventId}_${Date.now()}`)
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'incident_logs',
          filter: `event_id=eq.${currentEventId}`
        }, 
        (payload) => {
          console.log('Received incident change:', payload);
          let newIncidents: Incident[] = [];
          if (payload.eventType === 'INSERT') {
            newIncidents = [payload.new as Incident, ...incidents];
          } else if (payload.eventType === 'UPDATE') {
            newIncidents = incidents.map(incident => {
                if (incident.id === payload.new.id) {
                  console.log('Updating incident:', incident.id, 'New status:', payload.new.is_closed);
                  return { ...incident, ...payload.new };
                }
                return incident;
              });
          } else if (payload.eventType === 'DELETE') {
            newIncidents = incidents.filter(incident => incident.id !== payload.old.id);
          }
          setIncidents(newIncidents);
          if (onDataLoaded) {
            onDataLoaded(newIncidents);
          }
        }
      )
      .subscribe();

    fetchIncidents();

    return cleanup;
  }, [currentEventId, onDataLoaded]);

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
    try {
      const newStatus = !incident.is_closed;
      console.log('Toggling status for incident:', incident.id, 'New status:', newStatus);
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
      window.location.reload(); // Force full page reload after status change
    } catch (err) {
      console.error('Error updating incident status:', err);
      // Revert the optimistic update if there was an error
      setIncidents(prev => 
        prev.map(inc => 
          inc.id === incident.id 
            ? { ...inc, is_closed: incident.is_closed }
            : inc
        )
      );
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

  // Filter incidents based on the filter prop
  const filteredIncidents = filter
    ? incidents.filter(incident => {
        if (filter === 'high') {
          return ['Ejection', 'Code Green', 'Code Black', 'Code Pink'].includes(incident.incident_type);
        }
        if (filter === 'open') {
          return !incident.is_closed && incident.status !== 'Logged' && incident.incident_type !== 'Sit Rep' && incident.incident_type !== 'Attendance';
        }
        if (filter === 'closed') {
          return incident.is_closed && incident.status !== 'Logged' && incident.incident_type !== 'Sit Rep' && incident.incident_type !== 'Attendance';
        }
        if (['Refusal', 'Ejection', 'Medical'].includes(filter)) {
          return incident.incident_type === filter;
        }
        if (filter === 'Other') {
          return !['Refusal', 'Ejection', 'Medical', 'Attendance', 'Sit Rep'].includes(incident.incident_type);
        }
        return false; // Return false for unhandled filters
      })
    : incidents;

  // Show Back to Top if many incidents and scrolled down
  useEffect(() => {
    const handleScroll = () => {
      if (tableContainerRef.current) {
        if (incidents.length > 8 && tableContainerRef.current.scrollTop > 300) setShowBackToTop(true);
      }
    };
    const ref = tableContainerRef.current;
    if (ref && filteredIncidents.length > 15) {
      ref.addEventListener('scroll', handleScroll);
      return () => ref.removeEventListener('scroll', handleScroll);
    }
  }, [incidents.length, filteredIncidents.length]);

  if (loading) {
    return (
      <div className="mt-4 bg-white shadow rounded-lg p-6">
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

  if (filteredIncidents.length === 0) {
    return (
      <div className="mt-4 bg-white shadow rounded-lg p-6 text-center text-gray-500">
        No incidents to display
      </div>
    )
  }

  return (
    <>
      {/* Mobile Card/Accordion Layout */}
      <div ref={tableContainerRef} className="md:hidden mt-4 space-y-3" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', position: 'relative' }}>
        {/* Mobile Table Header */}
        <div className="sticky top-0 z-10 bg-gray-50 flex items-center px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="basis-[28%]">Log #</div>
          <div className="basis-[24%] text-center">Type</div>
          <div className="basis-[24%] text-center">Time</div>
          <div className="basis-[24%] text-right">Status</div>
        </div>
        {filteredIncidents.map((incident) => (
          <div
            key={incident.id}
            className={`bg-white shadow rounded-lg p-4 cursor-pointer transition hover:shadow-md ${getRowStyle(incident)}`}
            onClick={() => setExpandedIncidentId(expandedIncidentId === incident.id ? null : incident.id)}
            tabIndex={0}
            role="button"
            aria-label={`View details for log ${incident.log_number}`}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                setExpandedIncidentId(expandedIncidentId === incident.id ? null : incident.id);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="basis-[28%] font-bold text-blue-700 text-sm truncate">{incident.log_number}</div>
              <div className="basis-[24%] flex items-center justify-center">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold mx-auto text-center ${getIncidentTypeStyle(incident.incident_type)}`}>{incident.incident_type}</span>
              </div>
              <div className="basis-[24%] text-xs text-gray-500 flex items-center justify-center">{new Date(incident.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="basis-[24%] flex items-center justify-end">
                {incident.incident_type === 'Attendance' ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    Logged
                  </span>
                ) : (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${incident.is_closed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                  onClick={e => { e.stopPropagation(); toggleIncidentStatus(incident, e); }}
                >
                  {incident.is_closed ? 'Closed' : 'Open'}
                </span>
                )}
              </div>
            </div>
            {expandedIncidentId === incident.id && (
              <div className="mt-3 border-t pt-3 space-y-2">
                <div>
                  <span className="block text-xs text-gray-400 font-semibold">Occurrence</span>
                  <span className="block text-sm text-gray-700">{incident.occurrence}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-400 font-semibold">Action</span>
                  <span className="block text-sm text-gray-700">{incident.action_taken}</span>
                </div>
                <div className="flex gap-4 mt-2">
                  <span className="block text-xs text-gray-400 font-semibold">From:</span>
                  <span className="block text-xs text-gray-700">{incident.callsign_from}</span>
                  <span className="block text-xs text-gray-400 font-semibold">To:</span>
                  <span className="block text-xs text-gray-700">{incident.callsign_to}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        {/* Back to Top Button (Mobile) */}
        {showBackToTop && (
          <button
            className="fixed bottom-24 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 animate-fade-in"
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
      {/* Desktop Table Layout */}
      <div ref={tableContainerRef} className="hidden md:flex flex-col mt-4" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', position: 'relative' }}>
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-[10%]">
                      Log
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-[8%]">
                      Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-[10%]">
                      From
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-[10%]">
                      To
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-[22%]">
                      Occurrence
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-[12%]">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-[20%]">
                      Action
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-[8%]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIncidents.map((incident) => (
                    <tr 
                      key={incident.id} 
                      className={`cursor-pointer ${getRowStyle(incident)}`}
                      onClick={() => handleIncidentClick(incident)} 
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{incident.log_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(incident.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          title={
                            callsignShortToName[incident.callsign_from?.toUpperCase()] ||
                            callsignAssignments[incident.callsign_from?.toUpperCase()] ||
                            undefined
                          }
                          className="underline decoration-dotted cursor-help"
                        >
                          {incident.callsign_from}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          title={
                            callsignShortToName[incident.callsign_to?.toUpperCase()] ||
                            callsignAssignments[incident.callsign_to?.toUpperCase()] ||
                            undefined
                          }
                          className="underline decoration-dotted cursor-help"
                        >
                          {incident.callsign_to}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs overflow-ellipsis" title={incident.occurrence}>
                        {incident.occurrence}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-1.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${getIncidentTypeStyle(incident.incident_type)}`}>
                          {incident.incident_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs overflow-ellipsis" title={incident.action_taken}>
                        {incident.action_taken}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {incident.incident_type === 'Attendance' ? (
                          <span className="px-1.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Logged
                          </span>
                        ) : (
                          <button
                            onClick={(e) => toggleIncidentStatus(incident, e)}
                            className={`px-1.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${
                              incident.is_closed 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            }`}
                          >
                            {incident.is_closed ? 'Closed' : 'Open'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Back to Top Button (Desktop) */}
        {showBackToTop && (
          <button
            className="fixed bottom-24 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 animate-fade-in"
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
  )
} 