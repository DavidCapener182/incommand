'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { PlusIcon } from '@heroicons/react/24/outline'
import IncidentCreationModal from './IncidentCreationModal'

interface FloatingActionButtonProps {
  className?: string
}

export default function FloatingActionButton({ className = '' }: FloatingActionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCreateIncident = () => {
    setIsModalOpen(true)
  }

  const handleIncidentCreated = async () => {
    setIsModalOpen(false)
    // Could add success notification here
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        className={`fixed bottom-20 right-5 z-[55] ${className}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 17 }}
      >

        {/* Main FAB */}
        <motion.button
          onClick={handleCreateIncident}
          aria-label="Create new incident"
          className="touch-target flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-2xl border border-white/30 shadow-[inset_0_2px_6px_rgba(255,255,255,0.5),0_8px_20px_rgba(0,0,0,0.25)] transition-transform duration-200 active:scale-95 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          data-tour="log-incident"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/40 to-blue-600/30 blur-md" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-white/30 to-transparent" />
          <PlusIcon className="h-7 w-7 text-white drop-shadow-lg relative z-10" />
        </motion.button>
      </motion.div>

      {/* Incident Creation Modal */}
      <IncidentCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onIncidentCreated={handleIncidentCreated}
      />
    </>
  )
}