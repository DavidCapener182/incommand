'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { HelpCircle, ShieldCheck } from 'lucide-react'

const faqItems = [
  {
    question: 'Can I cancel or change my plan at any time?',
    answer:
      'Yes. You can upgrade, downgrade, or cancel your plan whenever needed — with no hidden fees. All changes take effect immediately.',
  },
  {
    question: 'How do I get started with InCommand?',
    answer:
      'Choose a plan, create your account, and follow the guided onboarding. Our team can assist with setting up zones, workflows, staff access, and integrations.',
  },
  {
    question: 'Do you offer annual billing discounts?',
    answer:
      'Yes. Annual billing provides a reduced rate compared to monthly plans, making it ideal for venues and organisations running events year-round.',
  },
  {
    question: 'How secure is my data?',
    answer:
      'InCommand uses enterprise-grade encryption, GDPR-compliant data handling, and secure cloud infrastructure. Only authorised users can access your operational data.',
  },
  {
    question: 'Is InCommand suitable for both small events and large venues?',
    answer:
      "Absolutely. Whether you're managing a local festival or a national stadium, InCommand scales with you. You can add users, zones, and capabilities as needed.",
  },
  {
    question: 'Does InCommand support real-time incident reporting?',
    answer:
      'Yes. Incidents can be logged instantly from mobile or desktop devices, with automatic updates pushed to the control room. Workflows and categories are fully customisable.',
  },
  {
    question: 'Can InCommand track live occupancy and crowd movement?',
    answer:
      'Yes — InCommand provides live occupancy levels, predictive attendance modelling, and tools to support safe ingress, egress, and crowd flow management.',
  },
  {
    question: 'Does InCommand support multi-agency collaboration?',
    answer:
      'It does. You can assign secure access to police, medical teams, fire services, local authorities, and contractors, with permissions controlling what each group can see.',
  },
  {
    question: 'What support is included?',
    answer:
      'Starter and Operational plans include standard support. Command and Enterprise plans include priority support, onboarding assistance, and optional custom integrations.',
  },
  {
    question: 'Can InCommand integrate with existing venue systems?',
    answer:
      'Yes. Enterprise integrations are available for ticketing systems, access control, CCTV platforms, and other operational tools. Contact our team for integration options.',
  },
]

export const FAQSection = () => (
  <div className="relative mx-auto max-w-6xl px-4 py-4">
    <div className="landing-section-shell flex flex-col gap-10 px-6 py-10 md:flex-row md:items-start md:gap-14 md:px-10 md:py-12">
      <div className="md:w-[40%]">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#23408e]/20 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#23408e]">
          <HelpCircle className="h-3.5 w-3.5" />
          Support
        </div>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight text-[#23408e] md:text-4xl">
          Frequently Asked
          <br /> Questions
        </h2>
        <p className="mt-4 max-w-sm text-base text-slate-600">
          Answers to the most common onboarding, billing, security, and operations questions.
        </p>

        <div className="mt-6 rounded-2xl border border-[#23408e]/15 bg-blue-50/70 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[#23408e] p-2 text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              Need a tailored answer? Reach our team via the contact options below and we&apos;ll help you map the right setup.
            </p>
          </div>
        </div>
      </div>

      <Accordion type="single" defaultValue="question-0" className="w-full md:max-w-2xl">
        {faqItems.map(({ question, answer }, index) => (
          <AccordionItem key={question} value={`question-${index}`} className="border-b border-slate-200">
            <AccordionTrigger className="text-left text-lg font-semibold text-blue-900 hover:text-[#23408e]">
              {question}
            </AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed text-slate-700">
              {answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </div>
)
