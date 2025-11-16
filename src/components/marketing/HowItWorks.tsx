'use client'

import { FadeIn } from '@/components/marketing/Motion'

const howItWorksSteps = [
  {
    step: '1',
    title: 'Setup Your Event',
    description: 'Create your event profile, configure settings, and invite your team members with appropriate access levels.',
  },
  {
    step: '2',
    title: 'Deploy Your Team',
    description: 'Assign staff to locations, manage skills coverage, and track presence in real-time with visual dashboards.',
  },
  {
    step: '3',
    title: 'Manage, Monitor & Review',
    description: 'Log incidents, monitor analytics, receive AI-powered insights, and generate compliance reports for post-event debriefs.',
  },
]

export const HowItWorks = () => (
  <section id="how-it-works" className="w-full bg-gradient-to-b from-blue-50 to-white py-12 sm:py-16 md:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
      <FadeIn className="mx-auto mb-8 max-w-3xl text-center sm:mb-12">
        <h2 className="text-2xl font-bold text-[#23408e] sm:text-3xl md:text-4xl">How It Works</h2>
        <p className="mt-3 text-base text-blue-700 sm:mt-4 sm:text-lg">
          Get started with InCommand in three simple steps and transform your event operations.
        </p>
      </FadeIn>

      <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
        {howItWorksSteps.map((step, index) => (
          <FadeIn
            key={step.step}
            delay={index * 0.1}
            className="rounded-xl sm:rounded-2xl bg-white p-6 sm:p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-blue-100 text-xl sm:text-2xl font-bold text-blue-700 mx-auto">
              {step.step}
            </div>
            <h3 className="mb-2 text-lg font-semibold text-blue-900 sm:mb-3 sm:text-xl">{step.title}</h3>
            <p className="text-sm text-blue-700 sm:text-base">{step.description}</p>
          </FadeIn>
        ))}
      </div>
    </div>
  </section>
)

export default HowItWorks

