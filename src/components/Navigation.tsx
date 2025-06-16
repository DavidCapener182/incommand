'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

export default function Navigation() {
  const pathname = usePathname() || '';
  const { signOut } = useAuth()
  const [reportsOpen, setReportsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    if (path === '/incidents' && pathname === '/') {
      return 'border-red-500 text-white'
    }
    return pathname === path ? 'border-red-500 text-white' : 'border-transparent text-white hover:border-white hover:text-gray-100'
  }

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen]);

  return (
    <nav className="bg-[#2A3990] border-b border-[#1e2a6a] sticky top-0 z-50 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Image
                src="/compact-logo.png"
                alt="Compact Security Logo"
                width={150}
                height={40}
                priority
              />
            </Link>
            {/* Desktop Nav */}
            <div className="hidden sm:ml-12 sm:flex sm:space-x-12 items-center">
              <Link href="/incidents" className={`${isActive('/incidents')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Incidents
              </Link>
              {/* Reports Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setReportsOpen((open) => !open)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium focus:outline-none ${pathname.startsWith('/reports') || pathname.startsWith('/analytics') ? 'border-red-500 text-white' : 'border-transparent text-white hover:border-white hover:text-gray-100'}`}
                  aria-haspopup="true"
                  aria-expanded={reportsOpen}
                >
                  Reports
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {reportsOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded shadow-lg z-10">
                    <Link href="/analytics" className="block px-4 py-2 text-gray-800 hover:bg-gray-100" onClick={() => setReportsOpen(false)}>Analytics</Link>
                    <Link href="/reports" className="block px-4 py-2 text-gray-800 hover:bg-gray-100" onClick={() => setReportsOpen(false)}>End of Event Report</Link>
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
          {/* Hamburger for mobile */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gray-200 focus:outline-none"
              aria-label="Open main menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div ref={mobileMenuRef} className="sm:hidden fixed top-0 right-0 w-64 h-full bg-[#2A3990] shadow-lg z-50 animate-slide-in flex flex-col p-6">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="self-end mb-6 p-2 text-white hover:text-gray-200 focus:outline-none"
            aria-label="Close menu"
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <Link href="/incidents" className="block py-2 px-2 text-white rounded hover:bg-[#1e2a6a]" onClick={() => setMobileMenuOpen(false)}>
            Incidents
          </Link>
          <div className="relative">
            <button
              className="w-full flex justify-between items-center py-2 px-2 text-white rounded hover:bg-[#1e2a6a] focus:outline-none"
              onClick={() => setReportsOpen((open) => !open)}
            >
              Reports
              <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {reportsOpen && (
              <div className="ml-4 mt-1 bg-white rounded shadow-lg z-10">
                <Link href="/analytics" className="block px-4 py-2 text-gray-800 hover:bg-gray-100" onClick={() => setReportsOpen(false)}>Analytics</Link>
                <Link href="/reports" className="block px-4 py-2 text-gray-800 hover:bg-gray-100" onClick={() => setReportsOpen(false)}>End of Event Report</Link>
              </div>
            )}
          </div>
          <Link href="/callsign-assignment" className="block py-2 px-2 text-white rounded hover:bg-[#1e2a6a]" onClick={() => setMobileMenuOpen(false)}>
            Callsigns
          </Link>
          <Link href="/help" className="block py-2 px-2 text-white rounded hover:bg-[#1e2a6a]" onClick={() => setMobileMenuOpen(false)}>
            Help & Glossary
          </Link>
          <Link href="/settings" className="block py-2 px-2 text-white rounded hover:bg-[#1e2a6a]" onClick={() => setMobileMenuOpen(false)}>
            Settings
          </Link>
          <button
            onClick={() => { setMobileMenuOpen(false); signOut(); }}
            className="mt-6 py-2 px-2 w-full text-white rounded hover:bg-red-600 bg-red-500 focus:outline-none"
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  )
} 