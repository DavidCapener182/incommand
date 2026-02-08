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
  if (plan.monthlyPrice == null || plan.isCustom) {
    return {
      label: 'Contact Sales',
      suffix: 'Custom pricing for large teams',
      isCustom: true,
      monthlyEquivalent: null
    }
  }

  const symbol = CURRENCY_SYMBOLS[plan.currency ?? 'GBP'] ?? ''
  
  if (period === 'monthly') {
    return {
      label: `${symbol}${plan.monthlyPrice.toLocaleString()}`,
      suffix: 'per month',
      isCustom: false,
      monthlyEquivalent: plan.monthlyPrice
    }
  } else {
    // For annual: calculate monthly * 12 - 10% discount, then show monthly equivalent
    const annualTotal = plan.monthlyPrice * 12 * 0.9 // 10% discount
    const monthlyEquivalent = annualTotal / 12
    
    return {
      label: `${symbol}${Math.round(monthlyEquivalent).toLocaleString()}`,
      suffix: 'per month, billed annually',
      isCustom: false,
      monthlyEquivalent: monthlyEquivalent,
      annualTotal: annualTotal
    }
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
      <div className="flex flex-col items-center gap-3">
        <div className="relative inline-flex h-12 items-center rounded-full border border-blue-100 bg-white/90 p-1 shadow-lg shadow-blue-900/10">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={cn(
              "relative z-10 rounded-full px-6 py-2 text-sm font-semibold transition-colors duration-200",
              billingPeriod === 'monthly' ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={cn(
              "relative z-10 rounded-full px-6 py-2 text-sm font-semibold transition-colors duration-200",
              billingPeriod === 'annual' ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Annual
          </button>
          {/* Sliding Pill Background */}
          <div
            className={cn(
              "absolute h-10 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm ring-1 ring-blue-200/80 transition-all duration-300 ease-in-out",
              billingPeriod === 'monthly' ? "left-1" : "left-[calc(50%+2px)]"
            )}
            style={{ 
              width: 'calc(50% - 4px)',
            }}
          />
        </div>
        
        {/* Discount Badge */}
        {billingPeriod === 'annual' && (
          <FadeIn>
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
              Save up to 10%
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
                'group relative flex flex-col overflow-hidden rounded-3xl p-8 transition-all duration-300',
                isPopular 
                  ? 'z-10 border border-blue-300 bg-gradient-to-b from-white to-blue-50/70 shadow-[0_40px_80px_-50px_rgba(37,99,235,0.8)] ring-1 ring-blue-200/80 lg:-mt-4 lg:pb-10' 
                  : 'border border-slate-200/90 bg-white/95 shadow-[0_30px_70px_-55px_rgba(15,23,42,0.85)] hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_35px_75px_-50px_rgba(37,99,235,0.5)]'
              )}
            >
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-1",
                  isPopular ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-400" : "bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 group-hover:from-blue-200 group-hover:via-blue-100 group-hover:to-blue-200"
                )}
              />

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
                   <p className="mt-2 min-h-[40px] text-sm leading-relaxed text-slate-500">
                     {plan.description}
                   </p>
                </div>

                <div className="mt-2">
                   <div className="flex items-baseline gap-1">
                     {price.isCustom ? (
                        <span className="text-3xl font-bold tracking-tight text-slate-900">{price.label}</span>
                     ) : (
                        <>
                          <span className="text-sm font-medium text-slate-500">From</span>
                          <span className="text-4xl font-bold tracking-tight text-slate-900">{price.label}</span>
                          <span className="text-sm font-medium text-slate-500">/mo</span>
                        </>
                     )}
                   </div>
                   {billingPeriod === 'annual' && price.annualTotal && (
                     <p className="mt-1 text-xs font-medium text-slate-600">
                       From {CURRENCY_SYMBOLS[plan.currency ?? 'GBP'] ?? '£'}{Math.round(price.annualTotal).toLocaleString()} /year
                     </p>
                   )}
                   <p className={cn("text-xs font-medium", billingPeriod === 'annual' && price.annualTotal ? "text-slate-400" : "text-slate-400")}>
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
                        : "bg-slate-50 text-slate-900 ring-1 ring-slate-200 hover:bg-blue-50 hover:ring-blue-300"
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
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1",
                        isPopular ? "bg-blue-100 text-blue-600 ring-blue-200" : "bg-slate-100 text-slate-500 ring-slate-200"
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
