'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { CheckIcon } from '@heroicons/react/24/outline'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { StackedPanel } from '@/components/ui/StackedPanel'
import MarketingNavigation from '@/components/MarketingNavigation'

const plans = [
  {
    name: 'Starter',
    price: '£25',
    period: 'per month',
    description: 'Perfect for smaller events and first-time users.',
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
    description: 'Ideal for growing teams running multiple events.',
    features: [
      'Unlimited incidents',
      '20 staff members',
      'AI-powered insights',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'API access',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/signup',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '£200',
    period: 'per month',
    description: 'For large-scale operations with advanced needs.',
    features: [
      'Everything in Professional',
      'Unlimited staff members',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee (99.9%)',
      'Advanced security suite',
      'White-label options',
    ],
    cta: 'Contact Sales',
    ctaLink: 'mailto:sales@incommand.uk?subject=Enterprise Plan Inquiry',
    highlighted: false,
  },
]

const faqs = [
  {
    question: 'Can I change or cancel my plan?',
    answer:
      'Yes. You can upgrade, downgrade, or cancel your subscription at any time. Changes apply at the next billing cycle.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Absolutely. You can try the Professional plan free for 14 days with no credit card required.',
  },
  {
    question: 'Do you offer annual billing discounts?',
    answer:
      'Yes — annual subscriptions come with a 15% discount across all tiers.',
  },
  {
    question: 'How secure is my data?',
    answer:
      'Your data is fully encrypted and stored on enterprise-grade infrastructure with row-level security and audit logging.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700 text-white">
      <MarketingNavigation />
      <PageWrapper>

        {/* HERO SECTION */}
        <section className="flex flex-col lg:flex-row items-center justify-between py-20 px-6 sm:px-10">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-xl text-center lg:text-left"
          >
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-blue-100 text-lg mb-8">
              Choose the plan that fits your operation. All tiers include real-time dashboards,
              notifications, and mobile access.
            </p>
            <p className="text-sm text-blue-200 mb-8">
              14-day free trial • No credit card required • Cancel anytime
            </p>
            <Link
              href="/signup"
              className="bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold shadow hover:bg-blue-100 transition-transform active:scale-95"
            >
              Start Free Trial
            </Link>
          </motion.div>

          {/* Image Placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="relative w-full max-w-lg mt-10 lg:mt-0"
          >
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-blue-200/30">
              <Image
                src="/placeholder-pricing-dashboard.png"
                alt="Screenshot of InCommand pricing dashboard"
                fill
                className="object-cover"
              />
            </div>
          </motion.div>
        </section>

        {/* PRICING GRID */}
        <StackedPanel className="py-16 px-6 sm:px-10 bg-white text-blue-900 rounded-t-3xl">
          <h2 className="text-center text-3xl font-bold mb-12 text-[#23408e]">
            Choose Your Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border border-blue-100 shadow-md p-8 flex flex-col justify-between ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white scale-[1.03]'
                    : 'bg-white text-blue-900'
                }`}
              >
                <div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p
                    className={`mb-4 ${
                      plan.highlighted ? 'text-blue-100' : 'text-blue-700'
                    }`}
                  >
                    {plan.description}
                  </p>
                  <div className="flex items-baseline mb-6">
                    <span className="text-5xl font-extrabold">{plan.price}</span>
                    <span className="ml-2 text-blue-700 dark:text-blue-200 font-medium">
                      {plan.period}
                    </span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <CheckIcon
                          className={`w-5 h-5 ${
                            plan.highlighted
                              ? 'text-emerald-300'
                              : 'text-blue-600'
                          } mr-3 mt-1 flex-shrink-0`}
                        />
                        <span
                          className={`${
                            plan.highlighted ? 'text-blue-50' : 'text-blue-800'
                          }`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={plan.ctaLink}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-center transition-all ${
                    plan.highlighted
                      ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </StackedPanel>

        {/* FAQ SECTION */}
        <section className="bg-white text-blue-900 py-16 px-6 sm:px-10">
          <h2 className="text-3xl font-bold text-center mb-10 text-[#23408e]">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.details
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-blue-50 rounded-xl p-6 border border-blue-100 hover:shadow-md transition"
              >
                <summary className="flex justify-between items-center cursor-pointer font-semibold text-lg text-blue-900">
                  {faq.question}
                  <span className="text-blue-500 group-open:rotate-180 transition-transform">⌄</span>
                </summary>
                <p className="text-blue-800 mt-3">{faq.answer}</p>
              </motion.details>
            ))}
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="bg-gradient-to-r from-blue-700 to-blue-600 py-20 text-center text-white rounded-t-3xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to Simplify Your Operations?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join hundreds of event and safety professionals using InCommand.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="bg-white text-blue-700 font-semibold px-8 py-4 rounded-xl hover:bg-blue-100 shadow-md transition-transform active:scale-95"
            >
              Start Free Trial
            </Link>
            <a
              href="mailto:sales@incommand.uk?subject=Pricing Inquiry"
              className="border border-white text-white px-8 py-4 rounded-xl hover:bg-white/10 font-semibold transition-colors"
            >
              Talk to Sales
            </a>
          </div>
        </section>
      </PageWrapper>
    </div>
  )
}