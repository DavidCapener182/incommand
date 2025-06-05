'use client'

import React, { useState, useEffect } from 'react'
import IncidentTable from './IncidentTable'
import {
  UsersIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
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

const CurrentEvent: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Current Event</h2>
        <p className="text-gray-600">No event selected</p>
      </div>
      <TimeCard />
    </div>
  )
}

const TimeCard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Current Time</h2>
      <p className="text-3xl font-bold text-gray-900">{currentTime}</p>
    </div>
  )
}

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
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CurrentEvent />
      
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <StatCard 
            title="Venue Occupancy" 
            value={0} 
            icon={<UserGroupIcon className="w-full h-full" />}
            color="blue"
          />
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
    </div>
  )
} 