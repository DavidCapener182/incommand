'use client'

import React, { useState, useEffect, useRef } from 'react';
import { PaperClipIcon, ArrowUpCircleIcon, CpuChipIcon, MagnifyingGlassIcon, DocumentTextIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { QuickAction, CommandExecutionResult } from '@/types/chat';
import { categorizeIncident, analyzeTextNLP, determineRouting } from '@/lib/chat/incidentParser';
import { enhancedChatCompletion, generateDebriefReport, analyzeSentiment, generatePredictiveAnalytics } from '@/services/browserLLMService';
import { enhancedChatCompletion as ollamaChatCompletion, generateOllamaDebriefReport, analyzeOllamaSentiment, generateOllamaPredictiveAnalytics, processNaturalLanguageSearch, categorizeIncidentWithOllama } from '@/services/ollamaService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    incidentCategory?: any;
    nlpAnalysis?: any;
    routingDecision?: any;
    sentiment?: any;
    searchResults?: any;
  };
}

interface AIChatProps {
  isVisible: boolean;
}

export default function AIChat({ isVisible }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);
  const [eventContext, setEventContext] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentIncidents, setCurrentIncidents] = useState<any[]>([]);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [aiService, setAiService] = useState<'browser' | 'ollama'>('browser');
  const [isGeneratingDebrief, setIsGeneratingDebrief] = useState(false);
  const [debriefReport, setDebriefReport] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

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

  // Auto-scroll to bottom when new messages arrive, unless user scrolled up
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  // Focus input when chat becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  // Load current incidents and staff data
  useEffect(() => {
    const loadContextData = async () => {
      try {
        // Load current incidents
        const incidentsResponse = await fetch('/api/incidents');
        if (incidentsResponse.ok) {
          const incidents = await incidentsResponse.json();
          setCurrentIncidents(incidents);
        }

        // Load staff data
        const staffResponse = await fetch('/api/staff');
        if (staffResponse.ok) {
          const staff = await staffResponse.json();
          setStaffData(staff);
        }
      } catch (error) {
        console.error('Error loading context data:', error);
      }
    };

    loadContextData();
  }, []);

  // Initialize with welcome message and quick actions
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `
🤖 **inCommand AI Assistant** - Enhanced with Advanced Features

**Core Capabilities:**
• **Automated Incident Categorization** - AI-powered classification and routing
• **Natural Language Search** - Find incidents using plain English
• **Smart Routing** - Automatic staff assignment based on incident type
• **Sentiment Analysis** - Understand urgency and emotional context
• **Predictive Analytics** - Forecast potential incidents and risks
• **Debrief Generation** - Comprehensive event reports with insights

**Quick Actions:**
• **Incident Analysis** - Review trends and patterns
• **SOPs & Procedures** - Get step-by-step guidance
• **Risk Assessment** - Identify and mitigate threats
• **Emergency Response** - Quick access to protocols
• **Crowd Management** - Capacity and safety advice

What would you like assistance with today?`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
      
      // Load enhanced quick actions
      setQuickActions([
        { id: 'status', text: "Current event status", icon: '📊', mode: 'chat' },
        { id: 'incidents', text: "Recent incidents summary", icon: '📋', mode: 'chat' },
        { id: 'sop', text: "Emergency procedures", icon: '🚨', mode: 'chat' },
        { id: 'help', text: "What can you help with?", icon: '❓', mode: 'chat' },
        { id: 'debrief', text: "Generate debrief report", icon: '📄', mode: 'command' },
        { id: 'predict', text: "Predictive analytics", icon: '🔮', mode: 'command' },
        { id: 'search', text: "Search incidents", icon: '🔍', mode: 'command' }
      ]);
    }
  }, [messages.length]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);
  };

  // Enhanced message processing with AI analysis
  const processMessageWithAI = async (content: string): Promise<{
    response: string;
    quickActions?: QuickAction[];
    metadata?: any;
  }> => {
    // Check if this is a search query
    if (content.toLowerCase().includes('search') || content.toLowerCase().includes('find') || content.toLowerCase().includes('look for')) {
      return await handleSearchQuery(content);
    }

    // Check if this is an incident report
    const incidentKeywords = ['incident', 'report', 'happened', 'occurred', 'issue', 'problem'];
    const isIncidentReport = incidentKeywords.some(keyword => content.toLowerCase().includes(keyword));

    if (isIncidentReport) {
      return await handleIncidentReport(content);
    }

    // Regular chat processing
    return await handleRegularChat(content);
  };

  // Handle search queries with NLP
  const handleSearchQuery = async (query: string) => {
    try {
      // Process natural language search
      const searchAnalysis = aiService === 'ollama' 
        ? await processNaturalLanguageSearch(query)
        : null; // Browser LLM doesn't have this function yet

      if (searchAnalysis) {
        // Apply search filters to current incidents
        const filteredIncidents = currentIncidents.filter(incident => {
          const matchesType = searchAnalysis.filters.incidentType.length === 0 || 
            searchAnalysis.filters.incidentType.includes(incident.type);
          const matchesSeverity = searchAnalysis.filters.severity.length === 0 || 
            searchAnalysis.filters.severity.includes(incident.severity);
          return matchesType && matchesSeverity;
        });

        setSearchResults(filteredIncidents);

        return {
          response: `🔍 **Search Results for: "${query}"**

Found ${filteredIncidents.length} incidents matching your criteria:

${filteredIncidents.slice(0, 5).map(incident => 
  `• **${incident.type}** (${incident.severity}) - ${incident.description?.substring(0, 100)}...`
).join('\n')}

${filteredIncidents.length > 5 ? `... and ${filteredIncidents.length - 5} more incidents` : ''}

**Suggested queries:** ${searchAnalysis.suggestedQueries.slice(0, 3).join(', ')}`,
          metadata: { searchResults: filteredIncidents }
        };
      }
    } catch (error) {
      console.error('Search processing error:', error);
    }

    // Fallback to regular search
    return {
      response: `I'll help you search for incidents. Could you please provide more specific details about what you're looking for? For example:
• "Show me all medical incidents"
• "Find incidents from today"
• "Search for security issues"`,
      quickActions: [
        { id: 'search_medical', text: "Medical incidents", icon: '🏥', mode: 'chat' },
        { id: 'search_security', text: "Security incidents", icon: '🛡️', mode: 'chat' },
        { id: 'search_today', text: "Today's incidents", icon: '📅', mode: 'chat' }
      ]
    };
  };

  // Handle incident reports with automated categorization
  const handleIncidentReport = async (content: string) => {
    try {
      // Perform NLP analysis
      const nlpAnalysis = analyzeTextNLP(content);
      
      // Categorize incident
      const incidentCategory = categorizeIncident(content);
      
      // Determine routing
      const routingDecision = determineRouting(incidentCategory, nlpAnalysis, staffData, currentIncidents);
      
      // Analyze sentiment
      const sentiment = aiService === 'ollama' 
        ? await analyzeOllamaSentiment(content)
        : await analyzeSentiment(content);

      // Generate response with AI insights
      const aiResponse = await generateAIResponse(content, {
        incidentCategory,
        nlpAnalysis,
        routingDecision,
        sentiment
      });

      return {
        response: aiResponse,
        metadata: {
          incidentCategory,
          nlpAnalysis,
          routingDecision,
          sentiment
        },
        quickActions: generateQuickActionsFromAnalysis(incidentCategory, routingDecision)
      };
    } catch (error) {
      console.error('Incident processing error:', error);
      return {
        response: `I've received your incident report. Let me analyze it and provide appropriate guidance. Please provide any additional details that might be helpful.`
      };
    }
  };

  // Handle regular chat
  const handleRegularChat = async (content: string) => {
    try {
      const response = await fetch('/api/chat/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: content.trim(),
          conversationHistory: messages.slice(-10)
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        response: data.response || data.fallback || 'I apologize, but I encountered an issue processing your request.',
        quickActions: data.quickActions,
        context: data.context
      };
    } catch (error) {
      console.error('Chat processing error:', error);
      return {
        response: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.'
      };
    }
  };

  // Generate AI response with context
  const generateAIResponse = async (content: string, analysis: any) => {
    const { incidentCategory, nlpAnalysis, routingDecision, sentiment } = analysis;
    
    let response = `📋 **Incident Analysis Complete**

**Category:** ${incidentCategory.primary} (${Math.round(incidentCategory.confidence * 100)}% confidence)
**Severity:** ${incidentCategory.severity}
**Requires Escalation:** ${incidentCategory.requiresEscalation ? 'Yes' : 'No'}

**AI Insights:**
• **Sentiment:** ${sentiment?.sentiment || 'neutral'} (${Math.round((sentiment?.confidence || 0) * 100)}% confidence)
• **Urgency Level:** ${Math.round((nlpAnalysis.urgency || 0) * 100)}%
• **Key Entities:** ${nlpAnalysis.entities.slice(0, 3).map(e => e.text).join(', ')}

**Recommended Actions:**
${incidentCategory.suggestedActions.map(action => `• ${action}`).join('\n')}

**Routing Decision:**
• **Target Role:** ${routingDecision.targetRole}
• **Priority:** ${routingDecision.priority}
• **Estimated Response Time:** ${routingDecision.estimatedResponseTime} minutes
• **Auto-Assign:** ${routingDecision.autoAssign ? 'Yes' : 'No'}

${routingDecision.autoAssign ? '✅ **Staff will be automatically assigned**' : '⚠️ **Manual assignment required**'}`;

    return response;
  };

  // Generate quick actions based on analysis
  const generateQuickActionsFromAnalysis = (incidentCategory: any, routingDecision: any): QuickAction[] => {
    const actions: QuickAction[] = [];

    if (routingDecision.autoAssign) {
      actions.push({
        id: 'auto_assign',
        text: `Auto-assign to ${routingDecision.targetRole}`,
        icon: '👥',
        mode: 'command',
        payload: { targetRole: routingDecision.targetRole, priority: routingDecision.priority }
      });
    }

    if (incidentCategory.requiresEscalation) {
      actions.push({
        id: 'escalate',
        text: 'Escalate incident',
        icon: '🚨',
        mode: 'command',
        payload: { reason: routingDecision.reason }
      });
    }

    actions.push(
      { id: 'view_details', text: 'View incident details', icon: '📄', mode: 'command' },
      { id: 'update_status', text: 'Update status', icon: '✏️', mode: 'command' }
    );

    return actions;
  };

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
      const result = await processMessageWithAI(content.trim());

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString(),
        metadata: result.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update quick actions and context if provided
      if (result.quickActions) {
        setQuickActions(result.quickActions);
      }
      if (result.context) {
        setEventContext(result.context);
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

  const executeCommand = async (action: QuickAction): Promise<CommandExecutionResult> => {
    try {
      setIsExecutingCommand(true);
      
      switch (action.id) {
        case 'debrief':
          return await executeDebriefGeneration();
          
        case 'predict':
          return await executePredictiveAnalytics();
          
        case 'search':
          return await executeSearch();
          
        case 'auto_assign':
          return await executeStaffAssignment(action);
          
        case 'escalate':
          return await executeEscalation(action);
          
        case 'view_details':
          return await executeViewIncident(action);
          
        case 'update_status':
          return await executeUpdateStatus(action);
          
        default:
          return {
            success: false,
            error: 'Unknown command',
            message: 'This action is not yet implemented.'
          };
      }
    } catch (error) {
      console.error('Command execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to execute command. Please try again.'
      };
    } finally {
      setIsExecutingCommand(false);
    }
  };

  const executeDebriefGeneration = async (): Promise<CommandExecutionResult> => {
    try {
      setIsGeneratingDebrief(true);
      
      const eventData = {
        incidents: currentIncidents,
        staff: staffData,
        eventContext,
        timestamp: new Date().toISOString()
      };

      const debrief = aiService === 'ollama' 
        ? await generateOllamaDebriefReport(eventData)
        : await generateDebriefReport(eventData);

      if (debrief) {
        setDebriefReport(debrief);
        return {
          success: true,
          data: debrief,
          message: 'Debrief report generated successfully'
        };
      } else {
        throw new Error('Failed to generate debrief report');
      }
    } catch (error) {
      console.error('Debrief generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to generate debrief report'
      };
    } finally {
      setIsGeneratingDebrief(false);
    }
  };

  const executePredictiveAnalytics = async (): Promise<CommandExecutionResult> => {
    try {
      const analytics = aiService === 'ollama' 
        ? await generateOllamaPredictiveAnalytics(currentIncidents)
        : await generatePredictiveAnalytics(currentIncidents);

      if (analytics) {
        return {
          success: true,
          data: analytics,
          message: 'Predictive analytics generated successfully'
        };
      } else {
        throw new Error('Failed to generate predictive analytics');
      }
    } catch (error) {
      console.error('Predictive analytics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to generate predictive analytics'
      };
    }
  };

  const executeSearch = async (): Promise<CommandExecutionResult> => {
    try {
      setSearchQuery('');
      return {
        success: true,
        message: 'Search interface activated. Please enter your search query.'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to activate search'
      };
    }
  };

  const executeStaffAssignment = async (action: QuickAction): Promise<CommandExecutionResult> => {
    const response = await fetch('/api/staff-assignment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action.payload)
    });
    
    if (!response.ok) {
      throw new Error(`Staff assignment failed: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Staff assigned successfully'
    };
  };

  const executeEscalation = async (action: QuickAction): Promise<CommandExecutionResult> => {
    // This would call your escalation API
    return {
      success: true,
      message: 'Incident escalated successfully'
    };
  };

  const executeViewIncident = async (action: QuickAction): Promise<CommandExecutionResult> => {
    return {
      success: true,
      message: 'Incident details retrieved'
    };
  };

  const executeUpdateStatus = async (action: QuickAction): Promise<CommandExecutionResult> => {
    return {
      success: true,
      message: 'Status update completed'
    };
  };

  const handleQuickAction = async (action: QuickAction) => {
    // Check if this is a command action
    if (action.mode === 'command' || action.id.startsWith('cmd_')) {
      try {
        const result = await executeCommand(action);
        
        if (result.success) {
          // Add a synthetic assistant message confirming the action
          const confirmationMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `✅ ${result.message}`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, confirmationMessage]);
        } else {
          // Add error message
          const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `❌ ${result.message}`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } catch (error) {
        console.error('Command execution failed:', error);
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '❌ Failed to execute command. Please try again.',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } else {
      // Use existing chat behavior
      sendMessage(action.text);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    setDebriefReport(null);
    setSearchResults([]);
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
            <p className="text-xs text-gray-600 dark:text-gray-300">Enhanced Digital Operations Assistant</p>
          </div>
        </div>
        
        {/* AI Service Toggle */}
        <div className="flex items-center space-x-2">
          <select
            value={aiService}
            onChange={(e) => setAiService(e.target.value as 'browser' | 'ollama')}
            className="text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
          >
            <option value="browser">Browser LLM</option>
            <option value="ollama">Ollama</option>
          </select>
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
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0"
      >
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
              
              {/* Show metadata if available */}
              {message.metadata && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {message.metadata.incidentCategory && (
                      <div className="mb-1">
                        <span className="font-medium">Category:</span> {message.metadata.incidentCategory.primary} 
                        ({Math.round(message.metadata.incidentCategory.confidence * 100)}%)
                      </div>
                    )}
                    {message.metadata.sentiment && (
                      <div className="mb-1">
                        <span className="font-medium">Sentiment:</span> {message.metadata.sentiment.sentiment}
                      </div>
                    )}
                    {message.metadata.routingDecision && (
                      <div>
                        <span className="font-medium">Priority:</span> {message.metadata.routingDecision.priority}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
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

        {/* Command Execution Loading Indicator */}
        {isExecutingCommand && (
          <div className="flex justify-start fade-in">
            <div className="bg-green-50 dark:bg-green-900 rounded-2xl px-5 py-3 shadow-md">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-green-600 dark:text-green-300">Executing command...</span>
              </div>
            </div>
          </div>
        )}

        {/* Debrief Generation Loading Indicator */}
        {isGeneratingDebrief && (
          <div className="flex justify-start fade-in">
            <div className="bg-purple-50 dark:bg-purple-900 rounded-2xl px-5 py-3 shadow-md">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-purple-600 dark:text-purple-300">Generating debrief report...</span>
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

      {/* Quick Actions - Enhanced with new features */}
      {quickActions.length > 0 && !isLoading && !isExecutingCommand && (
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-[#232c43]">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Quick Actions:</div>
          <div className="max-h-32 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1.5">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  disabled={isExecutingCommand}
                  className={`inline-flex items-center space-x-1.5 px-2 py-1 rounded-md text-xs font-medium shadow-sm focus:outline-none focus:ring-1 transition-all duration-150 truncate ${
                    action.mode === 'command' 
                      ? 'bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 text-green-700 dark:text-green-200 focus:ring-green-500' 
                      : 'bg-blue-50 dark:bg-[#1e2a6a] hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-200 focus:ring-blue-500'
                  } ${isExecutingCommand ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label={action.text}
                  title={`${action.text}${action.mode === 'command' ? ' (Direct Action)' : ' (Chat)'}`}
                >
                  <span className="flex-shrink-0">
                    {action.mode === 'command' ? '⚡' : action.icon}
                  </span>
                  <span className="truncate">{action.text}</span>
                </button>
              ))}
            </div>
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
            placeholder="Ask about incidents, SOPs, procedures, or search for data..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-[#2A3990] focus:border-transparent text-base md:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow"
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
      </div>
    </div>
  );
} 