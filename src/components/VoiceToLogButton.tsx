'use client'

import React, { useState } from 'react'
import { MicrophoneIcon } from '@heroicons/react/24/outline'
import VoiceToLogModal from './VoiceToLogModal'
import { VoiceIncidentData } from '@/lib/ai/voiceIncidentExtraction'

interface VoiceToLogButtonProps {
  onIncidentExtracted: (data: VoiceIncidentData) => void
  className?: string
}

export default function VoiceToLogButton({ onIncidentExtracted, className = '' }: VoiceToLogButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg shadow-lg transition-all transform hover:scale-105 ${className}`}
        title="Create incident using voice input"
      >
        <MicrophoneIcon className="h-5 w-5" />
        <span className="font-medium">Voice to Log</span>
      </button>

      <VoiceToLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onIncidentExtracted={(data) => {
          onIncidentExtracted(data)
          setIsModalOpen(false)
        }}
      />
    </>
  )
}

