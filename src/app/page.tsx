import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import MarketingNavigation from '@/components/MarketingNavigation'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SocialLinks } from '@/components/marketing/SocialLinks'
import { FadeIn } from '@/components/marketing/Motion'
import { HeroActions } from '@/components/marketing/interactives/HeroActions'
import { FeatureShowcase } from '@/components/marketing/interactives/FeatureShowcase'
import type { PricingPlan } from '@/components/marketing/interactives/PricingPlans'
import { PricingShowcase } from '@/components/marketing/PricingShowcase'
import { Testimonials } from '@/components/marketing/Testimonials'
import { FAQSection } from '@/components/marketing/FAQ'
import { ContactCTA } from '@/components/marketing/ContactCTA'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { PRICING_PLANS, type Plan, type PlanCode } from '@/config/PricingConfig'
import { pageMetadata } from '@/config/seo.config'
import { getServerUser } from '@/lib/auth/getServerUser'
import CardSwap, { Card } from '@/components/CardSwap'
import LogoLoop from '@/components/LogoLoop'
import DarkVeil from '@/components/DarkVeil'
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiCloudflare, SiSupabase, SiDatadog } from 'react-icons/si'
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

const partnerLogos = [
  { node: <SiReact />, title: 'React', href: 'https://react.dev' },
  { node: <SiNextdotjs />, title: 'Next.js', href: 'https://nextjs.org' },
  { node: <SiTypescript />, title: 'TypeScript', href: 'https://www.typescriptlang.org' },
  { node: <SiTailwindcss />, title: 'Tailwind CSS', href: 'https://tailwindcss.com' },
  { node: <SiSupabase />, title: 'Supabase', href: 'https://supabase.com' },
  { node: <SiCloudflare />, title: 'Cloudflare', href: 'https://cloudflare.com' },
  { node: <SiDatadog />, title: 'Datadog', href: 'https://www.datadoghq.com' },
]

const heroCardPlaceholders = [
  {
    title: 'Live Incident Feed',
    badge: 'Operations Control',
    description: 'Placeholder for a screenshot of your real-time incident timeline showing active logs and status chips.',
    placeholderNote: 'Swap with: dashboard image of incident cards + response timers.',
    gradient: 'from-[#2563eb] via-[#1d4ed8] to-[#0f172a]',
    statLabel: 'Avg Response',
    statValue: '6m 12s',
  },
  {
    title: 'Staff Readiness Snapshot',
    badge: 'Staffing & Readiness',
    description: 'Placeholder for a staffing or readiness widget displaying coverage by discipline.',
    placeholderNote: 'Swap with: staffing coverage heatmap / readiness gauge.',
    gradient: 'from-[#111827] via-[#334155] to-[#9ca3af]',
    statLabel: 'Coverage',
    statValue: '94%',
  },
  {
    title: 'AI Event Summary',
    badge: 'Analytics',
    description: 'Placeholder for AI-generated insights or executive summary view.',
    placeholderNote: 'Swap with: AI summary text block with highlights.',
    gradient: 'from-[#fb7185] via-[#f43f5e] to-[#fbcfe8]',
    statLabel: 'Confidence',
    statValue: '92%',
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
        <div className="relative w-full bg-[#23408e] text-white">
          <div className="absolute inset-0 pointer-events-none opacity-70 mix-blend-screen">
            <DarkVeil
              hueShift={-8}
              noiseIntensity={0.04}
              scanlineIntensity={0.08}
              scanlineFrequency={720}
              speed={0.35}
              warpAmount={0.1}
            />
          </div>
          <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-4 py-12 sm:gap-12 sm:px-6 sm:py-16 md:px-10 md:py-24 lg:flex-row">
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
              <div className="relative mx-auto w-full max-w-[520px]" style={{ height: 520 }}>
                <div
                  className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20"
                  aria-hidden="true"
                />
                <CardSwap
                  width={460}
                  height={540}
                  cardDistance={65}
                  verticalDistance={75}
                  delay={4500}
                  pauseOnHover
                >
                  {heroCardPlaceholders.map((card) => (
                    <Card key={card.title} className="border border-white/20 shadow-2xl">
                      <div
                        className={`flex h-full w-full flex-col justify-between rounded-2xl bg-gradient-to-br ${card.gradient} p-6 text-white`}
                      >
                        <div>
                          <p className="text-xs uppercase tracking-wide text-white/70">{card.badge}</p>
                          <h3 className="mt-2 text-2xl font-semibold">{card.title}</h3>
                          <p className="mt-3 text-sm text-white/80">{card.description}</p>
                        </div>
                        <div className="mt-6 space-y-3">
                          <div className="rounded-xl border border-white/30 bg-white/10 p-4 text-xs leading-relaxed text-white/80">
                            {card.placeholderNote}
                          </div>
                          <div className="rounded-2xl border border-white/30 bg-white/10 p-4 flex items-center justify-center">
                            <Image
                              src="/inCommand.png"
                              alt="InCommand logo placeholder"
                              width={160}
                              height={48}
                              className="opacity-90"
                            />
                          </div>
                          <div className="flex items-center justify-between rounded-xl bg-white/20 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/90">
                            <span>{card.statLabel}</span>
                            <span className="text-base">{card.statValue}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </CardSwap>
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
            <div className="relative mx-auto max-w-5xl">
              <LogoLoop
                logos={partnerLogos}
                speed={60}
                direction="left"
                logoHeight={44}
                gap={48}
                hoverSpeed={20}
                scaleOnHover
                fadeOut
                fadeOutColor="#ffffff"
                ariaLabel="Technology partners"
                className="text-blue-700 w-full"
              />
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
      <HowItWorks />

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 md:py-24">
        <div className="mx-auto max-w-7xl rounded-2xl sm:rounded-3xl bg-white px-4 py-12 sm:px-6 sm:py-14 md:px-10 md:py-16">
          <FadeIn className="mb-10 text-center sm:mb-14">
            <h2 className="text-2xl font-bold text-[#23408e] sm:text-3xl">Choose Your Plan</h2>
            <p className="mt-3 text-base text-blue-700 sm:mt-4 sm:text-lg">
              Whether you manage a local festival or a national venue, InCommand adapts to your needs.
            </p>
          </FadeIn>
          <PricingShowcase plans={plans} />
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-gradient-to-b from-white to-blue-50 px-4 py-12 sm:px-6 sm:py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-7xl text-center">
          <FadeIn className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-[#23408e] sm:text-3xl md:text-4xl">Trusted by Venues Around the World</h2>
            <p className="mt-3 text-base text-blue-700 sm:mt-4 sm:text-lg">
              Real operators. Real events. Real impact.
            </p>
          </FadeIn>
          <Testimonials />
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-white px-4 py-12 text-blue-900 sm:px-6 sm:py-16 md:px-10 md:py-20">
        <FAQSection />
      </section>

      <ContactCTA />

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
