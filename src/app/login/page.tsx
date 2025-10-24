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
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    emailRef.current?.focus()
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
      const { error } = await supabase.auth.signInWithPassword({
        email: emailValue,
        password: passwordValue,
      })
      if (error) throw error
      router.push('/incidents')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setLoading(false)
    }
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
          <div className="mb-4 text-sm text-red-600 text-center bg-red-50 border border-red-200 rounded-lg py-2 px-3">
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