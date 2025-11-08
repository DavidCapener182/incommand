import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import MarketingNavigation from '@/components/MarketingNavigation'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SocialLinks } from '@/components/marketing/SocialLinks'
import { FadeIn } from '@/components/marketing/Motion'
import { HeroActions } from '@/components/marketing/interactives/HeroActions'
import { FeatureShowcase } from '@/components/marketing/interactives/FeatureShowcase'
import { PricingPlans, type PricingPlan } from '@/components/marketing/interactives/PricingPlans'
import { PRICING_PLANS, type Plan, type PlanCode } from '@/config/PricingConfig'
import { pageMetadata } from '@/config/seo.config'
import { getServerUser } from '@/lib/auth/getServerUser'
import {
  ShieldCheckIcon,
  LightBulbIcon,
  CheckCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  ...pageMetadata.home,
  alternates: { canonical: '/' },
}

const PLAN_ORDER: PlanCode[] = ['starter', 'operational', 'command', 'enterprise']
const CURRENCY_SYMBOLS: Record<string, string> = { GBP: '£', USD: '$', EUR: '€' }
const PLAN_NOTES: Record<PlanCode, string> = {
  starter: 'Built for smaller teams just getting started.',
  operational: 'Our most popular plan for growing venues.',
  command: 'Advanced control and AI insights for complex operations.',
  enterprise: 'Includes dedicated onboarding, custom SLAs, and private deployment options.',
}

function buildPricingPlan(
  plan: Plan,
  options: {
    monthlyPrice?: number | null
    annualPrice?: number | null
    currency?: string
    features?: string[]
  } = {}
): PricingPlan {
  const monthlyPrice =
    options.monthlyPrice !== undefined
      ? options.monthlyPrice
      : typeof plan.pricing.monthly === 'number'
      ? plan.pricing.monthly
      : null

  const annualPrice =
    options.annualPrice !== undefined
      ? options.annualPrice
      : typeof plan.pricing.annual === 'number'
      ? plan.pricing.annual
      : null

  const currency = options.currency ?? plan.pricing.currency
  const features = options.features ?? plan.features.features
  const isCustom = monthlyPrice === null

  return {
    name: plan.displayName,
    description: plan.metadata.description ?? '',
    features,
    cta: isCustom ? 'Talk to Sales' : 'Get Started',
    ctaLink: isCustom
      ? 'mailto:support@incommand.uk?subject=InCommand%20Enterprise%20Pricing'
      : `/signup?plan=${plan.code}`,
    note: PLAN_NOTES[plan.code],
    monthlyPrice,
    annualPrice,
    currency,
    isCustom,
  }
}

async function loadPlans(): Promise<PricingPlan[]> {
  const normalizedBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || ''

  if (normalizedBase) {
    try {
      const baseUrl = normalizedBase.startsWith('http') ? normalizedBase : `https://${normalizedBase}`
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/billing/plans`, {
        cache: 'no-store',
        next: { revalidate: 0 },
      })

      if (res.ok) {
        const json = await res.json()
        const planMap = new Map<string, any>((json.plans ?? []).map((p: any) => [p.code, p]))

        const apiPlans = PLAN_ORDER.map((code) => {
          const configPlan = PRICING_PLANS[code]
          if (!configPlan) return null
          const apiPlan = planMap.get(code)

          const monthlyPrice =
            typeof apiPlan?.price_monthly === 'number'
              ? apiPlan.price_monthly
              : typeof configPlan.pricing.monthly === 'number'
              ? configPlan.pricing.monthly
              : null

          const annualPrice =
            typeof apiPlan?.price_annual === 'number'
              ? apiPlan.price_annual
              : typeof configPlan.pricing.annual === 'number'
              ? configPlan.pricing.annual
              : null

          const currency = apiPlan?.currency ?? configPlan.pricing.currency
          const features = Array.isArray(apiPlan?.metadata?.features)
            ? apiPlan.metadata.features
            : configPlan.features.features

          return buildPricingPlan(configPlan, { monthlyPrice, annualPrice, currency, features })
        }).filter((plan): plan is PricingPlan => Boolean(plan))

        if (apiPlans.length > 0) {
          return apiPlans
        }
      }
    } catch (error) {
      console.error('Error loading plans:', error)
    }
  }

  return PLAN_ORDER.map((code) => buildPricingPlan(PRICING_PLANS[code]))
}

const testimonials = [
  {
    quote: 'We reduced incident response times by 40% using InCommand during our first major deployment.',
    name: 'Event Safety Manager',
    org: 'Major UK Arena',
  },
  {
    quote: 'Finally, a platform that understands the operational challenges of live events.',
    name: 'Head of Security',
    org: 'National Stadium Group',
  },
  {
    quote: 'The analytics and AI summaries are game-changers for post-event debriefs.',
    name: 'Operations Lead',
    org: 'City Festival',
  },
  {
    quote: 'InCommand transformed how we coordinate multi-venue operations. The real-time visibility is unmatched.',
    name: 'Festival Operations Director',
    org: 'National Event Group',
  },
]

const companyValues = [
  {
    icon: ShieldCheckIcon,
    title: 'Safety First',
    description:
      'Every attendee deserves to feel safe. Our platform empowers teams to respond rapidly and effectively to incidents.',
  },
  {
    icon: LightBulbIcon,
    title: 'Innovation',
    description:
      'We harness AI, automation, and predictive analytics to deliver modern, proactive event safety management.',
  },
  {
    icon: CheckCircleIcon,
    title: 'Reliability',
    description:
      'Our clients rely on InCommand during their most critical operations. We maintain 99.9% uptime, always.',
  },
  {
    icon: UsersIcon,
    title: 'Community',
    description:
      'We connect event professionals worldwide, sharing knowledge and best practices to improve safety standards together.',
  },
]

const howItWorksSteps = [
  {
    step: '1',
    title: 'Setup Your Event',
    description: 'Create your event profile, configure settings, and invite your team members with appropriate access levels.',
  },
  {
    step: '2',
    title: 'Deploy Your Team',
    description: 'Assign staff to locations, manage skills coverage, and track presence in real-time with visual dashboards.',
  },
  {
    step: '3',
    title: 'Manage, Monitor & Review',
    description: 'Log incidents, monitor analytics, receive AI-powered insights, and generate compliance reports for post-event debriefs.',
  },
]

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

export default async function HomePage() {
  // Redirect authenticated users to their dashboard
  try {
    const { user, role } = await getServerUser()
    if (user) {
      if (role === 'superadmin') {
        redirect('/admin')
      }
      redirect('/incidents')
    }
  } catch (error) {
    // If auth check fails, continue to show marketing page
    console.error('Error checking auth in HomePage:', error)
  }

  const plans = await loadPlans()

  return (
    <div className="min-h-screen bg-[#F1F4F9] text-slate-900">
      <MarketingNavigation />

      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden">
        <div className="w-full bg-gradient-to-b from-[#23408e] to-[#2661F5] text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-4 py-12 sm:gap-12 sm:px-6 sm:py-16 md:px-10 md:py-24 lg:flex-row">
            <FadeIn className="max-w-xl text-center lg:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm backdrop-blur-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
                <span className="whitespace-nowrap">1,200+ venues secured with inCommand</span>
              </div>
              <h1 className="mb-4 text-3xl font-extrabold leading-tight sm:mb-6 sm:text-4xl md:text-5xl">
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Event Safety Management, Simplified
                </span>
              </h1>
              <p className="mb-8 text-base leading-relaxed text-blue-100 sm:mb-10 sm:text-lg">
                Streamline every aspect of live event control — from incident logging to staff coordination — with one
                intelligent, AI-powered command platform trusted across the UK.
              </p>
              <HeroActions
                className="justify-center lg:justify-start"
                secondaryHref="#features"
                secondaryLabel="Explore Features"
              />
              <FadeIn delay={0.2} className="mt-6 sm:mt-8">
                <SocialLinks textClassName="text-white" iconClassName="border-white/60 bg-white/20" />
              </FadeIn>
            </FadeIn>

            <FadeIn delay={0.2} className="relative w-full max-w-lg mt-8 lg:mt-0">
              <div className="overflow-hidden rounded-2xl sm:rounded-3xl bg-white/10 backdrop-blur-sm">
                <Image
                  src="/placeholder-dashboard.png"
                  alt="Screenshot of InCommand dashboard showing live incidents and analytics"
                  width={960}
                  height={540}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Partners / Social Proof Section */}
      <section id="partners" className="bg-white py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
          <FadeIn className="text-center">
            <p className="mb-4 text-xs sm:text-sm font-semibold uppercase tracking-wide text-blue-600 sm:mb-6">Trusted by employees at</p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 opacity-60">
              {/* Placeholder for company logos - can be replaced with actual logos */}
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="h-10 w-20 sm:h-12 sm:w-24 rounded-lg bg-blue-100/50 flex items-center justify-center text-blue-400 text-xs font-semibold"
                >
                  Logo {i}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Benefits / Features Section */}
      <section id="features" className="py-12 sm:py-16 md:py-24">
        <div className="mx-auto max-w-7xl rounded-2xl sm:rounded-3xl bg-white px-4 py-12 sm:px-6 sm:py-14 md:px-10 md:py-16">
          <FadeIn className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
            <h2 className="text-2xl font-bold text-[#23408e] sm:text-3xl md:text-4xl">
              Built for Real-World Crowd Operations
            </h2>
            <p className="mt-3 text-base text-blue-700 sm:mt-4 sm:text-lg">
              InCommand equips your team with the tools they need to plan, monitor, and manage any live event — whether
              it&apos;s a local festival or a national stadium. Each feature is built to enhance coordination,
              accountability, and response speed.
            </p>
          </FadeIn>
          <FeatureShowcase />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-gradient-to-b from-blue-50 to-white py-12 sm:py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
          <FadeIn className="mx-auto mb-8 max-w-3xl text-center sm:mb-12">
            <h2 className="text-2xl font-bold text-[#23408e] sm:text-3xl md:text-4xl">How It Works</h2>
            <p className="mt-3 text-base text-blue-700 sm:mt-4 sm:text-lg">
              Get started with InCommand in three simple steps and transform your event operations.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            {howItWorksSteps.map((step, index) => (
              <FadeIn
                key={step.step}
                delay={index * 0.1}
                className="rounded-xl sm:rounded-2xl bg-white p-6 sm:p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-blue-100 text-xl sm:text-2xl font-bold text-blue-700 mx-auto">
                  {step.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-blue-900 sm:mb-3 sm:text-xl">{step.title}</h3>
                <p className="text-sm text-blue-700 sm:text-base">{step.description}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 md:py-24">
        <div className="mx-auto max-w-7xl rounded-2xl sm:rounded-3xl bg-white px-4 py-12 sm:px-6 sm:py-14 md:px-10 md:py-16">
          <FadeIn className="mb-10 text-center sm:mb-14">
            <h2 className="text-2xl font-bold text-[#23408e] sm:text-3xl">Choose Your Plan</h2>
            <p className="mt-3 text-base text-blue-700 sm:mt-4 sm:text-lg">
              Whether you manage a local festival or a national venue, InCommand adapts to your needs.
            </p>
          </FadeIn>
          <PricingPlans plans={plans} />
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-gradient-to-b from-white to-blue-50 px-4 py-12 text-blue-900 sm:px-6 sm:py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-7xl">
          <FadeIn className="mx-auto mb-10 max-w-3xl text-center sm:mb-16">
            <h2 className="text-2xl font-bold text-[#23408e] sm:text-3xl md:text-4xl">Loved by People Worldwide</h2>
            <p className="mt-3 text-base text-blue-700 sm:mt-4 sm:text-lg">
              See what event professionals are saying about InCommand.
            </p>
          </FadeIn>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((testimonial, index) => (
              <FadeIn
                key={testimonial.name}
                delay={0.2 + index * 0.08}
                className="rounded-xl sm:rounded-2xl bg-white p-5 sm:p-6 text-blue-800 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-3 flex text-yellow-400 sm:mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="h-4 w-4 sm:h-5 sm:w-5 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="mb-3 text-sm italic sm:mb-4 sm:text-base">&ldquo;{testimonial.quote}&rdquo;</p>
                <p className="text-sm font-semibold text-blue-900 sm:text-base">{testimonial.name}</p>
                <p className="text-xs text-blue-600 sm:text-sm">{testimonial.org}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-white px-4 py-12 text-blue-900 sm:px-6 sm:py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-7xl">
          <FadeIn className="mb-8 text-center sm:mb-10">
            <h2 className="text-2xl font-bold text-[#23408e] sm:text-3xl">Frequently Asked Questions</h2>
            <p className="mt-3 text-base text-blue-700 sm:mt-4 sm:text-lg">
              Address some major questions to help people make the final call.
            </p>
          </FadeIn>

          <div className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <FadeIn
                key={faq.question}
                delay={index * 0.06}
                className="group rounded-lg sm:rounded-xl bg-blue-50 p-4 transition hover:shadow-md sm:p-6"
              >
                <details className="text-blue-900">
                  <summary className="flex cursor-pointer items-center justify-between text-base font-semibold sm:text-lg">
                    {faq.question}
                    <span className="text-blue-500 transition group-open:rotate-180">⌄</span>
                  </summary>
                  <p className="mt-2 text-sm text-blue-800 sm:mt-3 sm:text-base">{faq.answer}</p>
                </details>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="cta" className="bg-gradient-to-r from-[#23408e] to-[#2661F5] py-12 text-center text-white sm:py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
          <FadeIn className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl md:text-4xl">Ready to Simplify Your Operations?</h2>
              <p className="mt-2 text-base text-blue-100 sm:mt-3 sm:text-lg">
                Join the growing number of venues using inCommand to manage their security operations smarter.
              </p>
            </div>
            <HeroActions
              className="justify-center"
              preLaunchLabel="Register Interest"
              postLaunchLabel="Request a Demo"
              secondaryHref="mailto:sales@incommand.uk?subject=Request%20Demo"
              secondaryLabel="Talk to Sales"
              secondaryButtonClassName="border border-white text-white px-8 py-4 rounded-xl hover:bg-white/10 font-semibold transition-colors"
              showCountdown={false}
            />
          </FadeIn>
        </div>
      </section>

      {/* Mobile Notice Section - Only visible on mobile */}
      <section className="bg-blue-50 border-t-2 border-blue-200 py-8 px-6 sm:hidden">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-4 py-2 mb-4">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-semibold text-blue-900">Mobile App in Development</span>
          </div>
          <p className="text-sm text-blue-800 leading-relaxed">
            We&apos;re currently developing a dedicated mobile experience for inCommand. For the full platform experience, please access inCommand from a desktop browser.
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
