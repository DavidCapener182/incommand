'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  HandThumbUpIcon, 
  CheckIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline'
import { type ChatMessage } from '@/lib/collaboration/chatService'
import clsx from 'clsx'

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  onReaction?: (emoji: string) => void
}

const QUICK_REACTIONS = ['👍', '✅', '❤️', '😂', '😮', '😢']

export default function MessageBubble({ message, isOwn, onReaction }: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const handleReaction = (emoji: string) => {
    onReaction?.(emoji)
    setShowReactions(false)
  }

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch (error) {
      console.error('Error formatting time:', error, timestamp)
      return 'Invalid Date'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        "flex group",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div className={clsx(
        "max-w-[75%] rounded-2xl p-3 relative shadow-sm transition-all duration-200",
        isOwn
          ? "bg-gradient-to-r from-[#2A3990] to-[#4057C0] text-white ml-auto"
          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
      )}>
        {/* Message Header */}
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {((message as any).user_callsign || message.userCallsign || 'Unknown User').replace(/\./g, ' ').toUpperCase()}
            </span>
          </div>
        )}

        {/* Message Content */}
        <div className="whitespace-pre-wrap break-words">
          {message.message}
        </div>

        {/* Message Footer */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {/* Read Receipts */}
            {isOwn && (
              <div className="flex items-center gap-1">
                <CheckIcon className="h-3 w-3 text-white/70" />
                {((message as any).read_by || message.readBy || []).length > 1 && (
                  <CheckIcon className="h-3 w-3 text-white/70 -ml-1" />
                )}
              </div>
            )}

            {/* Timestamp */}
            <span className={clsx(
              "text-xs",
              isOwn ? "text-white/70" : "text-gray-500 dark:text-gray-400"
            )}>
              {formatTime((message as any).created_at || message.createdAt || new Date().toISOString())}
            </span>
          </div>

          {/* Message Options */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className={clsx(
                "p-1 rounded transition-colors",
                isOwn 
                  ? "hover:bg-white/20" 
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
              aria-label="Add reaction"
            >
              <HandThumbUpIcon className={clsx(
                "h-3 w-3",
                isOwn ? "text-white/70" : "text-gray-500 dark:text-gray-400"
              )} />
            </button>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={clsx(
                "p-1 rounded transition-colors",
                isOwn 
                  ? "hover:bg-white/20" 
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
              aria-label="Message options"
            >
              <EllipsisHorizontalIcon className={clsx(
                "h-3 w-3",
                isOwn ? "text-white/70" : "text-gray-500 dark:text-gray-400"
              )} />
            </button>
          </div>
        </div>

        {/* Reactions */}
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex gap-1 border border-gray-200 dark:border-gray-700"
          >
            {QUICK_REACTIONS.map((emoji) => (
              <motion.button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label={`React with ${emoji}`}
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Message Options Menu */}
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 min-w-[120px] border border-gray-200 dark:border-gray-700"
          >
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Reply
            </button>
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Copy
            </button>
            {isOwn && (
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Edit
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
