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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname() || '';
  const showNav = !['/login', '/signup'].includes(pathname);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = React.useState(false);
  const handleIncidentCreated = async () => {
    setIsIncidentModalOpen(false);
    // Optionally: window.location.reload();
  };
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <AuthGate>
            {showNav && <Navigation />}
            <main>{children}</main>
            {/* Global FAB for New Incident */}
            {showNav && (
              <>
                <button
                  type="button"
                  className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                  aria-label="Report New Incident"
                  onClick={() => setIsIncidentModalOpen(true)}
                >
                  <img src="/icon.png" alt="New Incident" className="w-full h-full object-cover rounded-full" />
                </button>
                <IncidentCreationModal
                  isOpen={isIncidentModalOpen}
                  onClose={() => setIsIncidentModalOpen(false)}
                  onIncidentCreated={handleIncidentCreated}
                />
              </>
            )}
          </AuthGate>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
} 