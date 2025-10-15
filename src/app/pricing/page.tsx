'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckIcon } from '@heroicons/react/24/outline'

const plans = [
  {
    name: 'Starter',
    price: '£25',
    period: 'per month',
    description: 'Perfect for small events and teams getting started',
    badge: 'Most Popular',
    badgeColor: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    features: [
      'Up to 50 incidents per month',
      '5 staff members',
      'Basic analytics and reporting',
      'Email support',
      'Mobile app access',
      'Real-time notifications',
      'Event dashboard',
      'Photo attachments',
    ],
    cta: 'Get Started',
    highlighted: true,
  },
  {
    name: 'Professional',
    price: '£75',
    period: 'per month',
    description: 'For growing teams managing multiple events',
    features: [
      'Unlimited incidents',
      '20 staff members',
      'Advanced AI insights',
      'Real-time analytics',
      'Priority support',
      'Custom branding',
      'Advanced reporting',
      'Staff management',
      'API access',
      'Predictive analytics',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    price: '£200',
    period: 'per month',
    description: 'For large organizations with complex needs',
    badge: 'Best Value',
    badgeColor: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    features: [
      'Everything in Professional',
      'Unlimited staff members',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee (99.9% uptime)',
      'Advanced security features',
      'Custom training',
      'White-label options',
      'Priority feature requests',
      'Multi-tenant management',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

const faqs = [
  {
    question: 'Can I change plans later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes, we offer a 14-day free trial for the Professional plan. No credit card required.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, debit cards, and can arrange invoicing for Enterprise customers.',
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer: 'Yes, we offer a 15% discount when you choose annual billing instead of monthly.',
  },
  {
    question: 'What happens if I exceed my plan limits?',
    answer: "We'll notify you when you're approaching your limits. You can upgrade your plan at any time or we'll work with you to find the best solution.",
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#15192c]">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-4">
            Choose the perfect plan for your event management needs. All plans include core features.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-white dark:bg-[#1e2438] rounded-xl shadow-lg ${
                plan.highlighted ? 'ring-2 ring-blue-600 dark:ring-blue-400 scale-105' : ''
              } p-8 flex flex-col`}
            >
              {plan.badge && (
                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{plan.description}</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                <span className="text-gray-600 dark:text-gray-400 ml-2">{plan.period}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href={plan.name === 'Enterprise' ? 'mailto:sales@incommand.uk?subject=Enterprise Plan Inquiry' : '/incidents'}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-center transition-colors ${
                  plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Compare Plans
          </h2>
          <div className="bg-white dark:bg-[#1e2438] rounded-xl shadow-lg overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-900 dark:text-white font-semibold">Feature</th>
                  <th className="text-center py-4 px-6 text-gray-900 dark:text-white font-semibold">Starter</th>
                  <th className="text-center py-4 px-6 text-gray-900 dark:text-white font-semibold">Professional</th>
                  <th className="text-center py-4 px-6 text-gray-900 dark:text-white font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Incidents per month</td>
                  <td className="text-center py-4 px-6 text-gray-700 dark:text-gray-300">50</td>
                  <td className="text-center py-4 px-6 text-gray-700 dark:text-gray-300">Unlimited</td>
                  <td className="text-center py-4 px-6 text-gray-700 dark:text-gray-300">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Staff members</td>
                  <td className="text-center py-4 px-6 text-gray-700 dark:text-gray-300">5</td>
                  <td className="text-center py-4 px-6 text-gray-700 dark:text-gray-300">20</td>
                  <td className="text-center py-4 px-6 text-gray-700 dark:text-gray-300">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">AI insights</td>
                  <td className="text-center py-4 px-6"><span className="text-gray-400">—</span></td>
                  <td className="text-center py-4 px-6"><CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Custom branding</td>
                  <td className="text-center py-4 px-6"><span className="text-gray-400">—</span></td>
                  <td className="text-center py-4 px-6"><CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">SLA guarantee</td>
                  <td className="text-center py-4 px-6"><span className="text-gray-400">—</span></td>
                  <td className="text-center py-4 px-6"><span className="text-gray-400">—</span></td>
                  <td className="text-center py-4 px-6"><CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white dark:bg-[#1e2438] rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 dark:bg-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Still have questions?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Our team is here to help you find the perfect plan.
            </p>
            <a
              href="mailto:sales@incommand.uk?subject=Pricing Question"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Contact Sales
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

