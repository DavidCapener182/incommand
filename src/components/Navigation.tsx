'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

export default function Navigation() {
  const pathname = usePathname() || '';
  const { signOut } = useAuth()
  const [reportsOpen, setReportsOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/incidents' && pathname === '/') {
      return 'border-red-500 text-white'
    }
    return pathname === path ? 'border-red-500 text-white' : 'border-transparent text-white hover:border-white hover:text-gray-100'
  }

  return (
    <nav className="bg-[#2A3990] border-b border-[#1e2a6a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Image
                src="/compact-logo.png"
                alt="Compact Security Logo"
                width={150}
                height={40}
                priority
              />
            </Link>
            <div className="hidden sm:ml-12 sm:flex sm:space-x-12 items-center">
              <Link href="/incidents" className={`${isActive('/incidents')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Incidents
              </Link>
              {/* Reports Dropdown */}
              <div className="relative" onMouseEnter={() => setReportsOpen(true)} onMouseLeave={() => setReportsOpen(false)}>
                <button
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium focus:outline-none ${pathname.startsWith('/reports') || pathname.startsWith('/analytics') ? 'border-red-500 text-white' : 'border-transparent text-white hover:border-white hover:text-gray-100'}`}
                >
                  Reports
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {reportsOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded shadow-lg z-10">
                    <Link href="/analytics" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Analytics</Link>
                    <Link href="/reports" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">End of Event Report</Link>
                  </div>
                )}
              </div>
              <Link href="/callsign-assignment" className={`${isActive('/callsign-assignment')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Callsigns
              </Link>
              <Link href="/help" className={`${isActive('/help')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Help & Glossary
              </Link>
              <Link href="/settings" className={`${isActive('/settings')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Settings
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button 
              onClick={() => signOut()}
              className="ml-3 p-2 text-white hover:text-gray-200 focus:outline-none"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
} 