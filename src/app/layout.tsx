"use client";
import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import Navigation from '../components/Navigation'
import { usePathname, useRouter } from 'next/navigation'
import { Analytics } from '@vercel/analytics/react'
import IncidentCreationModal from '../components/IncidentCreationModal'
import FloatingAIChat from '../components/FloatingAIChat'
import { NotificationDrawerProvider, useNotificationDrawer } from '../contexts/NotificationDrawerContext'
import { supabase } from '../lib/supabase'
import Dock from '../components/Dock'
import { Buffer } from 'buffer';
   if (typeof window !== 'undefined') {
     // @ts-ignore
     window.Buffer = Buffer;
   }

const inter = Inter({ subsets: ['latin'] })

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
    <footer className="fixed bottom-0 left-0 w-full z-30 px-4 py-2 flex justify-between items-center text-xs text-white dark:text-gray-100"
      style={{
        background: 'linear-gradient(180deg, #1e326e 0%, #101a3a 100%)',
        boxShadow: '0 -4px 24px 0 rgba(16, 26, 58, 0.12)',
        backdropFilter: 'blur(2px)'
      }}
    >
      <span>
        v0.1.0{companyName && ` Build for ${companyName}`}
      </span>
      <span className="absolute left-1/2 transform -translate-x-1/2">
        support@incommandapp.com
      </span>
    </footer>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const showNav = !['/login', '/signup'].includes(pathname);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = React.useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = React.useState(false);
  const { isOpen: notificationDrawerOpen } = useNotificationDrawer();
  const [hasCurrentEvent, setHasCurrentEvent] = useState<boolean>(true);

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

  // Check if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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
        <main className={`min-h-screen bg-gray-50 dark:bg-[#15192c] ${showNav ? 'pb-12' : ''}`}>{children}</main>
        {/* Docked FAB Bar at Bottom Right */}
        {showNav && hasCurrentEvent && (
          <Dock
            items={[
              {
                icon: <img src="/icon.png" alt="New Incident" className="w-8 h-8" />,
                label: 'New Incident',
                onClick: () => setIsIncidentModalOpen(true),
              },
              {
                icon: MessageBubbleIcon,
                label: 'Chat/Support',
                onClick: () => setIsAIChatOpen((v) => !v),
              },
            ]}
            panelHeight={68}
            baseItemSize={56}
            magnification={72}
            className={isMobile ? "bottom-16" : "bottom-2"}
          />
        )}
        {/* Controlled AI Chat - only render when open */}
        {isAIChatOpen && (
          <FloatingAIChat isOpen={true} onToggle={() => setIsAIChatOpen((v) => !v)} />
        )}
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.Buffer = Buffer;
  }

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/manifest.json" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className + " bg-white dark:bg-[#151d34] text-gray-900 dark:text-gray-100"}>
        <AuthProvider>
          <NotificationDrawerProvider>
            <main className="bg-white dark:bg-[#151d34] text-gray-900 dark:text-gray-100 min-h-screen">
              <LayoutContent>{children}</LayoutContent>
            </main>
          </NotificationDrawerProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
} 
