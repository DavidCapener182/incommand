"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
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
      <div data-signup-page className="min-h-screen text-gray-900 antialiased" style={{ backgroundColor: '#23408e', minHeight: '100vh' }}>
      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#23408e' }}>
        <header className="text-center mb-8">
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/inCommand.png"
              alt="inCommand Logo"
              width={320}
              height={240}
              className="object-contain"
              priority
            />
            <p className="text-blue-200 text-sm sm:text-base max-w-md">
              Smart, scalable incident management — built for every operation.
            </p>
          </div>
        </header>

        <main className="w-full max-w-md">
          <div className="bg-[#F3F4F6] rounded-xl shadow-lg p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
              <p className="text-sm text-gray-600">Join hundreds of event professionals using inCommand.</p>
            </div>

            {error && (
              <div className="text-sm text-red-700 text-center bg-red-50 border border-red-200 rounded-lg py-2 px-3">
                {error}
              </div>
            )}
            {message && (
              <div className="text-sm text-green-700 text-center bg-green-50 border border-green-200 rounded-lg py-2 px-3">
                {message}
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-5">
              <div>
                <label htmlFor="signup-company" className="block text-sm font-medium text-gray-700">
                  Organisation or Company Name
                </label>
                <div className="mt-1">
                  <input
                    id="signup-company"
                    name="company"
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">This will appear on your dashboard and reports.</p>
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="signup-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">At least 8 characters, including one number or symbol.</p>
              </div>

              <div>
                <label htmlFor="signup-plan" className="block text-sm font-medium text-gray-700">
                  Choose Your Plan
                </label>
                <div className="mt-1">
                  <select
                    id="signup-plan"
                    name="plan"
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value as PlanCode)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]"
                  >
                    {plans.map((plan) => (
                      <option key={plan.code} value={plan.code}>
                        {plan.displayName} - {typeof plan.pricing.monthly === 'number' ? `£${plan.pricing.monthly}/month` : 'Custom pricing'}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {plans.find(p => p.code === selectedPlan)?.metadata.description}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-[#3B82F6] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B82F6] transition-colors disabled:opacity-70"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Already have an account?</p>
              <Link
                href="/login"
                className="inline-flex justify-center w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B82F6] transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </main>

        <footer className="text-center text-xs text-blue-200 mt-10 space-y-2">
          <div className="space-x-2">
            <button
              onClick={() => {
                setLegalModalTab('privacy')
                setShowLegalModal(true)
              }}
              className="hover:underline"
            >
              Privacy Policy
            </button>
            <span>|</span>
            <button
              onClick={() => {
                setLegalModalTab('terms')
                setShowLegalModal(true)
              }}
              className="hover:underline"
            >
              Terms of Use
            </button>
          </div>
          <div>
            <a
              href="mailto:support@incommand.uk?subject=Signup Support"
              className="hover:underline"
            >
              Need help? Contact support
            </a>
          </div>
          <p>© {new Date().getFullYear()} inCommand. All rights reserved.</p>
        </footer>
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