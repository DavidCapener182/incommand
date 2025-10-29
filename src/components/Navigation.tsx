'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { ROLES } from '../types/auth'
import { useEventMembership } from '../hooks/useEventMembership'
import EventCreationModal from './EventCreationModal'
import { supabase } from '../lib/supabase'
import ProfileMenu from './ProfileMenu'
import NotificationDrawer from './NotificationDrawer'
import { useNotificationDrawer } from '../contexts/NotificationDrawerContext'
import { UsersIcon, ExclamationTriangleIcon, StarIcon, BoltIcon, BuildingOffice2Icon } from '@heroicons/react/24/solid'
import { motion, AnimatePresence } from 'framer-motion'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './ui/navigation-menu'

const GREETINGS = ['Welcome', 'Hello', 'Hi', 'Greetings', 'Hey', 'Good to see you', 'Salutations'];

// Helper component for navigation list items
function ListItem({ title, children, href, ...props }: React.ComponentPropsWithoutRef<'li'> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">{children}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

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
  const { isTemporaryMember, canAccessAdminFeatures, hasActiveMembership } = useEventMembership();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileReportsOpen, setMobileReportsOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
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
  const [companyId, setCompanyId] = useState<string | null>(null);

  console.log("Navigation component mounted");

  const isActive = (path: string) => {
    if (path === '/incidents' && pathname === '/') {
      return 'border-red-500 text-white'
    }
    return pathname === path ? 'border-red-500 text-white' : 'border-transparent text-white/90 hover:border-white/50 hover:text-white transition-all duration-200'
  }

  useEffect(() => {
    let isMounted = true;

    async function checkCurrentEvent() {
      if (!user) {
        if (isMounted) {
          setHasCurrentEvent(null);
        }
        return;
      }

      if (role !== 'superadmin' && !companyId) {
        if (isMounted) {
          setHasCurrentEvent(false);
        }
        return;
      }

      try {
        let query = supabase
          .from('events')
          .select('id')
          .eq('is_current', true);

        if (role !== 'superadmin' && companyId) {
          query = query.eq('company_id', companyId);
        }

        const { data: event, error } = await query.maybeSingle();

        if (!isMounted) return;

        if (error && error.code && error.code !== 'PGRST116') {
          console.error('Failed to check current event for navigation', error);
          setHasCurrentEvent(false);
          return;
        }

        setHasCurrentEvent(!!event);
      } catch (err) {
        if (!isMounted) return;
        console.error('Unexpected error checking current event for navigation', err);
        setHasCurrentEvent(false);
      }
    }

    checkCurrentEvent();

    return () => {
      isMounted = false;
    }
  }, [user, role, companyId]);

  // Fetch profile info as soon as user is available
  useEffect(() => {
    if (user) {
      setProfileLoading(true);
      (async () => {
        console.log('Fetching profile for user:', user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email, company, avatar_url, company_id')
          .eq('id', user.id)
          .single();

        console.log('Profile fetch result:', { data, error });

        if (error) {
          console.error('Profile fetch failed, using user metadata as fallback');
          // Fallback to user metadata if profile fetch fails
          setProfile({
            full_name: user.user_metadata?.full_name || user.email,
            email: user.email,
            company: user.user_metadata?.company || 'Unknown',
            avatar_url: user.user_metadata?.avatar_url,
            company_id: user.user_metadata?.company_id || null
          });
          setCompanyId(user.user_metadata?.company_id || null);
        } else {
          setProfile(data);
          setCompanyId(data?.company_id ?? null);
        }
        setProfileLoading(false);
      })();
    } else {
      setProfile(null);
      setCompanyId(null);
    }
  }, [user]);

  // Fetch profile info when dropdown is opened (for latest info)
  useEffect(() => {
    if (profileDropdownOpen && user) {
      setProfileLoading(true);
      (async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email, company, avatar_url, company_id')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Profile fetch failed on dropdown open, using user metadata as fallback');
          // Fallback to user metadata if profile fetch fails
          setProfile({
            full_name: user.user_metadata?.full_name || user.email,
            email: user.email,
            company: user.user_metadata?.company || 'Unknown',
            avatar_url: user.user_metadata?.avatar_url,
            company_id: user.user_metadata?.company_id || null
          });
          setCompanyId(user.user_metadata?.company_id || null);
        } else {
          setProfile(data);
          setCompanyId(data?.company_id ?? null);
        }
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
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen]);

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

  // Prefer profile avatar; fall back to user metadata if profile lacks it
  const effectiveAvatarUrl = (profile?.avatar_url || user?.user_metadata?.avatar_url || null) as string | null;
  const displayName = (profile?.full_name || user?.user_metadata?.full_name || user?.email || '') as string;

  return (
    <>
      <nav
        role="banner"
        className="bg-[#2A3990] border-b border-[#1e2a6a] sticky top-0 z-50 shadow"
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
                <Link href="/incidents" className="flex-shrink-0 flex items-center" data-tour="dashboard">
                <Image
                  src="/inCommand.png"
                  alt="inCommand Logo"
                  width={150}
                  height={40}
                  priority
                />
              </Link>
              {/* Desktop Nav */}
              <div className="hidden xl:ml-16 xl:flex xl:items-center">
                <NavigationMenu className="text-white" style={{ backgroundColor: 'transparent' }} viewport={false}>
                  <NavigationMenuList className="gap-8">
                    <NavigationMenuItem>
                      <Link href="/incidents" className={`${isActive('/incidents')} inline-flex items-center px-3 py-2 border-b-2 text-base font-medium tracking-tight text-white hover:text-gray-100`}>
                        Incidents
                      </Link>
                    </NavigationMenuItem>
                    
                    {/* Reports Dropdown */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger 
                        className={`!bg-transparent !text-white/90 hover:!text-white !border-transparent hover:!border-white/50 px-3 py-2 text-base font-medium tracking-tight transition-all duration-200 ${pathname.startsWith('/reports') || pathname.startsWith('/analytics') ? '!border-red-500 !text-white' : ''} ${!hasCurrentEvent && !(role === ROLES.ADMIN || role === ROLES.SUPERADMIN) ? 'opacity-50' : ''}`}
                        onClick={() => {
                          if (!hasCurrentEvent && !(role === ROLES.ADMIN || role === ROLES.SUPERADMIN)) {
                            setShowNoEventModal(true);
                            return;
                          }
                        }}
                      >
                        Reports
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="!bg-[#3345A3]/95 !border-white/10 !text-white shadow-xl shadow-black/20 rounded-xl border backdrop-blur-md">
                        <ul className="grid w-[300px] gap-4 p-4">
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/analytics" className="block p-3 rounded-lg hover:bg-white/10 transition-colors">
                                <div className="text-sm font-medium tracking-tight leading-relaxed text-white">Analytics</div>
                                <div className="text-xs text-white/80 leading-relaxed">View event analytics and insights.</div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/analytics?tab=end-of-event" className="block p-3 rounded-lg hover:bg-white/10 transition-colors">
                                <div className="text-sm font-medium tracking-tight leading-relaxed text-white">End of Event Report</div>
                                <div className="text-xs text-white/80 leading-relaxed">Generate comprehensive event reports.</div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <Link 
                        href="/staffing" 
                        className={`${isActive('/staffing')} inline-flex items-center px-3 py-2 border-b-2 text-base font-medium tracking-tight text-white hover:text-gray-100 ${!hasCurrentEvent && !(role === ROLES.ADMIN || role === ROLES.SUPERADMIN) ? 'opacity-50' : ''}`}
                      >
                        Staff
                      </Link>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <Link href="/help" className={`${isActive('/help')} inline-flex items-center px-3 py-2 border-b-2 text-base font-medium tracking-tight text-white hover:text-gray-100`}>
                        Help
                      </Link>
                    </NavigationMenuItem>

                    {canAccessAdminFeatures && (
                      <NavigationMenuItem>
                        <Link href="/settings" className={`${isActive('/settings')} inline-flex items-center px-3 py-2 border-b-2 text-base font-medium tracking-tight text-white hover:text-gray-100`}>
                          Settings
                        </Link>
                      </NavigationMenuItem>
                    )}

                    {/* More Dropdown */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger
                        className={`!bg-transparent !text-white/90 hover:!text-white !border-transparent hover:!border-white/50 px-3 py-2 text-base font-medium tracking-tight transition-all duration-200 ${pathname.startsWith('/about') || pathname.startsWith('/blog') || pathname.startsWith('/careers') || pathname.startsWith('/status') || pathname.startsWith('/features') || pathname.startsWith('/pricing') || pathname.startsWith('/vendors') || pathname.startsWith('/maintenance') || pathname.startsWith('/lost-and-found') ? '!border-red-500 !text-white' : ''}`}
                      >
                        More
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="!bg-[#3345A3]/95 !border-white/10 !text-white shadow-xl shadow-black/20 rounded-xl border backdrop-blur-md">
                        <ul className="grid w-[300px] gap-4 p-4">
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/features" className="block p-3 rounded-lg hover:bg-white/10 transition-colors">
                                <div className="text-sm font-medium tracking-tight leading-relaxed text-white">Features</div>
                                <div className="text-xs text-white/80 leading-relaxed">Explore all platform features.</div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/vendors" className="block p-3 rounded-lg hover:bg-white/10 transition-colors">
                                <div className="text-sm font-medium tracking-tight leading-relaxed text-white">Accreditation Management</div>
                                <div className="text-xs text-white/80 leading-relaxed">Manage Accreditation onboarding and access control.</div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/maintenance" className="block p-3 rounded-lg hover:bg-white/10 transition-colors">
                                <div className="text-sm font-medium tracking-tight leading-relaxed text-white">Maintenance & Assets</div>
                                <div className="text-xs text-white/80 leading-relaxed">Track assets, work orders, and schedules.</div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/lost-and-found" className="block p-3 rounded-lg hover:bg-white/10 transition-colors">
                                <div className="text-sm font-medium tracking-tight leading-relaxed text-white">Lost &amp; Found</div>
                                <div className="text-xs text-white/80 leading-relaxed">Reconcile guest reports with recovered items.</div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/pricing" className="block p-3 rounded-lg hover:bg-white/10 transition-colors">
                                <div className="text-sm font-medium tracking-tight leading-relaxed text-white">Pricing</div>
                                <div className="text-xs text-white/80 leading-relaxed">View pricing plans and options.</div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/about" className="block p-3 rounded-lg hover:bg-white/10 transition-colors">
                                <div className="text-sm font-medium tracking-tight leading-relaxed text-white">About</div>
                                <div className="text-xs text-white/80 leading-relaxed">Learn about our company and mission.</div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/blog" className="block p-3 rounded-lg hover:bg-white/10 transition-colors">
                                <div className="text-sm font-medium tracking-tight leading-relaxed text-white">Blog</div>
                                <div className="text-xs text-white/80 leading-relaxed">Read our latest blog posts.</div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/careers" className="block p-3 rounded-lg hover:bg-white/10 transition-colors">
                                <div className="text-sm font-medium tracking-tight leading-relaxed text-white">Careers</div>
                                <div className="text-xs text-white/80 leading-relaxed">Join our team.</div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/status" className="block p-3 rounded-lg hover:bg-white/10 transition-colors">
                                <div className="text-sm font-medium tracking-tight leading-relaxed text-white">Status</div>
                                <div className="text-xs text-white/80 leading-relaxed">Check system status and uptime.</div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Admin Button - only show for admin users */}
                    {(role === ROLES.ADMIN || role === ROLES.SUPERADMIN) && (
                      <NavigationMenuItem>
                        <Link href="/admin" className={`${isActive('/admin')} inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium text-white hover:text-gray-100`}>
                          Admin
                        </Link>
                      </NavigationMenuItem>
                    )}
                  </NavigationMenuList>
                </NavigationMenu>

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
                  <div className="hidden md:flex md:items-center md:gap-2">
                    <span className="text-white font-semibold text-base">
                      {getRandomGreeting()}, {(() => {
                        if (profile?.full_name) return profile.full_name.split(' ')[0];
                        return '';
                      })()}
                    </span>
                    {isTemporaryMember && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        Guest
                      </span>
                    )}
                  </div>
                  {/* Profile Photo - Mobile optimized touch target (min 44px) */}
                  <button
                    className="flex items-center focus:outline-none touch-target p-2 -m-2 rounded-lg hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] justify-center"
                    onClick={() => setShowProfileCard(true)}
                    aria-label="Open profile"
                  >
                    {effectiveAvatarUrl ? (
                      <Image
                        src={effectiveAvatarUrl}
                        alt="Profile"
                        width={36}
                        height={36}
                        className="w-10 h-10 md:w-9 md:h-9 rounded-full object-cover border-2 border-blue-500"
                        unoptimized
                        onError={(e) => {
                          // If image fails to load, hide it so initials show
                          (e.currentTarget as unknown as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-blue-200 flex items-center justify-center text-lg font-bold text-blue-700 border-2 border-blue-500">
                        {getInitials(displayName)}
                      </div>
                    )}
                  </button>

                  {/* Notification Bell - Mobile optimized touch target (min 44px) */}
                  <button
                    onClick={() => setNotificationDrawerOpen(true)}
                    className="relative touch-target p-3 md:p-2 text-white hover:text-white/80 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#2A3990] rounded-lg transition-colors duration-150 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Open notifications"
                  >
                    {/* Bell Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.124 7.5A8.969 8.969 0 0 1 5.292 3m13.416 0a8.969 8.969 0 0 1 2.168 4.5" />
                    </svg>
                    {/* Notification Badge */}
                    {unreadNotifications > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px] h-5 animate-pulse shadow-lg">
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
            {/* Hamburger for mobile - Enhanced touch target (min 44px) */}
            <div className="xl:hidden flex items-center ml-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="touch-target inline-flex items-center justify-center p-3 rounded-lg text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#2A3990] transition-colors min-h-[44px] min-w-[44px]"
                aria-label={mobileMenuOpen ? "Close main menu" : "Open main menu"}
                aria-expanded={mobileMenuOpen}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
      {/* Mobile Menu Dropdown - Enhanced for mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              className="xl:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div 
              ref={mobileMenuRef} 
              className="xl:hidden fixed top-0 right-0 w-full sm:w-80 h-full bg-[#2A3990] shadow-2xl z-50 flex flex-col"
              style={{
                paddingLeft: 'max(env(safe-area-inset-left), 1.5rem)',
                paddingRight: 'max(env(safe-area-inset-right), 1.5rem)',
                paddingTop: 'max(env(safe-area-inset-top), 1.5rem)',
                paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)',
              }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <motion.button
                onClick={() => setMobileMenuOpen(false)}
                className="self-end touch-target p-3 mb-4 text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                aria-label="Close menu"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
          
          <motion.div
            className="space-y-2 flex-1 overflow-y-auto"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link href="/incidents" className={`${isActive('/incidents')} touch-target block py-4 px-4 rounded-xl text-base font-medium text-white hover:bg-[#3b4a9b] transition-all duration-200 min-h-[44px] flex items-center`} onClick={() => setMobileMenuOpen(false)}>Incidents</Link>

            {/* Reports Dropdown for Mobile */}
            <div>
              <button
                onClick={() => {
                  if (!hasCurrentEvent) {
                    setShowNoEventModal(true);
                    return;
                  }
                  setMobileReportsOpen(!mobileReportsOpen);
                }}
                className={`touch-target w-full text-left py-4 px-4 rounded-xl text-base font-medium text-white hover:bg-[#3b4a9b] transition-all duration-200 min-h-[44px] flex items-center justify-between ${!hasCurrentEvent ? 'opacity-50' : ''}`}
              >
                <span>Reports</span>
                <svg className={`w-5 h-5 transition-transform duration-200 ${mobileReportsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mobileReportsOpen && hasCurrentEvent && (
                <div className="pl-6 space-y-1 py-2">
                  <Link 
                    href="/analytics" 
                    className={`${isActive('/analytics')} touch-target block py-3 px-4 rounded-lg text-sm text-white/80 hover:bg-[#4c5aa9] transition-colors min-h-[44px] flex items-center`} 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Analytics
                  </Link>
                  <Link 
                    href="/analytics?tab=end-of-event" 
                    className={`${isActive('/reports')} touch-target block py-3 px-4 rounded-lg text-sm text-white/80 hover:bg-[#4c5aa9] transition-colors min-h-[44px] flex items-center`} 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    End of Event Report
                  </Link>
                </div>
              )}
            </div>

            <Link 
              href="/staffing" 
              className={`${isActive('/staffing')} touch-target block py-4 px-4 rounded-xl text-base font-medium text-white hover:bg-[#3b4a9b] transition-all duration-200 min-h-[44px] flex items-center ${!hasCurrentEvent && !(role === ROLES.ADMIN || role === ROLES.SUPERADMIN) ? 'opacity-50' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Staff
            </Link>
            <Link href="/help" className={`${isActive('/help')} touch-target block py-4 px-4 rounded-xl text-base font-medium text-white hover:bg-[#3b4a9b] transition-all duration-200 min-h-[44px] flex items-center`} onClick={() => setMobileMenuOpen(false)}>Help</Link>
            {canAccessAdminFeatures && (
              <Link href="/settings" className={`${isActive('/settings')} touch-target block py-4 px-4 rounded-xl text-base font-medium text-white hover:bg-[#3b4a9b] transition-all duration-200 min-h-[44px] flex items-center`} onClick={() => setMobileMenuOpen(false)}>Settings</Link>
            )}
            
            {/* More Dropdown for Mobile */}
            <div>
              <button
                onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
                className="touch-target w-full text-left py-4 px-4 rounded-xl text-base font-medium text-white hover:bg-[#3b4a9b] transition-all duration-200 min-h-[44px] flex items-center justify-between"
              >
                <span>More</span>
                <svg className={`w-5 h-5 transition-transform duration-200 ${mobileMoreOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mobileMoreOpen && (
                <div className="pl-6 space-y-1 py-2">
                  <Link href="/features" className={`${isActive('/features')} touch-target block py-3 px-4 rounded-lg text-sm text-white/80 hover:bg-[#4c5aa9] transition-colors min-h-[44px] flex items-center`} onClick={() => setMobileMenuOpen(false)}>Features</Link>
                  <Link href="/vendors" className={`${isActive('/vendors')} touch-target block py-3 px-4 rounded-lg text-sm text-white/80 hover:bg-[#4c5aa9] transition-colors min-h-[44px] flex items-center`} onClick={() => setMobileMenuOpen(false)}>Accreditation Management</Link>
                  <Link href="/maintenance" className={`${isActive('/maintenance')} touch-target block py-3 px-4 rounded-lg text-sm text-white/80 hover:bg-[#4c5aa9] transition-colors min-h-[44px] flex items-center`} onClick={() => setMobileMenuOpen(false)}>Maintenance &amp; Assets</Link>
                  <Link href="/lost-and-found" className={`${isActive('/lost-and-found')} touch-target block py-3 px-4 rounded-lg text-sm text-white/80 hover:bg-[#4c5aa9] transition-colors min-h-[44px] flex items-center`} onClick={() => setMobileMenuOpen(false)}>Lost &amp; Found</Link>
                  <Link href="/pricing" className={`${isActive('/pricing')} touch-target block py-3 px-4 rounded-lg text-sm text-white/80 hover:bg-[#4c5aa9] transition-colors min-h-[44px] flex items-center`} onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
                  <Link href="/about" className={`${isActive('/about')} touch-target block py-3 px-4 rounded-lg text-sm text-white/80 hover:bg-[#4c5aa9] transition-colors min-h-[44px] flex items-center`} onClick={() => setMobileMenuOpen(false)}>About</Link>
                  <Link href="/blog" className={`${isActive('/blog')} touch-target block py-3 px-4 rounded-lg text-sm text-white/80 hover:bg-[#4c5aa9] transition-colors min-h-[44px] flex items-center`} onClick={() => setMobileMenuOpen(false)}>Blog</Link>
                  <Link href="/careers" className={`${isActive('/careers')} touch-target block py-3 px-4 rounded-lg text-sm text-white/80 hover:bg-[#4c5aa9] transition-colors min-h-[44px] flex items-center`} onClick={() => setMobileMenuOpen(false)}>Careers</Link>
                  <Link href="/status" className={`${isActive('/status')} touch-target block py-3 px-4 rounded-lg text-sm text-white/80 hover:bg-[#4c5aa9] transition-colors min-h-[44px] flex items-center`} onClick={() => setMobileMenuOpen(false)}>Status</Link>
                </div>
              )}
            </div>
            
            {(role === ROLES.ADMIN || role === ROLES.SUPERADMIN) && (
              <Link href="/admin" className={`${isActive('/admin')} touch-target block py-4 px-4 rounded-xl text-base font-medium text-white hover:bg-[#3b4a9b] transition-all duration-200 min-h-[44px] flex items-center`} onClick={() => setMobileMenuOpen(false)}>Admin</Link>
            )}
            
            {/* Divider */}
            <div className="border-t border-white/20 my-4"></div>
            
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
              className="touch-target flex items-center w-full py-4 px-4 rounded-xl text-base font-medium text-white hover:bg-[#3b4a9b] transition-all duration-200 min-h-[44px]"
            >
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="touch-target flex items-center justify-between w-full py-4 px-4 rounded-xl text-base font-medium text-white hover:bg-[#3b4a9b] transition-all duration-200 min-h-[44px]"
            >
              <span>Notifications</span>
              {unreadNotifications > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px] h-5 shadow-lg">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>

            {/* Theme Toggle for Mobile */}
            <button
              onClick={() => {
                setTheme(theme === 'dark' ? 'light' : 'dark');
                setMobileMenuOpen(false);
              }}
              className="touch-target flex items-center w-full py-4 px-4 rounded-xl text-base font-medium text-white hover:bg-[#3b4a9b] transition-all duration-200 min-h-[44px]"
            >
              {theme === 'dark' ? (
                <>
                  {SunIcon}
                  <span className="ml-3">Light Mode</span>
                </>
              ) : (
                <>
                  {MoonIcon}
                  <span className="ml-3">Dark Mode</span>
                </>
              )}
            </button>
          </motion.div>

          {/* Sign Out - Fixed at bottom */}
          <div className="border-t border-white/20 pt-4 mt-4">
            <button 
              onClick={async () => {
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
              }} 
              className="touch-target w-full text-left py-4 px-4 rounded-xl text-base font-semibold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 min-h-[44px] flex items-center"
            >
              Sign Out
            </button>
          </div>
        </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* No Event Selected Modal */}
      {showNoEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="card-modal shadow-3 p-8 max-w-sm w-full">
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-[#3b4a9b]"
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
          {/* Overlay to close the menu when clicking outside */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setShowProfileCard(false)}
          />
          {/* Dropdown ProfileMenu below profile photo, fully inside screen */}
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
              <ProfileMenu />
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
                        : 'hover:bg-blue-50 dark:hover:bg-blue-800 text-gray-800 dark:text-white/80'}
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
