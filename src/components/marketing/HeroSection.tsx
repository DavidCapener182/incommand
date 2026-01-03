'use client'

import { FadeIn } from '@/components/marketing/Motion'
import { HeroActions } from '@/components/marketing/interactives/HeroActions'
import { SocialLinks } from '@/components/marketing/SocialLinks'
import HeroCards from '@/components/marketing/HeroCards'

export default function HeroSection() {
  return (
    <div className="min-h-screen bg-[#23408e] text-slate-900 font-sans selection:bg-blue-200 flex items-center justify-center">
      <section id="hero" className="relative overflow-hidden w-full">
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 md:px-10 lg:flex-row lg:justify-between lg:gap-16">
          <FadeIn className="max-w-2xl flex-1 text-center lg:text-left z-10">
            
            {/* Ping Animation Badge */}
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

            {/* Social Links */}
            <FadeIn delay={0.2} className="mt-10 flex items-center justify-center gap-6 lg:justify-start">
              <SocialLinks 
                textClassName="text-blue-100/80 hover:text-white text-sm font-medium" 
                iconClassName="border border-white/40 bg-white/10 hover:bg-white/20" 
              />
            </FadeIn>
          </FadeIn>

          {/* UPDATED: Added width classes to the FadeIn wrapper to prevent squashing */}
          <FadeIn delay={0.2} className="w-full lg:w-1/2">
            <HeroCards />
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
