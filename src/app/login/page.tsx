"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { 
  PlusIcon,
  EnvelopeIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
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
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [ssoLoading, setSsoLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const ssoProvider = process.env.NEXT_PUBLIC_SSO_PROVIDER || 'azure'
  const ssoEnabled = process.env.NEXT_PUBLIC_SSO_ENABLED === 'true' || process.env.NEXT_PUBLIC_SSO_ENABLED === '1'

  useEffect(() => {
    // Set body and html background to blue with !important
    const html = document.documentElement
    const body = document.body
    
    // Remove Tailwind bg classes that override our background
    body.classList.remove('bg-white', 'dark:bg-[#151d34]')
    
    // Set background with !important
    body.style.setProperty('background-color', '#23408e', 'important')
    html.style.setProperty('background-color', '#23408e', 'important')
    body.setAttribute('data-login-page', 'true')
    
    return () => {
      // Cleanup on unmount
      body.style.removeProperty('background-color')
      html.style.removeProperty('background-color')
      body.removeAttribute('data-login-page')
      // Restore original classes
      body.classList.add('bg-white', 'dark:bg-[#151d34]')
    }
  }, [])

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

    const currentUrl = new URL(window.location.href)
    const reason = currentUrl.searchParams.get('reason')

    if (reason === 'session-timeout') {
      setInfoMessage('For security, your session ended after 16 hours. Please sign in again to continue.')
      currentUrl.searchParams.delete('reason')
      window.history.replaceState({}, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`)
    }
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
              // Set flag to show loading screen after redirect
              if (typeof window !== 'undefined' && window.sessionStorage) {
                sessionStorage.setItem('showLoginLoadingScreen', 'true')
              }
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
            // Set flag to show loading screen after redirect
            if (typeof window !== 'undefined' && window.sessionStorage) {
              sessionStorage.setItem('showLoginLoadingScreen', 'true')
            }
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
      
      // Set flag to show loading screen after redirect
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('showLoginLoadingScreen', 'true')
      }
      
      // Check if this is the superadmin user
      if (data.user?.email === 'david@incommand.uk') {
        router.push('/admin')
      } else {
        router.push('/incidents')
      }
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in'
      const errorCode = err instanceof Error && 'code' in err ? String(err.code) : ''
      
      // Handle rate limit errors specifically
      if (errorMessage.toLowerCase().includes('rate limit') || 
          errorMessage.toLowerCase().includes('too many requests') ||
          errorCode === '429' ||
          errorCode === 'too_many_requests') {
        setError(
          'Authentication rate limit reached. This is a Supabase security feature. ' +
          'Please wait 15-60 minutes or contact support@incommand.uk if this persists. ' +
          'Rate limits can be increased in the Supabase dashboard under Authentication settings.'
        )
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignInWithSSO = async () => {
    setSsoLoading(true)
    setError(null)
    try {
      const redirectTo = `${window.location.origin}/auth/callback`
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: ssoProvider as 'azure',
        options: { redirectTo },
      })
      if (oauthError) throw oauthError
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'SSO sign-in failed'
      setError(msg)
      setSsoLoading(false)
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

  // Disabled mobile coming soon message - marketing page is now mobile responsive
  // if (!isCheckingMobileSupport && shouldShowMobileMessage) {
  //   return (
  //     <div className="min-h-screen flex flex-col items-center justify-center text-white text-center px-6 py-12" style={{ backgroundColor: '#23408e' }}>
  //       <Image
  //         src="/inCommand.png"
  //         alt="inCommand Logo"
  //         width={240}
  //         height={180}
  //         className="drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)] object-contain mb-10"
  //         priority
  //       />
  //       <h1 className="text-3xl font-semibold mb-4">Mobile experience coming soon</h1>
  //       <p className="text-base text-blue-100 max-w-md mb-8 leading-relaxed">
  //         We&apos;re crafting a dedicated mobile experience for inCommand. For now, please access the platform from a desktop browser
  //         or request the desktop site from your mobile browser to continue.
  //       </p>
  //       <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
  //         <Link
  //           href={forceDesktopUrl}
  //           className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-[#23408e] font-semibold shadow-md hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition"
  //         >
  //           Continue to desktop site
  //         </Link>
  //         <a
  //           href="mailto:info@incommand.uk"
  //           className="inline-flex items-center justify-center px-6 py-3 rounded-full border-2 border-white text-white font-semibold shadow-md hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition"
  //         >
  //           Contact us for information
  //         </a>
  //       </div>
  //       <div className="mt-10 flex items-center justify-center gap-6 text-blue-100">
  //         {socialLinks.map((social) => (
  //           <a
  //             key={social.name}
  //             href={social.href}
  //             target="_blank"
  //             rel="noopener noreferrer"
  //             className="flex items-center justify-center rounded-full border border-white/40 bg-white/5 p-3 transition hover:bg-white/10 hover:text-white"
  //             aria-label={social.name}
  //           >
  //             {social.icon}
  //           </a>
  //         ))}
  //       </div>
  //     </div>
  //   )
  // }

  // if (isCheckingMobileSupport) {
  //   return <div data-login-page className="min-h-screen" style={{ backgroundColor: '#23408e' }} />
  // }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        :root { --page-bg: #23408e !important; }
        html, body { 
          --page-bg: #23408e !important;
          background-color: #23408e !important; 
        }
        body.bg-white { background-color: #23408e !important; }
        body.dark\\:bg-\\[\\#151d34\\] { background-color: #23408e !important; }
        [data-login-page] { 
          --page-bg: #23408e !important;
          background-color: #23408e !important; 
        }
        body[data-login-page] main,
        body[data-login-page] [data-auth-route],
        main[data-auth-route],
        [data-auth-route="true"] { 
          --page-bg: #23408e !important;
          background-color: #23408e !important; 
        }
        [data-login-page] .bg-\\[\\#F3F4F6\\] { background-color: #F3F4F6 !important; }
        [data-login-page] input { background-color: white !important; }
      `}} />
      <div data-login-page className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#23408e', minHeight: '100vh' }}>    
        <RedirectBanner />
        
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#23408e] to-[#1a316e]" />
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
        />

        <div className="w-full max-w-md p-4 relative z-10">
          {/* Brand Header */}
          <div className="text-center mb-8 animate-fade-in-down">
            <div className="flex items-center justify-center gap-3 mb-4">
              <svg 
                className="h-12 w-12 text-white drop-shadow-md" 
                viewBox="0 0 100 100" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                <path d="M20 55 L45 75 L85 20" fill="none" stroke="#ed1c24" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h1 className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>InCommand</h1>
            </div>
            <p className="text-blue-100/90 text-sm font-medium tracking-wide uppercase">
              Incident Management System
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Welcome Back</h2>
              <p className="text-sm text-gray-500 text-center mb-8">Please enter your credentials to continue</p>

              {/* Messages */}
            {infoMessage && (
                <div className="mb-6 p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-700 flex items-start gap-2">
                  <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
                  <span>{infoMessage}</span>
              </div>
            )}

            {error && (
                <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700 flex items-start gap-2 animate-shake">
                  <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Authentication Error</p>
                    <p className="mt-1 opacity-90">{error}</p>
                {error.toLowerCase().includes('rate limit') && (
                      <div className="text-xs text-red-600 space-y-1 pt-2 mt-2 border-t border-red-200">
                    <p>Rate limits typically reset after 15-60 minutes.</p>
                    <p>
                      If this persists, please contact{' '}
                      <a 
                        href="mailto:support@incommand.uk?subject=Login Rate Limit Issue" 
                        className="underline font-semibold"
                      >
                        support@incommand.uk
                      </a>
                    </p>
                  </div>
                )}
                  </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
                {/* Email Input */}
                <div className="space-y-1">
                  <label htmlFor="login-email" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email Address
                </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  <input
                    ref={emailRef}
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#23408e] focus:border-[#23408e] sm:text-sm transition-all"
                      placeholder="name@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

                {/* Password Input */}
                <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Password
                  </label>
                    <Link href="/forgot-password" className="text-xs text-[#23408e] hover:text-blue-700 font-medium">
                    Forgot password?
                  </Link>
                </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  <input
                    ref={passwordRef}
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                      className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#23408e] focus:border-[#23408e] sm:text-sm transition-all"
                      placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#23408e] hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#23408e] disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
              >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Authenticating...
                    </>
                  ) : (
                    'Sign In'
                  )}
              </button>

              {ssoEnabled && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-2 text-gray-500">or</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignInWithSSO}
                    disabled={ssoLoading}
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#23408e] disabled:opacity-70 transition-all"
                  >
                    {ssoLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Redirecting...
                      </>
                    ) : (
                      `Sign in with SSO${ssoProvider === 'okta' ? ' (Okta)' : ' (Azure AD)'}`
                    )}
                  </button>
                </>
              )}
            </form>

            </div>

            {/* Card Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500">New to InCommand?</span>
              <Link
                href="/signup"
                className="font-semibold text-[#23408e] hover:text-blue-800 flex items-center gap-1 group"
              >
                <PlusIcon className="h-4 w-4 transition-transform group-hover:rotate-90" />
                Create account
              </Link>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-4">
            <div className="flex justify-center gap-6 text-xs text-blue-200/80 font-medium">
              <button onClick={() => { setLegalModalTab('privacy'); setShowLegalModal(true); }} className="hover:text-white transition-colors">
              Privacy Policy
            </button>
              <button onClick={() => { setLegalModalTab('terms'); setShowLegalModal(true); }} className="hover:text-white transition-colors">
              Terms of Use
            </button>
              <a href="mailto:support@incommand.uk" className="hover:text-white transition-colors">
                Contact Support
              </a>
          </div>
            <p className="text-[10px] text-blue-200/50 uppercase tracking-widest">
              © {new Date().getFullYear()} InCommand. All rights reserved.
            </p>
          </div>
      </div>

      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        defaultTab={legalModalTab}
      />
    </div>
    </>
  )
}