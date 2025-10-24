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

export interface PricingPlan {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  ctaLink: string
  highlighted?: boolean
}

interface PricingPlansProps {
  plans: PricingPlan[]
}

export const PricingPlans = ({ plans }: PricingPlansProps) => {
  const { isPreLaunch } = useLaunchMode()
  const [interestOpen, setInterestOpen] = useState(false)

  const formattedPlans = useMemo(() => plans, [plans])

  return (
    <>
      <div className="grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
        {formattedPlans.map((plan, index) => {
          const isSignupPlan = plan.ctaLink.startsWith('/signup')
          const highlightClasses = plan.highlighted
            ? 'bg-gradient-to-b from-[#23408e] to-[#2661F5] text-white shadow-xl'
            : 'bg-white text-blue-900 shadow-md'

          return (
            <FadeIn
              key={plan.name}
              delay={index * 0.08}
              className={`flex min-h-[28rem] flex-col justify-between rounded-2xl p-6 transition-all hover:-translate-y-2 sm:p-8 ${highlightClasses}`}
            >
              <div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className={`${plan.highlighted ? 'text-blue-100' : 'text-blue-700'} mb-4`}>{plan.description}</p>
                <div className="mb-6 flex items-baseline">
                  <span className="text-4xl font-extrabold sm:text-5xl">{plan.price}</span>
                  <span className={`ml-2 text-sm ${plan.highlighted ? 'text-blue-100' : 'text-blue-700'}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckIcon
                        className={`mr-3 mt-1 h-5 w-5 flex-shrink-0 ${
                          plan.highlighted ? 'text-emerald-300' : 'text-blue-600'
                        }`}
                      />
                      <span className={plan.highlighted ? 'text-blue-50' : 'text-blue-800'}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {isPreLaunch && isSignupPlan ? (
                <button
                  type="button"
                  onClick={() => setInterestOpen(true)}
                  className={`w-full rounded-lg px-6 py-3 font-semibold transition-all ${
                    plan.highlighted ? 'bg-white text-blue-700 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Register Interest
                </button>
              ) : (
                <Link
                  href={plan.ctaLink}
                  className={`w-full rounded-lg px-6 py-3 text-center font-semibold transition-all ${
                    plan.highlighted ? 'bg-white text-blue-700 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
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
