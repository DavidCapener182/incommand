import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import DOMPurify from 'dompurify';

interface AIInsight {
  id: string;
  content: string;
  type: 'analysis' | 'prediction' | 'recommendation' | 'alert';
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  confidence?: number;
}

interface EnhancedAIInsightsProps {
  insights: AIInsight[];
  cycleInterval?: number;
}

export default function EnhancedAIInsights({ insights, cycleInterval = 15000 }: EnhancedAIInsightsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (insights.length === 0) return;

    const startCycling = () => {
      intervalRef.current = setInterval(() => {
        if (!isPaused) {
          setCurrentIndex((prev) => (prev + 1) % insights.length);
        }
      }, cycleInterval);
    };

    startCycling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [insights.length, cycleInterval, isPaused]);

  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const currentInsight = insights[currentIndex];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'analysis':
        return '📊';
      case 'prediction':
        return '🔮';
      case 'recommendation':
        return '💡';
      case 'alert':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100 border-red-300';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'low':
        return 'text-green-600 bg-green-100 border-green-300';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  // Sanitize HTML content for security
  const sanitizeContent = (content: string): string => {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote', 'a', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
      ALLOW_DATA_ATTR: false
    });
  };

  // Custom components for ReactMarkdown
  const markdownComponents = {
    // Code block with syntax highlighting
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';
      
      if (inline) {
        return (
          <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800" {...props}>
            {children}
          </code>
        );
      }
      
      return (
        <div className="my-4">
          <SyntaxHighlighter
            style={tomorrow}
            language={language}
            PreTag="div"
            className="rounded-lg"
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              lineHeight: '1.5'
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    },
    
    // Headers with proper styling
    h1: ({ children, ...props }: any) => (
      <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-xl font-semibold text-gray-800 mb-3 mt-5" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-lg font-medium text-gray-700 mb-2 mt-4" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 className="text-base font-medium text-gray-600 mb-2 mt-3" {...props}>
        {children}
      </h4>
    ),
    
    // Lists with proper styling
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc list-inside space-y-1 mb-4 text-gray-700" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal list-inside space-y-1 mb-4 text-gray-700" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="ml-2" {...props}>
        {children}
      </li>
    ),
    
    // Links with security attributes
    a: ({ href, children, ...props }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline transition-colors"
        {...props}
      >
        {children}
      </a>
    ),
    
    // Blockquotes
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4" {...props}>
        {children}
      </blockquote>
    ),
    
    // Paragraphs
    p: ({ children, ...props }: any) => (
      <p className="mb-3 text-gray-700 leading-relaxed" {...props}>
        {children}
      </p>
    ),
    
    // Tables
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-gray-300 rounded-lg" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead className="bg-gray-50" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }: any) => (
      <tbody className="divide-y divide-gray-200" {...props}>
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }: any) => (
      <tr className="hover:bg-gray-50" {...props}>
        {children}
      </tr>
    ),
    th: ({ children, ...props }: any) => (
      <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="px-4 py-2 text-gray-600" {...props}>
        {children}
      </td>
    ),
    
    // Strong and emphasis
    strong: ({ children, ...props }: any) => (
      <strong className="font-semibold text-gray-900" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className="italic text-gray-800" {...props}>
        {children}
      </em>
    ),
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + insights.length) % insights.length);
    setIsVisible(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % insights.length);
    setIsVisible(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentInsight.content);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy insight:', error);
    }
  };

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No AI Insights Available</h4>
          <p className="text-sm text-gray-500">AI insights will appear here as they become available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded-lg transition-colors ${
              isPaused ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
            }`}
            title={isPaused ? 'Resume cycling' : 'Pause cycling'}
          >
            {isPaused ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="Copy insight"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          className={`transition-all duration-500 ease-in-out ${
            isVisible ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-4'
          }`}
        >
          <div className="flex items-start space-x-3 mb-4">
            <div className="text-2xl">{getTypeIcon(currentInsight.type)}</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(currentInsight.priority)}`}>
                  {currentInsight.priority} Priority
                </span>
                {currentInsight.confidence && (
                  <span className="text-xs text-gray-500">
                    Confidence: {currentInsight.confidence}%
                  </span>
                )}
              </div>
              <div className="prose prose-sm max-w-none markdown-content">
                <ReactMarkdown
                  components={markdownComponents}
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                >
                  {sanitizeContent(currentInsight.content)}
                </ReactMarkdown>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {new Date(currentInsight.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevious}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              disabled={insights.length <= 1}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              disabled={insights.length <= 1}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-1">
            {insights.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsVisible(false);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
