'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PaperAirplaneIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  FaceSmileIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { chatService, type ChatMessage } from '@/lib/collaboration/chatService'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import TypingIndicator from './TypingIndicator'
import { useTeamChat } from '@/hooks/useTeamChat'
import clsx from 'clsx'

interface TeamChatProps {
  eventId: string
  companyId: string
  userId: string
  userCallsign: string
}

export default function TeamChat({
  eventId,
  companyId,
  userId,
  userCallsign
}: TeamChatProps) {
  const [selectedChannel, setSelectedChannel] = useState('general')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showChannelSelector, setShowChannelSelector] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    channels,
    sendMessage,
    loading,
    error,
    typingUsers,
    onlineUsers
  } = useTeamChat(eventId, companyId, selectedChannel)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (content: string, metadata?: any) => {
    await sendMessage(content, metadata)
  }

  const handleChannelSelect = (channelName: string) => {
    setSelectedChannel(channelName)
    setShowChannelSelector(false)
  }

  const filteredMessages = searchQuery
    ? messages.filter(msg => 
        msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.userCallsign.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setShowChannelSelector(!showChannelSelector)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                "bg-[#2A3990] text-white shadow-sm",
                "hover:bg-[#1e2a6b] hover:shadow-md"
              )}
            >
              <span>#{selectedChannel}</span>
              <ChevronDownIcon className="h-4 w-4" />
            </motion.button>
            
            {onlineUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {onlineUsers.length} online
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <motion.button
              onClick={() => setShowSearch(!showSearch)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors touch-target"
              aria-label="Search messages"
            >
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors touch-target"
              aria-label="Add channel"
            >
              <PlusIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3"
            >
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#2A3990] focus:border-transparent transition-all duration-200"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Channel Selector */}
        <AnimatePresence>
          {showChannelSelector && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 space-y-1"
            >
              {channels.map((channel) => (
                <motion.button
                  key={channel.id}
                  onClick={() => handleChannelSelect(channel.name)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={clsx(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200",
                    selectedChannel === channel.name
                      ? 'bg-[#2A3990] text-white shadow-sm'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>#{channel.name}</span>
                    {selectedChannel === channel.name && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-white rounded-full"
                      />
                    )}
                  </div>
                  <div className={clsx(
                    "text-xs mt-1",
                    selectedChannel === channel.name
                      ? "text-white/70"
                      : "text-gray-500 dark:text-gray-400"
                  )}>
                    {channel.type === 'team' ? 'Team channel' : 'Channel'}
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 max-h-full">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A3990] mx-auto mb-2"></div>
              <div className="text-gray-500 dark:text-gray-400">Loading messages...</div>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-500">
              <div className="text-lg mb-2">⚠️</div>
              <div>Error loading messages: {error}</div>
            </div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col h-full">
            {/* Channel Description */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  #{selectedChannel}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedChannel === 'general' && 'General team discussions and announcements'}
                  {selectedChannel === 'SMT' && 'Senior Management Team coordination and strategic discussions'}
                  {selectedChannel === 'Supervisors' && 'Supervisor coordination and operational updates'}
                  {selectedChannel === 'Issues' && 'Report and track operational issues and incidents'}
                </p>
              </div>
            </motion.div>
            
            {/* Empty State */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-1">No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </motion.div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MessageBubble
                  message={message}
                  isOwn={message.userId === userId}
                  onReaction={(emoji) => {
                    // Handle reaction
                    chatService.addReaction(message.id, userId, emoji)
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 p-2"
          >
            <TypingIndicator color="gray" />
            <span>
              {typingUsers.length === 1 
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.length} people are typing...`
              }
            </span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        onSend={handleSendMessage}
        placeholder={`Message #${selectedChannel}`}
        disabled={loading}
      />
    </div>
  )
}
