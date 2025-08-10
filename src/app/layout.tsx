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
import { ToastProvider, useToast } from '../components/Toast'
import { OfflineIndicator } from '../components/OfflineIndicator'
import { PWAInstallPrompt } from '../components/PWAInstallPrompt'
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
      <span className="absolute left-1/2 transform -translate-x-1/2">
        support@incommandapp.com
      </span>
      <span>
        Powered by InCommand
      </span>
    </footer>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isOpen } = useNotificationDrawer();
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const pathname = usePathname() || '';
  const showNav = !['/login', '/signup'].includes(pathname);
  


  const handleIncidentCreated = async () => {
    setIsIncidentModalOpen(false);
    // Refresh current event data
    await fetchCurrentEvent();
  };

  const fetchCurrentEvent = async () => {
    if (!user) return;

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

      // Get current event for the company
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('status', 'active')
        .single();

      if (eventError && eventError.code !== 'PGRST116') {
        console.error('Error fetching current event:', eventError);
        return;
      }

      setCurrentEvent(event);
    } catch (err) {
      console.error('Error fetching current event:', err);
    }
  };

  useEffect(() => {
    fetchCurrentEvent();
  }, [user]);

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
        <div className={`transition-all duration-300 ${isOpen ? 'ml-80' : 'ml-0'}`}>
          <main className="min-h-screen bg-gray-50 dark:bg-[#15192c]">{children}</main>
          {/* Docked FAB Bar at Bottom Right - Hide on incidents page */}
          {showNav && !pathname.includes('/incidents') && (
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
              className="bottom-2"
            />
          )}
          {/* Controlled AI Chat - only render when open */}
          {isAIChatOpen && (
            <FloatingAIChat isOpen={true} onToggle={() => setIsAIChatOpen((v) => !v)} />
          )}
        </div>
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
      <OfflineIndicator />
      <PWAInstallPrompt />
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Enhanced service worker registration with proper error handling and update management
    const registerServiceWorker = async () => {
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);
        
        // Handle service worker updates with user notification
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available - notify user
                console.log('New service worker available');
                
                // Show notification to user (will be handled by toast context)
                const event = new CustomEvent('serviceWorkerUpdate', {
                  detail: {
                    title: 'Update Available',
                    message: 'A new version is available. Reload to update.',
                    type: 'info',
                    duration: 10000
                  }
                });
                window.dispatchEvent(event);
              }
            });
          }
        });

        // Handle service worker errors with retry logic
        registration.addEventListener('error', (event) => {
          console.error('Service Worker error:', event);
          
          // Retry registration after delay
          setTimeout(async () => {
            try {
              console.log('Retrying service worker registration...');
              await navigator.serviceWorker.register('/sw.js');
            } catch (retryError) {
              console.error('Service Worker retry failed:', retryError);
              
              // Show error notification to user
              const event = new CustomEvent('serviceWorkerError', {
                detail: {
                  title: 'Service Worker Error',
                  message: 'Failed to register service worker. Some features may not work properly.',
                  type: 'error',
                  duration: 8000
                }
              });
              window.dispatchEvent(event);
            }
          }, 5000);
        });

        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_UPDATED') {
            console.log('Service worker updated');
            
            // Show success notification
            const successEvent = new CustomEvent('serviceWorkerSuccess', {
              detail: {
                title: 'Update Complete',
                message: 'The app has been updated successfully.',
                type: 'success',
                duration: 5000
              }
            });
            window.dispatchEvent(successEvent);
            
            // Reload the page to use the new service worker
            window.location.reload();
          }
          
          // Handle other service worker messages
          if (event.data && event.data.type === 'SW_ERROR') {
            console.error('Service Worker reported error:', event.data.error);
            
            const errorEvent = new CustomEvent('serviceWorkerError', {
              detail: {
                title: 'Service Worker Error',
                message: event.data.error || 'An error occurred in the service worker.',
                type: 'error',
                duration: 8000
              }
            });
            window.dispatchEvent(errorEvent);
          }
        });

        // Handle service worker controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service Worker controller changed');
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
        
        // Show error notification to user
        const errorEvent = new CustomEvent('serviceWorkerError', {
          detail: {
            title: 'Service Worker Error',
            message: 'Failed to register service worker. Some features may not work properly.',
            type: 'error',
            duration: 8000
          }
        });
        window.dispatchEvent(errorEvent);
        
        // Retry registration after delay
        setTimeout(async () => {
          try {
            console.log('Retrying service worker registration...');
            await navigator.serviceWorker.register('/sw.js');
          } catch (retryError) {
            console.error('Service Worker retry failed:', retryError);
          }
        }, 10000);
      }
    };

    registerServiceWorker();

    // Add PWA meta tags
    const addPWAMetaTags = () => {
      const existingMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
      if (!existingMeta) {
        const meta = document.createElement('meta');
        meta.name = 'apple-mobile-web-app-capable';
        meta.content = 'yes';
        document.head.appendChild(meta);
      }

      const existingStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!existingStatusBar) {
        const statusBar = document.createElement('meta');
        statusBar.name = 'apple-mobile-web-app-status-bar-style';
        statusBar.content = 'default';
        document.head.appendChild(statusBar);
      }

      const existingTheme = document.querySelector('meta[name="theme-color"]');
      if (!existingTheme) {
        const theme = document.createElement('meta');
        theme.name = 'theme-color';
        theme.content = '#1f2937';
        document.head.appendChild(theme);
      }
    };

    addPWAMetaTags();
  }, []);

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#1f2937" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon.png" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className + " bg-white dark:bg-[#151d34] text-gray-900 dark:text-gray-100"}>
        <AuthProvider>
          <NotificationDrawerProvider>
            <ToastProvider>
              <main className="bg-white dark:bg-[#151d34] text-gray-900 dark:text-gray-100 min-h-screen">
                <LayoutContent>{children}</LayoutContent>
              </main>
            </ToastProvider>
          </NotificationDrawerProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
} 
