'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { PricingPlan } from '@/components/marketing/interactives/PricingPlans'

type BillingPeriod = 'monthly' | 'annual'

const CURRENCY_SYMBOLS: Record<string, string> = { GBP: '£', USD: '$', EUR: '€' }

const displayPrice = (plan: PricingPlan, period: BillingPeriod) => {
  const value = period === 'monthly' ? plan.monthlyPrice : plan.annualPrice

  if (value == null || plan.isCustom) {
    return {
      label: 'Talk to Sales',
      suffix: plan.isCustom ? 'Custom pricing' : 'Contact us for pricing',
    }
  }

  const symbol = CURRENCY_SYMBOLS[plan.currency ?? 'GBP'] ?? ''
  return {
    label: `${symbol}${value.toLocaleString()}`,
    suffix: period === 'monthly' ? 'per month' : 'per month (annual)',
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
      <Tabs
        value={billingPeriod}
        onValueChange={(v) => setBillingPeriod(v as BillingPeriod)}
        className="flex flex-col items-center"
      >
        <TabsList className="inline-flex h-11 rounded-full border bg-background text-sm backdrop-blur-sm">
          <TabsTrigger
            value="monthly"
            className="px-5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Monthly
          </TabsTrigger>
          <TabsTrigger
            value="annual"
            className="px-5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Annual billing
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-10 grid gap-6 lg:grid-cols-4 items-stretch">
        {orderedPlans.map((plan, index) => {
          const price = displayPrice(plan, billingPeriod)
          const isPopular = plan.name.toLowerCase() === 'command'
          const isBlueTint = index % 2 === 1

          return (
            <div
              key={plan.name}
              className={cn(
                'relative flex h-full flex-col rounded-3xl border p-0 shadow-sm transition overflow-hidden',
                isBlueTint
                  ? 'bg-[#e6edff] border-[#cad6ff]'
                  : 'bg-white border-blue-100',
                isPopular && 'border-blue-300 shadow-lg ring-2 ring-blue-200 scale-[1.03]'
              )}
            >
              {/* NEW TOP BANNER */}
              {isPopular && (
                <div className="w-full bg-[#23408e] text-white text-xs font-semibold tracking-wide text-center py-2">
                  MOST POPULAR
                </div>
              )}

              {/* Card content */}
              <div className="p-8">
                {/* Header */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="mt-6">
                  <p className="text-sm font-medium text-muted-foreground">from</p>
                  <p className="text-4xl font-bold leading-tight">{price.label}</p>
                  <p className="text-sm text-muted-foreground">{price.suffix}</p>
                </div>

                {/* CTA */}
                <Button
                  asChild
                  size="lg"
                  className={cn(
                    'mt-6 w-full rounded-full font-semibold shadow-sm',
                    isPopular
                      ? 'bg-[#1d4ed8] text-white hover:bg-[#1e40af]'
                      : 'bg-white text-primary border border-primary hover:bg-primary/5'
                  )}
                >
                  <Link href={plan.ctaLink}>
                    {plan.cta}
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                {/* Divider */}
                <div className="my-8 h-px bg-border" />

                {/* Features */}
                <ul className="flex-1 space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CircleCheck className="mt-0.5 h-4 w-4 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}