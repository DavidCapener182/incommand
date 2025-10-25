export const revalidate = 3600
export const dynamic = 'force-static'

import Link from 'next/link'
import Script from 'next/script'
import MarketingNavigation from '../components/MarketingNavigation'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SocialLinks } from '@/components/marketing/SocialLinks'
import { FadeIn } from '@/components/marketing/Motion'
import { HeroActions } from '@/components/marketing/interactives/HeroActions'
import { schemaMarkup } from '@/config/seo.config'

const featureHighlights = [
  {
    title: 'Seamless Multi-Event Control',
    desc: 'Manage multiple events with isolated dashboards, permissions, and data in real time.',
    link: '/features',
  },
  {
    title: 'AI-Driven Insights',
    desc: 'Predict risks and analyse performance with intelligent reporting tools.',
    link: '/features',
  },
  {
    title: 'Real-Time Alerts',
    desc: 'Receive instant notifications on incidents and activity — wherever you are.',
    link: '/features',
  },
  {
    title: 'Smarter Staff Management',
    desc: 'Assign, reassign, and track teams visually with callsigns and live status boards.',
    link: '/features',
  },
  {
    title: 'Advanced Analytics Dashboard',
    desc: 'Heatmaps, incident timelines, and performance metrics designed for operational clarity.',
    link: '/features',
  },
  {
    title: 'Security & Compliance',
    desc: 'Built for JESIP alignment and GDPR compliance, ensuring data integrity and audit-ready logs.',
    link: '/features',
  },
]

export default function HomePage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <Script id="ld-json-org" type="application/ld+json">
        {JSON.stringify(schemaMarkup.organization)}
      </Script>
      <Script id="ld-json-software" type="application/ld+json">
        {JSON.stringify(schemaMarkup.softwareApplication)}
      </Script>
      
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700 text-white">
        <MarketingNavigation />

      <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 pt-16 pb-20 text-center sm:pt-24 sm:pb-32">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[size:40px_40px] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-800/60 to-blue-700/70" />
        <div className="absolute inset-0 animate-pulse-slow bg-gradient-to-br from-blue-800/20 to-blue-600/10" />

        <FadeIn className="relative z-10 max-w-4xl">
          <h1 className="text-4xl font-extrabold leading-tight drop-shadow-lg sm:text-5xl lg:text-6xl">
            Take Command of Every Event{' '}
            <span className="mt-2 block text-blue-200">Safely, Efficiently, and in Real Time</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.1} className="relative z-10 mt-6 max-w-2xl">
          <p className="text-base leading-relaxed text-blue-100 sm:text-lg">
            InCommand is the UK&apos;s all-in-one event control and incident management platform — built by
            safety professionals to help your team respond faster, communicate smarter, and maintain
            complete operational oversight.
          </p>
        </FadeIn>

        <FadeIn delay={0.2} className="relative z-10 mt-8 w-full">
          <HeroActions className="justify-center" />
        </FadeIn>

        <FadeIn delay={0.3} className="relative z-10 mt-8">
          <SocialLinks />
        </FadeIn>

        <FadeIn delay={0.4} className="relative z-10 mt-16 w-full max-w-5xl">
          <div className="aspect-video w-full overflow-hidden rounded-3xl border border-blue-200/30 shadow-2xl ring-4 ring-white/10">
            <div className="flex h-full w-full items-center justify-center bg-blue-900/30">
              <p className="text-sm italic text-blue-200 sm:text-base">
                [ Placeholder for product screenshot or animated preview ]
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      <section className="relative bg-gradient-to-b from-[#23408e] to-[#2661F5]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#23408e] to-[#2661F5]" />
        <div className="relative z-10 overflow-hidden rounded-t-3xl bg-white px-6 py-20 text-blue-900 lg:px-12">
          <h2 className="mb-14 text-center text-2xl font-bold text-[#23408e] sm:text-3xl lg:text-4xl">
            Why Event Professionals Choose InCommand
          </h2>
          <p className="mx-auto mb-16 max-w-3xl text-center text-lg text-blue-700">
            Trusted by UK festivals, venues, and safety teams, InCommand brings together everything you need
            to manage incidents, monitor operations, and make confident decisions — all in one intuitive
            platform.
          </p>

          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featureHighlights.map((item, index) => (
              <FadeIn
                key={item.title}
                delay={index * 0.1}
                className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg sm:p-8"
              >
                <h3 className="mb-2 text-lg font-semibold text-[#23408e]">{item.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-blue-700">{item.desc}</p>
                <Link
                  href={item.link}
                  className="inline-flex items-center text-sm font-semibold text-[#2661F5] hover:underline"
                >
                  Learn more →
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#23408e] to-[#2661F5] px-6 py-24 text-center text-white lg:px-12">
        <FadeIn className="mx-auto max-w-3xl space-y-8">
          <div>
            <h2 className="text-2xl font-extrabold drop-shadow-md sm:text-3xl lg:text-4xl">
              Ready to Transform Your Operations?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-blue-100">
              Join hundreds of event and safety teams using InCommand to deliver safer, smarter, more
              efficient live operations.
            </p>
          </div>
          <HeroActions
            className="justify-center sm:flex-row"
            secondaryHref="/pricing"
            secondaryLabel="See Pricing"
            secondaryButtonClassName="border border-white text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 shadow-md transition"
            showCountdown={false}
          />
        </FadeIn>
      </section>

        <MarketingFooter />
      </div>
    </>
  )
}
