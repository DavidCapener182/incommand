"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Image from 'next/image'
import Link from 'next/link'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [company, setCompany] = useState('')
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Sign up form submitted');
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!company.trim()) {
      setError('Company name is required')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // Insert into profiles table
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email,
            company,
          },
        ])
        if (profileError) throw profileError;
      }

      setMessage('Check your email for the confirmation link')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#23408e] relative">
      <div className="w-full flex flex-col items-center mt-20">
        <Image
          src="/inCommand.png"
          alt="inCommand Logo"
          width={180}
          height={180}
          className="mx-auto mb-6 md:mb-8 drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)] h-32 w-auto object-contain"
        />
        <div className="text-base text-blue-100 font-medium mb-8 text-center max-w-xl mx-auto">
          Modern incident tracking and event command for every scale of operation.
        </div>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-blue-100">
          <h2 className="mb-6 text-center text-2xl font-extrabold text-blue-900 drop-shadow-sm tracking-tight">Create your account</h2>
          <form className="space-y-6 w-full mt-6" onSubmit={handleSignUp}>
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-[#2A3990]">Company Name</label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base"
                />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2A3990]">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base"
                />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#2A3990]">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base"
                />
            </div>
            {error && (
              <div className="rounded-md bg-red-50 p-4 mt-2">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}
            {message && (
              <div className="rounded-md bg-green-50 p-4 mt-2">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">{message}</h3>
                  </div>
                </div>
              </div>
            )}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#2661F5] hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 text-white font-semibold text-lg py-3 rounded-xl shadow transition-transform duration-150 active:scale-95 hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
          <div className="mt-8 w-full">
            <div className="flex flex-col items-center">
              <Link href="/login" className="text-xs text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2">Already have an account?</Link>
              <Link
                href="/login"
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl shadow text-base font-semibold text-white bg-[#2661F5] hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-transform duration-150 active:scale-95 hover:scale-[1.02]"
              >
                Sign in
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