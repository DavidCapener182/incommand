'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

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
  <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 md:flex-row md:items-start md:gap-12">
    <h2 className="text-3xl font-semibold tracking-tight text-[#23408e] md:text-4xl">
      Frequently Asked
      <br /> Questions
    </h2>
    <Accordion type="single" defaultValue="question-0" className="w-full md:max-w-xl">
      {faqItems.map(({ question, answer }, index) => (
        <AccordionItem key={question} value={`question-${index}`}>
          <AccordionTrigger className="text-left text-lg text-blue-900">{question}</AccordionTrigger>
          <AccordionContent className="text-base text-blue-700">{answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
)

