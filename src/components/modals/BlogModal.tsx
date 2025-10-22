'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline'

interface BlogModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  author: string
  date: string
  readTime: string
  content: React.ReactNode
  image?: string
}

export function BlogModal({ 
  isOpen, 
  onClose, 
  title, 
  author, 
  date, 
  readTime, 
  content,
  image 
}: BlogModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#1e2438] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>

              {/* Header Image */}
              {image && (
                <div className="h-48 bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-6xl">
                  {image}
                </div>
              )}

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-60px)] p-8">
                {/* Title */}
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {title}
                </h1>

                {/* Meta information */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-1">
                    <UserIcon className="w-4 h-4" />
                    <span>By {author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>{readTime}</span>
                  </div>
                </div>

                {/* Article content */}
                <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                  {content}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

