'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import EventCreationModal from './EventCreationModal'
import { supabase } from '../lib/supabase'
import ProfileCard from './ProfileCard'
import './ProfileCard.css'

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
  const [showProfileCard, setShowProfileCard] = useState(false);
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
    <>
      <nav className="bg-[#2A3990] border-b border-[#1e2a6a] sticky top-0 z-50 shadow">
        <div className="px-4 sm:px-6 lg:px-8">
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
              <div className="hidden xl:ml-12 xl:flex xl:space-x-12 items-center">
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
                {/* Temporary Admin Button */}
                <Link href="/admin" className={`${isActive('/admin')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Admin
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
                    onClick={() => setShowProfileCard(true)}
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
                </div>
              )}
            </div>
            {/* Hamburger for mobile */}
            <div className="xl:hidden flex items-center">
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
      </nav>
      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div ref={mobileMenuRef} className="xl:hidden fixed top-0 right-0 w-64 h-full bg-[#2A3990] shadow-lg z-50 animate-slide-in flex flex-col p-6">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="self-end p-2 mb-4 text-white"
            aria-label="Close menu"
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <Link href="/incidents" className={`${isActive('/incidents')} block py-3 px-4 rounded-md text-lg font-medium text-white hover:bg-[#3b4a9b]`}>Incidents</Link>

          <button
            onClick={() => {
              if (!hasCurrentEvent) {
                setShowNoEventModal(true);
                return;
              }
              setReportsOpen((open) => !open);
            }}
            className={`w-full text-left py-3 px-4 rounded-md text-lg font-medium text-white hover:bg-[#3b4a9b] ${!hasCurrentEvent ? 'opacity-50' : ''}`}
          >
            Reports
          </button>
          {reportsOpen && hasCurrentEvent && (
            <div className="pl-8">
              <Link href="/analytics" className="block py-2 px-4 rounded-md text-base text-gray-200 hover:bg-[#4c5aa9]" onClick={() => setMobileMenuOpen(false)}>Analytics</Link>
              <Link href="/reports" className="block py-2 px-4 rounded-md text-base text-gray-200 hover:bg-[#4c5aa9]" onClick={() => setMobileMenuOpen(false)}>End of Event Report</Link>
            </div>
          )}

          <button
            onClick={() => {
              if (!hasCurrentEvent) {
                setShowNoEventModal(true);
                return;
              }
              window.location.href = '/callsign-assignment';
            }}
            className={`block w-full text-left py-3 px-4 rounded-md text-lg font-medium text-white hover:bg-[#3b4a9b] ${!hasCurrentEvent ? 'opacity-50' : ''}`}
          >
            Callsigns
          </button>
          <Link href="/help" className={`${isActive('/help')} block py-3 px-4 rounded-md text-lg font-medium text-white hover:bg-[#3b4a9b]`}>Help & Glossary</Link>
          <Link href="/settings" className={`${isActive('/settings')} block py-3 px-4 rounded-md text-lg font-medium text-white hover:bg-[#3b4a9b]`}>Settings</Link>
          <Link href="/admin" className={`${isActive('/admin')} block py-3 px-4 rounded-md text-lg font-medium text-white hover:bg-[#3b4a9b]`}>Admin</Link>

          <div className="mt-auto">
            <button onClick={() => {
              signOut();
              setMobileMenuOpen(false);
            }} className="w-full text-left py-3 px-4 rounded-md text-lg font-medium text-red-400 hover:bg-[#3b4a9b] hover:text-red-300">
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* No Event Selected Modal */}
      {showNoEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-900">No Event Selected</h3>
            <p className="text-gray-700 mb-6">You must select a current event to access this feature.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowNoEventModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowNoEventModal(false);
                  setShowEventCreation(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}

      {showEventCreation && (
        <EventCreationModal 
          isOpen={showEventCreation} 
          onClose={() => setShowEventCreation(false)} 
          onEventCreated={() => { 
            setShowEventCreation(false); 
            window.location.reload(); 
          }} 
        />
      )}
      
      {showProfileCard && user && profile && (
        <>
          {/* Overlay to close the card when clicking outside */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setShowProfileCard(false)}
          />
          {/* Dropdown ProfileCard below profile photo, fully inside screen */}
          <div
            className="fixed z-50"
            style={{
              top: '60px', // below the profile photo (which is 36px + margin)
              right: '16px',
              maxWidth: '360px',
              width: '96vw',
              minWidth: '220px',
              maxHeight: '80vh',
              boxSizing: 'border-box',
              pointerEvents: 'none',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <div style={{ pointerEvents: 'auto', width: '100%' }}>
              <ProfileCard 
                name={profile.full_name || 'User'}
                title={profile.company || 'No company'}
                handle={user.email}
                status="Online"
                contactText="Edit Profile"
                avatarUrl={profile.avatar_url || ''}
                showUserInfo={true}
                enableTilt={true}
                className=""
                onContactClick={() => {
                  setShowProfileCard(false);
                  router.push('/profile');
                }}
              />
            </div>
          </div>
        </>
      )}
    </>
  )
} 