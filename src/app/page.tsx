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
import LogoLoop from '@/components/LogoLoop'
import HeroCards from '@/components/marketing/HeroCards'
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiCloudflare, SiSupabase, SiDatadog } from 'react-icons/si'
import {
  ShieldCheckIcon,
  LightBulbIcon,
  CheckCircleIcon,
  UsersIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  ...pageMetadata.home,
  alternates: { canonical: '/' },
}

// ... [Pricing Config Logic - Same as before] ...
const PLAN_ORDER: PlanCode[] = ['starter', 'operational', 'command', 'enterprise']
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

const partnerLogos = [
  { node: <SiReact />, title: 'React', href: 'https://react.dev' },
  { node: <SiNextdotjs />, title: 'Next.js', href: 'https://nextjs.org' },
  { node: <SiTypescript />, title: 'TypeScript', href: 'https://www.typescriptlang.org' },
  { node: <SiTailwindcss />, title: 'Tailwind CSS', href: 'https://tailwindcss.com' },
  { node: <SiSupabase />, title: 'Supabase', href: 'https://supabase.com' },
  { node: <SiCloudflare />, title: 'Cloudflare', href: 'https://cloudflare.com' },
  { node: <SiDatadog />, title: 'Datadog', href: 'https://www.datadoghq.com' },
]



export default async function HomePage() {
  try {
    const { user, role } = await getServerUser()
    if (user) {
      if (role === 'superadmin') {
        redirect('/admin')
      }
      redirect('/incidents')
    }
  } catch (error) {
    console.error('Error checking auth in HomePage:', error)
  }

  const plans = await loadPlans()

  return (
    <div className="min-h-screen bg-[#F1F4F9] text-slate-900 font-sans selection:bg-blue-200">
      <MarketingNavigation />

      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden bg-[#23408e]">
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 md:px-10 lg:flex-row lg:justify-between lg:gap-16">
          <FadeIn className="max-w-2xl flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md transition hover:bg-white/15">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-sm font-medium text-white/90 tracking-wide">
                Securing 1,200+ venues nationwide
              </span>
            </div>

            <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:leading-[1.1]">
              <span className="block">Event Safety,</span>
              <span className="bg-gradient-to-r from-blue-100 to-blue-400 bg-clip-text text-transparent">
                Simplified.
              </span>
            </h1>
            
            <p className="mt-6 text-lg leading-relaxed text-blue-100/90 sm:text-xl">
              Streamline every aspect of live event control — from incident logging to staff coordination — with one intelligent, AI-powered command platform.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:justify-start">
              <HeroActions
                className="w-full sm:w-auto"
                secondaryHref="#features"
                secondaryLabel="Explore Platform"
              />
            </div>

            <FadeIn delay={0.2} className="mt-10 flex items-center justify-center gap-6 lg:justify-start">
              <SocialLinks textClassName="text-blue-100/80 hover:text-white text-sm font-medium" iconClassName="border-white/40 bg-white/10 hover:bg-white/20" />
            </FadeIn>
          </FadeIn>

          <FadeIn delay={0.2}>
            <HeroCards />
          </FadeIn>
        </div>
      </section>

      {/* Partners Section - Fixed Gradient */}
      <section className="border-b border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <FadeIn className="flex flex-col items-center justify-center gap-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Trusted by teams at</p>
            <div className="w-full max-w-4xl opacity-75 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0">
              <LogoLoop
                logos={partnerLogos}
                speed={50}
                direction="left"
                logoHeight={36}
                gap={60}
                hoverSpeed={10}
                fadeOut
                fadeOutColor="white"
                ariaLabel="Technology partners"
                className="text-slate-600"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="rounded-3xl bg-white px-6 py-16 shadow-xl ring-1 ring-slate-900/5 sm:px-10 md:py-20 lg:px-16">
            <FadeIn className="mx-auto mb-16 max-w-3xl text-center">
              <h2 className="text-base font-semibold leading-7 text-[#23408e]">Operational Excellence</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Built for Real-World Crowd Operations
              </p>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                InCommand equips your team with the tools they need to plan, monitor, and manage any live event. 
                Each feature is engineered to enhance coordination, accountability, and response speed.
              </p>
            </FadeIn>
            <FeatureShowcase />
          </div>
        </div>
      </section>

      <HowItWorks />

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
           <div className="rounded-3xl bg-white px-6 py-16 shadow-xl ring-1 ring-slate-900/5 sm:px-10 md:py-20">
            <FadeIn className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Simple, Transparent Pricing</h2>
              <p className="mt-4 text-lg text-slate-600">
                Whether you manage a local festival or a national venue, InCommand adapts to your needs.
              </p>
            </FadeIn>
            <PricingShowcase plans={plans} />
          </div>
        </div>
      </section>

      <section id="testimonials" className="relative isolate bg-slate-50 px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-0 -z-10 opacity-20" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="mx-auto max-w-7xl text-center">
          <FadeIn className="mx-auto max-w-3xl mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#23408e] sm:text-4xl">Trusted by Venues Globally</h2>
            <p className="mt-4 text-lg text-slate-600">
              Real operators. Real events. Real impact.
            </p>
          </FadeIn>
          <Testimonials />
        </div>
      </section>

      <section id="faq" className="bg-white px-6 py-24 sm:py-32 lg:px-8">
        <FAQSection />
      </section>

      <ContactCTA />

      <div className="sm:hidden sticky bottom-0 z-50 border-t border-blue-200 bg-blue-50/95 backdrop-blur px-6 py-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-1">
             <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">Desktop Recommended</p>
            <p className="text-xs text-blue-700 mt-1">
              We&apos;re building a mobile app. For now, please use InCommand on a desktop for the best experience.
            </p>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  )
}