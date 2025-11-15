'use client'

import Link from 'next/link'
import { ComponentProps } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Marquee } from '@/components/ui/marquee'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Thompson',
    designation: 'Head of Event Safety',
    company: 'Wembley Stadium, UK',
    testimonial:
      'InCommand has become our operational heartbeat. Crowd flow, incident logging, and communication across all teams are faster and more accurate. It’s transformed how we run major events.',
  },
  {
    id: 2,
    name: 'Miguel Alvarez',
    designation: 'Security Operations Manager',
    company: 'Estadio Azteca, Mexico',
    testimonial:
      'We reduced our incident response times by nearly 40%. InCommand gives us real-time clarity we never had before. It’s now essential for every matchday.',
  },
  {
    id: 3,
    name: 'Laura Chen',
    designation: 'Director of Venue Operations',
    company: 'Singapore Sports Hub',
    testimonial:
      'A game-changing platform. Our teams collaborate seamlessly, and the predictive analytics have helped us prepare for peak surges with precision.',
  },
  {
    id: 4,
    name: 'Patrick O’Neill',
    designation: 'Crowd Management Lead',
    company: 'Aviva Stadium, Ireland',
    testimonial:
      'The situational awareness InCommand provides has raised our confidence during high-pressure events. It’s intuitive, fast, and built for real operations.',
  },
  {
    id: 5,
    name: 'Hannah Müller',
    designation: 'Event Control Room Supervisor',
    company: 'Olympiastadion Berlin, Germany',
    testimonial:
      'Finally, a system designed for the realities of stadium safety. InCommand centralises everything — reporting, communication, capacity updates — flawlessly.',
  },
  {
    id: 6,
    name: 'James Carter',
    designation: 'Festival Director',
    company: 'HarbourSound Festival, Australia',
    testimonial:
      'Running a multi-day festival has never been smoother. Our teams rely on InCommand for staffing, incidents, and keeping tens of thousands moving efficiently.',
  },
]

export const Testimonials = () => (
  <div className="relative mt-12 flex flex-col gap-10">
    <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-blue-50 via-blue-50/70 to-transparent" />
    <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-blue-50 via-blue-50/70 to-transparent" />

    <Marquee pauseOnHover className="[--duration:25s]">
      <TestimonialList />
    </Marquee>

    <Marquee pauseOnHover reverse className="[--duration:25s]">
      <TestimonialList />
    </Marquee>
  </div>
)

const TestimonialList = () => (
  <>
    {testimonials.map((testimonial) => (
      <div
        key={testimonial.id}
        className="min-w-[320px] max-w-sm rounded-2xl border border-blue-100 bg-white/90 p-6 text-left shadow-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-semibold">
                {testimonial.name
                  .split(' ')
                  .map((word) => word[0])
                  .join('')
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-blue-900">{testimonial.name}</p>
              <p className="text-sm text-blue-600">
                {testimonial.designation}, {testimonial.company}
              </p>
            </div>
          </div>

          <Button variant="ghost" size="icon" asChild>
            <Link href="#" target="_blank" aria-label="View testimonial on X">
              <TwitterLogo className="h-4 w-4 text-blue-500" />
            </Link>
          </Button>
        </div>

        <p className="mt-4 text-base leading-relaxed text-blue-900">“{testimonial.testimonial}”</p>
      </div>
    ))}
  </>
)

const TwitterLogo = (props: ComponentProps<'svg'>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>X</title>
    <path
      fill="currentColor"
      d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
    />
  </svg>
)

