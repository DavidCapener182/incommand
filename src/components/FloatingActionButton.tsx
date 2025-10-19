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
          className="touch-target flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-blue-500/60 text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_4px_16px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          data-tour="log-incident"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PlusIcon className="h-6 w-6 text-white drop-shadow" />
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