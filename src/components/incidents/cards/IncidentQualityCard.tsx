'use client';

import React, { useState, useEffect } from 'react';
import { SparklesIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface IncidentFormData {
  callsign_from: string;
  callsign_to: string;
  occurrence?: string;
  incident_type: string;
  action_taken?: string;
  priority: string;
  facts_observed?: string;
  actions_taken?: string;
  outcome?: string;
  headline?: string;
  source?: string;
}

interface IncidentQualityCardProps {
  formData: IncidentFormData;
  onApplySuggestion?: (field: string, value: string) => void;
}

interface AnalysisResult {
  score: number;
  suggestions: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
}

const IncidentQualityCard: React.FC<IncidentQualityCardProps> = ({ 
  formData, 
  onApplySuggestion 
}) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Debounced analysis to avoid API spam
  useEffect(() => {
    const hasContent = 
      (formData.occurrence?.length > 10 || formData.facts_observed?.length > 10) &&
      formData.incident_type;

    if (!hasContent) {
      setAnalysis(null);
      return;
    }

    const timer = setTimeout(() => {
      if (!analyzing) {
        analyzeIncidentQuality();
      }
    }, 2000); // 2s debounce

    return () => clearTimeout(timer);
  }, [
    formData.occurrence, 
    formData.facts_observed, 
    formData.incident_type, 
    formData.priority,
    formData.actions_taken,
    formData.headline
  ]);

  const analyzeIncidentQuality = async () => {
    setAnalyzing(true);

    // Combine relevant text for context
    const fullText = `Type: ${formData.incident_type}. Priority: ${formData.priority}. 
    Headline: ${formData.headline || 'N/A'}. 
    Facts: ${formData.facts_observed || formData.occurrence || 'N/A'}. 
    Actions: ${formData.actions_taken || formData.action_taken || 'N/A'}.`;

    try {
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a senior event safety officer auditing incident logs based on JESIP standards. Return ONLY valid JSON with this exact structure: {"score": number (0-100), "riskLevel": "Low"|"Medium"|"High", "suggestions": ["short actionable tip 1", "short actionable tip 2"]}. Check for: missing 5Ws (Who,What,Where,When,Why), mismatch between Type/Priority/Content, incomplete information.'
            },
            {
              role: 'user',
              content: `Audit this incident log: "${fullText}". Return JSON only with score, riskLevel, and suggestions array.`
            }
          ],
          model: 'gpt-4o-mini',
          temperature: 0.3,
          max_tokens: 300
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze incident quality');
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '{}';
      
      // Try to parse JSON from the response
      let result: AnalysisResult;
      try {
        // OpenAI sometimes returns JSON wrapped in markdown code blocks
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : text;
        result = JSON.parse(jsonText);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        result = {
          score: 50,
          riskLevel: 'Medium' as const,
          suggestions: ['Unable to parse analysis. Please ensure all fields are filled correctly.']
        };
      }

      // Validate result structure
      if (
        typeof result.score === 'number' &&
        ['Low', 'Medium', 'High'].includes(result.riskLevel) &&
        Array.isArray(result.suggestions)
      ) {
        setAnalysis(result);
      }
    } catch (e) {
      console.error('Incident quality audit failed:', e);
      // Don't show error to user, just silently fail
    } finally {
      setAnalyzing(false);
    }
  };

  if (!analysis && !analyzing) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-sm p-5 relative overflow-hidden transition-all duration-500 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2 text-sm">
          <SparklesIcon className="w-4 h-4 text-indigo-500" /> Log Quality Score
        </h3>
        {analyzing ? (
          <span className="text-xs text-indigo-400 animate-pulse">Auditing...</span>
        ) : (
          <span 
            className={`text-lg font-black ${
              (analysis?.score || 0) > 80 
                ? 'text-green-600' 
                : (analysis?.score || 0) > 50 
                  ? 'text-amber-500' 
                  : 'text-red-500'
            }`}
          >
            {analysis?.score}/100
          </span>
        )}
      </div>

      {analysis && (
        <div className="space-y-3">
          {/* Risk Badge */}
          {analysis.riskLevel === 'High' && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded flex items-center gap-1 font-bold">
              <ExclamationTriangleIcon className="w-3 h-3" /> High Risk Detected
            </div>
          )}

          {/* Suggestions */}
          <div className="space-y-2">
            {analysis.suggestions.slice(0, 2).map((suggestion, i) => (
              <div 
                key={i} 
                className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded border border-indigo-50 dark:border-slate-700"
              >
                <ShieldCheckIcon className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentQualityCard;

