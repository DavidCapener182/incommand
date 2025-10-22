'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckIcon } from '@heroicons/react/24/outline'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { StackedPanel } from '@/components/ui/StackedPanel'

const plans = [
  {
    name: 'Starter',
    price: '£25',
    period: 'per month',
    description: 'Perfect for small events and teams getting started',
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
    ctaLink: '/incidents',
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
    ctaLink: '/incidents',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    price: '£200',
    period: 'per month',
    description: 'For large organizations with complex needs',
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
    ctaLink: 'mailto:sales@incommand.uk?subject=Enterprise Plan Inquiry',
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

const comparisonFeatures = [
  { feature: 'Incidents per month', starter: '50', professional: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Staff members', starter: '5', professional: '20', enterprise: 'Unlimited' },
  { feature: 'AI insights', starter: false, professional: true, enterprise: true },
  { feature: 'Custom branding', starter: false, professional: true, enterprise: true },
  { feature: 'SLA guarantee', starter: false, professional: false, enterprise: true },
  { feature: 'Dedicated account manager', starter: false, professional: false, enterprise: true },
]

export default function PricingPage() {
  return (
    <PageWrapper>
      {/* Hero Section with Image Placeholder */}
      <div className="relative -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-8 h-80 sm:h-96 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 overflow-hidden">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Content overlay */}
        <div className="relative h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-emerald-100 max-w-3xl mx-auto mb-4">
              Choose the perfect plan for your event management needs. All plans include core features.
            </p>
            <p className="text-sm text-emerald-200">
              14-day free trial • No credit card required • Cancel anytime
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <StackedPanel className="space-y-12">
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`card-depth p-8 flex flex-col ${
                plan.highlighted 
                  ? 'ring-2 ring-blue-600 dark:ring-blue-400 transform lg:scale-105' 
                  : ''
              }`}
            >
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
              <Link
                href={plan.ctaLink}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-center transition-all ${
                  plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Compare Plans
          </h2>
          <div className="card-depth overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-[#15192c]">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-900 dark:text-white font-semibold">Feature</th>
                    <th className="text-center py-4 px-6 text-gray-900 dark:text-white font-semibold">Starter</th>
                    <th className="text-center py-4 px-6 text-gray-900 dark:text-white font-semibold">Professional</th>
                    <th className="text-center py-4 px-6 text-gray-900 dark:text-white font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((item, index) => (
                    <tr 
                      key={item.feature}
                      className={index % 2 === 0 ? 'bg-white dark:bg-[#1e2438]' : 'bg-gray-50 dark:bg-[#1a2035]'}
                    >
                      <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">{item.feature}</td>
                      <td className="text-center py-4 px-6 text-gray-700 dark:text-gray-300">
                        {typeof item.starter === 'boolean' ? (
                          item.starter ? (
                            <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )
                        ) : (
                          item.starter
                        )}
                      </td>
                      <td className="text-center py-4 px-6 text-gray-700 dark:text-gray-300">
                        {typeof item.professional === 'boolean' ? (
                          item.professional ? (
                            <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )
                        ) : (
                          item.professional
                        )}
                      </td>
                      <td className="text-center py-4 px-6 text-gray-700 dark:text-gray-300">
                        {typeof item.enterprise === 'boolean' ? (
                          item.enterprise ? (
                            <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )
                        ) : (
                          item.enterprise
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="card-depth-subtle p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="card-depth bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-12 text-center"
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
      </StackedPanel>
    </PageWrapper>
  )
}
