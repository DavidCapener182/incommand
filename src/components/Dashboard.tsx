'use client'

import React, { useState, useEffect, useRef, Fragment } from 'react'
import IncidentTable from './IncidentTable'
import CurrentEvent from './CurrentEvent'
import EventCreationModal from './EventCreationModal'
import IncidentCreationModal, {
  incidentTypes,
} from './IncidentCreationModal'
import VenueOccupancy from './VenueOccupancy'
import { supabase } from '../lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import {
  UsersIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  HeartIcon,
  ClipboardDocumentCheckIcon,
  QuestionMarkCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import WeatherCard from './WeatherCard'
import { geocodeAddress } from '../utils/geocoding'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import Modal from 'react-modal'
import what3words from '@what3words/api'
import { Menu, Transition, Dialog } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import AttendanceModal from './AttendanceModal'
import { getIncidentTypeStyle } from './IncidentTable'
import Toast, { useToast } from './Toast'
import FloatingAIChat from './FloatingAIChat'
import { AnimatePresence, motion } from 'framer-motion'
import RotatingText from './RotatingText'

// <style>
// {`
//   .splash-bg {
//     background: radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0.08) 0%, rgba(35,64,142,1) 80%), #23408e;
//   }
// `}
// </style>

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color?: string
  isSelected?: boolean
  onClick?: () => void
  isFilterable?: boolean
  className?: string
  tooltip?: string
  showPulse?: boolean
}

interface EventTiming {
  title: string
  time: string
  isNext?: boolean
}

interface TimeCardProps {
  companyId: string | null;
  currentTime: string;
  eventTimings: EventTiming[];
  nextEvent: EventTiming | null;
  countdown: string;
      }

const TimeCard: React.FC<TimeCardProps> = ({ companyId, currentTime, eventTimings, nextEvent, countdown }) => {
  return (
    <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 transition-colors duration-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:block">
            <div className="hidden md:block">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Current Time</h2>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{currentTime}</p>
          {nextEvent && (
            <div className="mt-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-100">Time until {nextEvent.title}</h3>
              <p className="text-lg font-bold text-blue-600 dark:text-gray-100">{countdown}</p>
            </div>
          )}
            </div>
        </div>
        <div>
            <div className='hidden md:block'>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Event Schedule</h2>
            </div>
            <div className="space-y-2 mt-2">
            {eventTimings.map((timing, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center p-2 rounded ${
                        timing.isNext ? 'md:bg-blue-50 md:border md:border-blue-200' : ''
                      } `}
              >
                      <span className={`text-sm font-medium ${timing.isNext ? 'md:text-blue-600' : 'text-gray-500 dark:text-gray-100'}`}>
                  {timing.title}
                </span>
                      <span className={`text-sm font-bold ${timing.isNext ? 'md:text-blue-700' : 'text-gray-900 dark:text-gray-100'}`}>
                  {timing.time}
                </span>
              </div>
            ))}
            </div>
             {eventTimings.length === 0 && !nextEvent && (
              <p className="text-sm text-gray-500 dark:text-gray-100">No upcoming event timings</p>
            )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  isSelected, 
  onClick, 
  isFilterable = false,
  className,
  tooltip,
  showPulse
}) => {
  const colorClasses = {
    blue: 'text-blue-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500',
    green: 'text-green-500',
  }

  // Pulse animation when value changes
  const [pulse, setPulse] = React.useState(false);
  const prevValue = React.useRef(value);
  React.useEffect(() => {
    if (prevValue.current !== value) {
      setPulse(true);
      const timeout = setTimeout(() => setPulse(false), 400);
      prevValue.current = value;
      return () => clearTimeout(timeout);
    }
  }, [value]);

  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div 
      onClick={isFilterable ? onClick : undefined}
      className={`
        bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 flex flex-col items-center text-center transition-colors duration-300
        ${isFilterable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${pulse ? 'animate-pulse-once' : ''}
        relative
        ${className}
        hover:shadow-xl hover:-translate-y-1 transition-all duration-200
      `}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip(v => !v)}
    >
      {showPulse && (
        <span className="absolute top-2 right-2 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
      <div className="flex-shrink-0 mb-2">
        {icon}
      </div>
      <div className="flex flex-col items-center">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-100 truncate mb-1">{title}</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      </div>
      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute z-20 left-1/2 top-full mt-2 w-40 p-2 bg-gray-800 text-white text-xs rounded shadow-lg -translate-x-1/2">
          {tooltip}
        </div>
      )}
    </div>
  )
}

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

function What3WordsMapCard({ lat, lon, venueAddress, singleCard, largeLogo }: { 
  lat: number; 
  lon: number; 
  venueAddress: string; 
  singleCard: boolean; 
  largeLogo: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchedLatLon, setSearchedLatLon] = useState<{lat: number, lon: number} | null>(null);

  // Modal map URL
  const modalLat = searchedLatLon?.lat || lat;
  const modalLon = searchedLatLon?.lon || lon;
  const modalMapUrl = modalLat && modalLon
    ? `https://map.what3words.com/?maptype=roadmap&zoom=17&center=${modalLat},${modalLon}&marker=${modalLat},${modalLon}`
    : null;

  return (
    <>
      <div
        className="w-full h-full flex items-center justify-center cursor-pointer"
        onClick={() => setModalOpen(true)}
      >
        <img 
          src="/w3w.png" 
          alt="What3Words" 
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            console.error('Error loading w3w image:', e);
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onRequestClose={() => { setModalOpen(false); setSearchedLatLon(null); }}
          contentLabel="What3Words Map"
          className="bg-transparent p-0 w-full h-full flex items-center justify-center"
          overlayClassName="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center"
          ariaHideApp={false}
        >
          <div className="relative w-11/12 h-5/6">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-0 right-0 -mt-9 -mr-10 z-10 bg-gray-800 text-white rounded-full p-2 shadow-lg hover:bg-gray-700 transition-colors"
              aria-label="Close map"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            <div className="bg-transparent rounded-lg overflow-hidden w-full h-full">
              {modalMapUrl ? (
                <iframe
                  src={modalMapUrl}
                  className="w-full h-full border-none rounded-lg"
                  title="What3Words Map"
                  allow="geolocation"
                ></iframe>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <p>Loading map...</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

// Top 3 Incident Types Card
interface TopIncidentTypesCardProps {
  incidents: any[];
  onTypeClick: (type: string) => void;
  selectedType: string | null;
}

function TopIncidentTypesCard({ incidents, onTypeClick, selectedType }: TopIncidentTypesCardProps) {
  try {
    // Ensure incidents is an array
    const safeIncidents = Array.isArray(incidents) ? incidents : [];
    
    // Exclude Attendance and Sit Rep
    const filtered = safeIncidents.filter((i: any) => 
      i && i.incident_type && !['Attendance', 'Sit Rep'].includes(i.incident_type)
    );
    
    // Count by type
    const counts = filtered.reduce((acc: Record<string, number>, i: any) => {
      if (i.incident_type) {
        acc[i.incident_type] = (acc[i.incident_type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Sort by count desc, then alphabetically
    const sorted = (Object.entries(counts) as [string, number][]) 
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 3);

    if (sorted.length === 0) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2">
          <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1 text-center">Top 3 Incident Types</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">No incidents yet</div>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-2">
        <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2 text-center">Top 3 Incident Types</div>
        <div className="flex flex-col gap-1 w-full">
          {sorted.map(([type, count]) => {
            try {
              const styleClasses = getIncidentTypeStyle(type);
              const isSelected = selectedType === type;
              return (
                <button
                  key={type}
                  onClick={() => onTypeClick(type)}
                  className={`flex items-center justify-between px-2 py-1 rounded text-xs font-medium transition-all duration-200 w-full ${styleClasses} ${
                    isSelected 
                      ? 'ring-2 ring-offset-1 ring-gray-400' 
                      : 'hover:opacity-80'
                  }`}
                >
                  <span className="truncate flex-1 text-left">{type}</span>
                  <span className="ml-1 font-bold">{count}</span>
                </button>
              );
            } catch (error) {
              console.error('Error rendering incident type button:', error, type);
              return (
                <div key={type} className="px-2 py-1 text-xs text-gray-500">
                  {type}: {count}
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in TopIncidentTypesCard:', error);
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-2">
        <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">Top 3 Incident Types</div>
        <div className="text-xs text-red-500">Error loading data</div>
      </div>
    );
  }
}



export default function Dashboard() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false)
  const [initialIncidentType, setInitialIncidentType] = useState<
    string | undefined
  >(undefined)
  const [hasCurrentEvent, setHasCurrentEvent] = useState(false)
  const [currentEventId, setCurrentEventId] = useState<string | null>(null)
  const [currentEvent, setCurrentEvent] = useState<any | null>(null)
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
  const [loadingCurrentEvent, setLoadingCurrentEvent] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('en-GB'));
  const [eventTimings, setEventTimings] = useState<EventTiming[]>([]);
  const [countdown, setCountdown] = useState<string>('');
  const [nextEvent, setNextEvent] = useState<EventTiming | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOccupancyModalOpen, setIsOccupancyModalOpen] = useState(false);
  const [attendanceTimeline, setAttendanceTimeline] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Toast notifications
  const { messages, addToast, removeToast } = useToast();

  // Add a state for showing the event creation modal if not already present
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  // Event types to cycle through
  const eventTypes = [
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
  const [eventTypeIndex, setEventTypeIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setEventTypeIndex((i) => (i + 1) % eventTypes.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchCurrentEvent = async () => {
    if (!companyId) return;
    setIsRefreshing(true);
    setLoadingCurrentEvent(true);
    setCurrentEvent(null);
    try {
      const { data } = await supabase
        .from('events')
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
            console.error('Error geocoding address:', error);
          }
        }
      } else {
        setHasCurrentEvent(false);
        setCurrentEventId(null);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoadingCurrentEvent(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-GB'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      if (!companyId) return;
      setIsRefreshing(true);
      const { data: event } = await supabase
        .from('events')
        .select('security_call_time, main_act_start_time, show_down_time, show_stop_meeting_time, doors_open_time, curfew_time, event_name, support_acts')
        .eq('is_current', true)
        .eq('company_id', companyId)
        .single();
      if (event) {
        const now = new Date();
        const currentTimeNumber = now.getHours() * 60 + now.getMinutes();
        let supportActs = [];
        if (event.support_acts) {
          try {
            supportActs = typeof event.support_acts === 'string' ? JSON.parse(event.support_acts) : event.support_acts;
          } catch (e) { console.error('Error parsing support acts:', e); supportActs = []; }
        }
        const timings: EventTiming[] = [
          { title: 'Security Call', time: event.security_call_time },
          { title: 'Show Stop Meeting', time: event.show_stop_meeting_time },
          { title: 'Doors Open', time: event.doors_open_time },
          ...supportActs.map((act: { act_name: string; start_time: string }) => ({ title: act.act_name, time: act.start_time })),
          { title: event.event_name, time: event.main_act_start_time },
          { title: 'Show Down', time: event.show_down_time },
          { title: 'Curfew', time: event.curfew_time }
        ].filter(timing => timing.time);
        const timingsWithMinutes = timings.map(timing => {
          const [hours, minutes] = timing.time.split(':').map(Number);
          return { ...timing, minutesSinceMidnight: hours * 60 + minutes };
        });
        const futureTimings = timingsWithMinutes
          .filter(t => t.minutesSinceMidnight > currentTimeNumber)
          .sort((a, b) => a.minutesSinceMidnight - b.minutesSinceMidnight);
        const nextTiming = futureTimings[0] || null;
        const nextFiveTimings = futureTimings.slice(0, 5).map((t, i) => ({ ...t, isNext: i === 0 }));
        setEventTimings(nextFiveTimings);
        setNextEvent(nextTiming ? { ...nextTiming, isNext: true } : null);
      }
      setIsRefreshing(false);
    };
    if (companyId) {
      fetchEventTimings();
      const refreshTimer = setInterval(fetchEventTimings, 60000);
      return () => clearInterval(refreshTimer);
    }
  }, [companyId]);

  useEffect(() => {
    const fetchCompanyId = async () => {
      if (!user) return;
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      if (profileError || !profile?.company_id) {
        setError('Could not determine your company. Please check your profile.');
        return;
      }
      setCompanyId(profile.company_id);
      const { data: profileFull } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setUserRole(profileFull?.role || null);
    };
    fetchCompanyId();
  }, [user]);

  useEffect(() => {
    if (companyId) {
      fetchCurrentEvent();
      }
  }, [companyId]);

  // This effect will run when the incident data is passed up from the table
  useEffect(() => {
    if (incidents) {
      const isCountable = (incident: any) => 
        !['Attendance', 'Sit Rep'].includes(incident.incident_type);

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
      
      const total = countableIncidents.length;
      const high = highPriorityIncidents.length;
      const hasOpenHighPrio = highPriorityIncidents.some(i => !i.is_closed);
      const open = countableIncidents.filter(i => !i.is_closed).length;
      const closed = countableIncidents.filter(i => i.is_closed).length;
      const refusals = countableIncidents.filter(i => i.incident_type === 'Refusal').length;
      const ejections = countableIncidents.filter(i => i.incident_type === 'Ejection').length;
      const medicals = countableIncidents.filter(i => i.incident_type === 'Medical').length;
      const other = countableIncidents.filter(i => !['Refusal', 'Ejection', 'Medical'].includes(i.incident_type)).length;
      
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
  }, [incidents]); // Re-run calculations when incidents data changes

  const handleIncidentCreated = async () => {
    setIsIncidentModalOpen(false);
    // No need to force refresh - real-time subscription will handle the update
  };

  // Fetch attendance timeline when modal opens
  useEffect(() => {
    if (isOccupancyModalOpen && currentEventId) {
      (async () => {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('count, timestamp')
          .eq('event_id', currentEventId)
          .order('timestamp', { ascending: true });
        if (!error && data) setAttendanceTimeline(data);
      })();
    }
  }, [isOccupancyModalOpen, currentEventId]);

  // Splash screen if no current event
  if (!currentEvent) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#23408e] z-50 min-h-screen splash-bg">
        <img src="/inCommand.png" alt="inCommand Logo" className="h-32 w-auto mb-8 object-contain drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)]" />
        {/* Create + Event type on same line under logo */}
        <div className="flex flex-row items-center justify-center mb-8 gap-4">
          <span className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-lg md:drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)]">Event Control for</span>
          <RotatingText
            items={eventTypes}
            interval={2000}
            className="bg-white rounded-xl px-6 py-2 shadow-lg flex items-center justify-center min-w-[160px] min-h-[40px] font-extrabold text-2xl md:text-3xl"
          />
        </div>
        <div className="text-base text-blue-100 font-medium mt-2 mb-8 text-center max-w-xl mx-auto">
          Modern incident tracking and event command for every scale of operation.
        </div>
        <div className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-md rounded-2xl p-8 flex flex-col items-center mt-10 shadow-2xl shadow-[0_10px_32px_4px_rgba(34,41,120,0.15)]">
          <button 
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xl font-bold py-4 rounded-xl shadow-xl mb-4 transition hover:scale-[1.02] focus-visible:ring-4 focus-visible:ring-blue-300 outline-none hover:shadow-2xl hover:-translate-y-1 hover:ring-2 hover:ring-blue-400"
            onClick={() => setShowCreateEvent(true)}
          >
            <PlusIcon className="h-6 w-6 mr-2" /> Start New Event
          </button>
          <button 
            className="w-full flex items-center justify-center gap-2 border border-blue-300 text-blue-700 font-semibold py-3 rounded-xl bg-white/60 hover:bg-blue-50 transition focus-visible:ring-4 focus-visible:ring-blue-300 outline-none"
            onClick={() => router.push('/settings/events')}
          >
            <ClockIcon className="h-5 w-5 mr-2" /> Open Previous Events
          </button>
        </div>
        {showCreateEvent && (
          <EventCreationModal isOpen={showCreateEvent} onClose={() => setShowCreateEvent(false)} onEventCreated={fetchCurrentEvent} />
        )}
        {/* Floating AI Chat and Create New Incident Button */}
        {hasCurrentEvent && (
          <div className="fixed bottom-8 right-8 flex flex-col items-end gap-4 z-50">
            <FloatingAIChat />
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg text-lg"
              onClick={() => {}}
            >
              Create New Incident
            </button>
          </div>
        )}
        <div className="absolute bottom-2 right-4 text-xs text-blue-100 opacity-70 select-none">v{process.env.NEXT_PUBLIC_APP_VERSION}</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
              {/* Event Header - Sticky */}
        <div className="md:bg-transparent md:shadow-none -mx-6 md:-mx-8 px-6 md:px-8 pt-0 pb-2 md:py-0 mb-6">
        {/* Desktop view */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6">
          <CurrentEvent
            currentTime={currentTime}
            currentEvent={currentEvent}
            loading={loadingCurrentEvent}
            error={error}
            onEventCreated={fetchCurrentEvent}
          />
          <TimeCard
            companyId={companyId}
            currentTime={currentTime}
            eventTimings={eventTimings}
            nextEvent={nextEvent}
            countdown={countdown}
          />
        </div>

        {/* Mobile view */}
        <div className="md:hidden bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] transition-colors duration-300">
          {loadingCurrentEvent && <p className="p-3">Loading event...</p>}
          {!loadingCurrentEvent && currentEvent && (
            <div>
              <div className="flex justify-between items-center p-3">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 mr-2">Event</span>
                  <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{currentEvent.event_name}</span>
                </div>
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">{currentTime}</span>
              </div>
              <hr className="border-t border-gray-200" />
              {nextEvent ? (
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-b-lg">
                  <span className="text-sm font-medium text-blue-600 dark:text-gray-100">{nextEvent.title}</span>
                  <span className="text-sm font-bold text-blue-700 dark:text-gray-100">{nextEvent.time}</span>
                  <span className="text-sm font-medium text-blue-600">{nextEvent.title}</span>
                  <span className="text-sm font-bold text-blue-700">{nextEvent.time}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center p-3">No upcoming timings</p>
              )}
            </div>
          )}
          {!loadingCurrentEvent && !currentEvent && (
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
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            Incident Dashboard
            {isRefreshing && (
              <span className="ml-2 text-xs text-blue-500 flex items-center animate-pulse">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-1 animate-bounce"></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-1 animate-bounce delay-150"></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></span>
                <span className="ml-1">Live</span>
              </span>
            )}
          </h2>
          <div className="relative inline-flex rounded-md shadow-sm">
          <button 
              type="button"
              onClick={() => {
                setInitialIncidentType(undefined)
                setIsIncidentModalOpen(true)
              }}
            disabled={!hasCurrentEvent}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-l-xl shadow-lg ${
              hasCurrentEvent 
                  ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200`}
          >
            New Incident
          </button>
            <Menu as="div" className="-ml-px block">
              <Menu.Button
                disabled={!hasCurrentEvent}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-xl shadow-lg ${
                  hasCurrentEvent
                    ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200`}
              >
                <span className="sr-only">Open options</span>
                <ChevronDownIcon
                  className="h-5 w-5 text-white"
                  aria-hidden="true"
                />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1 flex flex-col max-h-60 overflow-y-auto">
                    {incidentTypes.map(type => (
                      <Menu.Item key={type}>
                        {({ active }) => (
                          <a
                            href="#"
                            onClick={() => {
                              setInitialIncidentType(type)
                              setIsIncidentModalOpen(true)
                            }}
                            className={`
                              ${
                                active
                                  ? 'bg-gray-100 text-gray-900'
                                  : 'text-gray-700'
                              }
                              block px-4 py-2 text-sm w-full text-left'
                            `}
                          >
                            {type}
                          </a>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
        <p className="text-gray-600 dark:text-white mb-6">
          Track and manage security incidents in real-time
        </p>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-4 mb-6">
          <StatCard
                title="Total"
            value={incidentStats.total}
                icon={<ExclamationTriangleIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />}
            isSelected={selectedFilter === null}
            onClick={() => setSelectedFilter(null)}
            isFilterable={true}
                tooltip="All logs including Attendance and Sit Reps."
          />
          <StatCard
            title="Open"
            value={incidentStats.open}
                icon={<FolderOpenIcon className="h-6 w-6 md:h-8 md:w-8 text-yellow-400" />}
                isSelected={selectedFilter === 'open'}
                onClick={() => setSelectedFilter('open')}
                isFilterable={true}
            color="yellow"
                tooltip="Incidents that are currently open."
            />
            <StatCard
                title="High Prio"
                value={incidentStats.high}
                icon={<ExclamationTriangleIcon className="h-6 w-6 md:h-8 md:w-8 text-red-400" />}
                isSelected={selectedFilter === 'high'}
                onClick={() => setSelectedFilter('high')}
            isFilterable={true}
                color="red"
                tooltip="Incidents marked as high priority."
                showPulse={incidentStats.hasOpenHighPrio}
          />
          <StatCard
            title="Closed"
            value={incidentStats.closed}
                icon={<CheckCircleIcon className="h-6 w-6 md:h-8 md:w-8 text-green-400" />}
                isSelected={selectedFilter === 'closed'}
                onClick={() => setSelectedFilter('closed')}
                isFilterable={true}
            color="green"
                tooltip="Incidents that have been closed."
          />
          <StatCard
            title="Refusals"
            value={incidentStats.refusals}
                icon={<UserGroupIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />}
                isSelected={selectedFilter === 'Refusal'}
                onClick={() => setSelectedFilter('Refusal')}
            isFilterable={true}
                tooltip="Incidents where entry was refused."
          />
          <StatCard
            title="Ejections"
            value={incidentStats.ejections}
                icon={<UsersIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />}
                isSelected={selectedFilter === 'Ejection'}
                onClick={() => setSelectedFilter('Ejection')}
            isFilterable={true}
                tooltip="Incidents where someone was ejected."
          />
          <StatCard
            title="Medicals"
            value={incidentStats.medicals}
                icon={<HeartIcon className="h-6 w-6 md:h-8 md:w-8 text-red-400" />}
                isSelected={selectedFilter === 'Medical'}
                onClick={() => setSelectedFilter('Medical')}
                isFilterable={true}
                tooltip="Medical-related incidents."
            />
            <StatCard
                title="Other"
                value={incidentStats.other}
                icon={<QuestionMarkCircleIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />}
                isSelected={selectedFilter === 'Other'}
                onClick={() => setSelectedFilter('Other')}
            isFilterable={true}
                tooltip="All other incident types."
          />
        </div>

        {/* Stats Grid - Second Row */}
        <div>
          {/* Mobile: Venue Occupancy full width */}
          <div className="block md:hidden mb-4">
            <div className="h-[115px] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-3 flex flex-col items-center justify-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 w-full bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100" onClick={() => setIsOccupancyModalOpen(true)}>
              <VenueOccupancy currentEventId={currentEventId} />
            </div>
          </div>
          {/* Mobile: W3W and Top 3 side by side */}
          <div className="block md:hidden grid grid-cols-2 gap-4 mb-8">
            <div className="h-[115px] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-3 flex flex-col items-center justify-center bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <What3WordsMapCard 
                lat={coordinates.lat} 
                lon={coordinates.lon} 
                venueAddress={currentEvent?.venue_address || ''} 
                singleCard
                largeLogo={false}
              />
            </div>
            <div className="h-[115px] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-3 flex flex-col items-center justify-center bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <TopIncidentTypesCard 
                incidents={incidents} 
                onTypeClick={(type: string) => {
                  // Filter by exact incident type
                  setSelectedFilter(type);
                }} 
                selectedType={selectedFilter}
              />
            </div>
          </div>
                    {/* Desktop: Venue, Weather, W3W, Top 3 in a single row */}
          <div className="hidden md:grid grid-cols-4 gap-4 mb-8">
            <div className="h-[115px] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-2 flex flex-col items-center justify-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 col-span-1 bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100" onClick={() => setIsOccupancyModalOpen(true)}>
              <VenueOccupancy currentEventId={currentEventId} />
            </div>
            <div className="flex flex-col h-[115px] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-2 items-center justify-center hover:shadow-xl hover:-translate-y-1 transition-all duration-200 col-span-1 bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100">
              {currentEvent?.venue_address && (
                <WeatherCard 
                  lat={coordinates?.lat} 
                  lon={coordinates?.lon}
                  locationName={currentEvent.venue_address}
                  eventDate={currentEvent.event_date ?? ''} 
                  startTime={currentEvent.main_act_start_time ?? ''}
                  curfewTime={currentEvent.curfew_time ?? ''}
                />
              )}
            </div>
            <div className="h-[115px] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-2 flex flex-col items-center justify-center bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 col-span-1 cursor-pointer">
              <What3WordsMapCard 
                lat={coordinates.lat} 
                lon={coordinates.lon} 
                venueAddress={currentEvent?.venue_address || ''} 
                singleCard={true}
                largeLogo={false}
              />
            </div>
            <div className="h-[115px] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-2 flex flex-col items-center justify-center bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 col-span-1">
              <TopIncidentTypesCard 
                incidents={incidents} 
                onTypeClick={(type: string) => {
                  // Filter by exact incident type
                  setSelectedFilter(type);
                }} 
                selectedType={selectedFilter}
              />
            </div>
          </div>
        </div>

        {/* Incident Table */}
        <div className="pb-24">
          <IncidentTable 
            key={refreshKey}
            filter={typeof selectedFilter === 'string' ? selectedFilter : undefined} 
            onDataLoaded={setIncidents}
            onToast={addToast}
          />
        </div>
      </div>

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
    </div>
  )
} 