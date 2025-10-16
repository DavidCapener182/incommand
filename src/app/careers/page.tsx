'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  MapPinIcon,
  ClockIcon,
  CurrencyPoundIcon,
  HeartIcon,
  LightBulbIcon,
  UserGroupIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline'

const benefits = [
  {
    icon: CurrencyPoundIcon,
    title: 'Competitive Salary',
    description: 'Industry-leading compensation packages with performance bonuses and equity options.',
  },
  {
    icon: HeartIcon,
    title: 'Health & Wellness',
    description: 'Comprehensive health insurance, mental health support, and fitness allowances.',
  },
  {
    icon: LightBulbIcon,
    title: 'Learning & Development',
    description: 'Annual learning budget, conference attendance, and professional growth opportunities.',
  },
  {
    icon: ClockIcon,
    title: 'Flexible Working',
    description: 'Remote-first culture with flexible hours and generous time-off policies.',
  },
]

const jobs = [
  {
    title: 'Senior Full-Stack Developer',
    location: 'Remote (UK)',
    type: 'Full-time',
    department: 'Engineering',
    departmentColor: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    description: 'Build and scale our event management platform using Next.js, React, TypeScript, and Supabase. Work on AI-powered features and real-time systems.',
    requirements: ['5+ years experience', 'React/Next.js expertise', 'TypeScript proficiency'],
  },
  {
    title: 'Product Manager',
    location: 'London, UK',
    type: 'Full-time',
    department: 'Product',
    departmentColor: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    description: 'Define product strategy and roadmap for our event safety platform. Work closely with customers to understand needs and drive feature development.',
    requirements: ['3+ years in product management', 'B2B SaaS experience', 'Strong analytical skills'],
  },
  {
    title: 'Customer Success Manager',
    location: 'Remote (UK)',
    type: 'Full-time',
    department: 'Customer Success',
    departmentColor: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    description: 'Be the primary point of contact for our event management customers. Ensure successful onboarding, adoption, and ongoing satisfaction.',
    requirements: ['2+ years in customer success', 'Event industry knowledge', 'Excellent communication'],
  },
  {
    title: 'DevOps Engineer',
    location: 'Remote',
    type: 'Full-time',
    department: 'Engineering',
    departmentColor: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    description: 'Build and maintain our infrastructure, CI/CD pipelines, and monitoring systems. Ensure 99.9% uptime for mission-critical event operations.',
    requirements: ['3+ years DevOps experience', 'AWS/cloud infrastructure', 'Kubernetes knowledge'],
  },
  {
    title: 'UX/UI Designer',
    location: 'Remote (UK)',
    type: 'Full-time',
    department: 'Design',
    departmentColor: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    description: 'Design intuitive interfaces for event safety teams working in high-pressure environments. Create mobile-first experiences that work in the field.',
    requirements: ['4+ years UX/UI experience', 'Figma proficiency', 'Mobile design expertise'],
  },
]

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#15192c]">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Join Our Mission
            <span className="block text-blue-600 dark:text-blue-400">
              Build the Future of Event Safety
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            We&apos;re building a talented team passionate about creating tools that make events safer and more efficient.
          </p>
        </motion.div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Why Work at InCommand?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="bg-white dark:bg-[#1e2438] rounded-xl shadow-lg p-6 text-center"
              >
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Open Positions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Open Positions
          </h2>
          <div className="space-y-6">
            {jobs.map((job, index) => (
              <motion.div
                key={job.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="bg-white dark:bg-[#1e2438] rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {job.title}
                      </h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${job.departmentColor}`}>
                        {job.department}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {job.type}
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements.map((req) => (
                        <span
                          key={req}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="lg:ml-6">
                    <a
                      href={`mailto:careers@incommand.uk?subject=Application: ${job.title}`}
                      className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      Apply Now
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Company Culture */}
      <div className="bg-blue-600 dark:bg-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              Our Culture
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RocketLaunchIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Innovation First</h3>
                <p className="text-blue-100">
                  We encourage experimentation and embrace new ideas. Your input shapes our product.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Collaborative Team</h3>
                <p className="text-blue-100">
                  Work with talented colleagues who support each other and celebrate wins together.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HeartIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Work-Life Balance</h3>
                <p className="text-blue-100">
                  Flexible schedules, remote work, and unlimited time off to recharge.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="bg-white dark:bg-[#1e2438] rounded-xl shadow-lg p-8 sm:p-12 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Don&apos;t See the Right Role?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            We&apos;re always looking for talented people. Send us your CV and tell us how you&apos;d like to contribute.
          </p>
          <a
            href="mailto:careers@incommand.uk?subject=General Application"
            className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            Get in Touch
          </a>
        </motion.div>
      </div>
    </div>
  )
}

