'use client'

import { ComponentProps } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  <div className="relative mt-16">
    <div className="pointer-events-none absolute inset-x-6 top-2 h-24 rounded-full bg-blue-200/20 blur-2xl" />
    <div className="relative flex w-full flex-col gap-8 overflow-hidden rounded-3xl border border-[#23408e]/10 bg-white/70 p-5 shadow-[0_35px_80px_-60px_rgba(15,23,42,0.95)] backdrop-blur [mask-image:linear-gradient(to_right,transparent,white_8%,white_92%,transparent)] sm:p-8">
      <Marquee pauseOnHover className="[--duration:40s]">
        <TestimonialList />
      </Marquee>

      <Marquee pauseOnHover reverse className="[--duration:40s]">
        <TestimonialList />
      </Marquee>
    </div>
  </div>
)

const TestimonialList = () => (
  <>
    {testimonials.map((testimonial) => (
      <div
        key={testimonial.id}
        className="mx-4 flex w-[350px] flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-8 shadow-[0_24px_55px_-45px_rgba(15,23,42,0.95)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_28px_60px_-38px_rgba(37,99,235,0.45)]"
      >
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-slate-100">
                <AvatarFallback className="bg-slate-50 text-slate-600 text-sm font-bold">
                  {testimonial.name
                    .split(' ')
                    .map((word) => word[0])
                    .join('')
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-bold text-slate-900">{testimonial.name}</p>
                <p className="text-xs font-medium text-slate-500">
                  {testimonial.company}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm leading-relaxed text-slate-600">
              &quot;{testimonial.testimonial}&quot;
            </p>
          </div>
        </div>
        
        {/* Optional: Status indicator to add detail */}
        <div className="mt-6 flex items-center gap-2 border-t border-slate-50 pt-4">
           <div className="flex -space-x-1">
             {[1,2,3,4,5].map(i => (
               <StarIcon key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
             ))}
           </div>
           <span className="text-xs font-medium text-slate-400">Verified Customer</span>
        </div>
      </div>
    ))}
  </>
)

const StarIcon = (props: ComponentProps<'svg'>) => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
  </svg>
)
