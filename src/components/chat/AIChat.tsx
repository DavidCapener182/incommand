'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  SparklesIcon, 
  ArchiveBoxIcon,
  TrashIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'
import { aiChatService, type AIMessage } from '@/lib/ai/aiChatService'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import TypingIndicator from './TypingIndicator'
import { useAIChat } from '@/hooks/useAIChat'
import clsx from 'clsx'

interface AIChatProps {
  eventId: string
  companyId: string
  userId: string
}

const EXAMPLE_PROMPTS = [
  {
    title: "Incident Summary",
    prompt: "Summarise today's incident log for this event",
    icon: "📊"
  },
  {
    title: "Green Guide Query",
    prompt: "According to the Green Guide, what's the minimum barrier height for a 10,000-capacity event?",
    icon: "📖"
  },
  {
    title: "Crowd Analytics",
    prompt: "Show me the latest crowd density prediction",
    icon: "👥"
  },
  {
    title: "Safety Procedures",
    prompt: "What are the safety procedures for crowd ingress?",
    icon: "🛡️"
  },
  {
    title: "Emergency Response",
    prompt: "How should we handle a medical emergency?",
    icon: "🚨"
  }
]

export default function AIChat({
  eventId,
  companyId,
  userId
}: AIChatProps) {
  const [conversationId, setConversationId] = useState<string>('')
  const [showExamples, setShowExamples] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    sendMessage,
    loading,
    isTyping,
    error,
    archiveConversation,
    clearConversation
  } = useAIChat(conversationId, eventId, companyId, userId)

  // Generate conversation ID on mount
  useEffect(() => {
    if (!conversationId) {
      const newId = aiChatService.generateConversationId()
      setConversationId(newId)
    }
  }, [conversationId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!conversationId) return
    
    await sendMessage(content)
    setShowExamples(false)
  }

  const handleExampleClick = (prompt: string) => {
    handleSendMessage(prompt)
  }

  const handleArchive = async () => {
    if (messages.length === 0) return
    
    const success = await archiveConversation()
    if (success) {
      // Clear conversation after successful archive
      clearConversation()
      const newId = aiChatService.generateConversationId()
      setConversationId(newId)
    }
  }

  const handleClear = () => {
    clearConversation()
    const newId = aiChatService.generateConversationId()
    setConversationId(newId)
    setShowExamples(true)
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-6 w-6 text-[#2A3990]" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                AI Assistant
              </h3>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Powered by inCommand AI
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <>
                <motion.button
                  onClick={handleArchive}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors touch-target"
                  title="Archive conversation"
                  aria-label="Archive conversation"
                >
                  <ArchiveBoxIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </motion.button>
                <motion.button
                  onClick={handleClear}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors touch-target"
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <TrashIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </motion.button>
              </>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors touch-target"
              title="Help"
              aria-label="Help"
            >
              <QuestionMarkCircleIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 max-h-full">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A3990] mx-auto mb-2"></div>
              <div className="text-gray-500 dark:text-gray-400">Loading conversation...</div>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-500">
              <div className="text-lg mb-2">⚠️</div>
              <div>Error: {error}</div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              <div className="text-center text-gray-500 dark:text-gray-400 max-w-md mx-auto px-4 py-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <SparklesIcon className="h-16 w-16 mx-auto mb-4 text-[#2A3990] opacity-60" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">AI Assistant</h3>
                  <p className="text-sm mb-6 text-gray-600 dark:text-gray-300">
                    💡 Ask about incidents, staff, or safety guidance
                  </p>
                  
                  {/* Example Prompts */}
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400 mb-3 font-medium">Try asking:</p>
                    {EXAMPLE_PROMPTS.map((example, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleExampleClick(example.prompt)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="block w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{example.icon}</span>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white mb-1">
                              {example.title}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {example.prompt}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <AIMessageBubble
                  message={message}
                  isOwn={message.role === 'user'}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 p-2"
          >
            <TypingIndicator color="purple" />
            <span>AI is thinking...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        onSend={handleSendMessage}
        placeholder="Ask the AI assistant..."
        disabled={loading || isTyping}
      />
    </div>
  )
}

// AI-specific message bubble with citation support
function AIMessageBubble({ message, isOwn }: { message: AIMessage; isOwn: boolean }) {
  const hasCitations = message.citations && message.citations.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        "flex",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div className={clsx(
        "max-w-[75%] rounded-2xl p-3 shadow-sm transition-all duration-200",
        isOwn
          ? "bg-gradient-to-r from-[#2A3990] to-[#4057C0] text-white ml-auto"
          : "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700"
      )}>
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        
        {/* Green Guide Citations */}
        {hasCitations && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ delay: 0.1 }}
            className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300 mb-2 font-medium">
              <BookOpenIcon className="h-3 w-3" />
              <span>Green Guide Sources:</span>
            </div>
            <div className="space-y-2">
              {message.citations?.map((citation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="text-xs"
                >
                  <a
                    href={`/green-guide?page=${citation.page}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors"
                  >
                    <span className="font-medium">[GG p.{citation.page}]</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {citation.content.slice(0, 80)}...
                    </span>
                  </a>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        
        <div className={clsx(
          "text-xs mt-2",
          isOwn ? "text-white/70" : "text-gray-500 dark:text-gray-400"
        )}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  )
}
