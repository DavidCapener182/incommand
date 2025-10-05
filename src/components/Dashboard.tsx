'use client'

import React, { useState, useEffect, useRef, Fragment, useCallback } from 'react'
import Image from 'next/image'
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
import LiveRiskPulse from './LiveRiskPulse'
import What3WordsSearchCard from './What3WordsSearchCard'
import { geocodeAddress } from '../utils/geocoding'
import { useRouter } from 'next/navigation'
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
import RotatingText from './RotatingText'
import { createPortal } from 'react-dom';
// import StaffDeploymentCard from './StaffDeploymentCard'
import { useStaffAvailability } from '../hooks/useStaffAvailability'
import { logger } from '../lib/logger'

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

// Skeleton Loading Components
const StatCardSkeleton = () => (
  <div className="relative bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 p-2 md:p-3 animate-pulse">
    <div className="flex flex-row items-center justify-between w-full">
      <div className="flex flex-col items-start">
        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-12 mb-1"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
      </div>
      <div className="h-6 w-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
    </div>
  </div>
);

const TimeCardSkeleton = () => (
  <div className="relative bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:block relative">
        <div className="hidden md:block">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-40 mb-2"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-28"></div>
        </div>
      </div>
      <div>
        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-2"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center p-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const CardSkeleton = () => (
  <div className="h-[130px] bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 p-4 flex flex-col items-center justify-center animate-pulse">
    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full mb-2"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-1"></div>
    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
  </div>
);

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
  index?: number
}

interface EventTiming {
  title: string
  time: string
  isNext?: boolean
  isActuallyHappeningNow?: boolean
}

interface TimeCardProps {
  companyId: string | null;
  currentTime: string;
  eventTimings: EventTiming[];
  nextEvent: EventTiming | null;
  countdown: string;
  currentSlot?: EventTiming | null;
  timeSinceLastIncident: string;
}

const TimeCard: React.FC<TimeCardProps> = ({ companyId, currentTime, eventTimings, nextEvent, countdown, currentSlot, timeSinceLastIncident }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative h-full bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] flex flex-col"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative flex-1">
        <div className="md:block relative">
          <div className="hidden md:block">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
            >
              Current Time
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4"
            >
              {currentTime}
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-2 mb-4"
            >
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-100">Time Since Last Incident</h3>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-300">{timeSinceLastIncident}</p>
            </motion.div>
            {nextEvent && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-2"
              >
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-100">Time until {nextEvent.title}</h3>
                <p className="text-lg font-bold text-blue-600 dark:text-gray-100">{countdown}</p>
              </motion.div>
            )}
          </div>
          {/* Mobile: show current time and happening now */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Current Time</h2>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentTime}</p>
              </div>
              {currentSlot && (
                <div className="text-right">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-200">
                    {currentSlot.isActuallyHappeningNow ? 'Happening Now' : 'Happening Next'}
                  </span>
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{currentSlot.title}</div>
                  <div className="text-xs text-gray-700 dark:text-gray-100">{currentSlot.time}</div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <div className='hidden md:block'>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Event Schedule</h2>
          </div>
          <div className="space-y-2 mt-2">
            {eventTimings.map((timing, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className={`flex justify-between items-center p-2 rounded transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        timing.isNext ? 'md:bg-blue-50 md:border md:border-blue-200' : ''
                      } `}
              >
                <span className={`text-sm font-medium ${timing.isNext ? 'md:text-blue-600' : 'text-gray-500 dark:text-gray-100'}`}>{timing.title}</span>
                <span className={`text-sm font-bold ${timing.isNext ? 'md:text-blue-700' : 'text-gray-900 dark:text-gray-100'}`}>{timing.time}</span>
              </motion.div>
            ))}
          </div>
          {eventTimings.length === 0 && !nextEvent && (
            <p className="text-sm text-gray-500 dark:text-gray-100">No upcoming event timings</p>
          )}
        </div>
      </div>
      
      {/* Desktop: Happening Now positioned in bottom left corner */}
      {currentSlot && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
          className="hidden md:block absolute bottom-4 left-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-200 block">
            {currentSlot.isActuallyHappeningNow ? 'Happening Now' : 'Happening Next'}
          </span>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{currentSlot.title}</div>
          <div className="text-xs text-gray-700 dark:text-gray-100">{currentSlot.time}</div>
        </motion.div>
      )}
    </motion.div>
  );
}

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
  showPulse,
  index = 0
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
  const [isDesktop, setIsDesktop] = React.useState(true);
  const [tooltipPosition, setTooltipPosition] = React.useState({ top: 0, left: 0 });
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const checkScreen = () => setIsDesktop(window.innerWidth >= 768);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 10,
        left: rect.left + rect.width / 2
      });
    }
    setShowTooltip(true);
  };

  const baseClasses = `
    relative bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 
    p-2 md:p-3 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-105
    ${isFilterable ? 'cursor-pointer' : ''}
    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#0f172a] shadow-lg scale-105' : 'hover:shadow-xl'}
    ${pulse ? 'animate-pulse' : ''}
    ${className || ''}
  `;

  const content = (
    <div className="flex flex-row items-center justify-between w-full">
      <div className="flex flex-col items-start">
        <motion.div 
          key={value}
          initial={{ scale: 1.1, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-0.5"
        >
          {value}
        </motion.div>
        <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
          {title}
        </div>
      </div>
      <motion.div 
        whileHover={{ rotate: 5, scale: 1.1 }}
        transition={{ duration: 0.2 }}
        className={`${colorClasses[color as keyof typeof colorClasses] || 'text-gray-400'}`}
      >
        {icon}
      </motion.div>
      {showPulse && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
      )}
    </div>
  );

  if (isFilterable) {
    return (
      <motion.div 
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.5, 
          delay: index * 0.1,
          ease: "easeOut"
        }}
        whileHover={{ 
          y: -4,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.95 }}
        className={baseClasses}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {content}
        {tooltip && showTooltip && isDesktop && createPortal(
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed z-[99999] px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-xl whitespace-nowrap"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              transform: 'translateX(-50%)',
              pointerEvents: 'none'
            }}
          >
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </motion.div>,
          document.body
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
      className={baseClasses}
    >
      {content}
    </motion.div>
  );
};

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
    
    // Exclude Attendance, Sit Rep, Artist On/Off Stage, Artist On Stage, and Artist Off Stage
    const filtered = safeIncidents.filter((i: any) => {
      return i && i.incident_type && !['Attendance', 'Sit Rep', 'Artist On/Off Stage', 'Artist On Stage', 'Artist Off Stage', 'Artist off Stage', 'Artist on Stage'].includes(i.incident_type);
    });
    
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
          {/* Clear Filter Button - Show when a filter is active */}
          {selectedType && (
            <button
              onClick={() => onTypeClick('')}
              className="flex items-center justify-center px-2 py-1 rounded text-xs font-medium transition-all duration-200 w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
            >
              <span className="truncate">Clear Filter</span>
            </button>
          )}
          
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
  const [filters, setFilters] = useState<FilterState>({ types: [], statuses: [], priorities: [], query: '' })
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false)
  const [initialIncidentType, setInitialIncidentType] = useState<
    string | undefined
  >(undefined)
  const [hasCurrentEvent, setHasCurrentEvent] = useState(false)
  const [currentEventId, setCurrentEventId] = useState<string | null>(null)
  const [currentEvent, setCurrentEvent] = useState<any | null>(null)
  
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
  const [loadingCurrentEvent, setLoadingCurrentEvent] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('en-GB'));
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
  const [viewMode, setViewMode] = useState<'table' | 'board' | 'timeline' | 'staff'>('table');
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

  const fetchCurrentEvent = useCallback(async () => {
    console.log('Fetching current event...');
    setIsRefreshing(true);
    setLoadingCurrentEvent(true);
    setCurrentEvent(null);
    
    try {
      // First try to fetch without company_id filter (like Navigation component does)
      console.log('Trying to fetch current event without company_id filter...');
      let { data, error } = await supabase
        .from('events')
        .select('*, event_name, venue_name, event_type, event_description, support_acts')
        .eq('is_current', true)
        .single();
      
      console.log('Event fetch result (no company_id filter):', { data, error });
      
      // If that fails and we have a company_id, try with company_id filter
      if ((error || !data) && companyId) {
        console.log('Trying with company_id filter:', companyId);
        const { data: companyData, error: companyError } = await supabase
          .from('events')
          .select('*, event_name, venue_name, event_type, event_description, support_acts')
          .eq('is_current', true)
          .eq('company_id', companyId)
          .single();
        
        console.log('Event fetch result (with company_id filter):', { companyData, companyError });
        
        if (companyData) {
          data = companyData;
          error = null;
        }
      }

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
        console.log('No event found with company_id filter, trying without company_id for superadmin...');
        
        // For superadmin users, try fetching without company_id filter
        if (userRole === 'superadmin') {
          try {
            const { data: superadminData, error: superadminError } = await supabase
              .from('events')
              .select('*, event_name, venue_name, event_type, event_description, support_acts')
              .eq('is_current', true)
              .single();
            
            console.log('Superadmin event fetch result:', { superadminData, superadminError });
            
            if (superadminData) {
              superadminData.venue_name = superadminData.venue_name
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
              setCurrentEvent(superadminData);
              setHasCurrentEvent(true);
              setCurrentEventId(superadminData.id);
              if (superadminData.venue_address) {
                try {
                  const coords = await geocodeAddress(superadminData.venue_address);
                  setCoordinates(coords);
                } catch (error) {
                  logger.error('Error geocoding address', error, { 
                    component: 'Dashboard', 
                    action: 'geocodeAddress',
                    venueAddress: superadminData.venue_address 
                  });
                }
              }
            } else {
              setHasCurrentEvent(false);
              setCurrentEventId(null);
            }
          } catch (superadminErr) {
            console.error('Superadmin event fetch failed:', superadminErr);
            setHasCurrentEvent(false);
            setCurrentEventId(null);
          }
        } else {
          setHasCurrentEvent(false);
          setCurrentEventId(null);
        }
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
  }, [companyId, userRole]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-GB'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate time since last incident and update recent incidents
  useEffect(() => {
    if (incidents && incidents.length > 0) {
      // Get the most recent incident
      const mostRecentIncident = incidents[0]; // Assuming incidents are sorted by timestamp desc
      const lastIncidentTime = new Date(mostRecentIncident.timestamp);
      const now = new Date();
      const timeDiff = now.getTime() - lastIncidentTime.getTime();
      
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
      
      // Update recent incidents (last 3, excluding Attendance and Sit Rep)
      const recentFiltered = incidents
        .filter(inc => !['Attendance', 'Sit Rep'].includes(inc.incident_type))
        .slice(0, 3);
      setRecentIncidents(recentFiltered);
      
      // Dispatch incident summary to BottomNav
      const countableIncidents = incidents.filter(inc => !['Attendance', 'Sit Rep'].includes(inc.incident_type));
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

      window.dispatchEvent(new CustomEvent('updateIncidentSummary', { detail: summary }));
      
      // Dispatch recent incidents for scrolling ticker
      const recentForTicker = incidents.filter(inc => !['Attendance', 'Sit Rep'].includes(inc.incident_type)).slice(0, 5).reverse(); // Get 5 most recent and reverse for logical order (oldest first)
      window.dispatchEvent(new CustomEvent('updateRecentIncidents', { detail: recentForTicker }));
    } else {
      setTimeSinceLastIncident('No incidents');
      setRecentIncidents([]);
      window.dispatchEvent(new CustomEvent('updateIncidentSummary', { detail: 'No incidents' }));
      window.dispatchEvent(new CustomEvent('updateRecentIncidents', { detail: [] }));
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
      
      // First try without company_id filter
      let { data: event, error } = await supabase
        .from('events')
        .select('security_call_time, main_act_start_time, show_down_time, show_stop_meeting_time, doors_open_time, curfew_time, event_name, support_acts')
        .eq('is_current', true)
        .single();
      
      console.log('Event timings fetch result (no company_id filter):', { event, error });
      
      // If that fails and we have a company_id, try with company_id filter
      if ((error || !event) && companyId) {
        console.log('Trying event timings with company_id filter:', companyId);
        const { data: companyEvent, error: companyError } = await supabase
          .from('events')
          .select('security_call_time, main_act_start_time, show_down_time, show_stop_meeting_time, doors_open_time, curfew_time, event_name, support_acts')
          .eq('is_current', true)
          .eq('company_id', companyId)
          .single();
        
        console.log('Event timings fetch result (with company_id filter):', { companyEvent, companyError });
        
        if (companyEvent) {
          event = companyEvent;
          error = null;
        }
      }
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
        // Find current and next slot
        const sortedTimings = timingsWithMinutes.sort((a, b) => a.minutesSinceMidnight - b.minutesSinceMidnight);
        // Find the minutesSinceMidnight for 'Show Down'
        const showDownTiming = sortedTimings.find(t => t.title.toLowerCase().includes('show down'));
        const showDownMinutes = showDownTiming ? showDownTiming.minutesSinceMidnight : null;
        // Filter out 'stand down', 'curfew', and 'show down' from timings for Happening Now
        const filteredTimings = sortedTimings.filter(t => {
          const title = t.title.toLowerCase();
          return !title.includes('stand down') && !title.includes('curfew') && !title.includes('show down');
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
  }, []);

  useEffect(() => {
    const fetchCompanyId = async () => {
      if (!user) return;
      console.log('Fetching company ID for user:', user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      console.log('Profile fetch result:', { profile, profileError });
      
      if (profileError || !profile?.company_id) {
        console.error('Profile error or missing company_id:', { profileError, profile });
        setError('Could not determine your company. Please check your profile.');
        return;
      }
      
      console.log('Setting company ID:', profile.company_id);
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
    fetchCurrentEvent();
  }, [fetchCurrentEvent]);

  // This effect will run when the incident data is passed up from the table
  useEffect(() => {
    if (incidents) {
      // Debug: Log some incident data to understand the structure
      logger.debug('Sample incidents data', { 
        component: 'Dashboard', 
        action: 'incidentDataEffect',
        sampleIncidents: incidents.slice(0, 3).map(inc => ({
          id: inc.id,
          log_number: inc.log_number,
          incident_type: inc.incident_type,
          is_closed: inc.is_closed,
          status: inc.status,
          occurrence: inc.occurrence?.substring(0, 50) + '...'
        }))
      });
      
      // Always use unfiltered incidents for stats - StatCards should show total counts
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
    // No need to force refresh - real-time subscription will handle the update
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
        <Image
          src="/inCommand.png"
          alt="inCommand Logo"
          width={256}
          height={128}
          className="mb-8 object-contain drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)]"
          priority
        />
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
        {/* Floating FABs removed; actions available in sticky bottom nav */}
        <div className="absolute bottom-2 right-4 text-xs text-blue-100 opacity-70 select-none">v{process.env.NEXT_PUBLIC_APP_VERSION}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155] p-6 md:p-8">
      {/* Event Header - Sticky */}
      <div className="md:bg-transparent md:shadow-none -mx-6 md:-mx-8 px-6 md:px-8 pt-0 pb-2 md:py-0 mb-8">
        {/* Desktop view */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <CurrentEvent
            currentTime={currentTime}
            currentEvent={currentEvent}
            loading={loadingCurrentEvent}
            error={error}
            onEventCreated={fetchCurrentEvent}
          />
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
          <LiveRiskPulse className="h-full" />
        </div>

        {/* Mobile view */}
        <div className="md:hidden bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 transition-colors duration-300">
          {loadingCurrentEvent && <p className="p-3">Loading event...</p>}
          {!loadingCurrentEvent && currentEvent && (
            <div>
              <div className="flex justify-between items-center p-3">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 mr-2">Event</span>
                  <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{currentEvent.event_name}</span>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center mb-2">
              <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></div>
              Incident Dashboard
              {isRefreshing && (
                <span className="ml-3 text-sm text-blue-500 flex items-center animate-pulse">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-1 animate-bounce"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-1 animate-bounce delay-150"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></span>
                  <span className="ml-1">Live</span>
                </span>
              )}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Track and manage security incidents in real-time
            </p>
          </div>

        </div>

        
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-3 mb-6">
          {loadingCurrentEvent ? (
            // Show skeleton loading states
            Array.from({ length: 8 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))
          ) : (
            <>
              <StatCard
                title="High Priority"
                value={incidentStats.high}
                icon={<ExclamationTriangleIcon className="h-6 w-6 md:h-8 md:w-8 text-red-400" />}
                isSelected={filters.types.some(type => ['Ejection', 'Code Green', 'Code Black', 'Code Pink', 'Aggressive Behaviour', 'Missing Child/Person', 'Hostile Act', 'Counter-Terror Alert', 'Fire Alarm', 'Evacuation', 'Medical', 'Suspicious Behaviour', 'Queue Build-Up'].includes(type))}
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  types: ['Ejection', 'Code Green', 'Code Black', 'Code Pink', 'Aggressive Behaviour', 'Missing Child/Person', 'Hostile Act', 'Counter-Terror Alert', 'Fire Alarm', 'Evacuation', 'Medical', 'Suspicious Behaviour', 'Queue Build-Up'],
                  statuses: [],
                  priorities: []
                }))}
                isFilterable={true}
                color="red"
                tooltip="High priority incident types including Medical, Ejection, Code alerts, etc."
                showPulse={incidentStats.hasOpenHighPrio}
                index={0}
              />
              <StatCard
                title="Medicals"
                value={incidentStats.medicals}
                icon={<HeartIcon className="h-6 w-6 md:h-8 md:w-8 text-red-400" />}
                isSelected={filters.types.includes('Medical')}
                onClick={() => setFilters(prev => ({ ...prev, types: prev.types.includes('Medical') ? prev.types.filter(t => t !== 'Medical') : ['Medical'] }))}
                isFilterable={true}
                tooltip="Medical-related incidents."
                index={1}
              />
              <StatCard
                title="Open"
                value={incidentStats.open}
                icon={<FolderOpenIcon className="h-6 w-6 md:h-8 md:w-8 text-yellow-400" />}
                isSelected={filters.statuses.includes('open')}
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  statuses: prev.statuses.includes('open') ? prev.statuses.filter(s => s !== 'open') : ['open'],
                  types: [],
                  priorities: []
                }))}
                isFilterable={true}
                color="yellow"
                tooltip="Incidents that are currently open (is_closed = false)."
                index={2}
              />
              <StatCard
                title="Ejections"
                value={incidentStats.ejections}
                icon={<UsersIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />}
                isSelected={filters.types.includes('Ejection')}
                onClick={() => setFilters(prev => ({ ...prev, types: prev.types.includes('Ejection') ? prev.types.filter(t => t !== 'Ejection') : ['Ejection'] }))}
                isFilterable={true}
                tooltip="Incidents where someone was ejected."
                index={3}
              />
              <StatCard
                title="Refusals"
                value={incidentStats.refusals}
                icon={<UserGroupIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />}
                isSelected={filters.types.includes('Refusal')}
                onClick={() => setFilters(prev => ({ ...prev, types: prev.types.includes('Refusal') ? prev.types.filter(t => t !== 'Refusal') : ['Refusal'] }))}
                isFilterable={true}
                tooltip="Incidents where entry was refused."
                index={4}
              />
              <StatCard
                title="Total"
                value={incidentStats.total}
                icon={<ExclamationTriangleIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />}
                isSelected={(filters.types.length + filters.statuses.length + filters.priorities.length) === 0}
                onClick={resetToTotal}
                isFilterable={true}
                tooltip="All incidents (excluding Attendance and Sit Reps)."
                index={5}
              />
              <StatCard
                title="Closed"
                value={incidentStats.closed}
                icon={<CheckCircleIcon className="h-6 w-6 md:h-8 md:w-8 text-green-400" />}
                isSelected={filters.statuses.includes('closed')}
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  statuses: prev.statuses.includes('closed') ? prev.statuses.filter(s => s !== 'closed') : ['closed'],
                  types: [],
                  priorities: []
                }))}
                isFilterable={true}
                color="green"
                tooltip="Incidents that have been closed (is_closed = true)."
                index={6}
              />
              <StatCard
                title="Other"
                value={incidentStats.other}
                icon={<QuestionMarkCircleIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />}
                isSelected={filters.types.length > 0 && !['Refusal','Ejection','Medical'].some(t => filters.types.includes(t))}
                onClick={() => setFilters(prev => ({ ...prev, types: [] }))}
                isFilterable={true}
                tooltip="All other incident types."
                index={7}
              />
            </>
          )}
        </div>



        {/* Stats Grid - Second Row */}
        <div>
          {/* Mobile: Venue Occupancy full width */}
          <div className="block md:hidden mb-4">
            {loadingCurrentEvent ? (
              <CardSkeleton />
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ y: -4 }}
                className="h-[130px] bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 p-4 flex flex-col items-center justify-center cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 w-full text-gray-900 dark:text-gray-100" 
                onClick={() => setIsOccupancyModalOpen(true)}
              >
                <VenueOccupancy currentEventId={currentEventId} />
              </motion.div>
            )}
          </div>
          {/* Mobile: W3W and Top 3 side by side */}
          <div className="block md:hidden grid grid-cols-2 gap-4 mb-8">
            {loadingCurrentEvent ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              <>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ y: -4 }}
                  className="h-[130px] bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 p-4 flex flex-col items-center justify-center text-gray-900 dark:text-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  <What3WordsSearchCard 
                    lat={coordinates.lat} 
                    lon={coordinates.lon} 
                    venueAddress={currentEvent?.venue_address || ''} 
                    singleCard
                    largeLogo={false}
                  />
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileHover={{ y: -4 }}
                  className="h-[130px] bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 p-4 flex flex-col items-center justify-center text-gray-900 dark:text-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  <TopIncidentTypesCard 
                    incidents={incidents} 
                    onTypeClick={(type: string) => {
                      setFilters(prev => ({ ...prev, types: type ? [type] : [] }));
                    }} 
                    selectedType={filters.types[0] || null}
                  />
                </motion.div>
              </>
            )}
          </div>
          {/* Desktop: Venue, Weather, W3W, Top 3, Social Media in a single row */}
          <div className="hidden md:grid grid-cols-4 gap-4 mb-8">
            {loadingCurrentEvent ? (
              Array.from({ length: 5 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))
            ) : (
              <>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ y: -4 }}
                  className="h-[130px] bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 p-4 flex flex-col items-center justify-center cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 col-span-1 text-gray-900 dark:text-gray-100" 
                  onClick={() => setIsOccupancyModalOpen(true)}
                >
                  <VenueOccupancy currentEventId={currentEventId} />
                </motion.div>
                {/* WeatherCard: render only the WeatherCard, no extra card container */}
                {currentEvent?.venue_address && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    whileHover={{ y: -4 }}
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
                  whileHover={{ y: -4 }}
                  className="h-[130px] bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 p-4 flex flex-col items-center justify-center text-gray-900 dark:text-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 col-span-1 cursor-pointer"
                >
                  <What3WordsSearchCard 
                    lat={coordinates.lat} 
                    lon={coordinates.lon} 
                    venueAddress={currentEvent?.venue_address || ''} 
                    singleCard={true}
                    largeLogo={false}
                  />
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  whileHover={{ y: -4 }}
                  className="h-[130px] bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 p-4 flex flex-col items-center justify-center text-gray-900 dark:text-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 col-span-1"
                >
                  <TopIncidentTypesCard 
                    incidents={incidents} 
                    onTypeClick={(type: string) => {
                      setFilters(prev => ({ ...prev, types: type ? [type] : [] }));
                    }} 
                    selectedType={filters.types[0] || null}
                  />
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Incident Table and Staff Deployment */}
        <div className="pb-24">
          <IncidentTable
            key={refreshKey}
            filters={filters}
            onFiltersChange={setFilters}
            onDataLoaded={setIncidents}
            onToast={addToast}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            currentUser={user}
            currentEventId={currentEventId || undefined}
            currentEvent={currentEvent}
          />
          
          {/* Staff Deployment Overview hidden intentionally */}
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

      {/* Floating New Incident Button */}
      {!isIncidentModalOpen && (
        <div className="fixed bottom-32 right-6 z-50">
          <div className="relative">
            <button 
              type="button"
              onClick={() => {
                setInitialIncidentType(undefined)
                setIsIncidentModalOpen(true)
              }}
              disabled={!hasCurrentEvent}
              className={`relative inline-flex items-center px-4 py-3 text-sm font-semibold text-white rounded-full shadow-lg ${
                hasCurrentEvent 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5`}
            >
                          <PlusIcon className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">New Incident</span>
            <span className="sm:hidden">+</span>
          </button>
          </div>
        </div>
      )}
    </div>
  )
} 
