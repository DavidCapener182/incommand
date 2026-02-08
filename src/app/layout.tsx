import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AppProviders from '../providers/AppProviders'
import LayoutWrapper from '../components/LayoutWrapper'
import MaintenanceBanner from '../components/MaintenanceBanner'
import { Analytics } from '@vercel/analytics/react'
import { defaultMetadata } from '../config/seo.config'
import WebVitalsReporter from '../components/WebVitalsReporter'

// Optimize Inter font with next/font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
})

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
  maximumScale: 5,
  userScalable: true,
  themeColor: '#2A3990'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable} light`} suppressHydrationWarning>
      <head>
        <script
          // Compatibility guard for stale client bundles that still reference a global `theme` variable.
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                  var devCleanupKey = '__incommand_dev_cache_cleared_v2__';
                  if (isLocalhost && sessionStorage.getItem(devCleanupKey) !== '1') {
                    var swCleanup = Promise.resolve();
                    if ('serviceWorker' in navigator) {
                      try {
                        // Disable future SW registration in localhost dev.
                        navigator.serviceWorker.register = function () {
                          return Promise.reject(new Error('Service workers are disabled in localhost development.'));
                        };
                      } catch (_ignored) {}

                      swCleanup = navigator.serviceWorker
                        .getRegistrations()
                        .then(function (registrations) {
                          return Promise.all(registrations.map(function (registration) {
                            return registration.unregister();
                          }));
                        });
                    }

                    swCleanup
                      .then(function () {
                        if ('caches' in window) {
                          return caches.keys().then(function (keys) {
                            return Promise.all(keys.map(function (key) {
                              return caches.delete(key);
                            }));
                          });
                        }
                      })
                      .finally(function () {
                        sessionStorage.setItem(devCleanupKey, '1');
                        /* Removed auto-reload to prevent full-page refresh and style loss on incidents dashboard */
                      });
                  }

                  window.theme = 'light';
                } catch (e) {
                  window.theme = 'light';
                }
              })();
            `,
          }}
        />
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
        
        {/* Resource hints for performance */}
        <link rel="preconnect" href="https://api.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.supabase.co" />
        <link rel="preconnect" href="https://va.vercel-scripts.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://va.vercel-scripts.com" />
        {/* Google Fonts preconnect - required by next/font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      </head>
      <body className={`bg-white text-gray-900 transition-colors duration-300 ${inter.className}`}>
        {/* Skip to content link */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] 
                     focus:bg-white focus:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                     px-4 py-2 rounded-lg shadow"
        >
          Skip to main content
        </a>

        <AppProviders>
          <MaintenanceBanner />
          {/* <PrintInitializer /> */}
          <LayoutWrapper>{children}</LayoutWrapper>
        </AppProviders>
        <Analytics />
        <WebVitalsReporter />
      </body>
    </html>
  )
} 
