'use client'

import { FadeIn } from '@/components/marketing/Motion'
import { HeroActions } from '@/components/marketing/interactives/HeroActions'
import { SocialLinks } from '@/components/marketing/SocialLinks'
import HeroCards from '@/components/marketing/HeroCards'

export default function HeroSection() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#1c3582] via-[#23408e] to-[#2d57c8] text-slate-900 font-sans selection:bg-blue-200">
      <div className="pointer-events-none absolute inset-0 landing-mesh opacity-85" />
      <div className="pointer-events-none absolute inset-0 landing-noise opacity-10" />
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl" />

      <section id="hero" className="relative w-full overflow-hidden">
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 md:px-10 lg:flex-row lg:justify-between lg:gap-16">
          <FadeIn className="z-10 max-w-2xl flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur-md transition hover:bg-white/15">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-sm font-semibold tracking-wide text-white/95">
                Securing 1,200+ venues nationwide
              </span>
            </div>

            <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:leading-[1.05]">
              <span className="block">Event Safety,</span>
              <span className="bg-gradient-to-r from-blue-50 via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                Simplified.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-blue-100/90 sm:text-xl lg:mx-0">
              Streamline every aspect of live event control, from incident logging to staff coordination, with one intelligent platform built for operational teams.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:max-w-md sm:grid-cols-3 lg:max-w-lg">
              {[
                { label: 'Incidents routed', value: '<15 sec' },
                { label: 'Average uptime', value: '99.99%' },
                { label: 'Live coverage', value: '24/7' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/20 bg-white/10 p-3 text-left backdrop-blur">
                  <p className="text-sm font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-blue-100/80">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:justify-start">
              <HeroActions
                className="w-full sm:w-auto"
                secondaryHref="#features"
                secondaryLabel="Explore Platform"
              />
            </div>

            <FadeIn delay={0.2} className="mt-10 flex items-center justify-center gap-6 lg:justify-start">
              <SocialLinks
                textClassName="text-blue-100/85 text-sm font-medium"
                iconClassName="border border-white/40 bg-white/10 hover:bg-white/20"
              />
            </FadeIn>
          </FadeIn>

          <FadeIn delay={0.2} className="w-full lg:w-1/2">
            <HeroCards />
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
