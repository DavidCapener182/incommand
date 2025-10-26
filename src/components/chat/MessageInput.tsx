'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  PaperAirplaneIcon, 
  FaceSmileIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface MessageInputProps {
  onSend: (message: string, metadata?: any) => void
  placeholder?: string
  disabled?: boolean
}

const EMOJIS = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']

export default function MessageInput({ onSend, placeholder = "Type a message...", disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [showEmojis, setShowEmojis] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled && !isSending) {
      setIsSending(true)
      try {
        await onSend(message.trim())
        setMessage('')
        setShowEmojis(false)
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      } finally {
        setIsSending(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji)
    setShowEmojis(false)
    textareaRef.current?.focus()
  }

  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  const handleCompositionEnd = () => {
    setIsComposing(false)
  }

  return (
    <div className="relative bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-sm p-3">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* File Upload Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-target"
          disabled={disabled}
          aria-label="Attach file"
        >
          <PaperClipIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </motion.button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder={placeholder}
            disabled={disabled || isSending}
            className={clsx(
              "w-full px-4 py-3 pr-12 border rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#2A3990] focus:border-transparent resize-none max-h-32 transition-all duration-200",
              "border-gray-200 dark:border-gray-600",
              "focus:bg-white dark:focus:bg-gray-700"
            )}
            rows={1}
            style={{ minHeight: '44px' }}
          />
          
          {/* Emoji Button */}
          <motion.button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            disabled={disabled}
            aria-label="Add emoji"
          >
            <FaceSmileIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </motion.button>
        </div>

        {/* Send Button */}
        <motion.button
          type="submit"
          disabled={!message.trim() || disabled || isSending}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={clsx(
            "p-3 text-white rounded-full transition-all duration-200 touch-target",
            "bg-gradient-to-r from-[#2A3990] to-[#4057C0] hover:from-[#1e2a6b] hover:to-[#3649a8]",
            "disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed",
            isSending && "animate-pulse"
          )}
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </motion.button>
      </form>

      {/* Emoji Picker */}
      {showEmojis && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 max-h-48 overflow-y-auto z-10"
        >
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((emoji) => (
              <motion.button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-lg touch-target"
                aria-label={`Add ${emoji} emoji`}
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
