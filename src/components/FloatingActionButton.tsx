'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PlusIcon } from '@heroicons/react/24/outline'
import IncidentCreationModal from './IncidentCreationModal'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface FloatingActionButtonProps {
  className?: string
}

export default function FloatingActionButton({ className = '' }: FloatingActionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasCurrentEvent, setHasCurrentEvent] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const supabase = createClientComponentClient()

  // Check for active event
  useEffect(() => {
    const checkCurrentEvent = async () => {
      try {
        const { data: event } = await supabase
          .from('events')
          .select('id')
          .eq('is_current', true)
          .single()
        
        setHasCurrentEvent(!!event)
      } catch (error) {
        console.error('Error checking current event:', error)
        setHasCurrentEvent(false)
      }
    }

    checkCurrentEvent()
  }, [supabase])

  // Listen for event modal state changes
  useEffect(() => {
    const handleEventModalChange = (event: CustomEvent) => {
      setShowEventModal(event.detail.isOpen)
    }

    window.addEventListener('eventModalChange', handleEventModalChange as EventListener)
    return () => {
      window.removeEventListener('eventModalChange', handleEventModalChange as EventListener)
    }
  }, [])

  const handleCreateIncident = () => {
    setIsModalOpen(true)
  }

  const handleIncidentCreated = async () => {
    setIsModalOpen(false)
    // Could add success notification here
  }

  // Don't show FAB if no active event or if event modal is open
  if (!hasCurrentEvent || showEventModal) {
    return (
      <IncidentCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onIncidentCreated={handleIncidentCreated}
      />
    )
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
          className="touch-target flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          data-tour="log-incident"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ 
            backgroundColor: '#3b82f6',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none'
          }}
        >
          <PlusIcon className="h-5 w-5 text-white" />
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