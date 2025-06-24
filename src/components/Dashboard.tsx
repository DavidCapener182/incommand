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
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:block">
            <div className="hidden md:block">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Current Time</h2>
          <p className="text-3xl font-bold text-gray-900 mb-4">{currentTime}</p>
          {nextEvent && (
            <div className="mt-2">
              <h3 className="text-sm font-medium text-gray-500">Time until {nextEvent.title}</h3>
              <p className="text-lg font-bold text-blue-600">{countdown}</p>
            </div>
          )}
            </div>
        </div>
        <div>
            <div className='hidden md:block'>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Schedule</h2>
            </div>
            <div className="space-y-2 mt-2">
            {eventTimings.map((timing, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center p-2 rounded ${
                        timing.isNext ? 'md:bg-blue-50 md:border md:border-blue-200' : ''
                      } `}
              >
                      <span className={`text-sm font-medium ${timing.isNext ? 'md:text-blue-600' : 'text-gray-500'}`}>
                  {timing.title}
                </span>
                      <span className={`text-sm font-bold ${timing.isNext ? 'md:text-blue-700' : 'text-gray-900'}`}>
                  {timing.time}
                </span>
              </div>
            ))}
            </div>
             {eventTimings.length === 0 && !nextEvent && (
              <p className="text-sm text-gray-500">No upcoming event timings</p>
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
        bg-white rounded-lg border border-gray-200 shadow-md p-2 md:p-4 flex flex-col md:flex-row items-center text-center md:text-left
        ${isFilterable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${pulse ? 'animate-pulse-once' : ''}
        relative
        ${className}
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
      <div className="flex-shrink-0 md:mr-4 mb-2 md:mb-0">
        {icon}
      </div>
      <div>
        <p className="text-xs md:text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="mt-1 text-lg md:text-3xl font-semibold text-gray-900">{value}</p>
      </div>
      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute z-20 left-1/2 md:left-auto md:right-0 top-full mt-2 w-40 p-2 bg-gray-800 text-white text-xs rounded shadow-lg -translate-x-1/2 md:translate-x-0">
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

function What3WordsMapCard({ lat, lon, venueAddress, singleCard, largeLogo }: { lat: number; lon: number; venueAddress: string; singleCard: boolean; largeLogo: boolean }) {
  const [w3w, setW3w] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchedLatLon, setSearchedLatLon] = useState<{lat: number, lon: number} | null>(null);
  const [isValidW3W, setIsValidW3W] = useState(false);
  const [w3wCoords, setW3wCoords] = useState<{lat: number, lon: number} | null>(null);

  useEffect(() => {
    if (lat && lon) {
      setLoading(true);
      fetchWhat3Words(lat, lon)
        .then(words => setW3w(words))
        .catch(() => setError('Could not fetch What3Words address'))
        .finally(() => setLoading(false));
    }
  }, [lat, lon]);

  // Validate and convert W3W input
  useEffect(() => {
    if (w3wApi && w3wRegex.test(search.trim())) {
      setIsValidW3W(true);
      w3wApi.convertToCoordinates({ words: search.replace(/^\/+/, '') })
        .then((response: { coordinates?: { lat: number; lng: number } }) => {
          if (response.coordinates) {
            setW3wCoords({ lat: response.coordinates.lat, lon: response.coordinates.lng });
            setError(null);
          } else {
            setW3wCoords(null);
            setError('Not a real What3Words address');
          }
        });
    } else {
      setIsValidW3W(false);
      setW3wCoords(null);
    }
  }, [search]);

  // Handle search submit
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidW3W && w3wCoords) {
      setSearchedLatLon(w3wCoords);
      setModalOpen(true);
    } else if (search) {
      try {
        const coords = await geocodeAddress(search);
        setSearchedLatLon(coords);
        setModalOpen(true);
      } catch {
        setError('Could not geocode searched location');
      }
    }
  };

  // Modal map URL
  const modalLat = searchedLatLon?.lat || lat;
  const modalLon = searchedLatLon?.lon || lon;
  const modalMapUrl = modalLat && modalLon
    ? `https://map.what3words.com/?maptype=roadmap&zoom=17&center=${modalLat},${modalLon}&marker=${modalLat},${modalLon}`
    : null;

  return (
    <>
      {singleCard ? (
        <div
          className="w-full h-full flex items-center justify-center cursor-pointer"
          style={{ minHeight: 0 }}
          onClick={() => setModalOpen(true)}
        >
          {largeLogo ? (
            <img src="/w3w.png" alt="What3Words" className="w-full h-full object-contain" />
          ) : (
            <img src="/w3w.png" alt="What3Words" className="w-2/3 h-2/3 object-contain" />
          )}
        </div>
      ) : (
        <div className="flex gap-4 w-full">
          <div
            className="bg-white rounded-lg shadow p-4 flex items-center justify-center cursor-pointer w-1/2"
            style={{ minHeight: 0, height: '100%' }}
            onClick={() => setModalOpen(true)}
          >
            {largeLogo ? (
              <img src="/w3w.png" alt="What3Words" className="w-full h-full object-contain" />
            ) : (
              <img src="/w3w.png" alt="What3Words" className="w-full h-full object-contain" />
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center justify-center w-1/2" style={{ minHeight: 0, height: '100%' }}>
            <span className="text-gray-400 text-lg font-semibold">Placeholder</span>
          </div>
        </div>
      )}
      <div className="fixed inset-0 z-50 pointer-events-none">
        {modalOpen && (
          <button
            className="absolute top-16 right-4 text-gray-500 hover:text-gray-700 text-3xl z-50 pointer-events-auto bg-white rounded-full shadow-lg px-3 py-1"
            onClick={() => { setModalOpen(false); setSearchedLatLon(null); }}
            aria-label="Close"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          >
            &times;
          </button>
        )}
      </div>
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
    </>
  );
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
      
      const highPriorityIncidentTypes = ['Ejection', 'Code Green', 'Code Black', 'Code Pink'];
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
    // Optionally, refresh incidents list here if needed
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

  return (
    <div className="px-4 sm:px-6 lg:px-8 md:pt-2">
      {/* Event Header - Sticky */}
      <div className="sticky top-16 z-20 bg-gray-50 md:bg-transparent md:shadow-none -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-0 pb-2 md:py-0 mb-4">
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
        <div className="md:hidden bg-white shadow-sm rounded-lg">
          {loadingCurrentEvent && <p className="p-3">Loading event...</p>}
          {!loadingCurrentEvent && currentEvent && (
            <div>
              <div className="flex justify-between items-center p-3">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 mr-2">Event</span>
                  <span className="text-base font-semibold text-gray-900">{currentEvent.event_name}</span>
                </div>
                <span className="text-base font-bold text-gray-900">{currentTime}</span>
              </div>
              <hr className="border-t border-gray-200" />
              {nextEvent ? (
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-b-lg">
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
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
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
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-l-md ${
              hasCurrentEvent 
                  ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500`}
          >
            New Incident
          </button>
            <Menu as="div" className="-ml-px block">
              <Menu.Button
                disabled={!hasCurrentEvent}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md ${
                  hasCurrentEvent
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500`}
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
        <p className="text-gray-600 mb-6">
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {/* Venue Occupancy */}
          <div className="h-[90px] md:h-[180px] rounded-lg shadow p-4 flex flex-col items-center justify-center cursor-pointer" onClick={() => setIsOccupancyModalOpen(true)}>
            <VenueOccupancy currentEventId={currentEventId} />
          </div>
  
          {/* WeatherCard - only render on md and up */}
          <div className="hidden md:block h-[180px] rounded-lg shadow p-4 flex flex-col items-center justify-center">
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
  
          <div className="h-[90px] md:h-[180px] rounded-lg shadow p-4 flex flex-col items-center justify-center bg-white">
            {coordinates && (
              <What3WordsMapCard 
                lat={coordinates.lat} 
                lon={coordinates.lon} 
                venueAddress={currentEvent?.venue_address || ''} 
                singleCard
                largeLogo
              />
            )}
          </div>
        </div>

        {/* Incident Table */}
        <div className="pb-24">
          <IncidentTable 
            filter={selectedFilter || undefined} 
            onDataLoaded={setIncidents} 
          />
        </div>
      </div>

      <IncidentCreationModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        onIncidentCreated={handleIncidentCreated}
        initialIncidentType={initialIncidentType}
      />

      {/* Floating Action Button for New Incident (Mobile Only) */}
      <button
        type="button"
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        aria-label="Report New Incident"
        onClick={() => setIsIncidentModalOpen(true)}
      >
        <img src="/icon.png" alt="New Incident" className="w-full h-full object-cover rounded-full" />
      </button>

      {/* Venue Occupancy Modal */}
      <AttendanceModal isOpen={isOccupancyModalOpen} onClose={() => setIsOccupancyModalOpen(false)} currentEventId={currentEventId} />
    </div>
  )
} 