'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

interface SuggestionsBoxProps {
  className?: string
}

export default function SuggestionsBox({ className = '' }: SuggestionsBoxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!suggestion.trim()) return

    setIsSubmitting(true)
    
    try {
      // For now, we'll just show a success message
      // Later this will be connected to an email service
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      setSubmitted(true)
      setSuggestion('')
      
      // Reset after 3 seconds
      setTimeout(() => {
        setSubmitted(false)
        setIsOpen(false)
      }, 3000)
    } catch (error) {
      console.error('Error submitting suggestion:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Suggestions Box */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ 
          opacity: isOpen ? 1 : 0, 
          y: isOpen ? 0 : 20, 
          scale: isOpen ? 1 : 0.9 
        }}
        transition={{ duration: 0.2 }}
        className={`absolute bottom-16 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 ${
          isOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Suggest a Feature</h3>
          </div>
          
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-600 font-medium">Thank you for your suggestion!</p>
              <p className="text-sm text-gray-500 mt-1">We&apos;ll review it and get back to you.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="suggestion" className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like to see in InCommand?
                </label>
                <textarea
                  id="suggestion"
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="Describe your feature idea, improvement, or feedback..."
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!suggestion.trim() || isSubmitting}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open suggestions box"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
      </motion.button>
    </div>
  )
}
