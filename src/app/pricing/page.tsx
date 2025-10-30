export const revalidate = 3600
export const dynamic = 'force-static'

import type { Metadata } from 'next'
import Image from 'next/image'
import MarketingNavigation from '@/components/MarketingNavigation'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SocialLinks } from '@/components/marketing/SocialLinks'
import { FadeIn } from '@/components/marketing/Motion'
import { HeroActions } from '@/components/marketing/interactives/HeroActions'
import { PricingPlans, type PricingPlan } from '@/components/marketing/interactives/PricingPlans'
import { defaultMarketingPlans } from '@/data/marketingPlans'
import { pageMetadata } from '@/config/seo.config'

export const metadata: Metadata = {
  ...pageMetadata.pricing,
  alternates: { canonical: '/pricing' },
}

async function loadPlans(): Promise<PricingPlan[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/billing/plans`, { cache: 'no-store' })
    if (res.ok) {
      const json = await res.json()
      const apiPlans = (json.plans ?? []).map((p: any) => ({
        name: p.name,
        price: `£${p.price_monthly ?? 0}`,
        period: 'per month',
        description: '',
        features: p.metadata?.features ?? [],
        cta: 'Get Started',
        ctaLink: '/signup',
        highlighted: p.code === 'professional',
      })) as PricingPlan[]
      if (apiPlans.length > 0) return apiPlans
    }
  } catch {}
  // Fallback to marketing defaults when no DB plans
  return defaultMarketingPlans.map((p) => ({
    name: p.name,
    price: `£${p.priceMonthly}`,
    period: 'per month',
    description: '',
    features: p.features,
    cta: 'Get Started',
    ctaLink: '/signup',
    highlighted: p.code === 'professional',
  }))
}

const faqs = [
  {
    question: 'Can I cancel or change my plan at any time?',
    answer: 'Absolutely. You can upgrade, downgrade, or cancel whenever needed — with no hidden fees.',
  },
  {
    question: 'How do I get started?',
    answer: 'Contact our sales team to discuss your requirements and get started with InCommand.',
  },
  {
    question: 'Do you offer annual billing discounts?',
    answer: 'Annual plans receive two months free and priority onboarding support.',
  },
  {
    question: 'How secure is my data?',
    answer:
      'All data is encrypted, stored on UK-based servers, and fully compliant with GDPR and ISO 27001 standards.',
  },
]

export default async function PricingPage() {
  const plans = await loadPlans()
  return (
    <div className="min-h-screen bg-[#F1F4F9] text-slate-900">
      <MarketingNavigation />

      <section className="relative w-full overflow-hidden">
        <div className="w-full bg-gradient-to-b from-[#23408e] to-[#2661F5] text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 px-6 py-16 sm:px-10 sm:py-24 lg:flex-row">
            <FadeIn className="max-w-xl text-center lg:text-left">
              <h1 className="mb-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                Clear, Scalable Pricing — Built for Every Operation
              </h1>
              <p className="mb-6 text-lg leading-relaxed text-blue-100">
                Whether you manage a local festival or a national venue, InCommand adapts to your needs. Every plan
                includes full analytics, real-time dashboards, and responsive UK-based support.
              </p>
              <p className="mb-10 text-sm text-blue-200">Contact sales to discuss your requirements</p>
              <HeroActions
                className="justify-center"
                preLaunchLabel="Register Interest"
                postLaunchLabel="Get Started"
                secondaryHref="mailto:sales@incommand.uk?subject=Pricing%20Inquiry"
                secondaryLabel="Talk to Sales"
                showCountdown={false}
              />
            </FadeIn>

            <FadeIn delay={0.2} className="relative w-full max-w-lg">
              <div className="aspect-video overflow-hidden rounded-3xl bg-white/10 backdrop-blur-sm">
                <Image
                  src="/placeholder-pricing-dashboard.png"
                  alt="Screenshot of InCommand pricing dashboard"
                  fill
                  className="object-cover"
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <div className="mt-10 flex justify-center px-6">
        <SocialLinks textClassName="text-blue-900" iconClassName="border-blue-300 text-blue-800" />
      </div>

      <section className="py-24">
        <div className="mx-auto max-w-7xl rounded-3xl bg-white px-6 py-16 sm:px-10">
          <FadeIn className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-[#23408e]">Choose Your Plan</h2>
          </FadeIn>
          <PricingPlans plans={plans} />
        </div>
      </section>

      <section className="bg-white px-6 py-20 text-blue-900 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <FadeIn className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-[#23408e]">Frequently Asked Questions</h2>
          </FadeIn>

          <div className="mx-auto max-w-3xl space-y-4">
            {faqs.map((faq, index) => (
              <FadeIn
                key={faq.question}
                delay={index * 0.06}
                className="group rounded-xl bg-blue-50 p-4 transition hover:shadow-md sm:p-6"
              >
                <details className="text-blue-900">
                  <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold">
                    {faq.question}
                    <span className="text-blue-500 transition group-open:rotate-180">⌄</span>
                  </summary>
                  <p className="mt-3 text-blue-800">{faq.answer}</p>
                </details>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#23408e] to-[#2661F5] py-24 text-center text-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <FadeIn className="mx-auto max-w-3xl space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to Simplify Your Operations?</h2>
              <p className="mt-3 text-lg text-blue-100">
                Join hundreds of event and safety professionals using InCommand.
              </p>
            </div>
            <HeroActions
              className="justify-center"
              preLaunchLabel="Get Started"
              postLaunchLabel="Get Started"
              secondaryHref="mailto:sales@incommand.uk?subject=Pricing%20Inquiry"
              secondaryLabel="Talk to Sales"
              secondaryButtonClassName="border border-white text-white px-8 py-4 rounded-xl hover:bg-white/10 font-semibold transition-colors"
              showCountdown={false}
            />
          </FadeIn>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
