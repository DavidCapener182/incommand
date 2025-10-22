'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ShieldCheckIcon,
  LightBulbIcon,
  CheckCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { StackedPanel } from '@/components/ui/StackedPanel'

const values = [
  {
    icon: ShieldCheckIcon,
    title: 'Safety First',
    description: 'We believe every event attendee deserves to feel safe. Our platform is built with safety as the top priority, enabling rapid response to incidents.',
  },
  {
    icon: LightBulbIcon,
    title: 'Innovation',
    description: 'We continuously push boundaries with AI-powered insights, predictive analytics, and cutting-edge technology to stay ahead of industry needs.',
  },
  {
    icon: CheckCircleIcon,
    title: 'Reliability',
    description: 'Event teams depend on us in critical moments. We maintain 99.9% uptime and provide rock-solid performance when it matters most.',
  },
  {
    icon: UsersIcon,
    title: 'Community',
    description: 'We\'re building a community of event professionals who share knowledge, best practices, and support each other in delivering exceptional events.',
  },
]

const stats = [
  { value: '15+', label: 'Years of Experience' },
  { value: '500+', label: 'Events Managed' },
  { value: '10,000+', label: 'Incidents Tracked' },
  { value: '99.9%', label: 'Uptime Guarantee' },
]

export default function AboutPage() {
  return (
    <PageWrapper>
      {/* Hero Section with Image Placeholder */}
      <div className="relative -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-8 h-80 sm:h-96 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 overflow-hidden">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Content overlay */}
        <div className="relative h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Making Events Safer
              <span className="block mt-2">
                One Incident at a Time
              </span>
            </h1>
            <p className="text-xl text-slate-200 max-w-3xl mx-auto">
              InCommand is dedicated to providing professional event management and incident response platforms for festivals, venues, and public events worldwide.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <StackedPanel className="space-y-12">
        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card-depth p-8 sm:p-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Our Mission
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 text-center max-w-4xl mx-auto mb-6">
            We empower event teams to respond faster, communicate better, and keep events safe. Through innovative technology and AI-powered insights, we&apos;re transforming how incidents are managed and how event safety is maintained.
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300 text-center max-w-4xl mx-auto">
            From small community gatherings to large-scale festivals, InCommand provides the tools that safety teams need to protect attendees and ensure successful events.
          </p>
        </motion.div>

        {/* Founder Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Meet the Founder
          </h2>
          <div className="card-depth overflow-hidden">
            <div className="md:flex">
              <div className="md:flex-shrink-0 bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center p-12 md:w-1/3">
                <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <span className="text-5xl font-bold text-white">DC</span>
                </div>
              </div>
              <div className="p-8 md:p-12">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  David Capener
                </h3>
                <p className="text-blue-600 dark:text-blue-400 font-semibold mb-6 text-lg">
                  CEO & Founder
                </p>
                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                  <p>
                    With over 15 years of experience in event management, security, and safety operations, David founded InCommand to modernize incident management and improve safety outcomes for public events.
                  </p>
                  <p>
                    Having managed security and safety operations at major UK festivals, sporting events, and public gatherings, David witnessed firsthand the challenges that event professionals face: inadequate tools, disconnected systems, and documentation processes that couldn&apos;t keep pace with the complexity of modern operations.
                  </p>
                  <p>
                    InCommand was built from this experience—designed by someone who has actually stood in the control room during critical incidents, coordinated with emergency services under pressure, and written the post-event reports that stand up to regulatory scrutiny.
                  </p>
                  <p className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <strong>Philosophy:</strong> &quot;If it isn&apos;t written down, it didn&apos;t happen.&quot; Professional incident management demands systems that maintain legally defensible records while empowering teams to respond faster and make better decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="card-depth-subtle p-6 text-center"
              >
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="card-depth bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-12"
        >
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            Built on Experience
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-blue-100 text-sm sm:text-base">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* The Story Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="card-depth p-8 sm:p-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Why InCommand Exists
          </h2>
          <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
            <p>
              InCommand was born from frustration with the tools available to event professionals. After years of managing major events with cobbled-together spreadsheets, paper logs, and disconnected systems, it became clear that the industry deserved better.
            </p>
            <p>
              Professional event management isn&apos;t about reacting to chaos—it&apos;s about having systems that help you anticipate, respond, and continuously improve. It&apos;s about maintaining legally defensible records without drowning in paperwork. It&apos;s about empowering your team with information they need, when they need it, without overwhelming them with complexity.
            </p>
            <p>
              InCommand is the system David wished he&apos;d had from day one: mobile-first, legally compliant, JESIP-aligned, and designed by someone who&apos;s actually done the job. It&apos;s built for the professionals in the field and control room who keep events safe.
            </p>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="card-depth-subtle p-12 text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Want to Learn More?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Get in touch to discuss how InCommand can help your events run safer and smoother.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:info@incommand.uk?subject=About InCommand"
              className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
            >
              Contact Us
            </a>
            <Link
              href="/features"
              className="inline-flex items-center justify-center px-8 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
            >
              Explore Features
            </Link>
          </div>
        </motion.div>
      </StackedPanel>
    </PageWrapper>
  )
}
