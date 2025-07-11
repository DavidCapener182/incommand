'use client';

import WeatherCard from '@/components/WeatherCard';

export default function DashboardPage() {
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Dashboard Overview</h1>
      
      {/* Incident Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 transition-colors duration-300">
          <h3 className="text-gray-500 dark:text-blue-100 text-sm">Total Incidents</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">31</span>
            <svg className="h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 transition-colors duration-300">
          <h3 className="text-gray-500 dark:text-blue-100 text-sm">High Priority</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">1</span>
            <svg className="h-8 w-8 text-red-500" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 transition-colors duration-300">
          <h3 className="text-gray-500 dark:text-blue-100 text-sm">Open</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">8</span>
            <svg className="h-8 w-8 text-yellow-500" viewBox="0 0 24 24" fill="none">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 transition-colors duration-300">
          <h3 className="text-gray-500 dark:text-blue-100 text-sm">In Progress</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">8</span>
            <svg className="h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 transition-colors duration-300">
          <h3 className="text-gray-500 dark:text-blue-100 text-sm">Closed</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">20</span>
            <svg className="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Venue Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 transition-colors duration-300">
          <h3 className="text-gray-500 dark:text-blue-100 text-sm">Venue Occupancy</h3>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">3,500</span>
            <span className="text-gray-500 dark:text-blue-100 ml-2">/ 3,500</span>
          </div>
          <div className="mt-2 bg-orange-100 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full w-full"></div>
          </div>
          <span className="text-orange-500 text-sm">100%</span>
        </div>

        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 transition-colors duration-300">
          <h3 className="text-gray-500 dark:text-blue-100 text-sm">Refusals</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">4</span>
            <svg className="h-8 w-8 text-red-500" viewBox="0 0 24 24" fill="none">
              <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 transition-colors duration-300">
          <h3 className="text-gray-500 dark:text-blue-100 text-sm">Ejections</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">1</span>
            <svg className="h-8 w-8 text-red-500" viewBox="0 0 24 24" fill="none">
              <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 transition-colors duration-300">
          <WeatherCard 
            lat={51.5033} 
            lon={0.0030} 
            locationName="Peninsula Square, Greenwich Peninsula, London SE10 0DX" 
            eventDate="2024-01-01"
            startTime="18:00"
            curfewTime="23:00"
          />
        </div>
      </div>
      <div className="flex justify-end mb-6">
        <a href="/callsign-assignment" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-colors duration-200">Manage Callsign Assignments</a>
      </div>
    </div>
  );
} 