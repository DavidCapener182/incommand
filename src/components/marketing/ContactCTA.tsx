'use client'

import Link from 'next/link'
import { Mail, MessageCircle, MapPin, Phone, type LucideIcon } from 'lucide-react'
import { FadeIn } from '@/components/marketing/Motion'

type ContactCard = {
  title: string
  description: string
  href: string
  cta: string
  Icon: LucideIcon
  external?: boolean
}

const contactCards: ContactCard[] = [
  {
    title: 'Email',
    description: 'Our friendly team is here to help.',
    href: 'mailto:info@incommand.uk',
    cta: 'info@incommand.uk',
    Icon: Mail,
  },
  {
    title: 'Live chat',
    description: 'Start a conversation with a product specialist.',
    href: '#',
    cta: 'Start new chat',
    Icon: MessageCircle,
  },
  {
    title: 'Office',
    description: 'Come say hello at our office.',
    href: 'https://maps.google.com/?q=Liverpool',
    cta: 'Liverpool',
    Icon: MapPin,
    external: true,
  },
  {
    title: 'Phone',
    description: 'Mon–Fri from 8am to 5pm.',
    href: 'tel:+447494258402',
    cta: '+44 7494 258402',
    Icon: Phone,
  },
]

export const ContactCTA = () => (
  <section
    id="cta"
    className="relative overflow-hidden bg-gradient-to-br from-[#1c3582] via-[#23408e] to-[#2661F5] py-16 text-white sm:py-20 md:py-24"
  >
    <div className="pointer-events-none absolute inset-0 landing-mesh opacity-65" />
    <div className="pointer-events-none absolute inset-0 landing-noise opacity-10" />
    <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-blue-300/30 blur-3xl" />
    <div className="pointer-events-none absolute -right-24 bottom-8 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl" />

    <div className="mx-auto max-w-7xl px-6 md:px-10">
      <FadeIn className="relative space-y-4 text-left sm:space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100/90">
            Contact us
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            We’d love to hear from you
          </h2>
          <p className="mt-4 max-w-2xl text-base text-blue-100/95 sm:text-lg">
            Our friendly team is always here to chat.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {contactCards.map((card) => (
            <div
              key={card.title}
              className="group flex flex-col rounded-2xl border border-white/25 bg-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 hover:shadow-[0_30px_60px_-40px_rgba(15,23,42,0.95)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white shadow-sm transition-colors group-hover:bg-white/30">
                <card.Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm text-blue-100/90">{card.description}</p>
              <Link
                className="mt-4 inline-block text-sm font-semibold underline decoration-white/50 underline-offset-4 transition hover:decoration-white"
                href={card.href}
                target={card.external ? '_blank' : undefined}
                rel={card.external ? 'noopener noreferrer' : undefined}
              >
                {card.cta}
              </Link>
            </div>
          ))}
        </div>
      </FadeIn>
    </div>
  </section>
)

export default ContactCTA
