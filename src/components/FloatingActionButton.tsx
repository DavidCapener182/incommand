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
        className={`fixed bottom-20 right-4 z-[55] ${className}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 17 }}
      >

        {/* Main FAB */}
        <motion.button
          onClick={handleCreateIncident}
          className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors touch-target"
          data-tour="log-incident"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PlusIcon className="h-6 w-6" />
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