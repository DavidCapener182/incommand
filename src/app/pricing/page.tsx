'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { CheckIcon } from '@heroicons/react/24/outline'
import MarketingNavigation from '@/components/MarketingNavigation'
import { useLaunchMode } from '@/hooks/useLaunchMode'
import { RegisterInterestModal } from '@/components/marketing/RegisterInterestModal'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SocialLinks } from '@/components/marketing/SocialLinks'

const plans = [
  {
    name: 'Starter',
    price: '£25',
    period: 'per month',
    description: 'Ideal for smaller teams and first-time users.',
    features: [
      'Up to 50 incidents per month',
      '5 staff members',
      'Basic analytics',
      'Email support',
      'Mobile app access',
      'Event dashboard',
    ],
    cta: 'Get Started',
    ctaLink: '/signup',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '£75',
    period: 'per month',
    description: 'For growing event teams running multiple venues.',
    features: [
      'Unlimited incidents',
      '20 staff members',
      'AI-powered insights',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'API access',
    ],
    cta: 'Get Started',
    ctaLink: '/signup',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '£200',
    period: 'per month',
    description: 'For large-scale operations and integrated deployments.',
    features: [
      'Everything in Professional',
      'Unlimited staff members',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee (99.9%)',
      'Advanced security suite',
      'White-label options',
    ],
    cta: 'Talk to Sales',
    ctaLink: 'mailto:sales@incommand.uk?subject=Enterprise Plan Inquiry',
    highlighted: false,
  },
]

const faqs = [
  {
    question: 'Can I cancel or change my plan at any time?',
    answer:
      'Absolutely. You can upgrade, downgrade, or cancel whenever needed — with no hidden fees.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Contact our sales team to discuss your requirements and get started with InCommand.',
  },
  {
    question: 'Do you offer annual billing discounts?',
    answer:
      'Annual plans receive two months free and priority onboarding support.',
  },
  {
    question: 'How secure is my data?',
    answer:
      'All data is encrypted, stored on UK-based servers, and fully compliant with GDPR and ISO 27001 standards.',
  },
]

export default function PricingPage() {
  const { isPreLaunch } = useLaunchMode()
  const [interestOpen, setInterestOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F1F4F9] text-slate-900">
      <MarketingNavigation />

      {/* HERO — full width, NO borders/shadows */}
      <section className="relative w-full overflow-hidden">
        <div className="w-full bg-gradient-to-b from-[#23408e] to-[#2661F5] text-white">
          <div className="mx-auto max-w-7xl py-16 sm:py-24 px-6 sm:px-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Copy */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-xl text-center lg:text-left"
            >
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6 text-white">
                Clear, Scalable Pricing — Built for Every Operation
              </h1>
              <p className="text-blue-100 text-lg mb-6 leading-relaxed">
                Whether you manage a local festival or a national venue, InCommand adapts to your needs. Every plan includes full analytics, real-time dashboards, and responsive UK-based support.
              </p>
              <p className="text-sm text-blue-200 mb-10">
                Contact sales to discuss your requirements
              </p>

              {isPreLaunch ? (
                <button
                  type="button"
                  onClick={() => setInterestOpen(true)}
                  className="inline-block bg-white text-blue-700 px-8 py-4 rounded-xl font-semibold shadow hover:bg-blue-50 transition-all active:scale-95"
                >
                  Register Interest
                </button>
              ) : (
                <Link
                  href="/signup"
                  className="inline-block bg-white text-blue-700 px-8 py-4 rounded-xl font-semibold shadow hover:bg-blue-50 transition-all active:scale-95"
                >
                  Get Started
                </Link>
              )}
            </motion.div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative w-full max-w-lg"
            >
              <div className="aspect-video rounded-3xl overflow-hidden bg-white/10 backdrop-blur-sm">
                <Image
                  src="/placeholder-pricing-dashboard.png"
                  alt="Screenshot of InCommand pricing dashboard"
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="flex justify-center mt-10">
        <SocialLinks />
      </div>

      {/* PRICING — cards WITHOUT borders */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl bg-white rounded-3xl py-16 px-6 sm:px-10">
          <h2 className="text-center text-3xl font-bold mb-14 text-[#23408e]">Choose Your Plan</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all hover:-translate-y-2 ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-[#23408e] to-[#2661F5] text-white shadow-xl'
                    : 'bg-white text-blue-900 shadow-md'
                }`}
              >
                <div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className={`${plan.highlighted ? 'text-blue-100' : 'text-blue-700'} mb-4`}>
                    {plan.description}
                  </p>

                  <div className="flex items-baseline mb-6">
                    <span className="text-4xl sm:text-5xl font-extrabold">{plan.price}</span>
                    <span className={`ml-2 text-sm ${plan.highlighted ? 'text-blue-100' : 'text-blue-700'}`}>
                      {plan.period}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start">
                        <CheckIcon
                          className={`w-5 h-5 mr-3 mt-1 flex-shrink-0 ${
                            plan.highlighted ? 'text-emerald-300' : 'text-blue-600'
                          }`}
                        />
                        <span className={`${plan.highlighted ? 'text-blue-50' : 'text-blue-800'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {isPreLaunch && plan.ctaLink.startsWith('/signup') ? (
                  <button
                    type="button"
                    onClick={() => setInterestOpen(true)}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-center transition-all ${
                      plan.highlighted ? 'bg-white text-blue-700 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Register Interest
                  </button>
                ) : (
                  <Link
                    href={plan.ctaLink}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-center transition-all ${
                      plan.highlighted ? 'bg-white text-blue-700 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white text-blue-900 py-20 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 text-[#23408e]">
            Frequently Asked Questions
          </h2>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.details
                key={faq.question}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="group bg-blue-50 rounded-xl p-4 sm:p-6 hover:shadow-md transition"
              >
                <summary className="flex justify-between items-center cursor-pointer font-semibold text-lg text-blue-900">
                  {faq.question}
                  <span className="text-blue-500 group-open:rotate-180 transition-transform">⌄</span>
                </summary>
                <p className="text-blue-800 mt-3">{faq.answer}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#23408e] to-[#2661F5] py-24 text-center text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to Simplify Your Operations?</h2>
          <p className="text-blue-100 text-lg mb-8">Join hundreds of event and safety professionals using InCommand.</p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isPreLaunch ? (
              <button
                type="button"
                onClick={() => setInterestOpen(true)}
                className="bg-white text-blue-700 font-semibold px-8 py-4 rounded-xl hover:bg-blue-100 shadow-md transition-transform active:scale-95"
              >
                Get Started
              </button>
            ) : (
              <Link
                href="/signup"
                className="bg-white text-blue-700 font-semibold px-8 py-4 rounded-xl hover:bg-blue-100 shadow-md transition-transform active:scale-95"
              >
                Get Started
              </Link>
            )}

            <a
              href="mailto:sales@incommand.uk?subject=Pricing Inquiry"
              className="border border-white text-white px-8 py-4 rounded-xl hover:bg-white/10 font-semibold transition-colors"
            >
              Talk to Sales
            </a>
          </div>
        </div>
      </section>

      <MarketingFooter />
      <RegisterInterestModal open={interestOpen} onOpenChange={setInterestOpen} />
    </div>
  )
}