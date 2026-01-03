'use client'

import React, { memo } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import { EventProvider } from '../contexts/EventContext'
import { NotificationDrawerProvider } from '../contexts/NotificationDrawerContext'
import { ToastProvider } from '../contexts/ToastContext'
import { NightModeProvider } from '../contexts/NightModeContext'
import { ThemeProvider } from '../contexts/ThemeContext'

interface AppProvidersProps {
  children: React.ReactNode
}

/**
 * Consolidated provider wrapper that optimizes context nesting
 * Memoized to prevent unnecessary re-renders
 */
const AppProviders = memo(function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <NightModeProvider>
        <AuthProvider>
          <EventProvider>
            <NotificationDrawerProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </NotificationDrawerProvider>
          </EventProvider>
        </AuthProvider>
      </NightModeProvider>
    </ThemeProvider>
  )
})

export default AppProviders
