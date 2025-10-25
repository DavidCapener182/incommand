'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navigation from './Navigation'
import BottomNav from './BottomNav'
import HelpCenterPanel from './HelpCenterModal'
import { usePathname, useRouter } from 'next/navigation'
import IncidentCreationModal from './IncidentCreationModal'
import { useNotificationDrawer } from '../contexts/NotificationDrawerContext'
import { IncidentSummaryProvider } from '@/contexts/IncidentSummaryContext'
import { EscalationToastProvider } from '@/contexts/EscalationToastContext'
import { supabase } from '../lib/supabase'
import GlobalEscalationToast from './GlobalEscalationToast'
import PWAInstallPrompt from './PWAInstallPrompt'
import OfflineIndicator from './OfflineIndicator'
import PWAUpdateNotification from './PWAUpdateNotification'
import PWASplashScreen from './PWASplashScreen'
import FloatingActionButton from './FloatingActionButton'
import { FooterSimple } from './FooterSimple'
// FAB components removed (FloatingAIChat, Dock)

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';

  React.useEffect(() => {
    // Define public routes that don't require authentication
    const publicRoutes = ['/', '/features', '/pricing', '/about', '/help', '/privacy', '/terms', '/login', '/signup', '/staffing', '/admin/green-guide', '/invite', '/auth/magic-link'];
    
    if (!loading && !user && !publicRoutes.includes(pathname)) {
      router.push('/login');
    }
    if (!loading && user && ['/login', '/signup'].includes(pathname)) {
      router.push('/incidents');
    }
  }, [user, loading, pathname, router]);

  if (loading) return null;
  return <>{children}</>;
}


export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const [isIncidentModalOpen, setIsIncidentModalOpen] = React.useState(false);
  // Removed floating AI chat state
  const { isOpen: notificationDrawerOpen } = useNotificationDrawer();
  const [hasCurrentEvent, setHasCurrentEvent] = useState<boolean>(true);
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Skip effects for style-lab route
    if (pathname.startsWith('/style-lab')) return;
    
    // Fetch current event on mount
    const fetchCurrentEvent = async () => {
      const { data } = await supabase
        .from('events')
        .select('id')
        .eq('is_current', true)
        .single();
      setHasCurrentEvent(!!data);
    };
    fetchCurrentEvent();
  }, [pathname]);

  useEffect(() => {
    // Skip effects for style-lab route
    if (pathname.startsWith('/style-lab')) return;
    
    const openHandler = () => setIsHelpCenterOpen(true);
    window.addEventListener('openHelpCenterMessagesAI', openHandler as any);
    return () => window.removeEventListener('openHelpCenterMessagesAI', openHandler as any);
  }, [pathname]);

  if (pathname.startsWith('/style-lab')) {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        {children}
      </div>
    );
  }

  // Define routes that should never show the main application navigation
  // Marketing pages have their own navigation, so hide the main nav on all of them
  // Note: '/help' is intentionally excluded so Help pages show the top nav
  const noNavRoutes = ['/', '/features', '/pricing', '/about', '/privacy', '/terms', '/login', '/signup'];
  
  // Only show the main application navigation for authenticated users on operational pages
  const showNav = user && !noNavRoutes.includes(pathname);

  const handleIncidentCreated = async () => {
    setIsIncidentModalOpen(false);
    // Optionally: window.location.reload();
  };

  // Message bubble SVG for AI Chat
  const MessageBubbleIcon = (
    <svg className="w-8 h-8" fill="none" stroke="white" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.436L3 21l1.436-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
    </svg>
  );

  return (
    <IncidentSummaryProvider>
      <EscalationToastProvider>
        <>
          <AuthGate>
          {/* Top status filler to match nav colour on iOS */}
          {showNav && (
            <div className="bg-[#2A3990]" style={{ height: 'env(safe-area-inset-top)' }} />
          )}
          {showNav && <Navigation />}
          <div className="flex flex-col min-h-screen">
            <main 
              id="main"
              role="main"
              className="flex-grow outline-none focus:outline-none"
              style={{
                paddingTop: 'max(env(safe-area-inset-top), 0px)',
                paddingLeft: 'max(env(safe-area-inset-left), 0px)',
                paddingRight: 'max(env(safe-area-inset-right), 0px)',
                paddingBottom: '0', // No padding needed - footer is positioned by flex layout
                marginBottom: 0,
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
            />
          )}
          {showNav && <FloatingActionButton />}
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
          
          {/* FABs removed; sticky BottomNav will provide actions */}
          {/* Modals - Always available */}
          {showNav && (
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
        </>
      </EscalationToastProvider>
    </IncidentSummaryProvider>
  );
}
