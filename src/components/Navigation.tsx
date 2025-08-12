'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { ROLES } from '../types/auth'
import EventCreationModal from './EventCreationModal'
import { supabase } from '../lib/supabase'
import ProfileCard from './ProfileCard'
import NotificationDrawer from './NotificationDrawer'
import './ProfileCard.css'
import { useNotificationDrawer } from '../contexts/NotificationDrawerContext'
import { UsersIcon, ExclamationTriangleIcon, StarIcon, BoltIcon, BuildingOffice2Icon } from '@heroicons/react/24/solid'

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

// Add sun/moon icons
const SunIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 7.07l-1.41-1.41M6.34 6.34L4.93 4.93m12.02 0l-1.41 1.41M6.34 17.66l-1.41 1.41" />
  </svg>
);
const MoonIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
  </svg>
);

// Theme toggle logic
function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = (t: 'light' | 'dark') => setThemeState(t);
  return [theme, setTheme] as const;
}

export default function Navigation() {
  const pathname = usePathname() || '';
  const { signOut, user, role } = useAuth();
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
  const { isOpen: notificationDrawerOpen, setIsOpen: setNotificationDrawerOpen } = useNotificationDrawer();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const router = useRouter();
  const [theme, setTheme] = useTheme();
  const [eventChats, setEventChats] = useState<{id: string, name: string, type: string}[]>([]);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [selectedEventChatId, setSelectedEventChatId] = useState<string | null>(null);

  console.log("Navigation component mounted");

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

  // Get last viewed timestamp for filtering notifications
  const getLastViewedTimestamp = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastViewedNotifications') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    }
    return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  };

  // Check for unread notifications using timestamp filtering
  useEffect(() => {
    const checkUnreadNotifications = async () => {
      try {
        const lastViewed = getLastViewedTimestamp();
        
        // Fetch actual recent actions using timestamp filter to get real count
        const response = await fetch(`/api/notifications/recent-actions?lastViewed=${encodeURIComponent(lastViewed)}`);
        if (response.ok) {
          const data = await response.json();
          // Count actual unread notifications
          const unreadCount = data.actions?.length || 0;
          setUnreadNotifications(unreadCount);
        } else {
          // Fallback to 0 if API fails
          setUnreadNotifications(0);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
        setUnreadNotifications(0);
      }
    };

    checkUnreadNotifications();
    
    // Check every 30 seconds for new notifications
    const interval = setInterval(checkUnreadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllNotificationsRead = () => {
    setUnreadNotifications(0);
    // In production, this would also update the backend
  };

  const handleClearAllNotifications = () => {
    setUnreadNotifications(0);
    // In production, this would clear all notifications from the backend
  };

  useEffect(() => {
    async function fetchCurrentEvent() {
      const { data: event, error } = await supabase
        .from('events')
        .select('id, event_name')
        .eq('is_current', true)
        .single();
      console.log('Fetched current event:', event, error);
      setCurrentEvent(event);
    }
    fetchCurrentEvent();
  }, []);

  useEffect(() => {
    async function fetchChats() {
      if (!currentEvent?.id) {
        console.log('No current event, skipping chat fetch');
        return;
      }
      const { data, error } = await supabase
        .from('event_chats')
        .select('id, name, type')
        .eq('event_id', currentEvent.id);
      console.log('Fetched event chats:', data, error);
      if (!error) setEventChats(data);
    }
    fetchChats();
  }, [currentEvent]);

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
                  Staff
                </button>
                <Link href="/help" className={`${isActive('/help')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Help & Glossary
                </Link>
                <Link href="/settings" className={`${isActive('/settings')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Settings
                </Link>
                {/* Admin Button - only show for admin users */}
                {(role === ROLES.ADMIN || role === ROLES.SUPERADMIN) && (
                  <Link href="/admin" className={`${isActive('/admin')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                    Admin
                  </Link>
                )}
                {/* Theme Toggle Button */}
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="ml-4 p-2 rounded-full bg-white/90 text-blue-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shadow"
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? SunIcon : MoonIcon}
                </button>
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
                  {/* Profile Photo */}
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

                  {/* Notification Bell - now on the right side of profile */}
                  <button
                    onClick={() => setNotificationDrawerOpen(true)}
                    className="relative p-2 text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#2A3990] rounded-md transition-colors duration-150"
                    aria-label="Open notifications"
                  >
                    {/* Bell Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.124 7.5A8.969 8.969 0 0 1 5.292 3m13.416 0a8.969 8.969 0 0 1 2.168 4.5" />
                    </svg>
                    {/* Notification Badge */}
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[20px] h-5 animate-pulse">
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                      </span>
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
            Staff
          </button>
          <Link href="/help" className={`${isActive('/help')} block py-3 px-4 rounded-md text-lg font-medium text-white hover:bg-[#3b4a9b]`}>Help & Glossary</Link>
          <Link href="/settings" className={`${isActive('/settings')} block py-3 px-4 rounded-md text-lg font-medium text-white hover:bg-[#3b4a9b]`}>Settings</Link>
          {(role === ROLES.ADMIN || role === ROLES.SUPERADMIN) && (
            <Link href="/admin" className={`${isActive('/admin')} block py-3 px-4 rounded-md text-lg font-medium text-white hover:bg-[#3b4a9b]`}>Admin</Link>
          )}
          
          {/* AI Assistant for Mobile */}
          <button
            onClick={() => {
              setNotificationDrawerOpen(true);
              setMobileMenuOpen(false);
              // Switch to chat tab when opening from mobile menu
              setTimeout(() => {
                const chatTab = document.querySelector('[role="tab"][aria-controls="chat-panel"]');
                if (chatTab) {
                  (chatTab as HTMLElement).click();
                }
              }, 100);
            }}
            className="flex items-center w-full py-3 px-4 rounded-md text-lg font-medium text-white hover:bg-[#3b4a9b]"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>AI Assistant</span>
          </button>

          {/* Notification Bell for Mobile */}
          <button
            onClick={() => {
              setNotificationDrawerOpen(true);
              setMobileMenuOpen(false);
            }}
            className="flex items-center justify-between w-full py-3 px-4 rounded-md text-lg font-medium text-white hover:bg-[#3b4a9b]"
          >
            <span>Notifications</span>
            {unreadNotifications > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px] h-5">
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </span>
            )}
          </button>

          <div className="mt-auto">
            <button onClick={async () => {
              try {
                if (signOut && typeof signOut === 'function') {
                  await signOut();
                } else {
                  // Fallback if signOut is not available
                  window.location.href = '/login';
                }
                setMobileMenuOpen(false);
              } catch (error) {
                console.error('Error during logout:', error);
                // Fallback: redirect to login
                window.location.href = '/login';
              }
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

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        unreadCount={unreadNotifications}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onClearAll={handleClearAllNotifications}
      />

      {/* Only render the event group section in the messages sidebar context: */}
      {pathname === '/messages' && (
        <div className="mt-4">
          <div className="flex flex-col bg-white dark:bg-[#232c43] rounded-2xl shadow-md overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <BuildingOffice2Icon className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-base text-gray-900 dark:text-gray-100">
                {currentEvent?.event_name || 'Event'}
                <span className="font-normal text-gray-500 dark:text-gray-400 ml-1">– Community</span>
              </span>
            </div>
            <ul className="flex flex-col gap-1 pl-8 pr-2 pb-3">
              {eventChats.map((group) => (
                <li key={group.id}>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2
                      ${selectedEventChatId === group.id
                        ? 'bg-blue-50 dark:bg-blue-900 font-bold text-[#2A3990] dark:text-blue-200 shadow'
                        : 'hover:bg-blue-50 dark:hover:bg-blue-800 text-gray-800 dark:text-gray-200'}
                    `}
                    onClick={() => setSelectedEventChatId(group.id)}
                  >
                    <UsersIcon className="w-5 h-5 text-blue-400" />
                    <span>{group.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
} 