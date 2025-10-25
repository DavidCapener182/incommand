import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { NotificationDrawerProvider } from '../contexts/NotificationDrawerContext'
import { ToastProvider } from '../contexts/ToastContext'
import { NightModeProvider } from '../contexts/NightModeContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import LayoutWrapper from '../components/LayoutWrapper'
import MaintenanceBanner from '../components/MaintenanceBanner'
import { Analytics } from '@vercel/analytics/react'
import OfflineIndicator from '../components/OfflineIndicator'
import { defaultMetadata } from '../config/seo.config'

// Using system/Tailwind fonts to avoid network fetches during build

export const metadata: Metadata = {
  ...defaultMetadata,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
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
  themeColor: '#2A3990'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="InCommand" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2A3990" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#2A3990" />
        
        {/* PWA Icons */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon.png" />
        <link rel="mask-icon" href="/icon.png" color="#2A3990" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://api.supabase.co" />
        <link rel="dns-prefetch" href="https://api.supabase.co" />
      </head>
      <body className={"bg-white dark:bg-[#151d34] text-gray-900 dark:text-gray-100 transition-colors duration-300"}>
        {/* Skip to content link */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] 
                     focus:bg-white focus:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                     px-4 py-2 rounded-lg shadow"
        >
          Skip to main content
        </a>

        <ThemeProvider>
          <NightModeProvider>
            <AuthProvider>
              <NotificationDrawerProvider>
                <ToastProvider>
              <MaintenanceBanner />
              <OfflineIndicator />
              <LayoutWrapper>{children}</LayoutWrapper>
              </ToastProvider>
            </NotificationDrawerProvider>
          </AuthProvider>
        </NightModeProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
} 
