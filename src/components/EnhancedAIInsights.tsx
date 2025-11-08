import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import DOMPurify from 'dompurify';
import { 
  ExclamationTriangleIcon, 
  ChartBarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  FireIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';

const ChartsSection = dynamic(
  () => import('@/components/analytics/EnhancedAIInsightsVisuals'),
  {
    ssr: false,
    loading: () => (
      <div className="mt-4 flex h-48 items-center justify-center rounded-lg bg-white/60 text-sm text-gray-500 dark:bg-slate-800/60 dark:text-gray-300">
        Loading analytical visuals…
      </div>
    ),
  }
);

interface AIInsight {
  id: string;
  content: string;
  type: 'analysis' | 'prediction' | 'recommendation' | 'alert' | 'forecast' | 'pattern';
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  confidence?: number;
  data?: any; // Additional data for visualizations
  metrics?: {
    trend?: number;
    riskScore?: number;
    crowdDensity?: number;
    incidentProbability?: number;
  };
}

interface EnhancedAIInsightsProps {
  insights: AIInsight[];
  cycleInterval?: number;
  showAdvancedCharts?: boolean;
  enablePredictiveMode?: boolean;
}

export interface PredictiveForecast {
  timeHorizon: string;
  confidence: number;
  predictions: {
    incidentCount: number;
    crowdDensity: number;
    riskLevel: number;
    responseTime: number;
  };
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable';
    magnitude: number;
    factors: string[];
  };
}

export interface PatternAnalysis {
  patternType: 'temporal' | 'spatial' | 'behavioral' | 'correlation';
  confidence: number;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  recommendations: string[];
}

export default function EnhancedAIInsights({ 
  insights, 
  cycleInterval = 15000,
  showAdvancedCharts = true,
  enablePredictiveMode = true
}: EnhancedAIInsightsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'insights' | 'charts' | 'predictions' | 'patterns'>('insights');
  const [predictiveData, setPredictiveData] = useState<PredictiveForecast | null>(null);
  const [patternData, setPatternData] = useState<PatternAnalysis[]>([]);
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
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Generate predictive forecast data
  useEffect(() => {
    if (enablePredictiveMode && insights.length > 0) {
      generatePredictiveForecast();
      analyzePatterns();
    }
  }, [insights.length, enablePredictiveMode, generatePredictiveForecast, analyzePatterns]);

  const generatePredictiveForecast = useCallback(() => {
    const currentInsight = insights[currentIndex];
    if (!currentInsight) return;

    // Simulate predictive forecasting based on current data
    const baseIncidentCount = currentInsight.metrics?.incidentProbability || 0.3;
    const baseCrowdDensity = currentInsight.metrics?.crowdDensity || 0.6;
    const baseRiskScore = currentInsight.metrics?.riskScore || 0.4;

    const forecast: PredictiveForecast = {
      timeHorizon: 'Next 2 Hours',
      confidence: currentInsight.confidence || 85,
      predictions: {
        incidentCount: Math.round(baseIncidentCount * 100 * (1 + Math.random() * 0.5)),
        crowdDensity: Math.round(baseCrowdDensity * 100 * (1 + Math.random() * 0.3)),
        riskLevel: Math.round(baseRiskScore * 100 * (1 + Math.random() * 0.4)),
        responseTime: Math.round(2.5 + Math.random() * 3) // 2.5-5.5 minutes
      },
      trends: {
        direction: Math.random() > 0.5 ? 'increasing' : 'decreasing',
        magnitude: Math.round(10 + Math.random() * 20),
        factors: [
          'Attendance patterns',
          'Weather conditions',
          'Historical incident data',
          'Staff deployment levels'
        ]
      }
    };

    setPredictiveData(forecast);
  }, [currentIndex, insights]);

  const analyzePatterns = useCallback(() => {
    const patterns: PatternAnalysis[] = [
      {
        patternType: 'temporal',
        confidence: 87,
        description: 'Incident frequency peaks between 22:00-23:00, likely due to alcohol consumption and crowd fatigue',
        impact: 'negative',
        recommendations: [
          'Increase security presence during peak hours',
          'Deploy additional medical staff',
          'Implement stricter alcohol monitoring'
        ]
      },
      {
        patternType: 'spatial',
        confidence: 92,
        description: 'High incident concentration in main bar area and dance floor, indicating crowd density issues',
        impact: 'negative',
        recommendations: [
          'Implement crowd flow management',
          'Add additional exits',
          'Deploy crowd control barriers'
        ]
      },
      {
        patternType: 'correlation',
        confidence: 78,
        description: 'Strong correlation between weather conditions and medical incidents, especially heat-related',
        impact: 'neutral',
        recommendations: [
          'Monitor weather forecasts',
          'Adjust medical staff deployment',
          'Ensure adequate hydration stations'
        ]
      }
    ];

    setPatternData(patterns);
  }, [insights]);

  const currentInsight = insights[currentIndex];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'analysis':
        return <ChartBarIcon className="w-6 h-6" />;
      case 'prediction':
        return <ChartBarIcon className="w-6 h-6" />;
      case 'recommendation':
        return <FireIcon className="w-6 h-6" />;
      case 'alert':
        return <ExclamationTriangleIcon className="w-6 h-6" />;
      case 'forecast':
        return <ClockIcon className="w-6 h-6" />;
      case 'pattern':
        return <ShieldExclamationIcon className="w-6 h-6" />;
      default:
        return <ChartBarIcon className="w-6 h-6" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100 border-red-300 dark:text-red-400 dark:bg-red-900/20 dark:border-red-700';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-300 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-700';
      case 'low':
        return 'text-green-600 bg-green-100 border-green-300 dark:text-green-400 dark:bg-green-900/20 dark:border-green-700';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-300 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-700';
    }
  };

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

  const markdownComponents = {
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
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4" {...props}>
        {children}
      </blockquote>
    ),
    p: ({ children, ...props }: any) => (
      <p className="mb-3 text-gray-700 leading-relaxed" {...props}>
        {children}
      </p>
    ),
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
    } catch (error) {
      console.error('Failed to copy insight:', error);
    }
  };

  if (insights.length === 0) {
    return (
      <div className="card-depth p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <ChartBarIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No AI Insights Available</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">AI insights will appear here as they become available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-depth p-6">
      {/* Header with View Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enhanced AI Insights</h3>
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { key: 'insights', label: 'Insights', icon: ChartBarIcon },
              { key: 'charts', label: 'Charts', icon: ChartBarIcon },
              { key: 'predictions', label: 'Predictions', icon: ClockIcon },
              { key: 'patterns', label: 'Patterns', icon: ShieldExclamationIcon }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === key
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 inline mr-1" />
                {label}
              </button>
            ))}
          </div>
          
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

      <div key={viewMode}>
        {/* Insights View */}
        {viewMode === 'insights' && (
      <div className="relative">
        <div
          className={`transition-all duration-500 ease-in-out ${
            isVisible ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-4'
          }`}
        >
          <div className="flex items-start space-x-3 mb-4">
                  <div className="text-2xl text-blue-600 dark:text-blue-400">
                    {getTypeIcon(currentInsight.type)}
                  </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(currentInsight.priority)}`}>
                  {currentInsight.priority} Priority
                </span>
                {currentInsight.confidence && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                    Confidence: {currentInsight.confidence}%
                  </span>
                )}
              </div>
                    <div className="prose prose-sm max-w-none markdown-content dark:prose-invert">
                <ReactMarkdown
                  components={markdownComponents}
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                >
                  {sanitizeContent(currentInsight.content)}
                </ReactMarkdown>
              </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {new Date(currentInsight.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
            </div>
        )}

        <ChartsSection
          viewMode={viewMode}
          showAdvancedCharts={showAdvancedCharts}
          predictiveData={predictiveData}
          patternData={patternData}
        />
      </div>

      {/* Navigation Controls */}
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
  );
}
