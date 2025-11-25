import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/getServerUser'
import MarketingNavigation from '@/components/MarketingNavigation'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SocialLinks } from '@/components/marketing/SocialLinks'
import { FadeIn } from '@/components/marketing/Motion'
import { HeroActions } from '@/components/marketing/interactives/HeroActions'

export const metadata: Metadata = {
  title: 'InCommand | Modern Incident Command Platform',
  description: 'A mobile-ready landing page showcasing InCommand for safety and operations teams.',
}

export default async function RootPage() {
  const { user, role } = await getServerUser()

  if (user) {
    if (role === 'superadmin') {
        redirect('/admin')
    }

    redirect('/incidents')
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F1F4F9] text-slate-900">
      <MarketingNavigation />

      <section className="relative overflow-hidden">
        <div className="w-full bg-gradient-to-b from-[#23408e] to-[#2661F5] text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 px-6 py-16 sm:py-24 sm:px-10 lg:flex-row">
            <FadeIn className="max-w-xl text-center lg:text-left">
              <h1 className="mb-6 text-4xl font-extrabold leading-tight sm:text-5xl">
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Modern incident command for real-world operations
                </span>
              </h1>
              <p className="mb-10 text-lg leading-relaxed text-blue-100">
                Keep your teams aligned, capture every detail, and make faster decisions with InCommand. Built with field
                operators for events, venues, and mission-critical organisations.
              </p>
              <HeroActions className="justify-center" secondaryHref="/features" secondaryLabel="Explore features" />
              <FadeIn delay={0.2} className="mt-8">
                <SocialLinks textClassName="text-white" iconClassName="border-white/60 bg-white/20" />
              </FadeIn>
            </FadeIn>

            <FadeIn delay={0.2} className="relative w-full max-w-lg">
              <div className="overflow-hidden rounded-3xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 shadow-2xl">
                <Image
                  src="/placeholder-dashboard.png"
                  alt="Screenshot of InCommand dashboard showing live incidents and analytics"
                  width={960}
                  height={540}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" aria-hidden />
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-3">
          {[
            {
              title: 'Operations-ready',
              copy: 'Field-tested workflows, structured logs, and audit trails keep every incident organised and traceable.',
            },
            {
              title: 'Built for scale',
              copy: 'From single-venue deployments to multi-agency operations, InCommand adapts to your footprint.',
            },
            {
              title: 'Secure by design',
              copy: 'Role-based access, SSO support, and encryption standards keep your data safe and compliant.',
            },
          ].map((item) => (
            <FadeIn key={item.title} className="rounded-2xl bg-blue-50/60 p-8 shadow-sm ring-1 ring-blue-100">
              <h3 className="text-xl font-semibold text-[#23408e]">{item.title}</h3>
              <p className="mt-4 text-base text-blue-900 leading-relaxed">{item.copy}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-r from-[#23408e] to-[#2661F5] py-20">
        <div className="absolute inset-0 opacity-30">
          <Image src="/placeholder-event-control-room.jpg" alt="Event control room" fill className="object-cover" />
        </div>
        <div className="relative mx-auto max-w-5xl px-6 text-center sm:px-10">
          <FadeIn>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">See InCommand in action</h2>
            <p className="mt-4 text-lg leading-relaxed text-blue-100">
              Take a quick tour of our live dashboards, AI-assisted incident summaries, and staff coordination tools designed to
              keep everyone in sync.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-base font-semibold text-[#23408e] shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                Talk to sales
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center rounded-full border border-white/60 px-7 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                View capabilities
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-6xl rounded-3xl bg-blue-50/70 p-10 text-center shadow-sm ring-1 ring-blue-100">
          <FadeIn>
            <h2 className="text-2xl font-bold text-[#23408e] sm:text-3xl">Ready to modernise your operations?</h2>
            <p className="mt-4 text-lg text-blue-900">
              Join teams across the UK who trust InCommand to manage complex events and day-to-day operations.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-[#23408e] px-7 py-3 text-base font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#1d3985]"
              >
                Get started
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-full border border-[#23408e]/20 px-7 py-3 text-base font-semibold text-[#23408e] transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                Learn more
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
