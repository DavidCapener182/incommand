'use client'

import React, { useState, useEffect } from 'react'
import IncidentTable from './IncidentTable'
import CurrentEvent from './CurrentEvent'
import EventCreationModal from './EventCreationModal'
import VenueOccupancy from './VenueOccupancy'
import { supabase } from '../lib/supabase'
import {
  UsersIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color?: string
  isSelected?: boolean
  onClick?: () => void
  isFilterable?: boolean
}

interface EventTiming {
  title: string
  time: string
  isNext?: boolean
}

const TimeCard: React.FC = () => {
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
    const fetchEventTimings = async () => {
      const { data: event } = await supabase
        .from('events')
        .select(`
          security_call_time,
          main_act_start_time,
          show_down_time,
          show_stop_meeting_time,
          doors_open_time,
          curfew_time,
          event_name
        `)
        .eq('is_current', true)
        .single();

      if (event) {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeNumber = currentHours * 60 + currentMinutes;

        setArtistName(event.event_name);

        const timings: EventTiming[] = [
          { title: 'Security Call', time: event.security_call_time },
          { title: 'Doors Open', time: event.doors_open_time },
          { title: event.event_name, time: event.main_act_start_time },
          { title: 'Show Stop Meeting', time: event.show_stop_meeting_time },
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

        // Take only the next 3 events and mark the nearest one
        const nextThreeTimings = futureTimings.slice(0, 3).map((timing, index) => ({
          title: timing.title,
          time: timing.time,
          isNext: index === 0
        }));

        setEventTimings(nextThreeTimings);
        setNextEvent(nextThreeTimings[0] || null);
      }
    };

    fetchEventTimings();
    // Refresh timings every minute
    const refreshTimer = setInterval(fetchEventTimings, 60000);
    return () => clearInterval(refreshTimer);
  }, []);

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
  isFilterable = false 
}) => {
  const colorClasses = {
    blue: 'text-blue-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500',
    green: 'text-green-500',
  }

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4 
        ${isFilterable ? 'cursor-pointer' : ''} 
        ${isFilterable && isSelected ? 'border-2 border-red-500' : 'border border-gray-100'}`}
      onClick={isFilterable ? onClick : undefined}
    >
      <div className="flex flex-col items-center justify-center space-y-1">
        <div className={`${colorClasses[color as keyof typeof colorClasses]} w-8 h-8`}>
          {icon}
        </div>
        <p className="text-4xl font-bold text-gray-900">{value}</p>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasCurrentEvent, setHasCurrentEvent] = useState(false)

  useEffect(() => {
    const checkCurrentEvent = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('is_current', true)
        .single()
      
      setHasCurrentEvent(!!data)
    }

    checkCurrentEvent()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Incidents</h1>
        {!hasCurrentEvent && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Event
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <CurrentEvent />
        <TimeCard />
      </div>
      
      {/* Incident Dashboard */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Incident Dashboard</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            New Incident
          </button>
        </div>
        <p className="text-gray-600 mb-6">Track and manage security incidents in real-time</p>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard 
            title="Total Incidents" 
            value={0} 
            icon={<UsersIcon className="w-full h-full" />}
            color="blue"
            isSelected={selectedFilter === 'total'}
            onClick={() => setSelectedFilter(selectedFilter === 'total' ? null : 'total')}
            isFilterable={true}
          />
          <StatCard 
            title="High Priority" 
            value={0} 
            icon={<ExclamationTriangleIcon className="w-full h-full" />}
            color="red"
            isSelected={selectedFilter === 'high'}
            onClick={() => setSelectedFilter(selectedFilter === 'high' ? null : 'high')}
            isFilterable={true}
          />
          <StatCard 
            title="Open" 
            value={0} 
            icon={<FolderOpenIcon className="w-full h-full" />}
            color="yellow"
            isSelected={selectedFilter === 'open'}
            onClick={() => setSelectedFilter(selectedFilter === 'open' ? null : 'open')}
            isFilterable={true}
          />
          <StatCard 
            title="In Progress" 
            value={0} 
            icon={<ClockIcon className="w-full h-full" />}
            color="blue"
            isSelected={selectedFilter === 'progress'}
            onClick={() => setSelectedFilter(selectedFilter === 'progress' ? null : 'progress')}
            isFilterable={true}
          />
          <StatCard 
            title="Closed" 
            value={0} 
            icon={<CheckCircleIcon className="w-full h-full" />}
            color="green"
            isSelected={selectedFilter === 'closed'}
            onClick={() => setSelectedFilter(selectedFilter === 'closed' ? null : 'closed')}
            isFilterable={true}
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <VenueOccupancy />
          <StatCard 
            title="Avg. Resolution (h)" 
            value={0} 
            icon={<ClockIcon className="w-full h-full" />}
            color="blue"
          />
          <StatCard 
            title="Refusals/Ejections" 
            value={0} 
            icon={<UsersIcon className="w-full h-full" />}
            color="red"
          />
          <StatCard 
            title="Medical Incidents" 
            value={0} 
            icon={<HeartIcon className="w-full h-full" />}
            color="red"
          />
        </div>

        {/* Red Divider */}
        <div className="border-b-2 border-red-500 my-8"></div>
      </div>

      {/* Incident Log Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Logs</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search incidents..."
              className="w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <IncidentTable />
      </div>

      <EventCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEventCreated={async () => {
          setIsModalOpen(false)
          // The CurrentEvent component will handle its own data refresh
        }}
      />
    </div>
  )
} 