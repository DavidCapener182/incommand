'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PlusIcon } from '@heroicons/react/24/solid'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Autofocus email on mount
  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Get values directly from the input elements to handle autofill
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
    <div className="min-h-screen flex flex-col justify-center items-center pt-8 md:pt-12 sm:px-6 lg:px-8 bg-[#23408e] relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Image
          src="/inCommand.png"
          alt="inCommand Logo"
          width={180}
          height={180}
          className="mx-auto mb-6 md:mb-8 drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)] h-32 w-auto object-contain"
        />
        <div className="text-base text-blue-100 font-medium mt-2 mb-8 text-center max-w-xl mx-auto">
          Modern incident tracking and event command for every scale of operation.
        </div>
      </div>
      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-md py-10 px-6 shadow-2xl shadow-[0_10px_32px_4px_rgba(34,41,120,0.15)] rounded-2xl w-full flex flex-col items-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#2A3990] text-center mb-2 drop-shadow-lg" style={{textShadow:'0 2px 8px rgba(34,41,120,0.10)'}}>Sign in to your account</h2>
          <form className="space-y-6 w-full mt-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2A3990]">Email address</label>
              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#2A3990]">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base"
                />
                <button
                  type="button"
                  tabIndex={0}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <Link href="/forgot-password" className="text-xs text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400">Forgot password?</Link>
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#2661F5] hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 text-white font-semibold text-lg py-3 rounded-xl shadow transition-transform duration-150 active:scale-95 hover:scale-[1.02]"
              >
                Sign in
              </button>
            </div>
          </form>
          <div className="mt-8 w-full">
            <div className="flex flex-col items-center">
              <Link href="/signup" className="text-xs text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2">New to inCommand?</Link>
              <Link
                href="/signup"
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl shadow text-base font-semibold text-white bg-[#2661F5] hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-transform duration-150 active:scale-95 hover:scale-[1.02]"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center mt-8 mb-4 w-full">
        <div className="flex gap-4 text-xs text-blue-100">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          <span>|</span>
          <Link href="/terms" className="hover:underline">Terms of Use</Link>
        </div>
        <div className="text-xs text-blue-100 mt-2">© {new Date().getFullYear()} inCommand. All rights reserved.</div>
      </div>
    </div>
  )
} 

