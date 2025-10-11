import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { NotificationDrawerProvider } from '../contexts/NotificationDrawerContext'
import { ToastProvider } from '../contexts/ToastContext'
import { NightModeProvider } from '../contexts/NightModeContext'
import LayoutWrapper from '../components/LayoutWrapper'
import MaintenanceBanner from '../components/MaintenanceBanner'
import { Analytics } from '@vercel/analytics/react'
import GlobalEscalationToast from '../components/GlobalEscalationToast'
import OfflineIndicator from '../components/OfflineIndicator'

// Using system/Tailwind fonts to avoid network fetches during build

export const metadata: Metadata = {
  title: 'InCommand - Event Management',
  description: 'Professional event management and incident tracking platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'InCommand'
  },
  formatDetection: {
    telephone: false
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="InCommand" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* PWA Icons */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon.png" />
        <link rel="mask-icon" href="/icon.png" color="#3b82f6" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://api.supabase.co" />
        <link rel="dns-prefetch" href="https://api.supabase.co" />
      </head>
      <body className={"bg-white dark:bg-[#151d34] text-gray-900 dark:text-gray-100"}>
        <NightModeProvider>
          <AuthProvider>
            <NotificationDrawerProvider>
              <ToastProvider>
              <MaintenanceBanner />
              <GlobalEscalationToast />
              <OfflineIndicator />
              <LayoutWrapper>{children}</LayoutWrapper>
            </ToastProvider>
          </NotificationDrawerProvider>
        </AuthProvider>
        </NightModeProvider>
        <Analytics />
      </body>
    </html>
  )
} 
