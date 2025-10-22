"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import LegalModal from '../../components/modals/LegalModal'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showLegalModal, setShowLegalModal] = useState(false)
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms'>('privacy')
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
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

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email,
            company,
          },
        ])
        if (profileError) throw profileError
      }

      setMessage('✅ Check your email for the confirmation link to complete setup.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-[#23408e] px-4 sm:px-6 lg:px-8">
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
          Modern incident tracking and event command for every scale of operation.
        </p>
      </div>

      {/* Sign-Up Card */}
      <div className="w-full max-w-md mx-auto bg-white/90 rounded-2xl shadow-lg border border-blue-100 p-6 sm:p-8 backdrop-blur-md">
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-blue-900 mb-6 sm:mb-8 tracking-tight">
          Create your account
        </h2>

        {/* Status messages */}
        {error && (
          <div className="mb-4 text-sm text-red-700 text-center bg-red-50 border border-red-200 rounded-lg py-2 px-3">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 text-sm text-green-700 text-center bg-green-50 border border-green-200 rounded-lg py-2 px-3">
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignUp} className="space-y-6">
          <div>
            <label htmlFor="signup-company" className="block text-sm font-medium text-[#2A3990] mb-2">
              Company Name
            </label>
            <input
              id="signup-company"
              name="company"
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400"
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-[#2A3990] mb-2">
              Email address
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400"
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-[#2A3990] mb-2">
              Password
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400"
            />
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2661F5] hover:bg-blue-700 text-white font-semibold text-lg py-3 rounded-xl shadow-md focus:ring-4 focus:ring-blue-300 transition-transform duration-150 active:scale-95 hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="mt-8 border-t border-blue-100"></div>

        {/* Already have account */}
        <div className="mt-6 flex flex-col items-center space-y-3">
          <p className="text-sm text-blue-700">Already have an account?</p>
          <Link
            href="/login"
            className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-base font-semibold text-white bg-[#2661F5] hover:bg-blue-700 shadow-md focus:ring-4 focus:ring-blue-300 transition-transform duration-150 active:scale-95 hover:scale-[1.02]"
          >
            Sign in
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