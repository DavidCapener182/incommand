'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useLaunchMode } from '@/hooks/useLaunchMode'
import { FadeIn } from '@/components/marketing/Motion'
import { CheckIcon } from '@heroicons/react/24/outline'

const RegisterInterestModal = dynamic(
  () => import('@/components/marketing/RegisterInterestModal').then((mod) => mod.RegisterInterestModal),
  { ssr: false },
)

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
}

export interface PricingPlan {
  name: string
  description?: string
  features: string[]
  cta: string
  ctaLink: string
  note?: string
  monthlyPrice?: number | null
  annualPrice?: number | null
  currency?: string
  isCustom?: boolean
}

interface PricingPlansProps {
  plans: PricingPlan[]
}

export const PricingPlans = ({ plans }: PricingPlansProps) => {
  const { isPreLaunch } = useLaunchMode()
  const [interestOpen, setInterestOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  const formattedPlans = useMemo(() => plans, [plans])

  return (
    <>
      <div className="mb-8 flex justify-center md:justify-end">
        <div className="inline-flex rounded-full bg-blue-100 p-1">
          {(['monthly', 'annual'] as const).map((cycle) => (
            <button
              key={cycle}
              type="button"
              onClick={() => setBillingCycle(cycle)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                billingCycle === cycle
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-700/70 hover:text-blue-700'
              }`}
            >
              {cycle === 'monthly' ? 'Monthly' : 'Annual'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        {formattedPlans.map((plan, index) => {
          const isSignupPlan = plan.ctaLink.startsWith('/signup')
          const isMailtoLink = plan.ctaLink.startsWith('mailto:')
          const variant = index % 2 === 0 ? 'light' : 'dark'
          const cardClasses =
            variant === 'dark'
              ? 'bg-gradient-to-br from-[#1d2f6a] via-[#23408e] to-[#1a2a57] text-white shadow-xl ring-1 ring-blue-900/40'
              : 'bg-white text-blue-900 shadow-md ring-1 ring-blue-100/60'
          const descriptionClass = variant === 'dark' ? 'text-blue-100' : 'text-blue-700'
          const priceLabelClass = variant === 'dark' ? 'text-blue-100/90' : 'text-blue-600'
          const featureTextClass = variant === 'dark' ? 'text-blue-50' : 'text-blue-800'
          const checkIconClass = variant === 'dark' ? 'text-emerald-300' : 'text-blue-600'
          const buttonClass =
            variant === 'dark'
              ? 'bg-white text-blue-700 hover:bg-blue-100'
              : 'bg-blue-600 text-white hover:bg-blue-700'

          const currencySymbol = CURRENCY_SYMBOLS[plan.currency ?? 'GBP'] ?? '£'
          const hasAnnual = typeof plan.annualPrice === 'number' && plan.annualPrice > 0
          const shouldShowAnnual = billingCycle === 'annual' && hasAnnual
          const activePrice = shouldShowAnnual
            ? plan.annualPrice!
            : typeof plan.monthlyPrice === 'number'
            ? plan.monthlyPrice
            : null
          const activeLabel = shouldShowAnnual ? 'per year' : 'per month'
          const activePrefix = 'From'
          const showAnnualSavings =
            shouldShowAnnual &&
            typeof plan.monthlyPrice === 'number' &&
            typeof plan.annualPrice === 'number'

          const isCustomPrice = plan.isCustom || activePrice === null
          const planKey = `${plan.name}-${index}`
          const isEnterpriseCard = plan.name.toLowerCase().includes('enterprise')
          const isExpanded = expandedCards[planKey]

          const featuresToShow = (() => {
            if (!isEnterpriseCard || isExpanded) return plan.features
            return plan.features.slice(0, 10)
          })()

          const hasHiddenFeatures = isEnterpriseCard && plan.features.length > featuresToShow.length

          return (
            <FadeIn
              key={planKey}
              delay={index * 0.08}
              className={`flex min-h-[30rem] flex-col justify-between rounded-2xl p-6 transition-all hover:-translate-y-2 hover:shadow-lg sm:p-8 ${cardClasses}`}
            >
              <div className="flex flex-col gap-5">
                <div className="space-y-2 text-center sm:text-left">
                  <h3 className="text-2xl font-bold sm:text-3xl">{plan.name}</h3>
                  {plan.description && (
                    <p className={`${descriptionClass} text-sm sm:text-base`}>{plan.description}</p>
                  )}
                </div>
                <div className="space-y-3">
                  {isCustomPrice ? (
                    <div className="text-center">
                      <span className="text-2xl font-semibold sm:text-3xl">Talk to us for £</span>
                      <p className={`${priceLabelClass} mt-2 text-sm`}>Tailored to enterprise deployments</p>
                    </div>
                  ) : (
                    <div className="flex w-full items-center justify-between gap-3">
                      <span
                        className={`w-16 text-left text-[0.65rem] font-semibold uppercase tracking-wide ${priceLabelClass}`}
                      >
                        From
                      </span>
                      <span className="flex-1 text-center text-3xl font-extrabold sm:text-4xl">
                        {currencySymbol}
                        {activePrice?.toLocaleString('en-GB')}
                      </span>
                      <span
                        className={`w-16 text-right text-[0.65rem] font-semibold uppercase tracking-wide leading-tight whitespace-pre-line ${priceLabelClass}`}
                      >
                        {shouldShowAnnual ? `Per
Year` : `Per
Month`}
                      </span>
                    </div>
                  )}
                  {showAnnualSavings && (
                    <p className={`${priceLabelClass} text-center text-xs sm:text-sm`}>
                      Save 10% with annual billing
                    </p>
                  )}
                  {plan.note && (
                    <p className={`${priceLabelClass} text-center text-xs sm:text-sm`}>{plan.note}</p>
                  )}
                </div>
                <ul className="space-y-3">
                  {featuresToShow.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckIcon className={`mr-3 mt-1 h-5 w-5 flex-shrink-0 ${checkIconClass}`} />
                      <span className={`${featureTextClass} text-sm sm:text-base`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                {isEnterpriseCard && plan.features.length > 6 && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCards((prev) => ({
                        ...prev,
                        [planKey]: !prev[planKey],
                      }))
                    }
                    className={`${priceLabelClass} text-xs font-semibold underline-offset-2 hover:underline`}
                  >
                    {isExpanded ? 'Show less' : 'See more'}
                  </button>
                )}
              </div>

              {isPreLaunch && isSignupPlan ? (
                <button
                  type="button"
                  onClick={() => setInterestOpen(true)}
                  className={`w-full rounded-lg px-6 py-3 font-semibold transition-all ${buttonClass}`}
                >
                  Register Interest
                </button>
              ) : isMailtoLink ? (
                <a
                  href={plan.ctaLink}
                  className={`w-full rounded-lg px-6 py-3 text-center font-semibold transition-all ${buttonClass}`}
                >
                  {plan.cta}
                </a>
              ) : (
                <Link
                  href={plan.ctaLink}
                  className={`w-full rounded-lg px-6 py-3 text-center font-semibold transition-all ${buttonClass}`}
                >
                  {plan.cta}
                </Link>
              )}
            </FadeIn>
          )
        })}
      </div>

      <RegisterInterestModal open={interestOpen} onOpenChange={setInterestOpen} />
    </>
  )
}
