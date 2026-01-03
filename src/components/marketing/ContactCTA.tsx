'use client'

import Link from 'next/link'
import { Mail, MessageCircle, MapPin, Phone } from 'lucide-react'
import { FadeIn } from '@/components/marketing/Motion'

export const ContactCTA = () => (
  <section
    id="cta"
    className="bg-gradient-to-r from-[#23408e] to-[#2661F5] py-16 sm:py-20 md:py-24 text-white"
  >
    <div className="mx-auto max-w-7xl px-6 md:px-10">
      <FadeIn className="space-y-4 sm:space-y-6 text-left">
        {/* Heading */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
            Contact us
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            We’d love to hear from you
          </h2>
          <p className="mt-4 text-base text-blue-100 sm:text-lg">
            Our friendly team is always here to chat.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Email */}
          <div className="flex flex-col rounded-xl border border-white/25 bg-white/10 p-6 backdrop-blur-sm transition hover:bg-white/15">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="mt-6 text-xl font-semibold">Email</h3>
            <p className="mt-2 text-sm text-blue-100">Our friendly team is here to help.</p>
            <Link
              className="mt-4 inline-block text-sm font-medium underline"
              href="mailto:info@incommand.uk"
            >
              info@incommand.uk
            </Link>
          </div>

          {/* Live Chat */}
          <div className="flex flex-col rounded-xl border border-white/25 bg-white/10 p-6 backdrop-blur-sm transition hover:bg-white/15">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h3 className="mt-6 text-xl font-semibold">Live chat</h3>
            <p className="mt-2 text-sm text-blue-100">Start a conversation with a product specialist.</p>
            <Link className="mt-4 inline-block text-sm font-medium underline" href="#">
              Start new chat
            </Link>
          </div>

          {/* Office */}
          <div className="flex flex-col rounded-xl border border-white/25 bg-white/10 p-6 backdrop-blur-sm transition hover:bg-white/15">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="mt-6 text-xl font-semibold">Office</h3>
            <p className="mt-2 text-sm text-blue-100">Come say hello at our office.</p>
            <Link
              className="mt-4 inline-block text-sm font-medium underline"
              href="https://maps.google.com/?q=Liverpool"
              target="_blank"
            >
              Liverpool
            </Link>
          </div>

          {/* Phone */}
          <div className="flex flex-col rounded-xl border border-white/25 bg-white/10 p-6 backdrop-blur-sm transition hover:bg-white/15">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white">
              <Phone className="h-5 w-5" />
            </div>
            <h3 className="mt-6 text-xl font-semibold">Phone</h3>
            <p className="mt-2 text-sm text-blue-100">Mon–Fri from 8am to 5pm.</p>
            <Link
              className="mt-4 inline-block text-sm font-medium underline"
              href="tel:+447494258402"
            >
              +44 7494 258402
            </Link>
          </div>
        </div>
      </FadeIn>
    </div>
  </section>
)

export default ContactCTA