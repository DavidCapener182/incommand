'use client'

import React, { useState, useEffect, useRef } from 'react'
import IncidentTable from './IncidentTable'
import CurrentEvent from './CurrentEvent'
import EventCreationModal from './EventCreationModal'
import IncidentCreationModal from './IncidentCreationModal'
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
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline'
import WeatherCard from './WeatherCard'
import { geocodeAddress } from '../utils/geocoding'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import TrafficReportCard from './TrafficReportCard'
import Modal from 'react-modal'
import what3words from '@what3words/api'

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color?: string
  isSelected?: boolean
  onClick?: () => void
  isFilterable?: boolean
  className?: string
}

interface EventTiming {
  title: string
  time: string
  isNext?: boolean
}

interface TimeCardProps {
  companyId: string | null;
}

const TimeCard: React.FC<TimeCardProps> = ({ companyId }) => {
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('en-GB'));
  const [eventTimings, setEventTimings] = useState<EventTiming[]>([]);
  const [countdown, setCountdown] = useState<string>('');
  const [nextEvent, setNextEvent] = useState<EventTiming | null>(null);
  const [artistName, setArtistName] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-GB'));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!nextEvent) return;

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

    const countdownTimer = setInterval(() => {
      setCountdown(calculateCountdown());
    }, 1000);

    setCountdown(calculateCountdown());

    return () => clearInterval(countdownTimer);
  }, [nextEvent]);

  useEffect(() => {
    if (!companyId) return;
    const fetchEventTimings = async () => {
      if (!companyId) return;
      const { data: event } = await supabase
        .from('events')
        .select(`
          security_call_time,
          main_act_start_time,
          show_down_time,
          show_stop_meeting_time,
          doors_open_time,
          curfew_time,
          event_name,
          support_acts
        `)
        .eq('is_current', true)
        .eq('company_id', companyId)
        .single();

      if (event) {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeNumber = currentHours * 60 + currentMinutes;

        setArtistName(event.event_name);

        // Parse support acts
        let supportActs = [];
        if (event.support_acts) {
          try {
            supportActs = typeof event.support_acts === 'string' ? 
              JSON.parse(event.support_acts) : 
              event.support_acts;
          } catch (e) {
            console.error('Error parsing support acts:', e);
            supportActs = [];
          }
        }

        const timings: EventTiming[] = [
          { title: 'Security Call', time: event.security_call_time },
          { title: 'Show Stop Meeting', time: event.show_stop_meeting_time },
          { title: 'Doors Open', time: event.doors_open_time },
          // Add support acts
          ...supportActs.map((act: { act_name: string; start_time: string }) => ({
            title: act.act_name,
            time: act.start_time
          })),
          { title: event.event_name, time: event.main_act_start_time },
          { title: 'Show Down', time: event.show_down_time },
          { title: 'Curfew', time: event.curfew_time }
        ].filter(timing => timing.time); // Only show timings that have been set

        // Convert times to minutes since midnight for comparison
        const timingsWithMinutes = timings.map(timing => {
          const [hours, minutes] = timing.time.split(':').map(Number);
          const timeInMinutes = hours * 60 + minutes;
          return {
            ...timing,
            minutesSinceMidnight: timeInMinutes
          };
        });

        // Filter to only future events and sort by time
        const futureTimings = timingsWithMinutes
          .filter(t => t.minutesSinceMidnight > currentTimeNumber)
          .sort((a, b) => a.minutesSinceMidnight - b.minutesSinceMidnight);

        // Take only the next 5 events and mark the nearest one
        const nextFiveTimings = futureTimings.slice(0, 5).map((timing, index) => ({
          title: timing.title,
          time: timing.time,
          isNext: index === 0
        }));

        setEventTimings(nextFiveTimings);
        setNextEvent(nextFiveTimings[0] || null);
      }
    };
    fetchEventTimings();
    // Refresh timings every minute
    const refreshTimer = setInterval(fetchEventTimings, 60000);
    return () => clearInterval(refreshTimer);
  }, [currentTime, companyId]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Current Time</h2>
          <p className="text-3xl font-bold text-gray-900 mb-4">{currentTime}</p>
          {nextEvent && (
            <div className="mt-2">
              <h3 className="text-sm font-medium text-gray-500">Time until {nextEvent.title}</h3>
              <p className="text-lg font-bold text-blue-600">{countdown}</p>
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Schedule</h2>
          <div className="space-y-2">
            {eventTimings.map((timing, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center p-2 rounded ${
                  timing.isNext ? 'bg-blue-50 border border-blue-200' : ''
                }`}
              >
                <span className={`text-sm font-medium ${timing.isNext ? 'text-blue-600' : 'text-gray-500'}`}>
                  {timing.title}
                </span>
                <span className={`text-sm font-bold ${timing.isNext ? 'text-blue-700' : 'text-gray-900'}`}>
                  {timing.time}
                </span>
              </div>
            ))}
            {eventTimings.length === 0 && (
              <p className="text-sm text-gray-500">No upcoming event timings</p>
            )}
          </div>
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
  className
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

  return (
    <div 
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-5 mb-2 sm:mb-0 
        ${isFilterable ? 'cursor-pointer' : ''} 
        ${isFilterable && isSelected ? 'border-2 border-blue-500' : 'border border-gray-100'}
        active:scale-95
        mx-1 my-2
        select-none
        ${className}
      `}
      onClick={isFilterable ? onClick : undefined}
      tabIndex={isFilterable ? 0 : -1}
      role={isFilterable ? 'button' : undefined}
      aria-pressed={isSelected}
    >
      <div className="flex flex-col items-center justify-center space-y-1">
        <div className={`${colorClasses[color as keyof typeof colorClasses]} w-9 h-9 mb-1`}>{icon}</div>
        <p className={`text-4xl font-bold text-gray-900 ${pulse ? 'animate-pulse' : ''}`}>{value}</p>
        <h3 className="text-base font-medium text-gray-600 mt-1">{title}</h3>
      </div>
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

const w3wApi = what3words(process.env.NEXT_PUBLIC_WHAT3WORDS_API_KEY || '');
const w3wRegex = /^(?:\s*\/{0,3})?([a-zA-Z]+)\.([a-zA-Z]+)\.([a-zA-Z]+)$/;

function What3WordsMapCard({ lat, lon, venueAddress, singleCard }: { lat: number; lon: number; venueAddress: string; singleCard: boolean }) {
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
    if (w3wRegex.test(search.trim())) {
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
          <img src="/w3w.png" alt="What3Words" className="w-2/3 h-2/3 object-contain" />
        </div>
      ) : (
        <div className="flex gap-4 w-full">
          <div
            className="bg-blue-50 rounded-lg shadow p-4 flex items-center justify-center cursor-pointer w-1/2"
            style={{ minHeight: 0, height: '100%' }}
            onClick={() => setModalOpen(true)}
          >
            <img src="/w3w.png" alt="What3Words" className="w-full h-full object-contain" />
          </div>
          <div className="bg-gray-50 rounded-lg shadow p-4 flex items-center justify-center w-1/2" style={{ minHeight: 0, height: '100%' }}>
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
        className="fixed inset-0 flex items-center justify-center z-40"
        overlayClassName="fixed inset-0 bg-black bg-opacity-60 z-30"
        style={{
          content: {
            width: '90vw',
            height: '90vh',
            maxWidth: '90vw',
            maxHeight: '90vh',
            left: '5vw',
            top: '5vh',
            right: 'auto',
            bottom: 'auto',
            padding: '0',
            borderRadius: '1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
        ariaHideApp={false}
      >
        <div className="bg-white rounded-lg shadow-lg w-full h-full flex flex-col items-center relative">
          {modalMapUrl ? (
            <iframe
              src={modalMapUrl}
              title="What3Words Map Fullscreen"
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '1rem' }}
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400 bg-gray-100 rounded">No map available</div>
          )}
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
  const [hasCurrentEvent, setHasCurrentEvent] = useState(false)
  const [currentEventId, setCurrentEventId] = useState<string | null>(null)
  const [currentEvent, setCurrentEvent] = useState<{
    venue_address: string;
    expected_attendance: string;
    venue_capacity: string;
    event_date?: string;
    main_act_start_time?: string;
    curfew_time?: string;
  } | null>(null)
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number }>({
    lat: 51.5074,
    lon: -0.1278
  })
  const [incidentStats, setIncidentStats] = useState({
    total: 0,
    high: 0,
    open: 0,
    inProgress: 0,
    closed: 0,
    logged: 0,
    avgResolution: 0,
    refusals: 0,
    ejections: 0,
    medical: 0
  })
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const router = useRouter()
  const [loadingCurrentEvent, setLoadingCurrentEvent] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch company_id on mount
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
    if (!companyId) return;
    setLoadingCurrentEvent(true);
    const fetchCurrentEvent = async () => {
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_current', true)
        .eq('company_id', companyId)
        .single();
      if (event) {
        setHasCurrentEvent(true);
        setCurrentEventId(event.id);
        setCurrentEvent({
          venue_address: event.venue_address,
          expected_attendance: event.expected_attendance,
          venue_capacity: event.venue_capacity,
          event_date: event.event_date,
          main_act_start_time: event.main_act_start_time,
          curfew_time: event.curfew_time
        });

        // Get coordinates for the venue address
        if (event.venue_address) {
          try {
            const coords = await geocodeAddress(event.venue_address);
            setCoordinates(coords);
          } catch (error) {
            console.error('Error geocoding address:', error);
          }
        }
      } else {
        setHasCurrentEvent(false);
        setCurrentEventId(null);
        setCurrentEvent(null);
      }
      setLoadingCurrentEvent(false);
    };
    fetchCurrentEvent();
  }, [companyId]);

  const fetchIncidentStats = async () => {
    console.log('Dashboard companyId:', companyId);
    if (!companyId) return;
    try {
      // Get current event first
      const { data: currentEvent } = await supabase
        .from('events')
        .select('id')
        .eq('is_current', true)
        .eq('company_id', companyId)
        .single()

      console.log('Dashboard currentEvent:', currentEvent);

      if (!currentEvent) return

      // Get all incidents for current event
      const { data: incidents, error: incidentsError } = await supabase
        .from('incident_logs')
        .select('*')
        .eq('event_id', currentEvent.id)

      if (incidentsError) {
        console.error('Dashboard incidents fetch error:', incidentsError);
      }

      if (!incidents || incidents.length === 0) {
        console.log('Dashboard incidents fetch returned empty:', incidents);
        return;
      }

      console.log('Dashboard incidents fetched:', incidents);

      const nonSitRepIncidents = incidents.filter(i => i.incident_type.toLowerCase() !== 'sit rep')
      const sitRepIncidents = incidents.filter(i => i.incident_type.toLowerCase() === 'sit rep')

      const isCountable = (i: any) => {
        const type = i.incident_type?.toLowerCase();
        return type !== 'attendance' && type !== 'sit rep';
      };

      setIncidentStats({
        total: incidents.filter(isCountable).length,
        high: incidents.filter(i => ['ejection', 'code green', 'code black', 'code pink'].includes(i.incident_type.toLowerCase()) && !i.is_closed).length,
        open: incidents.filter(i => isCountable(i) && !i.is_closed).length,
        inProgress: nonSitRepIncidents.filter(i => !i.is_closed && i.action_taken && i.status !== 'Logged' && i.incident_type.toLowerCase() !== 'attendance').length,
        closed: incidents.filter(i => isCountable(i) && i.is_closed).length,
        logged: sitRepIncidents.length + nonSitRepIncidents.filter(i => i.status === 'Logged').length,
        avgResolution: 0,
        refusals: incidents.filter(i => i.incident_type.toLowerCase() === 'refusal').length,
        ejections: incidents.filter(i => i.incident_type.toLowerCase() === 'ejection').length,
        medical: incidents.filter(i => ['code green', 'code purple'].includes(i.incident_type.toLowerCase())).length
      })
    } catch (err) {
      console.error('Error fetching incident stats:', err)
    }
  }

  // Cleanup function to handle unsubscribe
  const cleanup = () => {
    if (subscriptionRef.current) {
      console.log('Cleaning up dashboard subscription');
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  };

  useEffect(() => {
    if (!companyId) return;
    fetchIncidentStats();
    // Cleanup on unmount
    return cleanup;
  }, [companyId]);

  // Ensure EventCreationModal never opens if there is a current event
  useEffect(() => {
    if (hasCurrentEvent && isEventModalOpen) {
      setIsEventModalOpen(false);
    }
  }, [hasCurrentEvent]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
      <div className="flex justify-between items-center mb-8">
        {/* <h1 className="text-2xl font-bold">Incidents</h1> */}
      </div>

      {/* Event Header - Sticky */}
      <div className="sticky top-16 z-20 bg-white shadow-sm md:bg-transparent md:shadow-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <CurrentEvent />
          <TimeCard companyId={companyId} />
        </div>
      </div>
      
      {/* Incident Dashboard */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Incident Dashboard</h2>
          <button 
            onClick={() => setIsIncidentModalOpen(true)}
            disabled={!hasCurrentEvent}
            className={`px-4 py-2 rounded-md ${
              hasCurrentEvent 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            New Incident
          </button>
        </div>
        <p className="text-gray-600 mb-6">Track and manage security incidents in real-time</p>
        
        {/* Stats Grid - First Row */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
          <StatCard
            title="Total Incidents"
            value={incidentStats.total}
            icon={<ClipboardDocumentCheckIcon />}
            color="blue"
            isFilterable={true}
            isSelected={selectedFilter === null}
            onClick={() => setSelectedFilter(null)}
            className="min-h-[90px] md:min-h-[180px]"
          />
          <StatCard
            title="High Priority"
            value={incidentStats.high}
            icon={<ExclamationTriangleIcon />}
            color="red"
            isFilterable={true}
            isSelected={selectedFilter === 'high'}
            onClick={() => setSelectedFilter(selectedFilter === 'high' ? null : 'high')}
            className="min-h-[90px] md:min-h-[180px]"
          />
          <StatCard
            title="Open"
            value={incidentStats.open}
            icon={<FolderOpenIcon />}
            color="yellow"
            isFilterable={true}
            isSelected={selectedFilter === 'open'}
            onClick={() => setSelectedFilter(selectedFilter === 'open' ? null : 'open')}
            className="min-h-[90px] md:min-h-[180px]"
          />
          <StatCard
            title="Closed"
            value={incidentStats.closed}
            icon={<CheckCircleIcon />}
            color="green"
            isFilterable={true}
            isSelected={selectedFilter === 'closed'}
            onClick={() => setSelectedFilter(selectedFilter === 'closed' ? null : 'closed')}
            className="min-h-[90px] md:min-h-[180px]"
          />
          <StatCard
            title="Refusals"
            value={incidentStats.refusals}
            icon={<UsersIcon />}
            color="red"
            isFilterable={true}
            isSelected={selectedFilter === 'refusals'}
            onClick={() => setSelectedFilter(selectedFilter === 'refusals' ? null : 'refusals')}
            className="min-h-[90px] md:min-h-[180px]"
          />
          <StatCard
            title="Ejections"
            value={incidentStats.ejections}
            icon={<UsersIcon />}
            color="red"
            isFilterable={true}
            isSelected={selectedFilter === 'ejections'}
            onClick={() => setSelectedFilter(selectedFilter === 'ejections' ? null : 'ejections')}
            className="min-h-[90px] md:min-h-[180px]"
          />
        </div>

        {/* Stats Grid - Second Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 auto-rows-fr">
          <div className="h-full w-full min-h-[180px] rounded-lg shadow p-4 flex flex-col items-center justify-center">
            <VenueOccupancy currentEventId={currentEventId} />
          </div>
          <div className="h-full w-full min-h-[180px] rounded-lg shadow p-4 flex flex-col items-center justify-center">
            {currentEvent?.venue_address && (
              <WeatherCard 
                lat={coordinates.lat} 
                lon={coordinates.lon} 
                locationName={currentEvent.venue_address} 
                eventDate={currentEvent.event_date || ''}
                startTime={currentEvent.main_act_start_time || ''}
                curfewTime={currentEvent.curfew_time || ''}
              />
            )}
          </div>
          <div className="h-full w-full min-h-[180px] rounded-lg shadow p-4 flex flex-col items-center justify-center cursor-pointer bg-blue-50">
            {coordinates.lat && coordinates.lon && (
              <What3WordsMapCard lat={coordinates.lat} lon={coordinates.lon} venueAddress={currentEvent?.venue_address || ''} singleCard />
            )}
          </div>
          <div className="h-full w-full min-h-[180px] rounded-lg shadow p-4 flex flex-col items-center justify-center bg-gray-50">
            <span className="text-gray-400 text-lg font-semibold">Placeholder</span>
          </div>
        </div>

        {/* Incident Table */}
        <div className="pb-24">
          <IncidentTable filter={selectedFilter || undefined} />
        </div>
      </div>

      <IncidentCreationModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        onIncidentCreated={async () => {
          await fetchIncidentStats();
          window.location.reload(); // Force full page reload after incident creation
        }}
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
    </div>
  )
} 