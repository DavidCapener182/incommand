import type { Metadata } from 'next'
import MarketingNavigation from '@/components/MarketingNavigation'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { FadeIn } from '@/components/marketing/Motion'
import FeatureShowcase from '@/components/marketing/interactives/FeatureShowcase'
import HeroSection from '@/components/marketing/HeroSection'
import { PricingShowcase } from '@/components/marketing/PricingShowcase'
import { Testimonials } from '@/components/marketing/Testimonials'
import { FAQSection } from '@/components/marketing/FAQ'
import { ContactCTA } from '@/components/marketing/ContactCTA'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { pageMetadata } from '@/config/seo.config'
import LogoLoop from '@/components/LogoLoop'
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiCloudflare, SiSupabase, SiDatadog } from 'react-icons/si'
import { loadPlans } from '@/lib/pricing/loadPlans'
import { MobileBanner } from '@/components/marketing/MobileBanner'

export const runtime = 'nodejs'
// Use ISR instead of force-dynamic for better performance
// Page will be statically generated and revalidated every hour
export const revalidate = 3600 // 1 hour

export const metadata: Metadata = {
  ...pageMetadata.home,
  alternates: { canonical: '/' },
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
  // Always show the landing page - don't redirect logged-in users
  // They can navigate to other pages via the navigation if needed
  const plans = await loadPlans()

  return (
    // Added pb-24 for mobile to account for the dismissible banner overlapping content at the bottom
    <div className="relative min-h-screen overflow-x-clip bg-[var(--landing-soft)] pb-24 font-sans text-slate-900 selection:bg-blue-200 sm:pb-0">
      <MarketingNavigation />

      <HeroSection />

      {/* Partners Section */}
      <section className="relative border-y border-[#23408e]/10 bg-white/95 py-10 backdrop-blur">
        <div className="pointer-events-none absolute inset-0 landing-mesh opacity-35" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <FadeIn className="relative flex flex-col items-center justify-center gap-6 rounded-2xl border border-[#23408e]/10 bg-white/80 px-6 py-7 shadow-[0_30px_60px_-45px_rgba(35,64,142,0.85)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Trusted by teams at</p>
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
      <section id="features" className="relative py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 landing-mesh opacity-35" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="landing-section-shell px-6 py-16 sm:px-10 md:py-20 lg:px-16">
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
      <section id="pricing" className="relative py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 landing-noise opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="landing-section-shell landing-surface-gradient px-6 py-16 sm:px-10 md:py-20">
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

      <section id="testimonials" className="relative isolate overflow-hidden bg-white px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-0 -z-10 landing-noise opacity-30" />
        <div className="pointer-events-none absolute -left-28 top-8 h-56 w-56 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-2 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />
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

      <section id="faq" className="relative border-t border-[#23408e]/10 bg-[var(--landing-soft)] px-6 py-24 sm:py-32 lg:px-8">
        <div className="pointer-events-none absolute inset-0 landing-mesh opacity-25" />
        <FAQSection />
      </section>

      <ContactCTA />

      <MobileBanner />

      <MarketingFooter />
    </div>
  )
}
