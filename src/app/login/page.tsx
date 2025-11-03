"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/solid'
import LegalModal from '../../components/modals/LegalModal'
import { RedirectBanner } from '../../components/RedirectBanner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showLegalModal, setShowLegalModal] = useState(false)
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms'>('privacy')
  const [shouldShowMobileMessage, setShouldShowMobileMessage] = useState(false)
  const [isCheckingMobileSupport, setIsCheckingMobileSupport] = useState(true)
  const [forceDesktopUrl, setForceDesktopUrl] = useState('/login?force-desktop=1')
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('force-desktop', '1')
    setForceDesktopUrl(`${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const searchParams = new URLSearchParams(window.location.search)
    const forceDesktop = searchParams.get('force-desktop') === '1'

    const checkMobileSupport = () => {
      if (forceDesktop) {
        setShouldShowMobileMessage(false)
        setIsCheckingMobileSupport(false)
        return
      }

      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || ''
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      const isMobileDevice = mobileRegex.test(userAgent)
      const isSmallScreen = window.innerWidth < 768

      setShouldShowMobileMessage(isMobileDevice || isSmallScreen)
      setIsCheckingMobileSupport(false)
    }

    checkMobileSupport()

    if (!forceDesktop) {
      window.addEventListener('resize', checkMobileSupport)
    }

    return () => {
      if (!forceDesktop) {
        window.removeEventListener('resize', checkMobileSupport)
      }
    }
  }, [])

  // Handle magic link authentication
  useEffect(() => {
    const handleMagicLink = async () => {
      try {
        // Check if we have access token in the URL hash
        const hash = window.location.hash;
        if (hash.includes('access_token=')) {
          console.log('Login page - Magic link detected, processing authentication');
          
          // Import Supabase client
          const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
          const supabase = createClientComponentClient();
          
          // Extract tokens from URL hash
          const urlParams = new URLSearchParams(hash.substring(1));
          const accessToken = urlParams.get('access_token');
          const refreshToken = urlParams.get('refresh_token');
          const tokenType = urlParams.get('token_type');
          
          console.log('Login page - Extracted tokens:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            tokenType
          });
          
          if (accessToken && refreshToken) {
            // Set the session manually using the tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            console.log('Login page - Manual session set:', {
              hasSession: !!sessionData.session,
              sessionError: sessionError?.message,
              userId: sessionData.session?.user?.id,
              email: sessionData.session?.user?.email
            });
            
            if (sessionData.session) {
              console.log('Login page - User authenticated via magic link, redirecting to incidents');
              router.push('/incidents');
              return;
            }
          }
          
          // Wait for Supabase to process the magic link automatically
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check session after processing
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          console.log('Login page - Session check after magic link:', {
            hasSession: !!sessionData.session,
            sessionError: sessionError?.message,
            userId: sessionData.session?.user?.id,
            email: sessionData.session?.user?.email
          });
          
          if (sessionData.session) {
            console.log('Login page - User authenticated via magic link, redirecting to incidents');
            router.push('/incidents');
            return;
          }
        }
      } catch (err) {
        console.error('Login page - Magic link processing error:', err);
      }
    };

    handleMagicLink();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const emailValue = emailRef.current?.value || email
    const passwordValue = passwordRef.current?.value || password

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailValue,
        password: passwordValue,
      })
      if (error) throw error
      
      // Check if this is the superadmin user
      if (data.user?.email === 'david@incommand.uk') {
        router.push('/admin')
      } else {
        router.push('/incidents')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const socialLinks = [
    {
      name: 'Twitter',
      href: 'https://twitter.com/incommanduk',
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/incommand-uk',
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      name: 'GitHub',
      href: 'https://github.com/incommand',
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
    },
  ]

  if (!isCheckingMobileSupport && shouldShowMobileMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#23408e] text-white text-center px-6 py-12">
        <Image
          src="/inCommand.png"
          alt="inCommand Logo"
          width={240}
          height={180}
          className="drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)] object-contain mb-10"
          priority
        />
        <h1 className="text-3xl font-semibold mb-4">Mobile experience coming soon</h1>
        <p className="text-base text-blue-100 max-w-md mb-8 leading-relaxed">
          We&apos;re crafting a dedicated mobile experience for inCommand. For now, please access the platform from a desktop browser
          or request the desktop site from your mobile browser to continue.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <Link
            href={forceDesktopUrl}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-[#23408e] font-semibold shadow-md hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition"
          >
            Continue to desktop site
          </Link>
          <a
            href="mailto:info@incommand.uk"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full border-2 border-white text-white font-semibold shadow-md hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition"
          >
            Contact us for information
          </a>
        </div>
        <div className="mt-10 flex items-center justify-center gap-6 text-blue-100">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-full border border-white/40 bg-white/5 p-3 transition hover:bg-white/10 hover:text-white"
              aria-label={social.name}
            >
              {social.icon}
            </a>
          ))}
        </div>
      </div>
    )
  }

  if (isCheckingMobileSupport) {
    return <div className="min-h-screen bg-[#23408e]" />
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-[#23408e] px-4 sm:px-6 lg:px-8">
      <RedirectBanner />
      {/* Logo & Tagline */}
      <div className="flex flex-col items-center mb-10 sm:mb-14">
        <Image
          src="/inCommand.png"
          alt="inCommand Logo"
          width={400}
          height={300}
          className="drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)] object-contain mb-6 sm:mb-8"
          priority
        />
        <p className="text-sm sm:text-base text-blue-100 font-medium text-center max-w-md leading-relaxed">
          Smart, scalable incident management — built for every operation.
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md mx-auto bg-white/90 rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-6 md:p-8 backdrop-blur-md">
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-blue-900 mb-6 sm:mb-8 tracking-tight">
          Sign in to your account
        </h2>

        {error && (
          <div 
            role="alert" 
            aria-live="polite"
            className="mb-4 text-sm text-red-600 text-center bg-red-50 border border-red-200 rounded-lg py-2 px-3"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-[#2A3990] mb-2">
              Email address
            </label>
            <input
              ref={emailRef}
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg transition-all duration-200 placeholder-gray-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-[#2A3990] mb-2">
              Password
            </label>
            <div className="relative">
              <input
                ref={passwordRef}
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg transition-all duration-200 placeholder-gray-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-700 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <Link
                href="/forgot-password"
                className="text-xs text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2661F5] hover:bg-blue-700 text-white font-semibold text-lg py-3 rounded-xl shadow-md focus:ring-4 focus:ring-blue-300 transition-transform duration-150 active:scale-95 hover:scale-[1.02]"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="mt-8 border-t border-blue-100"></div>

        {/* Create Account */}
        <div className="mt-6 flex flex-col items-center space-y-3">
          <p className="text-sm text-blue-700">New to inCommand?</p>
          <Link
            href="/signup"
            className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-base font-semibold text-white bg-[#2661F5] hover:bg-blue-700 shadow-md focus:ring-4 focus:ring-blue-300 transition-transform duration-150 active:scale-95 hover:scale-[1.02]"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create an account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-blue-100 space-y-2">
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => {
              setLegalModalTab('privacy')
              setShowLegalModal(true)
            }}
            className="hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
          >
            Privacy Policy
          </button>
          <span>|</span>
          <button 
            onClick={() => {
              setLegalModalTab('terms')
              setShowLegalModal(true)
            }}
            className="hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
          >
            Terms of Use
          </button>
        </div>
        <div className="flex justify-center">
          <a 
            href="mailto:support@incommand.uk?subject=Login Support"
            className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
          >
            Need help? Contact support
          </a>
        </div>
        <p>© {new Date().getFullYear()} inCommand. All rights reserved.</p>
      </footer>

      {/* Legal Modal */}
      <LegalModal 
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        defaultTab={legalModalTab}
      />
    </div>
  )
}