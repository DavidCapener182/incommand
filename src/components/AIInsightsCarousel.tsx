import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface AISummaryData {
  summary: string;
  analysis: {
    totalIncidents: number;
    openIncidents: number;
    highPriorityIncidents: number;
    urgentAlerts: string[];
    recommendations: string[];
    attendanceInsights: string;
  };
  lastUpdated: string;
  details: {
    currentEventStatus: string;
    securityConcerns: string;
    trending: string;
    recommendations: string;
  };
}

interface AIInsightsCarouselProps {
  className?: string;
}

export default function AIInsightsCarousel({ className = "" }: AIInsightsCarouselProps) {
  const [aiSummary, setAISummary] = useState<AISummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  // Fetch AI summary data
  const fetchAISummary = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/ai-summary');
      if (response.ok) {
        const data = await response.json();
        setAISummary(data);
      }
    } catch (error) {
      console.error('Error fetching AI summary:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-rotate cards every 30 seconds
  useEffect(() => {
    if (!autoRotate || !aiSummary) return;

    const interval = setInterval(() => {
      setCurrentCardIndex(prev => (prev + 1) % getCards().length);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRotate, aiSummary]);

  // Fetch data on mount
  useEffect(() => {
    fetchAISummary();
  }, []);

  // Manual navigation
  const goToPrevious = () => {
    setAutoRotate(false);
    setCurrentCardIndex(prev => prev === 0 ? getCards().length - 1 : prev - 1);
    // Re-enable auto-rotate after 2 minutes
    setTimeout(() => setAutoRotate(true), 120000);
  };

  const goToNext = () => {
    setAutoRotate(false);
    setCurrentCardIndex(prev => (prev + 1) % getCards().length);
    // Re-enable auto-rotate after 2 minutes
    setTimeout(() => setAutoRotate(true), 120000);
  };

  // Generate cards from API details fields only
  const getCards = () => {
    if (!aiSummary || !aiSummary.details) return [];
    const { currentEventStatus, securityConcerns, trending, recommendations } = aiSummary.details;
    const cards = [];
    if (currentEventStatus) {
      cards.push({
        title: 'Current Event Status',
        icon: '📊',
        content: <div className="text-sm text-gray-700 leading-relaxed">{currentEventStatus}</div>
      });
    }
    if (securityConcerns) {
      cards.push({
        title: 'Security & Operational Concerns',
        icon: '🛡️',
        content: <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{securityConcerns}</div>
      });
    }
    if (trending) {
      cards.push({
        title: 'Trending Locations or Incident Types',
        icon: '📈',
        content: <div className="text-sm text-gray-700 leading-relaxed">{trending}</div>
      });
    }
    if (recommendations) {
      cards.push({
        title: 'Actionable Recommendations',
        icon: '✅',
        content: <div className="text-sm text-gray-700 leading-relaxed">{recommendations}</div>
      });
    }
    return cards;
  };

  const cards = getCards();

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!aiSummary || cards.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">🤖</div>
          <div className="text-sm">AI Insights loading...</div>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{currentCard.icon}</span>
          <h3 className="text-sm font-medium text-gray-900">{currentCard.title}</h3>
        </div>
        <div className="flex items-center space-x-1">
          {/* Dots indicator */}
          <div className="flex space-x-1 mr-2">
            {cards.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentCardIndex(index);
                  setAutoRotate(false);
                  setTimeout(() => setAutoRotate(true), 120000);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentCardIndex ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          {/* Navigation arrows */}
          <button
            onClick={goToPrevious}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Previous insight"
          >
            <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={goToNext}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Next insight"
          >
            <ChevronRightIcon className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Card content */}
      <div className="p-4 min-h-[100px] flex items-center">
        <div className="w-full">
          {currentCard.content}
        </div>
      </div>

      {/* Footer with timestamp */}
      <div className="px-3 py-2 bg-gray-50 rounded-b-lg border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>AI Analysis</span>
          <span>Updated {new Date(aiSummary.lastUpdated).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
} 