export const revalidate = 3600
export const dynamic = 'force-static'

import type { Metadata } from 'next'
import Image from 'next/image'
import MarketingNavigation from '@/components/MarketingNavigation'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SocialLinks } from '@/components/marketing/SocialLinks'
import { FadeIn } from '@/components/marketing/Motion'
import { HeroActions } from '@/components/marketing/interactives/HeroActions'
import { FeatureShowcase } from '@/components/marketing/interactives/FeatureShowcase'
import { pageMetadata } from '@/config/seo.config'

export const metadata: Metadata = {
  ...pageMetadata.features,
  alternates: { canonical: '/features' },
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
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F1F4F9] text-slate-900">
      <MarketingNavigation />

      <section className="relative overflow-hidden">
        <div className="w-full bg-gradient-to-b from-[#23408e] to-[#2661F5] text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 px-6 py-16 sm:py-24 sm:px-10 lg:flex-row">
            <FadeIn className="max-w-xl text-center lg:text-left">
              <h1 className="mb-6 text-4xl font-extrabold leading-tight sm:text-5xl">
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Designed for Modern Event Safety Teams
                </span>
              </h1>
              <p className="mb-10 text-lg leading-relaxed text-blue-100">
                Streamline every aspect of live event control — from incident logging to staff coordination — with one
                intelligent, AI-powered command platform trusted across the UK.
              </p>
              <HeroActions
                className="justify-center"
                secondaryHref="/pricing"
                secondaryLabel="Talk to Sales"
              />
              <FadeIn delay={0.2} className="mt-8">
                <SocialLinks textClassName="text-white" iconClassName="border-white/60 bg-white/20" />
              </FadeIn>
            </FadeIn>

            <FadeIn delay={0.2} className="relative w-full max-w-lg">
              <div className="overflow-hidden rounded-3xl bg-white/10 backdrop-blur-sm">
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

      <section className="py-24">
        <div className="mx-auto max-w-7xl rounded-3xl bg-white px-6 py-16 sm:px-10">
          <FadeIn className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-[#23408e] sm:text-4xl">
              Powerful Features for Safer, Smarter Operations
            </h2>
            <p className="mt-4 text-lg text-blue-700">
              InCommand equips your team with the tools they need to plan, monitor, and manage any live event — whether
              it&apos;s a local festival or a national stadium. Each feature is built to enhance coordination,
              accountability, and response speed.
            </p>
          </FadeIn>
          <FeatureShowcase />
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-r from-[#23408e] to-[#2661F5] py-24">
        <div className="absolute inset-0 opacity-40">
          <Image
            src="/placeholder-event-control-room.jpg"
            alt="Event control room with staff operating screens"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <FadeIn>
            <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">
              From the Field to the Control Room — One Connected Platform
            </h2>
            <p className="text-lg leading-relaxed text-blue-100">
              Designed by practitioners with real-world experience, InCommand connects your on-site teams and control
              staff through a single, secure interface. From mobile reporting to live dashboards, every decision becomes
              faster, clearer, and fully accountable.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-gradient-to-b from-white to-blue-50 px-6 py-20 text-blue-900 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <FadeIn className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-[#23408e] sm:text-4xl">Built for Scale, Proven in the Field</h2>
            <p className="mt-4 text-lg text-blue-700">
              InCommand adapts to any operation — from small community festivals to complex, city-wide deployments.
            </p>
          </FadeIn>

          <div className="mb-16 grid grid-cols-1 gap-8 xs:grid-cols-2 md:grid-cols-3">
            {[
              { label: 'Events Supported', value: '500+' },
              { label: 'Incidents Managed', value: '10,000+' },
              { label: 'Uptime Guarantee', value: '99.9%' },
            ].map((stat, index) => (
              <FadeIn key={stat.label} delay={index * 0.1} className="text-center">
                <div className="mb-2 text-3xl font-bold text-[#23408e] sm:text-4xl">{stat.value}</div>
                <div className="text-blue-700">{stat.label}</div>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="mb-8 text-center">
            <h3 className="text-2xl font-bold text-[#23408e]">Trusted by Industry Leaders</h3>
          </FadeIn>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <FadeIn
                key={testimonial.name}
                delay={0.2 + index * 0.08}
                className="rounded-2xl bg-white p-6 text-blue-800 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
              >
                <p className="mb-4 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <p className="font-semibold text-blue-900">{testimonial.name}</p>
                <p className="text-sm text-blue-600">{testimonial.org}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#23408e] to-[#2661F5] py-24 text-center text-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <FadeIn className="mx-auto max-w-3xl space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold sm:text-4xl">Experience the Future of Event Control</h2>
              <p className="mt-3 text-lg text-blue-100">
                Discover how InCommand helps your team coordinate safely and efficiently, no matter the size or
                complexity of your event.
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

      <MarketingFooter />
    </div>
  )
}
