export const revalidate = 3600
export const dynamic = 'force-static'

import type { Metadata } from 'next'
import Image from 'next/image'
import MarketingNavigation from '@/components/MarketingNavigation'
import { SocialLinks } from '@/components/marketing/SocialLinks'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { FadeIn } from '@/components/marketing/Motion'
import { HeroActions } from '@/components/marketing/interactives/HeroActions'
import {
  ShieldCheckIcon,
  LightBulbIcon,
  CheckCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { pageMetadata, schemaMarkup } from '@/config/seo.config'
import Script from 'next/script'

export const metadata: Metadata = {
  ...pageMetadata.about,
  alternates: { canonical: '/about' },
}

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

const impactStats = [
  { value: '15+', label: 'Years in Event Operations' },
  { value: '500+', label: 'Events Supported' },
  { value: '10,000+', label: 'Incidents Logged' },
  { value: '99.9%', label: 'Uptime Guarantee' },
]

export default function AboutPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <Script id="ld-json-org-about" type="application/ld+json">
        {JSON.stringify(schemaMarkup.organization)}
      </Script>

      <div className="min-h-screen overflow-x-hidden bg-[#F1F4F9] text-slate-900">
        <MarketingNavigation />

      <section className="relative overflow-hidden">
        <div className="relative w-full bg-gradient-to-b from-[#23408e] to-[#2661F5] text-white">
          <Image
            src="/placeholder-control-room.jpg"
            alt="Event control room with staff monitoring operations"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#23408e]/80 via-[#2661F5]/60 to-[#23408e]/70" />
          <div className="relative z-10 px-6 py-20 text-center sm:py-32">
            <FadeIn className="mx-auto max-w-3xl space-y-6">
              <div>
                <h1 className="text-4xl font-extrabold sm:text-5xl">Making Events Safer — One Incident at a Time</h1>
                <p className="mt-4 text-lg leading-relaxed text-blue-100 sm:text-xl">
                  We&apos;re redefining event management and incident response with real-time, field-proven technology
                  built by professionals who&apos;ve been there.
                </p>
              </div>
              <div className="flex justify-center">
                <SocialLinks />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 text-blue-900">
        <div className="mx-auto max-w-5xl space-y-12 px-6 text-center sm:px-10">
          <FadeIn className="space-y-6">
            <h2 className="text-3xl font-bold text-[#23408e]">Our Mission</h2>
            <p className="text-lg leading-relaxed text-blue-800">
              To empower event teams to respond faster, communicate smarter, and maintain the highest standards of safety
              and compliance — no matter the size or scale of operation.
            </p>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-blue-700">
              InCommand isn&apos;t just software — it&apos;s a professional platform that transforms how teams
              coordinate, document, and analyse safety operations in real time.
            </p>
          </FadeIn>

          <FadeIn delay={0.1} className="space-y-4">
            <h3 className="text-2xl font-semibold text-[#23408e]">Designed by Practitioners, for Practitioners</h3>
            <p className="leading-relaxed text-blue-800">
              After years managing major UK events, our founder recognised a problem — most incident management systems
              were built for offices, not the field. They were complicated, outdated, or couldn&apos;t adapt to the pace
              of live event control.
            </p>
            <p className="leading-relaxed text-blue-700">
              InCommand bridges that gap. Built mobile-first and JESIP-aligned, it&apos;s a legally defensible system
              that keeps teams connected, accountable, and in control — wherever they operate.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-gradient-to-b from-blue-50 to-blue-100 px-6 py-20 text-blue-900 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 md:flex-row">
          <FadeIn className="relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-3xl shadow-lg sm:h-64 sm:w-64">
            <Image
              src="/placeholder-david-capener.jpg"
              alt="Portrait of David Capener, CEO & Founder of InCommand"
              fill
              className="object-cover"
            />
          </FadeIn>

          <FadeIn delay={0.1} className="flex-1 space-y-4">
            <div>
              <h3 className="text-2xl font-bold">David Capener</h3>
              <p className="text-lg font-semibold text-blue-600">CEO & Founder</p>
            </div>
            <p className="leading-relaxed text-blue-800">
              With over 15 years of experience in event management, safety, and security, David founded InCommand to
              solve the operational challenges faced by professionals on the ground.
            </p>
            <p className="leading-relaxed text-blue-700">
              Having led control rooms at major festivals and sports events, he understands the realities of coordinating
              large-scale operations with fragmented tools. InCommand was designed from that experience — a platform built
              for real-world demands.
            </p>
            <p className="font-medium italic leading-relaxed text-blue-700">
              &ldquo;If it isn&apos;t written down, it didn&apos;t happen.&rdquo; That simple truth underpins every aspect
              of our system — clarity, accountability, and safety above all.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-white px-6 py-20 text-blue-900 sm:px-10">
        <div className="mx-auto max-w-7xl text-center">
          <FadeIn className="mb-12">
            <h2 className="text-3xl font-bold text-[#23408e]">Our Values</h2>
          </FadeIn>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {companyValues.map((value, index) => (
              <FadeIn
                key={value.title}
                delay={index * 0.1}
                className="rounded-2xl bg-blue-50 p-6 transition hover:-translate-y-1 hover:shadow-lg sm:p-8"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 sm:h-16 sm:w-16">
                  <value.icon className="h-6 w-6 text-blue-700 sm:h-8 sm:w-8" />
                </div>
                <h3 className="text-xl font-semibold">{value.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-blue-800">{value.description}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#23408e] to-[#2661F5] px-6 py-20 text-center text-white sm:px-10">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="mb-12">
            <h2 className="text-3xl font-bold">Built on Real Experience</h2>
          </FadeIn>
          <div className="grid grid-cols-1 gap-10 xs:grid-cols-2 md:grid-cols-4">
            {impactStats.map((stat, index) => (
              <FadeIn key={stat.label} delay={index * 0.1}>
                <div className="text-4xl font-extrabold sm:text-5xl">{stat.value}</div>
                <div className="mt-2 text-sm text-blue-100">{stat.label}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#23408e] to-[#2661F5] py-24 text-center text-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <FadeIn className="mx-auto max-w-3xl space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold sm:text-4xl">Partner with Us to Elevate Event Safety</h2>
              <p className="mt-3 text-lg text-blue-100">
                Whether you&apos;re managing a local festival or an international venue, InCommand empowers your team to
                operate safely, efficiently, and with complete confidence.
              </p>
            </div>
            <HeroActions
              className="justify-center"
              preLaunchLabel="Register Interest"
              postLaunchLabel="Register Interest"
              secondaryHref="mailto:info@incommand.uk?subject=About%20InCommand"
              secondaryLabel="Contact Us"
              secondaryButtonClassName="border border-white text-white px-8 py-4 rounded-xl hover:bg-white/10 font-semibold transition-colors"
              showCountdown={false}
            />
          </FadeIn>
        </div>
      </section>

        <MarketingFooter />
      </div>
    </>
  )
}
