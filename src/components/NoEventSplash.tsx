'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { PlusIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import RotatingText from './RotatingText'
import EventCreationModal from './EventCreationModal'

const EVENT_TYPES = [
  'Concerts', 'Sports Events', 'Conferences', 'Festivals', 
  'Exhibitions', 'Theatre Shows', 'Parades', 'Ceremonies', 
  'Gatherings', 'Charity Events', 'Corporate Events',
]

interface NoEventSplashProps {
  onEventCreated: () => void
}

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
}

export default function NoEventSplash({ onEventCreated }: NoEventSplashProps) {
  const router = useRouter()
  const [showCreateEvent, setShowCreateEvent] = useState(false)

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#23408e] z-50 min-h-screen overflow-hidden">
      
      {/* --- Ambient Background Animation --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff20_1px,transparent_1px),linear-gradient(to_bottom,#ffffff20_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        {/* Floating Orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500 rounded-full blur-[120px] mix-blend-overlay"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500 rounded-full blur-[120px] mix-blend-overlay"
        />
      </div>

      {/* --- Main Content --- */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center w-full max-w-4xl px-4"
      >
        
        {/* Logo */}
        <motion.div variants={itemVariants} className="mb-10 relative">
          <div className="absolute inset-0 bg-blue-400/30 blur-3xl rounded-full -z-10" />
          <Image
            src="/inCommand.png"
            alt="inCommand Logo"
            width={280}
            height={140}
            className="object-contain drop-shadow-2xl"
            priority
          />
        </motion.div>

        {/* Headline */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 mb-6 text-center">
          <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
            Event Control for
          </span>
          <div className="relative">
             {/* Glow behind rotating text */}
             <div className="absolute inset-0 bg-blue-400/20 blur-lg rounded-xl -z-10" />
             <RotatingText
               items={EVENT_TYPES}
               interval={2500}
               className="bg-white text-blue-900 rounded-xl px-6 py-2 shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center min-w-[200px] min-h-[56px] font-black text-2xl md:text-3xl transform rotate-[-1deg]"
             />
          </div>
        </motion.div>

        {/* Subtext */}
        <motion.p variants={itemVariants} className="text-lg text-blue-100/90 font-medium mb-12 text-center max-w-xl leading-relaxed">
          Modern incident tracking and intelligent command <br className="hidden sm:block" /> for every scale of operation.
        </motion.p>

        {/* Action Card */}
        <motion.div 
          variants={itemVariants}
          className="w-full max-w-md mx-auto relative group"
        >
          {/* Card Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
          
          <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/50 flex flex-col gap-4">
            
            {/* Primary Button */}
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full relative overflow-hidden flex items-center justify-center gap-3 bg-[#23408e] text-white text-lg font-bold py-4 rounded-xl shadow-lg group/btn"
              onClick={() => setShowCreateEvent(true)}
            >
              {/* Shine Effect */}
              <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
              
              <div className="relative z-10 flex items-center gap-2">
                 <PlusIcon className="h-6 w-6 stroke-[3px]" /> 
                 <span>Start New Event</span>
              </div>
            </motion.button>

            {/* Secondary Button */}
            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(243, 244, 246, 0.8)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 border-2 border-blue-100 text-blue-800 font-bold py-3.5 rounded-xl bg-white/50 hover:border-blue-200 transition-colors"
              onClick={() => router.push('/settings/events')}
            >
              <ClockIcon className="h-5 w-5" /> 
              <span>Open Previous Events</span>
            </motion.button>

          </div>
        </motion.div>

      </motion.div>

      {/* Footer Version */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-4 right-6 text-xs text-white font-mono tracking-wider select-none"
      >
        v{process.env.NEXT_PUBLIC_APP_VERSION}
      </motion.div>

      {/* Modals */}
      {showCreateEvent && (
        <EventCreationModal 
          isOpen={showCreateEvent} 
          onClose={() => setShowCreateEvent(false)} 
          onEventCreated={() => {
            onEventCreated()
            setShowCreateEvent(false)
          }} 
        />
      )}
    </div>
  )
}