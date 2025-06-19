'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import EventCreationModal from './EventCreationModal'
import { supabase } from '../lib/supabase'

const GREETINGS = ['Welcome', 'Hello', 'Hi', 'Greetings', 'Hey', 'Good to see you', 'Salutations'];

function getRandomGreeting() {
  if (typeof window !== 'undefined') {
    let greeting = sessionStorage.getItem('greeting');
    if (!greeting) {
      greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      sessionStorage.setItem('greeting', greeting);
    }
    return greeting;
  }
  return GREETINGS[0];
}

export default function Navigation() {
  const pathname = usePathname() || '';
  const { signOut, user } = useAuth()
  const [reportsOpen, setReportsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNoEventModal, setShowNoEventModal] = useState(false);
  const [showEventCreation, setShowEventCreation] = useState(false);
  const [hasCurrentEvent, setHasCurrentEvent] = useState<boolean | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === '/incidents' && pathname === '/') {
      return 'border-red-500 text-white'
    }
    return pathname === path ? 'border-red-500 text-white' : 'border-transparent text-white hover:border-white hover:text-gray-100'
  }

  useEffect(() => {
    async function checkCurrentEvent() {
      const { data: event } = await supabase
        .from('events')
        .select('id')
        .eq('is_current', true)
        .single();
      setHasCurrentEvent(!!event);
    }
    checkCurrentEvent();
  }, []);

  // Fetch profile info as soon as user is available
  useEffect(() => {
    if (user) {
      setProfileLoading(true);
      (async () => {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, email, company, avatar_url')
          .eq('id', user.id)
          .single();
        setProfile(data);
        setProfileLoading(false);
      })();
    } else {
      setProfile(null);
    }
  }, [user]);

  // Fetch profile info when dropdown is opened (for latest info)
  useEffect(() => {
    if (profileDropdownOpen && user) {
      setProfileLoading(true);
      (async () => {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, email, company, avatar_url')
          .eq('id', user.id)
          .single();
        setProfile(data);
        setProfileLoading(false);
      })();
    }
  }, [profileDropdownOpen, user]);

  function getInitials(nameOrEmail: string) {
    if (!nameOrEmail) return '?';
    // If it's a name with spaces, use first and last initial
    const parts = nameOrEmail.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    // If it's an email, use first two letters before @
    const emailPart = nameOrEmail.split('@')[0];
    if (emailPart.length >= 2) {
      return (emailPart[0] + emailPart[1]).toUpperCase();
    }
    if (emailPart.length === 1) {
      return (emailPart[0] + emailPart[0]).toUpperCase();
    }
    return '?';
  }

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
      if (profileDropdownOpen) setProfileDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen, profileDropdownOpen]);

  return (
    <nav className="bg-[#2A3990] border-b border-[#1e2a6a] sticky top-0 z-50 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Image
                src="/inCommand.png"
                alt="inCommand Logo"
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
                  onClick={() => {
                    if (!hasCurrentEvent) {
                      setShowNoEventModal(true);
                      return;
                    }
                    setReportsOpen((open) => !open);
                  }}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium focus:outline-none ${pathname.startsWith('/reports') || pathname.startsWith('/analytics') ? 'border-red-500 text-white' : 'border-transparent text-white hover:border-white hover:text-gray-100'} ${!hasCurrentEvent ? 'opacity-50' : ''}`}
                  aria-haspopup="true"
                  aria-expanded={reportsOpen}
                >
                  Reports
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {reportsOpen && hasCurrentEvent && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded shadow-lg z-10">
                    <Link href="/analytics" className="block px-4 py-2 text-gray-800 hover:bg-gray-100" onClick={() => setReportsOpen(false)}>Analytics</Link>
                    <Link href="/reports" className="block px-4 py-2 text-gray-800 hover:bg-gray-100" onClick={() => setReportsOpen(false)}>End of Event Report</Link>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  if (!hasCurrentEvent) {
                    setShowNoEventModal(true);
                    return;
                  }
                  window.location.href = '/callsign-assignment';
                }}
                className={`${isActive('/callsign-assignment')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium bg-transparent border-none ${!hasCurrentEvent ? 'opacity-50' : ''}`}
              >
                Callsigns
              </button>
              <Link href="/help" className={`${isActive('/help')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Help & Glossary
              </Link>
              <Link href="/settings" className={`${isActive('/settings')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Settings
              </Link>
            </div>
          </div>
          {/* User Avatar/Profile Dropdown - always far right */}
          <div className="flex items-center ml-auto">
            {user && (
              <div className="relative flex items-center space-x-3">
                {/* Welcome message with first name, left of avatar */}
                <span className="hidden md:inline-block text-white font-semibold text-base mr-2">
                  {getRandomGreeting()}, {(() => {
                    if (profile?.full_name) return profile.full_name.split(' ')[0];
                    return '';
                  })()}
                </span>
                <button
                  className="flex items-center focus:outline-none"
                  onClick={() => setProfileDropdownOpen((open) => !open)}
                >
                  {profile && profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center text-lg font-bold text-blue-700 border-2 border-blue-500">
                      {getInitials(profile?.full_name ? profile.full_name : user.email)}
                    </div>
                  )}
                </button>
                {profileDropdownOpen && (
                  <div className="fixed right-4 top-16 w-72 bg-white rounded shadow-lg z-50 p-4 min-w-[260px] max-w-xs break-words">
                    {profileLoading ? (
                      <div className="text-center text-gray-500">Loading...</div>
                    ) : (
                      <>
                        <div className="flex items-center mb-3">
                          {profile && profile.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt="Profile"
                              className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 mr-3"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-xl font-bold text-blue-700 border-2 border-blue-500 mr-3">
                              {getInitials(profile?.full_name ? profile.full_name : user.email)}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{profile?.full_name || '-'}</div>
                            <div className="text-sm text-gray-600 truncate">{profile?.email || user.email}</div>
                            <div className="text-xs text-gray-500 truncate">{profile?.company || '-'}</div>
                          </div>
                        </div>
                        <button
                          className="w-full mb-2 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          onClick={() => { setProfileDropdownOpen(false); router.push('/profile'); }}
                        >
                          Open Profile
                        </button>
                        <button
                          className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                          onClick={() => { setProfileDropdownOpen(false); signOut(); }}
                        >
                          Sign Out
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
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
          <span className="mb-6 text-2xl font-bold text-white">Menu</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="self-end mb-6 p-2 text-white hover:text-gray-200 focus:outline-none"
            aria-label="Close menu"
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <Link href="/incidents" className="block py-2 px-2 text-white rounded hover:bg-[#1e2a6a] text-left" onClick={() => setMobileMenuOpen(false)}>
            Incidents
          </Link>
          <div className="relative">
            <button
              className={`w-full flex justify-between items-center py-2 px-2 text-white rounded hover:bg-[#1e2a6a] focus:outline-none ${!hasCurrentEvent ? 'opacity-50' : ''}`}
              onClick={() => {
                if (!hasCurrentEvent) {
                  setShowNoEventModal(true);
                  return;
                }
                setReportsOpen((open) => !open);
              }}
            >
              Reports
              <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {reportsOpen && hasCurrentEvent && (
              <div className="ml-4 mt-1 bg-white rounded shadow-lg z-10">
                <Link href="/analytics" className="block px-4 py-2 text-gray-800 hover:bg-gray-100" onClick={() => setReportsOpen(false)}>Analytics</Link>
                <Link href="/reports" className="block px-4 py-2 text-gray-800 hover:bg-gray-100" onClick={() => setReportsOpen(false)}>End of Event Report</Link>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (!hasCurrentEvent) {
                setShowNoEventModal(true);
                return;
              }
              window.location.href = '/callsign-assignment';
              setMobileMenuOpen(false);
            }}
            className={`block py-2 px-2 text-white rounded hover:bg-[#1e2a6a] text-left ${!hasCurrentEvent ? 'opacity-50' : ''}`}
          >
            Callsigns
          </button>
          <Link href="/help" className="block py-2 px-2 text-white rounded hover:bg-[#1e2a6a] text-left" onClick={() => setMobileMenuOpen(false)}>
            Help & Glossary
          </Link>
          <Link href="/settings" className="block py-2 px-2 text-white rounded hover:bg-[#1e2a6a] text-left" onClick={() => setMobileMenuOpen(false)}>
            Settings
          </Link>
          <button
            onClick={() => { setMobileMenuOpen(false); signOut(); }}
            className="mt-6 py-2 px-2 w-full text-white rounded focus:outline-none hover:underline text-left"
          >
            Sign Out
          </button>
        </div>
      )}
      {/* No Event Modal */}
      {showNoEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">No Active Event</h3>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-bold">Create a new event</span> to see Reports and Callsigns.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNoEventModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowNoEventModal(false); setShowEventCreation(true); }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Event Creation Modal */}
      {showEventCreation && (
        <EventCreationModal isOpen={showEventCreation} onClose={() => setShowEventCreation(false)} onEventCreated={() => { setShowEventCreation(false); window.location.reload(); }} />
      )}
    </nav>
  )
} 