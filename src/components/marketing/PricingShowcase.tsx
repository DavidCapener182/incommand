'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PricingPlan } from '@/components/marketing/interactives/PricingPlans'
import { FadeIn } from '@/components/marketing/Motion'

type BillingPeriod = 'monthly' | 'annual'

const CURRENCY_SYMBOLS: Record<string, string> = { GBP: '£', USD: '$', EUR: '€' }

const displayPrice = (plan: PricingPlan, period: BillingPeriod) => {
  const value = period === 'monthly' ? plan.monthlyPrice : plan.annualPrice

  if (value == null || plan.isCustom) {
    return {
      label: 'Contact Sales',
      suffix: 'Custom pricing for large teams',
      isCustom: true
    }
  }

  const symbol = CURRENCY_SYMBOLS[plan.currency ?? 'GBP'] ?? ''
  return {
    label: `${symbol}${value.toLocaleString()}`,
    suffix: period === 'monthly' ? 'per month' : 'per month, billed annually',
    isCustom: false
  }
}

export const PricingShowcase = ({ plans }: { plans: PricingPlan[] }) => {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')

  const orderedPlans = useMemo(() => {
    const desired = ['starter', 'operational', 'command', 'enterprise']
    return desired
      .map((key) => plans.find((p) => p.name.toLowerCase() === key))
      .filter((p): p is PricingPlan => Boolean(p))
  }, [plans])

  return (
    <div className="w-full">
      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="relative inline-flex h-12 items-center rounded-full bg-slate-100/80 p-1 ring-1 ring-slate-200">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={cn(
              "relative z-10 rounded-full px-6 py-2 text-sm font-medium transition-colors duration-200",
              billingPeriod === 'monthly' ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={cn(
              "relative z-10 rounded-full px-6 py-2 text-sm font-medium transition-colors duration-200",
              billingPeriod === 'annual' ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Annual
          </button>
          {/* Sliding Pill Background */}
          <div
            className={cn(
              "absolute h-10 rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition-all duration-300 ease-in-out w-[50%]",
              billingPeriod === 'monthly' ? "left-1" : "left-[calc(50%-4px)] translate-x-[calc(100%-4px)]" // Adjust translation roughly
            )}
            style={{ 
               width: 'calc(50% - 4px)',
               transform: billingPeriod === 'monthly' ? 'translateX(0)' : 'translateX(100%)'
            }}
          />
        </div>
        
        {/* Discount Badge */}
        {billingPeriod === 'annual' && (
           <FadeIn className="absolute mt-3 ml-[220px] hidden sm:block">
             <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
               Save up to 20%
             </span>
           </FadeIn>
        )}
      </div>

      {/* Plans Grid */}
      <div className="mt-12 grid gap-8 lg:grid-cols-4 lg:items-start">
        {orderedPlans.map((plan, index) => {
          const price = displayPrice(plan, billingPeriod)
          const isPopular = plan.name.toLowerCase() === 'command'
          
          // Delay animations slightly for a cascading effect
          return (
            <FadeIn 
              key={plan.name} 
              delay={index * 0.1}
              className={cn(
                'group relative flex flex-col rounded-3xl p-8 transition-all duration-300',
                isPopular 
                  ? 'bg-white shadow-2xl ring-4 ring-blue-50 border-blue-200 scale-100 z-10 lg:-mt-4 lg:pb-10' 
                  : 'bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200'
              )}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#23408e] px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div>
                   <h3 className={cn("text-xl font-bold", isPopular ? "text-[#23408e]" : "text-slate-900")}>
                     {plan.name}
                   </h3>
                   <p className="mt-2 text-sm leading-relaxed text-slate-500 min-h-[40px]">
                     {plan.description}
                   </p>
                </div>

                <div className="mt-2">
                   <div className="flex items-baseline gap-1">
                     {price.isCustom ? (
                        <span className="text-3xl font-bold tracking-tight text-slate-900">{price.label}</span>
                     ) : (
                        <>
                          <span className="text-4xl font-bold tracking-tight text-slate-900">{price.label}</span>
                          <span className="text-sm font-medium text-slate-500">/mo</span>
                        </>
                     )}
                   </div>
                   <p className="mt-1 text-xs font-medium text-slate-400">
                     {price.suffix}
                   </p>
                </div>

                <div className="mt-4">
                  <Link 
                    href={plan.ctaLink} 
                    className={cn(
                      "inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
                      isPopular
                        ? "bg-[#23408e] text-white hover:bg-blue-800 hover:shadow-lg focus:ring-blue-600"
                        : "bg-slate-50 text-slate-900 ring-1 ring-slate-200 hover:bg-slate-100 hover:ring-slate-300"
                    )}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>

              <div className="mt-8">
                 <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Features</p>
                 <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-slate-600">
                      <div className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        isPopular ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                      )}>
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                 </ul>
              </div>
              
              {/* Sparkle decoration for popular plan */}
              {isPopular && (
                 <Sparkles className="absolute top-4 right-4 h-5 w-5 text-blue-200 opacity-50" />
              )}
            </FadeIn>
          )
        })}
      </div>
    </div>
  )
}