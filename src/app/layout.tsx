'use client'
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

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const showNav = !['/login', '/signup'].includes(pathname);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = React.useState(false);
  const { isOpen: notificationDrawerOpen } = useNotificationDrawer();
  
  const handleIncidentCreated = async () => {
    setIsIncidentModalOpen(false);
    // Optionally: window.location.reload();
  };

  return (
    <>
      <AuthGate>
        {showNav && <Navigation />}
        <main>{children}</main>
        {/* Global FAB for New Incident - Hidden when notification drawer is open */}
        {showNav && !notificationDrawerOpen && (
          <>
            <button
              type="button"
              className="fixed bottom-6 right-24 z-[60] bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              aria-label="Report New Incident"
              onClick={() => setIsIncidentModalOpen(true)}
            >
              <img src="/icon.png" alt="New Incident" className="w-full h-full object-cover rounded-full" />
            </button>
            <FloatingAIChat />
          </>
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
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
      <body className={inter.className}>
        <AuthProvider>
          <NotificationDrawerProvider>
            <LayoutContent>{children}</LayoutContent>
          </NotificationDrawerProvider>
        </AuthProvider>
        <Analytics />
        {/* Global Footer */}
        <footer className="fixed bottom-0 left-0 w-full z-40 bg-blue-900 px-4 py-2 flex justify-between items-center text-xs text-white">
          <span>v0.1.0</span>
          <span>support@incommandapp.com</span>
          <span>© 2025 InCommand</span>
        </footer>
      </body>
    </html>
  )
} 
