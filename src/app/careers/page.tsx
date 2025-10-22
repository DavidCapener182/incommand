'use client'

import { motion } from 'framer-motion'
import {
  CurrencyPoundIcon,
  HeartIcon,
  LightBulbIcon,
  ClockIcon,
  RocketLaunchIcon,
  UserGroupIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { StackedPanel } from '@/components/ui/StackedPanel'

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

const departments = [
  {
    name: 'Engineering',
    icon: RocketLaunchIcon,
    color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    status: 'Coming Soon',
  },
  {
    name: 'Product',
    icon: LightBulbIcon,
    color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    status: 'Coming Soon',
  },
  {
    name: 'Customer Success',
    icon: UserGroupIcon,
    color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    status: 'Coming Soon',
  },
  {
    name: 'Operations',
    icon: ClockIcon,
    color: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
    status: 'Coming Soon',
  },
]

export default function CareersPage() {
  return (
    <PageWrapper>
      {/* Hero Section with Image Placeholder */}
      <div className="relative -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-8 h-80 sm:h-96 bg-gradient-to-br from-green-600 via-teal-600 to-cyan-600 overflow-hidden">
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
              Join Our Mission
              <span className="block mt-2">
                Build the Future of Event Safety
              </span>
            </h1>
            <p className="text-xl text-teal-100 max-w-3xl mx-auto">
              We&apos;re building a talented team passionate about creating tools that make events safer and more efficient.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <StackedPanel className="space-y-12">
        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Why Work at InCommand?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="card-depth-subtle p-6 text-center"
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

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="card-depth bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#1a2a57] dark:to-[#1e3a8a] border-2 border-blue-200 dark:border-blue-700 p-8 sm:p-12 text-center"
        >
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 dark:bg-blue-500 rounded-full mb-4">
              <BellAlertIcon className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Exciting Opportunities Coming Soon
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            We&apos;re not actively hiring right now, but we&apos;re growing fast. Exciting opportunities across engineering, product, customer success, and operations are on the horizon.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Want to be the first to know when positions open up?
          </p>
          <a
            href="mailto:careers@incommand.uk?subject=Career Opportunities - Notify Me"
            className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            Notify Me
          </a>
        </motion.div>

        {/* Departments Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Departments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {departments.map((dept, index) => (
              <motion.div
                key={dept.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="card-depth p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <dept.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {dept.name}
                      </h3>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${dept.color}`}>
                    {dept.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Company Culture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="card-depth bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-12"
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
                Flexible schedules, remote work, and generous time off to recharge.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Speculative Applications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="card-depth-subtle p-8 sm:p-12 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Don&apos;t See the Right Role?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            We&apos;re always interested in hearing from talented people. Send us your CV and tell us how you&apos;d like to contribute to making events safer.
          </p>
          <a
            href="mailto:careers@incommand.uk?subject=General Application"
            className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            Get in Touch
          </a>
        </motion.div>
      </StackedPanel>
    </PageWrapper>
  )
}
