// @ts-nocheck
'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '../contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { IncidentSummaryProvider } from '@/contexts/IncidentSummaryContext'
import { EscalationToastProvider } from '@/contexts/EscalationToastContext'
import { supabase } from '../lib/supabase'
import type { Database } from '@/types/supabase'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { MOBILE_MEDIA_QUERY } from '@/lib/constants'
import type { QuickActionItem } from './QuickActionPalette'
// FAB components removed (FloatingAIChat, Dock)

const Navigation = dynamic(() => import('./Navigation'))
const BottomNav = dynamic(() => import('./BottomNav'))
const HelpCenterPanel = dynamic(() => import('./HelpCenterModal'))
const ChatPanel = dynamic(() => import('./ChatPanel'))
const IncidentCreationModal = dynamic(() => import('./IncidentCreationModal'))
const GlobalEscalationToast = dynamic(() => import('./GlobalEscalationToast'))
const PWAInstallPrompt = dynamic(() => import('./PWAInstallPrompt'), { ssr: false })
const OfflineIndicator = dynamic(() => import('./OfflineIndicator'), { ssr: false })
const PWAUpdateNotification = dynamic(() => import('./PWAUpdateNotification'), { ssr: false })
const PWASplashScreen = dynamic(() => import('./PWASplashScreen'), { ssr: false })
const FloatingActionButton = dynamic(() => import('./FloatingActionButton'))
const FooterSimple = dynamic(() => import('./FooterSimple').then((module) => module.FooterSimple))
const LoginLoadingScreen = dynamic(() => import('./LoginLoadingScreen'), { ssr: false })
const MobileAppShell = dynamic(() => import('./mobile/MobileAppShell'))
const QuickActionPalette = dynamic(() => import('./QuickActionPalette'))

const PUBLIC_ROUTES = new Set([
  '/',
  '/features',
  '/pricing',
  '/about',
  '/help',
  '/privacy',
  '/terms',
  '/login',
  '/signup',
  '/staffing',
  '/admin/green-guide',
  '/invite',
  '/auth/magic-link',
])

const NO_NAV_ROUTES = new Set(['/', '/features', '/pricing', '/about', '/privacy', '/terms', '/login', '/signup'])

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';

  React.useEffect(() => {
    if (!loading && !user && !PUBLIC_ROUTES.has(pathname)) {
      router.push('/login');
    }
    if (!loading && user && ['/login', '/signup'].includes(pathname)) {
      router.push('/incidents');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-incommand-page">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}


export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [isIncidentModalOpen, setIsIncidentModalOpen] = React.useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = React.useState(false);
  // Removed floating AI chat state
  const [hasCurrentEvent, setHasCurrentEvent] = useState<boolean>(true);
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const { user } = useAuth();
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY);
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const showNav = Boolean(user) && !NO_NAV_ROUTES.has(pathname);

  useEffect(() => {
    if (pathname.startsWith('/style-lab') || !showNav || isAdminRoute) {
      setCurrentEventId(null);
      return;
    }

    let isMounted = true;
    const fetchCurrentEvent = async () => {
      const { data } = await supabase
        .from<Database['public']['Tables']['events']['Row'], Database['public']['Tables']['events']['Update']>('events')
        .select('id')
        .eq('is_current', true)
        .single();
      if (!isMounted) return;
      setHasCurrentEvent(!!data);
      setCurrentEventId(data ? data.id : null);
    };

    fetchCurrentEvent();
    return () => {
      isMounted = false;
    };
  }, [pathname, showNav, isAdminRoute]);

  useEffect(() => {
    // Skip effects for style-lab route
    if (pathname.startsWith('/style-lab')) return;
    
    const openHandler = () => setIsHelpCenterOpen(true);
    window.addEventListener('openHelpCenterMessagesAI', openHandler as any);
    return () => window.removeEventListener('openHelpCenterMessagesAI', openHandler as any);
  }, [pathname]);

  useEffect(() => {
    if (!showNav) return;

    const openQuickActions = () => setIsQuickActionsOpen(true);
    window.addEventListener('openQuickActions', openQuickActions as EventListener);
    return () => window.removeEventListener('openQuickActions', openQuickActions as EventListener);
  }, [showNav]);

  useEffect(() => {
    if (!showNav) return;

    const handleQuickActionHotkey = (event: KeyboardEvent) => {
      const isQuickActionHotkey = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (!isQuickActionHotkey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName || '';
      const isEditable =
        target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);
      if (isEditable) {
        return;
      }

      event.preventDefault();
      setIsQuickActionsOpen((previous) => !previous);
    };

    document.addEventListener('keydown', handleQuickActionHotkey);
    return () => document.removeEventListener('keydown', handleQuickActionHotkey);
  }, [showNav]);

  useEffect(() => {
    setIsQuickActionsOpen(false);
  }, [pathname]);

  if (pathname.startsWith('/style-lab')) {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        {children}
      </div>
    );
  }

  const quickActions: QuickActionItem[] = showNav
    ? [
        {
          id: 'log-incident',
          label: 'Log New Incident',
          description: 'Open the incident logging modal',
          shortcut: 'N',
          group: 'Create',
          keywords: ['incident', 'log', 'new'],
          onSelect: () => {
            setIsQuickActionsOpen(false);
            setIsIncidentModalOpen(true);
          },
        },
        {
          id: 'incidents',
          label: 'Go to Incidents',
          description: 'Open the control room incident timeline',
          shortcut: 'G I',
          group: 'Navigation',
          keywords: ['home', 'timeline'],
          onSelect: () => {
            setIsQuickActionsOpen(false);
            router.push('/incidents');
          },
        },
        {
          id: 'reports',
          label: 'Go to Reports',
          description: 'Open reporting and exports',
          shortcut: 'R',
          group: 'Navigation',
          keywords: ['reports', 'analytics', 'export'],
          onSelect: () => {
            setIsQuickActionsOpen(false);
            router.push('/reports');
          },
        },
        {
          id: 'analytics',
          label: 'Go to Analytics',
          description: 'View event analytics and trends',
          shortcut: 'A',
          group: 'Navigation',
          keywords: ['charts', 'insights', 'metrics'],
          onSelect: () => {
            setIsQuickActionsOpen(false);
            router.push('/analytics');
          },
        },
        {
          id: 'staffing',
          label: 'Go to Staffing',
          description: 'Manage staff and deployments',
          shortcut: 'S',
          group: 'Navigation',
          keywords: ['staff', 'roster'],
          onSelect: () => {
            setIsQuickActionsOpen(false);
            router.push('/staffing');
          },
        },
        {
          id: 'tasks',
          label: 'Go to Tasks',
          description: 'Open operational task board',
          shortcut: 'T',
          group: 'Navigation',
          keywords: ['todos', 'work items'],
          onSelect: () => {
            setIsQuickActionsOpen(false);
            router.push('/tasks');
          },
        },
        {
          id: 'help',
          label: 'Open Help Center',
          description: 'Open chat and support panel',
          shortcut: 'H',
          group: 'Support',
          keywords: ['support', 'assistant'],
          onSelect: () => {
            setIsQuickActionsOpen(false);
            setIsHelpCenterOpen(true);
          },
        },
        {
          id: 'settings',
          label: 'Go to Settings',
          description: 'Manage account and workspace settings',
          shortcut: 'O',
          group: 'Navigation',
          keywords: ['preferences', 'config'],
          onSelect: () => {
            setIsQuickActionsOpen(false);
            router.push('/settings');
          },
        },
      ]
    : [];

  if (showNav && isMobile && !isAdminRoute) {
    return (
      <IncidentSummaryProvider>
        <EscalationToastProvider>
          <>
            <AuthGate>
              <div className="min-h-screen bg-white dark:bg-incommand-layout">
                <MobileAppShell />
              </div>
            </AuthGate>
            <GlobalEscalationToast />
            <OfflineIndicator />
            <PWAUpdateNotification />
            <PWASplashScreen />
            <PWAInstallPrompt />
            <LoginLoadingScreen />
          </>
        </EscalationToastProvider>
      </IncidentSummaryProvider>
    )
  }

  const handleIncidentCreated = async () => {
    setIsIncidentModalOpen(false);
    // Optionally: window.location.reload();
  };

  return (
    <IncidentSummaryProvider>
      <EscalationToastProvider>
        <>
          <AuthGate>
          {/* Top status filler to match nav colour on iOS */}
          {showNav && (
            <div className="bg-incommand-brand-mobile" style={{ height: 'env(safe-area-inset-top)' }} />
          )}
          {showNav && <Navigation minimal={isAdminRoute} />}
          <div className={`flex flex-col min-h-screen ${isAuthRoute ? 'data-auth-route' : ''}`} data-auth-route={isAuthRoute ? 'true' : undefined}>
            <main 
              id="main"
              role="main"
              className="flex-grow outline-none focus:outline-none"
              data-auth-route={isAuthRoute ? 'true' : undefined}
              style={{
                paddingTop: 'max(env(safe-area-inset-top), 0px)',
                paddingLeft: 'max(env(safe-area-inset-left), 0px)',
                paddingRight: 'max(env(safe-area-inset-right), 0px)',
                paddingBottom: '0', // No padding needed - footer is positioned by flex layout
                marginBottom: 0,
                ...(isAuthRoute ? { backgroundColor: 'transparent' } : {})
              }}
            >
              {children}
            </main>
            {showNav && (
              <div className="hidden md:block mt-0">
                <FooterSimple />
              </div>
            )}
          </div>
          {showNav && (
            <BottomNav
              onOpenHelpCenter={() => {
                try {
                  setIsHelpCenterOpen(true);
                } catch {}
              }}
              onOpenChat={() => {
                try {
                  setIsChatOpen(true);
                } catch {}
              }}
            />
          )}
          {showNav && !isAdminRoute && <FloatingActionButton />}
          {isHelpCenterOpen && (
            <>
              {/* Click-outside overlay (no dim) */}
              <div
                className="fixed inset-0 z-40"
                aria-hidden="true"
                onClick={() => setIsHelpCenterOpen(false)}
              />
              {/* Floating panel */}
              <div 
                className="fixed right-4 bottom-24 md:bottom-8 z-50 w-[min(92vw,28rem)] h-[80vh]"
                style={{
                  right: 'max(env(safe-area-inset-right), 1rem)',
                  bottom: 'max(env(safe-area-inset-bottom), 6rem)',
                  maxHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 2rem)',
                }}
              >
                <HelpCenterPanel isOpen={true} onClose={() => setIsHelpCenterOpen(false)} initialTab="messages" initialMessagesCategory="ai" />
              </div>
            </>
          )}
          
          {/* Chat Panel */}
          {isChatOpen && user && hasCurrentEvent && currentEventId && (
            <ChatPanel
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              eventId={currentEventId}
              companyId={user.user_metadata?.company_id || 'default-company'}
            />
          )}
          
          {/* FABs removed; sticky BottomNav will provide actions */}
          {/* Modals - Always available */}
          {showNav && isIncidentModalOpen && (
            <IncidentCreationModal
              isOpen={isIncidentModalOpen}
              onClose={() => setIsIncidentModalOpen(false)}
              onIncidentCreated={handleIncidentCreated}
            />
          )}
        </AuthGate>
        
          {/* Global Escalation Toast */}
          <GlobalEscalationToast />
          
          {/* PWA Components */}
          <OfflineIndicator />
          <PWAUpdateNotification />
          <PWASplashScreen />
          <PWAInstallPrompt />
          
          {/* Login Loading Screen */}
          <LoginLoadingScreen />

          {/* Global Quick Actions */}
          {showNav && isQuickActionsOpen && (
            <QuickActionPalette
              isOpen={isQuickActionsOpen}
              onClose={() => setIsQuickActionsOpen(false)}
              actions={quickActions}
            />
          )}
        </>
      </EscalationToastProvider>
    </IncidentSummaryProvider>
  );
}
