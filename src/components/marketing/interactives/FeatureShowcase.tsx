'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Shield, AlertTriangle, Bell, Users, BarChart3, Lock } from 'lucide-react'
import { FadeIn } from '@/components/marketing/Motion'

const features = [
  { icon: Shield, title: 'Oversee Multiple Events Seamlessly', description: 'Manage multiple sites, venues, or events from one dashboard — with dedicated access levels and full team visibility.' },
  { icon: AlertTriangle, title: 'Predict Risks Before They Escalate', description: 'AI-powered analytics highlight emerging trends and potential issues before they affect safety outcomes.' },
  { icon: Bell, title: 'Stay Informed with Real-Time Alerts', description: 'Smart notifications keep control rooms and field teams aligned, ensuring no critical incident goes unseen.' },
  { icon: Users, title: 'Smarter Staff Assignment', description: 'Visual dashboards make it easy to deploy teams, manage skills coverage, and reassign staff instantly.' },
  { icon: BarChart3, title: 'Turn Data into Safer Decisions', description: 'Analyse incident data, track response times, and benchmark performance using dynamic heatmaps and metrics.' },
  { icon: Lock, title: 'Built for Compliance and Security', description: 'Maintain a full audit trail of actions, aligned with UK JESIP frameworks and GDPR data standards.' },
]

export const FeatureShowcase = () => (
  <div className="flex flex-col items-center justify-center">
    <div className="w-full max-w-6xl py-6">
      <FadeIn className="space-y-4">
        <h2 className="text-3xl font-semibold tracking-tight text-[#23408e] md:text-4xl">Built for Real-World Crowd Operations</h2>
        <p className="text-lg text-blue-700">
          InCommand equips your team with the tools they need to plan, monitor, and manage any live event — from local festivals to national stadiums.
        </p>
      </FadeIn>
      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <Accordion type="single" defaultValue="feature-0" className="space-y-4">
          {features.map(({ title, description, icon: Icon }, index) => (
            <AccordionItem key={title} value={`feature-${index}`} className="border border-blue-100 rounded-2xl px-4">
              <AccordionTrigger className="text-left text-lg text-blue-900">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-blue-600" />
                  {title}
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-base text-blue-700">{description}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="hidden rounded-2xl bg-blue-100/40 md:block min-h-[420px]" />
      </div>
    </div>
  </div>
)
