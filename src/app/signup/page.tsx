"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import LegalModal from '../../components/modals/LegalModal'
import { createCompanyWithPlan } from './actions'
import { getAllPlans, type PlanCode } from '@/config/PricingConfig'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<PlanCode>('starter')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showLegalModal, setShowLegalModal] = useState(false)
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms'>('privacy')
  const router = useRouter()

  const plans = getAllPlans().filter(p => p.code !== 'enterprise' || typeof p.pricing.monthly === 'number')

  useEffect(() => {
    // Set body and html background to blue with !important
    const html = document.documentElement
    const body = document.body
    
    // Remove Tailwind bg classes that override our background
    body.classList.remove('bg-white', 'dark:bg-[#151d34]')
    
    // Set background with !important
    body.style.setProperty('background-color', '#23408e', 'important')
    html.style.setProperty('background-color', '#23408e', 'important')
    body.setAttribute('data-signup-page', 'true')
    
    return () => {
      // Cleanup on unmount
      body.style.removeProperty('background-color')
      html.style.removeProperty('background-color')
      body.removeAttribute('data-signup-page')
      // Restore original classes
      body.classList.add('bg-white', 'dark:bg-[#151d34]')
    }
  }, [])

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
        // Create company with selected plan using server action
        try {
          await createCompanyWithPlan(data.user.id, company, selectedPlan)
        } catch (err) {
          console.error('Company creation error:', err)
          // Still allow signup to proceed - company can be created later
        }

        // Create profile
        const { error: profileError } = await (supabase as any).from('profiles').insert([
          {
            id: data.user.id,
            email,
            company,
            role: 'company_admin',
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
    <>
      <style dangerouslySetInnerHTML={{__html: `
        :root { --page-bg: #23408e !important; }
        html, body { 
          --page-bg: #23408e !important;
          background-color: #23408e !important; 
        }
        body.bg-white { background-color: #23408e !important; }
        body.dark\\:bg-\\[\\#151d34\\] { background-color: #23408e !important; }
        [data-signup-page] { 
          --page-bg: #23408e !important;
          background-color: #23408e !important; 
        }
        body[data-signup-page] main,
        body[data-signup-page] [data-auth-route],
        main[data-auth-route],
        [data-auth-route="true"] { 
          --page-bg: #23408e !important;
          background-color: #23408e !important; 
        }
        [data-signup-page] .bg-\\[\\#F3F4F6\\] { background-color: #F3F4F6 !important; }
        [data-signup-page] input { background-color: white !important; }
      `}} />
      <div data-signup-page className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#23408e', minHeight: '100vh' }}>
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
              <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Create Your Account</h2>
              <p className="text-sm text-gray-500 text-center mb-8">Join hundreds of event professionals using InCommand</p>

              {/* Messages */}
            {error && (
                <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700 flex items-start gap-2 animate-shake">
                  <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Sign Up Error</p>
                    <p className="mt-1 opacity-90">{error}</p>
                  </div>
              </div>
            )}
            {message && (
                <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-700 flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
                  <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-5">
                {/* Company Input */}
                <div className="space-y-1">
                  <label htmlFor="signup-company" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Organisation or Company Name
                </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  <input
                    id="signup-company"
                    name="company"
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#23408e] focus:border-[#23408e] sm:text-sm transition-all"
                      placeholder="Your Company Name"
                  />
                </div>
                  <p className="mt-1 text-xs text-gray-500">This will appear on your dashboard and reports.</p>
              </div>

                {/* Email Input */}
                <div className="space-y-1">
                  <label htmlFor="signup-email" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email Address
                </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#23408e] focus:border-[#23408e] sm:text-sm transition-all"
                      placeholder="name@organization.com"
                  />
                </div>
              </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label htmlFor="signup-password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  <input
                    id="signup-password"
                    name="password"
                      type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#23408e] focus:border-[#23408e] sm:text-sm transition-all"
                      placeholder="••••••••"
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
                  <p className="mt-1 text-xs text-gray-500">At least 8 characters, including one number or symbol.</p>
              </div>

                {/* Plan Selection */}
                <div className="space-y-1">
                  <label htmlFor="signup-plan" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Choose Your Plan
                </label>
                  <div className="relative">
                  <select
                    id="signup-plan"
                    name="plan"
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value as PlanCode)}
                      className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#23408e] focus:border-[#23408e] transition-all"
                  >
                    {plans.map((plan) => (
                      <option key={plan.code} value={plan.code}>
                        {plan.displayName} - {typeof plan.pricing.monthly === 'number' ? `£${plan.pricing.monthly}/month` : 'Custom pricing'}
                      </option>
                    ))}
                  </select>
                </div>
                  <p className="mt-1 text-xs text-gray-500">
                  {plans.find(p => p.code === selectedPlan)?.metadata.description}
                </p>
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
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
              </button>
            </form>
            </div>

            {/* Card Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500">Already have an account?</span>
              <Link
                href="/login"
                className="font-semibold text-[#23408e] hover:text-blue-800 transition-colors"
              >
                Sign in
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