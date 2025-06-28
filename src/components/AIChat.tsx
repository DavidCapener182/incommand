'use client'

import React, { useState, useEffect, useRef } from 'react';
import { PaperClipIcon, ArrowUpCircleIcon, CpuChipIcon } from '@heroicons/react/24/outline';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface QuickAction {
  id: string;
  text: string;
  icon: string;
}

interface AIChatProps {
  isVisible: boolean;
}

export default function AIChat({ isVisible }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [eventContext, setEventContext] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem('aiChatHistory');
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          setMessages(parsed);
        } catch (error) {
          console.error('Error loading chat history:', error);
        }
      }
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem('aiChatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  // Initialize with welcome message and quick actions
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `
• **Incident Analysis** - Review trends and patterns
• **SOPs & Procedures** - Get step-by-step guidance
• **Risk Assessment** - Identify and mitigate threats
• **Emergency Response** - Quick access to protocols
• **Crowd Management** - Capacity and safety advice

What would you like assistance with today?`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
      
      // Load initial quick actions
      setQuickActions([
        { id: 'status', text: "Current event status", icon: '📊' },
        { id: 'incidents', text: "Recent incidents summary", icon: '📋' },
        { id: 'sop', text: "Emergency procedures", icon: '🚨' },
        { id: 'help', text: "What can you help with?", icon: '❓' }
      ]);
    }
  }, [messages.length]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: content.trim(),
          conversationHistory: messages.slice(-10) // Send last 10 messages for context
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Keep the raw content with markdown for proper formatting
      const rawContent = data.response || data.fallback || 'I apologize, but I encountered an issue processing your request.';

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: rawContent,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update quick actions and context if provided
      if (data.quickActions) {
        setQuickActions(data.quickActions);
      }
      if (data.context) {
        setEventContext(data.context);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to get response. Please try again.');
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment, or contact your control room supervisor for immediate assistance.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.text);
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aiChatHistory');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Function to format message content with proper bold text and other formatting
  const formatMessageContent = (content: string) => {
    // Split content by bold markers and create React elements
    const parts = content.split(/(\*\*.*?\*\*)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // This is bold text - remove ** and make it bold
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-semibold">{boldText}</strong>;
      } else {
        // Process regular text for other formatting
        const processedText = part
          .replace(/^#{1,6}\s+/gm, '') // Remove markdown headers
          .replace(/^[-*+]\s+/gm, '• ') // Convert markdown bullets to simple bullets
          .replace(/^\d+\.\s+/gm, ''); // Remove numbered list formatting
        
        return processedText;
      }
    });
  };

  if (!isVisible) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#232c43] dark:to-[#151d34] shadow-lg rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 dark:bg-blue-700 rounded-full flex items-center justify-center shadow">
            <CpuChipIcon className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight flex items-center gap-2">
              inCommand AI
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1" title="Online" />
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300">Digital Operations Assistant</p>
          </div>
        </div>
        
        {/* Event Context Display */}
        {eventContext && (
          <div className="text-xs text-gray-600 text-right">
            <div className="font-medium">{eventContext.eventName}</div>
            <div>{eventContext.totalIncidents} incidents • {eventContext.openIncidents} open</div>
          </div>
        )}
        
        {/* Clear Chat Button */}
        {messages.length > 1 && (
          <button
            onClick={clearChat}
            className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Clear chat history"
            aria-label="Clear chat history"
            data-ai-chat-clear
          >
            <svg className="h-5 w-5 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0">
        {messages.map((message, idx) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} fade-in`}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-md transition-all duration-200
                ${message.role === 'user'
                  ? 'bg-white text-[#2A3990] dark:bg-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                  : 'bg-blue-50 text-blue-900 dark:bg-[#232c43] dark:text-blue-100 border border-blue-100 dark:border-blue-700'}
              `}
              tabIndex={0}
              aria-label={message.role === 'user' ? 'Your message' : 'AI message'}
            >
              <div className="text-sm whitespace-pre-wrap">{formatMessageContent(message.content)}</div>
              <div className="text-xs mt-2 text-gray-400 dark:text-gray-500 text-right">{formatTimestamp(message.timestamp)}</div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start fade-in">
            <div className="bg-blue-50 dark:bg-[#232c43] rounded-2xl px-5 py-3 shadow-md">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-300">inCommand AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-2xl p-3 fade-in">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions - moved to just above the input area */}
      {quickActions.length > 0 && !isLoading && (
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-[#232c43]">
          <div className="flex flex-wrap gap-2 justify-start overflow-x-auto">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-[#1e2a6a] hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-200 shadow focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                aria-label={action.text}
              >
                <span>{action.icon}</span>
                <span>{action.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Attach file (coming soon)"
            aria-label="Attach file (coming soon)"
            disabled
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about incidents, SOPs, procedures..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-[#2A3990] focus:border-transparent text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow"
            disabled={isLoading}
            aria-label="Type your message"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2 rounded-full bg-[#2A3990] text-white dark:bg-white dark:text-[#2A3990] hover:bg-[#1e2a6a] dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2A3990] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow"
            aria-label="Send message"
          >
            <ArrowUpCircleIcon className="w-6 h-6" />
          </button>
        </form>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Powered by inCommand AI • For emergency situations, contact control room directly
        </div>
      </div>
    </div>
  );
} 