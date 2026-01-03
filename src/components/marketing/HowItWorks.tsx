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
  <section id="how-it-works" className="relative w-full bg-white py-16 sm:py-24">
    {/* Background decorative gradient */}
    <div className="absolute inset-0 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
    
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
        <div className="absolute left-0 top-12 hidden h-0.5 w-full -translate-y-1/2 border-t-2 border-dashed border-blue-100 md:block" aria-hidden="true" />

        {howItWorksSteps.map((step, index) => (
          <FadeIn
            key={step.step}
            delay={index * 0.15}
            className="relative flex flex-col items-center text-center"
          >
            {/* Icon Circle */}
            <div className="relative z-10 mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-xl shadow-blue-900/5 ring-1 ring-slate-200 transition-transform duration-300 hover:scale-110">
              <div className="absolute -top-3 rounded-full bg-[#23408e] px-3 py-1 text-xs font-bold text-white shadow-sm">
                Step {step.step}
              </div>
              <step.icon className="h-10 w-10 text-blue-600" />
            </div>

            {/* Content */}
            <div className="rounded-2xl bg-slate-50/50 p-6 transition-colors hover:bg-blue-50/50">
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