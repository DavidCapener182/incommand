'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navigation from './Navigation'
import BottomNav from './BottomNav'
import HelpCenterPanel from './HelpCenterModal'
import { usePathname, useRouter } from 'next/navigation'
import IncidentCreationModal from './IncidentCreationModal'
import { useNotificationDrawer } from '../contexts/NotificationDrawerContext'
import { supabase } from '../lib/supabase'
// FAB components removed (FloatingAIChat, Dock)

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';

  React.useEffect(() => {
    if (!loading && !user && !['/login', '/signup'].includes(pathname)) {
      router.push('/login');
    }
    if (!loading && user && ['/login', '/signup'].includes(pathname)) {
      router.push('/incidents');
    }
  }, [user, loading, pathname, router]);

  if (loading) return null;
  return <>{children}</>;
}

// Component to show company name in footer
function CompanyFooter() {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState<string>('');
  const pathname = usePathname() || '';
  const showFooter = !['/login', '/signup'].includes(pathname);

  useEffect(() => {
    if (!user || !showFooter) return;

    const fetchCompanyName = async () => {
      try {
        // Get user's company_id from profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (profileError || !profile?.company_id) {
          console.log('No company found for user');
          return;
        }

        // Get company name
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('name')
          .eq('id', profile.company_id)
          .single();

        if (companyError) {
          console.error('Error fetching company:', companyError);
          return;
        }

        setCompanyName(company?.name || '');
      } catch (err) {
        console.error('Error fetching company name:', err);
      }
    };

    fetchCompanyName();
  }, [user, showFooter]);

  if (!showFooter) return null;

  return (
    <footer className="fixed bottom-0 left-0 w-full z-40 px-4 py-2 flex justify-between items-center text-xs text-white dark:text-gray-100"
      style={{
        background: 'linear-gradient(180deg, #1e326e 0%, #101a3a 100%)',
        boxShadow: '0 -4px 24px 0 rgba(16, 26, 58, 0.12)',
        backdropFilter: 'blur(2px)'
      }}
    >
      <span>
        v0.1.0{companyName && ` Build for ${companyName}`}
      </span>
      <span className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
        support@incommandapp.com
      </span>
    </footer>
  );
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const showNav = !['/login', '/signup'].includes(pathname);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = React.useState(false);
  // Removed floating AI chat state
  const { isOpen: notificationDrawerOpen } = useNotificationDrawer();
  const [hasCurrentEvent, setHasCurrentEvent] = useState<boolean>(true);
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);

  const handleIncidentCreated = async () => {
    setIsIncidentModalOpen(false);
    // Optionally: window.location.reload();
  };

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const openHandler = () => setIsHelpCenterOpen(true);
    window.addEventListener('openHelpCenterMessagesAI', openHandler as any);
    return () => window.removeEventListener('openHelpCenterMessagesAI', openHandler as any);
  }, []);

  // Message bubble SVG for AI Chat
  const MessageBubbleIcon = (
    <svg className="w-8 h-8" fill="none" stroke="white" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.436L3 21l1.436-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
    </svg>
  );

  return (
    <>
      <AuthGate>
        {showNav && <Navigation />}
        <main className="min-h-screen bg-gray-50 dark:bg-[#15192c] pb-24">{children}</main>
        {showNav && (
          <BottomNav
            onOpenHelpCenter={() => {
              try {
                setIsHelpCenterOpen(true);
              } catch {}
            }}
          />
        )}
        {isHelpCenterOpen && (
          <>
            {/* Click-outside overlay (no dim) */}
            <div
              className="fixed inset-0 z-40"
              aria-hidden="true"
              onClick={() => setIsHelpCenterOpen(false)}
            />
            {/* Floating panel */}
            <div className="fixed right-4 bottom-24 md:bottom-8 z-50 w-[min(92vw,28rem)] h-[80vh]">
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
      <CompanyFooter />
    </>
  );
}
