'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/solid'
import LegalModal from '../../components/modals/LegalModal'
import { RedirectBanner } from '../../components/RedirectBanner'
import { motion } from 'framer-motion'

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

  useEffect(() => {
    const handleMagicLink = async () => {
      try {
        const hash = window.location.hash
        if (hash.includes('access_token=')) {
          const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
          const supabase = createClientComponentClient()

          const urlParams = new URLSearchParams(hash.substring(1))
          const accessToken = urlParams.get('access_token')
          const refreshToken = urlParams.get('refresh_token')

          if (accessToken && refreshToken) {
            const { data: sessionData } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            if (sessionData.session) {
              router.push('/incidents')
              return
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 2000))
          const { data: sessionData } = await supabase.auth.getSession()
          if (sessionData.session) {
            router.push('/incidents')
          }
        }
      } catch (err) {
        console.error('Magic link authentication failed', err)
      }
    }
    handleMagicLink()
  }, [router])

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
    <div className="min-h-screen flex flex-col justify-center bg-[#F1F4F9] px-4 sm:px-6 lg:px-8">
      <RedirectBanner />

      {/* Logo & Tagline */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="flex flex-col items-center mb-12 sm:mb-16 text-center"
      >
        <Image
          src="/inCommand.png"
          alt="inCommand Logo"
          width={340}
          height={100}
          className="object-contain drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)] mb-6"
          priority
        />
        <p className="text-blue-700 text-sm sm:text-base font-medium max-w-md leading-relaxed">
          Modern incident tracking and event command for every scale of operation.
        </p>
      </motion.div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-2xl border border-blue-200 p-8 sm:p-10"
      >
        <h2 className="text-center text-3xl sm:text-4xl font-extrabold text-blue-900 mb-6">
          Welcome Back
        </h2>
        <p className="text-center text-blue-700 text-sm mb-8">
          Sign in to access your incident dashboard
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-600 text-center bg-red-50 border border-red-200 rounded-lg py-2 px-3">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-blue-800 mb-2">
              Email address
            </label>
            <input
              ref={emailRef}
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-blue-200 rounded-xl shadow-sm text-blue-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold text-blue-800 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                ref={passwordRef}
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-blue-200 rounded-xl shadow-sm text-blue-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-700 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <Link href="/forgot-password" className="text-xs text-blue-700 hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-3 rounded-xl shadow-md transition-colors duration-200 active:scale-95"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="mt-10 border-t border-blue-100"></div>

        {/* Create Account */}
        <div className="mt-6 flex flex-col items-center space-y-3">
          <p className="text-sm text-blue-700">New to InCommand?</p>
          <Link
            href="/signup"
            className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors duration-200 active:scale-95"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create an account
          </Link>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-blue-600 space-y-2">
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              setLegalModalTab('privacy')
              setShowLegalModal(true)
            }}
            className="hover:underline cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>|</span>
          <button
            onClick={() => {
              setLegalModalTab('terms')
              setShowLegalModal(true)
            }}
            className="hover:underline cursor-pointer"
          >
            Terms of Use
          </button>
        </div>
        <p>© {new Date().getFullYear()} InCommand. All rights reserved.</p>
      </footer>

      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        defaultTab={legalModalTab}
      />
    </div>
  )
}