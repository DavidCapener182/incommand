'use client'

import { FadeIn } from '@/components/marketing/Motion'
import { Settings, Users, Activity, ArrowRight } from 'lucide-react'

const howItWorksSteps = [
  {
    step: '01',
    title: 'Setup Your Event',
    description: 'Create your event profile, configure operational zones, and invite your team members with role-based access.',
    icon: Settings,
  },
  {
    step: '02',
    title: 'Deploy Your Team',
    description: 'Assign staff to specific locations, manage skills coverage, and track real-time check-ins via the mobile app.',
    icon: Users,
  },
  {
    step: '03',
    title: 'Manage & Monitor',
    description: 'Log incidents as they happen, watch live risk analytics, and generate instant compliance reports for your debrief.',
    icon: Activity,
  },
]

export const HowItWorks = () => (
  <section id="how-it-works" className="relative w-full py-16 sm:py-24">
    <div className="pointer-events-none absolute inset-0 landing-noise opacity-20" />
    <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white to-transparent" />

    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
      <FadeIn className="mx-auto mb-16 max-w-3xl text-center">
        <h2 className="text-base font-semibold leading-7 text-[#23408e]">Workflow</h2>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          From Planning to Debrief
        </p>
        <p className="mt-4 text-lg text-slate-600">
          Get started with InCommand in three simple steps and transform how you manage event safety.
        </p>
      </FadeIn>

      <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Connector Line (Desktop Only) */}
        <div
          className="absolute left-0 top-16 hidden h-0.5 w-full -translate-y-1/2 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 md:block"
          aria-hidden="true"
        />

        {howItWorksSteps.map((step, index) => (
          <FadeIn
            key={step.step}
            delay={index * 0.15}
            className="relative flex flex-col items-center text-center"
          >
            <div className="landing-section-shell relative z-10 w-full px-6 py-8 transition-all duration-300 hover:-translate-y-1">
              <div className="mb-5 inline-flex rounded-full border border-[#23408e]/15 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#23408e]">
                Step {step.step}
              </div>

              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-900/25">
                <step.icon className="h-9 w-9" />
              </div>

              <h3 className="mb-3 text-xl font-bold text-slate-900">{step.title}</h3>
              <p className="text-base leading-relaxed text-slate-600">
                {step.description}
              </p>
            </div>

            {/* Mobile Arrow (Hidden on Desktop) */}
            {index < howItWorksSteps.length - 1 && (
              <div className="my-4 md:hidden">
                <ArrowRight className="h-6 w-6 text-slate-300" />
              </div>
            )}
          </FadeIn>
        ))}
      </div>
    </div>
  </section>
)

export default HowItWorks
