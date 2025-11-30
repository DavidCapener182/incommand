'use client';

import React, { useState, useEffect } from 'react';
import { SparklesIcon, ShieldCheckIcon, ExclamationTriangleIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

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
  onUpdateFactsObserved?: (updatedText: string) => void;
}

interface AnalysisResult {
  score: number;
  suggestions: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
}

const IncidentQualityCard: React.FC<IncidentQualityCardProps> = ({ 
  formData, 
  onApplySuggestion,
  onUpdateFactsObserved,
  guidedActionsApplied = true // Default to true to allow audit if prop not provided
}) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [additionalInfo, setAdditionalInfo] = useState<{ [key: number]: string }>({});
  const [lastAnalysisHash, setLastAnalysisHash] = useState<string>('');
  const [dismissedHashes, setDismissedHashes] = useState<Set<string>>(new Set());
  const [addressedKeywords, setAddressedKeywords] = useState<Set<string>>(new Set());
  const [lastFactsLength, setLastFactsLength] = useState<number>(0);

  // Debounced analysis to avoid API spam
  // Don't start audit until guided actions are applied (if applicable)
  useEffect(() => {
    // If guided actions haven't been applied yet, don't run the audit
    if (!guidedActionsApplied) {
      return;
    }

    // Check if there's content in any of the key fields
    const hasContent = 
      (formData.occurrence?.length > 10 || 
       formData.facts_observed?.length > 10 || 
       formData.actions_taken?.length > 10 ||
       formData.outcome?.length > 10) &&
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
    formData.outcome, // Add outcome to dependencies
    formData.headline,
    guidedActionsApplied // Add to dependencies
  ]);

  // Detect when user adds information that addresses suggestions (even if not through modal)
  // Check all three fields: facts_observed, actions_taken, and outcome
  useEffect(() => {
    const facts = formData.facts_observed?.toLowerCase() || '';
    const actions = formData.actions_taken?.toLowerCase() || '';
    const outcome = formData.outcome?.toLowerCase() || '';
    const allText = `${facts} ${actions} ${outcome}`;
    const newKeywords = new Set<string>();
    
    // Check if any of the three fields contain information that addresses common suggestion topics
    // Location detection - comprehensive venue location patterns
    // Check for common location words/phrases across all fields
    const locationPatterns = [
      'location', 'venue', 'stand', 'gate', 'bar', 'car park', 'carpark', 'kop', 
      'main stage', 'main stand', 'north stand', 'south stand', 'east stand', 'west stand',
      'north', 'south', 'east', 'west', 'entrance', 'exit', 'toilet', 'concourse',
      'stair', 'stairs', 'level', 'block', 'section', 'area', 'zone', 'pitch',
      'field', 'ground', 'stadium', 'anfield', 'premises', 'site', 'place',
      'at the', 'in the', 'on the' // Common location prepositions
    ];
    
    // Check if any location pattern appears in any of the three fields
    const hasLocation = locationPatterns.some(pattern => allText.includes(pattern));
    
    // Also check for location-like phrases (e.g., "in the kop", "at the bar")
    const locationPhrases = [
      /(in|at|on|from|to)\s+(the\s+)?(kop|stand|gate|bar|area|zone|section|block|concourse|stairs|entrance|exit)/i,
      /(kop|stand|gate|bar|area|zone|section|block|concourse|stairs|entrance|exit)\s+(area|zone|section)?/i
    ];
    
    const hasLocationPhrase = locationPhrases.some(regex => regex.test(allText));
    
    if (hasLocation || hasLocationPhrase) {
      newKeywords.add('location');
    }
    
    // Reason/Why detection - check all fields
    if (allText.includes('reason') || allText.includes('because') || allText.includes('due to') || 
        allText.includes('dispute') || allText.includes('argument') || allText.includes('conflict') ||
        (allText.includes('for') && (allText.includes('punch') || allText.includes('aggression') || 
         allText.includes('ejection') || allText.includes('assault') || allText.includes('dispute') ||
         allText.includes('behavior') || allText.includes('behaviour')))) {
      newKeywords.add('why');
      newKeywords.add('reason');
    }
    
    // Who detection - recognize gender, role, and descriptions across all fields
    if (allText.includes('who') || allText.includes('person') || allText.includes('individual') || 
        allText.includes('male') || allText.includes('female') || allText.includes('steward') || 
        allText.includes('fan') || allText.includes('patron') || allText.includes('customer') ||
        allText.includes('visitor') || allText.includes('attendee') || allText.includes('person') ||
        allText.includes('subject') || allText.includes('patron')) {
      newKeywords.add('who');
    }
    
    // Ejection-specific reason detection - check all fields
    if (allText.includes('ejection') && (allText.includes('reason') || allText.includes('for') || 
        allText.includes('because') || allText.includes('due to') || allText.includes('dispute') ||
        allText.includes('removed') || allText.includes('removal'))) {
      newKeywords.add('ejection-reason');
      newKeywords.add('why');
      newKeywords.add('reason');
    }
    
    // Specific patterns that indicate reason is present - check all fields
    if ((allText.includes('dispute') || allText.includes('argument')) && 
        (allText.includes('steward') || allText.includes('staff') || allText.includes('security'))) {
      newKeywords.add('why');
      newKeywords.add('reason');
      newKeywords.add('ejection-reason');
    }
    
    // Check if actions are already described
    if (actions.length > 20) {
      newKeywords.add('actions');
    }
    
    // Check if outcome is already described
    if (outcome.length > 10) {
      newKeywords.add('outcome');
    }
    
    // If we detect new keywords in the facts, mark them as addressed
    if (newKeywords.size > 0) {
      setAddressedKeywords(prev => {
        const combined = new Set([...prev, ...newKeywords]);
        return combined;
      });
    }
    
    const factsLength = formData.facts_observed?.length || 0;
    
    // If facts changed significantly (more than 20% difference), clear addressed keywords
    // This allows new suggestions if user significantly rewrites content
    if (lastFactsLength > 0 && Math.abs(factsLength - lastFactsLength) > Math.max(factsLength, lastFactsLength) * 0.2) {
      // Don't clear if we just detected new keywords - user is improving the log
      if (newKeywords.size === 0) {
        setAddressedKeywords(new Set());
        setDismissedHashes(new Set());
      }
    }
    
    setLastFactsLength(factsLength);
  }, [formData.facts_observed, formData.actions_taken, formData.outcome, lastFactsLength]);

  const analyzeIncidentQuality = async () => {
    setAnalyzing(true);

    // Combine relevant text for context - include all three key fields
    const fullText = `Type: ${formData.incident_type}. Priority: ${formData.priority}. 
    Headline: ${formData.headline || 'N/A'}. 
    Facts Observed: ${formData.facts_observed || formData.occurrence || 'N/A'}. 
    Actions Taken: ${formData.actions_taken || formData.action_taken || 'N/A'}. 
    Current Outcome: ${formData.outcome || 'N/A'}.`;

    try {
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a senior event safety officer auditing incident logs based on JESIP standards. Return ONLY valid JSON with this exact structure: {"score": number (0-100), "riskLevel": "Low"|"Medium"|"High", "suggestions": ["short actionable tip 1", "short actionable tip 2"]}. CRITICAL RULES: 1. NEVER suggest adding time or date information - these are automatically logged by the system. 2. NEVER suggest "include time references" or "add date" or anything related to when something happened. 3. Before suggesting improvements, carefully check ALL THREE fields: "Facts Observed", "Actions Taken", and "Current Outcome". Information may be in ANY of these fields. DO NOT suggest adding information that is already clearly stated in ANY of these fields. Examples: - If "Facts Observed" mentions "dispute with steward" or "due to [reason]", the reason is already present - If "Facts Observed" mentions "male individual" or "female person" or any gender/description, the "who" is already present - If "Facts Observed" mentions ANY location reference (e.g., "main stand", "kop", "car park", "north gate", "bar", "concourse", "stairs", "entrance", "exit", "section", "block", "area", "zone", "pitch", "field", "ground", "stadium", "kop", "anfield road", or ANY venue-specific location name), the location is already present - If "Actions Taken" describes what was done, do not suggest adding actions - If "Current Outcome" describes the status, do not suggest adding outcome information. 4. Only suggest improvements if information is genuinely missing or unclear across ALL three fields. Check for: missing 5Ws (Who,What,Where,Why - NEVER check for When as time/date are automatically logged), mismatch between Type/Priority/Content, incomplete information. ABSOLUTELY DO NOT suggest adding time or date information under any circumstances.'
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
        // Filter out time/date related suggestions - comprehensive filtering
        result.suggestions = result.suggestions.filter(s => {
          const lower = s.toLowerCase();
          return !lower.includes('time') && 
                 !lower.includes('date') &&
                 !lower.includes('when') &&
                 !lower.includes('timestamp') &&
                 !lower.includes('time reference') &&
                 !lower.includes('specific time') &&
                 !lower.includes('time details') &&
                 !lower.includes('add time') &&
                 !lower.includes('include time') &&
                 !lower.includes('record time') &&
                 !lower.includes('time information');
        });
        
        // Also filter out location suggestions if location is already present in any of the three fields
        const factsLower = (formData.facts_observed || formData.occurrence || '').toLowerCase();
        const actionsLower = (formData.actions_taken || formData.action_taken || '').toLowerCase();
        const outcomeLower = (formData.outcome || '').toLowerCase();
        const allText = `${factsLower} ${actionsLower} ${outcomeLower}`;
        
        const locationKeywords = ['kop', 'stand', 'gate', 'bar', 'area', 'zone', 'section', 'block', 
                                  'concourse', 'stairs', 'entrance', 'exit', 'premises', 'venue', 
                                  'location', 'site', 'place', 'stadium', 'ground', 'field', 'pitch'];
        const hasLocation = locationKeywords.some(keyword => allText.includes(keyword));
        
        if (hasLocation) {
          result.suggestions = result.suggestions.filter(s => {
            const lower = s.toLowerCase();
            return !lower.includes('location') && 
                   !lower.includes('where') &&
                   !lower.includes('location details') &&
                   !lower.includes('include location') &&
                   !lower.includes('clarify location') &&
                   !lower.includes('specify location');
          });
        }
        
        // Filter out suggestions about actions if actions are already described
        if (actionsLower.length > 20) {
          result.suggestions = result.suggestions.filter(s => {
            const lower = s.toLowerCase();
            return !lower.includes('actions taken') && 
                   !lower.includes('what action') &&
                   !lower.includes('describe action') &&
                   !lower.includes('include action');
          });
        }
        
        // Filter out suggestions about outcome if outcome is already described
        if (outcomeLower.length > 10) {
          result.suggestions = result.suggestions.filter(s => {
            const lower = s.toLowerCase();
            return !lower.includes('outcome') && 
                   !lower.includes('current status') &&
                   !lower.includes('final status') &&
                   !lower.includes('result');
          });
        }
        
        // Extract keywords from suggestions to check if similar ones were already addressed
        const extractKeywords = (suggestion: string): string[] => {
          const lower = suggestion.toLowerCase();
          const keywords: string[] = [];
          
          // Location keywords - check if suggestion is asking for location information
          if (lower.includes('location') || lower.includes('where') || lower.includes('venue') || 
              lower.includes('place') || lower.includes('site') || 
              (lower.includes('location') && (lower.includes('details') || lower.includes('include') || lower.includes('specify'))) ||
              (lower.includes('where') && (lower.includes('occurred') || lower.includes('happened') || lower.includes('took place')))) {
            keywords.push('location');
          }
          
          // Who keywords - check if suggestion is asking for "who" information
          if (lower.includes('who') || 
              (lower.includes('individual') && (lower.includes('details') || lower.includes('include') || lower.includes('about') || lower.includes('ejected'))) ||
              (lower.includes('person') && (lower.includes('details') || lower.includes('include') || lower.includes('about') || lower.includes('ejected'))) ||
              lower.includes('people') || lower.includes('persons involved')) {
            keywords.push('who');
          }
          
          // Why/Reason keywords - more comprehensive
          // Check if suggestion is asking for reason/why information
          if (lower.includes('why') || lower.includes('cause') || lower.includes('reason') || 
              lower.includes('specify the reason') || lower.includes('clarify the reason') ||
              lower.includes('ejection reason') || lower.includes('reason for') ||
              (lower.includes('more clearly') && (lower.includes('reason') || lower.includes('why'))) ||
              (lower.includes('clarify') && lower.includes('reason'))) {
            keywords.push('why');
            keywords.push('reason'); // Add both variations
          }
          
          // What keywords
          if (lower.includes('what') || lower.includes('details') || lower.includes('specific') || lower.includes('describe')) {
            keywords.push('what');
          }
          
          // 5Ws check
          if (lower.includes('5ws') || lower.includes('5 ws') || lower.includes('all 5ws')) {
            keywords.push('5ws');
          }
          
          // Ejection-specific
          if (lower.includes('ejection') && (lower.includes('reason') || lower.includes('why') || lower.includes('clarify'))) {
            keywords.push('ejection-reason');
            keywords.push('why');
            keywords.push('reason');
          }
          
          // Fight-specific
          if (lower.includes('fight')) {
            keywords.push('fight');
          }
          
          // Car park specific
          if (lower.includes('car park') || lower.includes('carpark')) {
            keywords.push('car park');
          }
          
          return keywords;
        };
        
        // Check if any suggestions address topics that were already addressed
        const hasAddressedSimilar = result.suggestions.some(suggestion => {
          const keywords = extractKeywords(suggestion);
          // Check if ANY keyword matches an addressed keyword
          return keywords.some(keyword => addressedKeywords.has(keyword));
        });
        
        // Create a hash of the analysis suggestions (not including score, as score can change with same suggestions)
        const suggestionsHash = result.suggestions.sort().join('|');
        const analysisHash = `${result.score}-${suggestionsHash}`;
        const isNewAnalysis = analysisHash !== lastAnalysisHash;
        
        setAnalysis(result);
        setLastAnalysisHash(analysisHash);
        
        // Show modal only if:
        // 1. Score is less than 85
        // 2. There are suggestions
        // 3. It's a new analysis (different suggestions)
        // 4. This specific set of suggestions hasn't been dismissed yet
        // 5. Similar topics haven't been addressed already
        const hasBeenDismissed = dismissedHashes.has(suggestionsHash);
        const shouldShowModal = result.score < 85 && 
                               result.suggestions.length > 0 && 
                               isNewAnalysis &&
                               !hasBeenDismissed &&
                               !hasAddressedSimilar;
        
        if (shouldShowModal) {
          setShowModal(true);
        }
      }
    } catch (e) {
      console.error('Incident quality audit failed:', e);
      // Don't show error to user, just silently fail
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplySuggestions = () => {
    if (!analysis || !onUpdateFactsObserved) return;

    const currentFacts = formData.facts_observed || '';
    const additions: string[] = [];
    const newKeywords = new Set<string>();

    analysis.suggestions.forEach((suggestion, index) => {
      if (selectedSuggestions.has(index)) {
        const info = additionalInfo[index]?.trim();
        if (info) {
          additions.push(info);
        } else {
          // If no custom info, use the suggestion as a prompt
          additions.push(suggestion);
        }
        
        // Extract keywords from this suggestion to mark as addressed
        const lower = suggestion.toLowerCase();
        
        // Location keywords - comprehensive detection
        if (lower.includes('location') || lower.includes('where') || lower.includes('venue') || 
            lower.includes('place') || lower.includes('site') || lower.includes('stand') ||
            lower.includes('gate') || lower.includes('bar') || lower.includes('area') ||
            lower.includes('zone') || lower.includes('section') || lower.includes('block')) {
          newKeywords.add('location');
        }
        
        // Who keywords
        if (lower.includes('who') || lower.includes('person') || lower.includes('individual') || lower.includes('people') || lower.includes('persons involved')) {
          newKeywords.add('who');
        }
        
        // Why/Reason keywords - more comprehensive
        if (lower.includes('why') || lower.includes('cause') || lower.includes('reason') || 
            lower.includes('specify the reason') || lower.includes('clarify the reason') ||
            lower.includes('ejection reason') || 
            (lower.includes('more clearly') && (lower.includes('reason') || lower.includes('why')))) {
          newKeywords.add('why');
          newKeywords.add('reason'); // Add both variations
        }
        
        // What keywords
        if (lower.includes('what') || lower.includes('details') || lower.includes('specific') || lower.includes('describe')) {
          newKeywords.add('what');
        }
        
        // 5Ws check
        if (lower.includes('5ws') || lower.includes('5 ws') || lower.includes('all 5ws')) {
          newKeywords.add('5ws');
        }
        
        // Ejection-specific
        if (lower.includes('ejection') && (lower.includes('reason') || lower.includes('why') || lower.includes('clarify'))) {
          newKeywords.add('ejection-reason');
          newKeywords.add('why');
          newKeywords.add('reason');
        }
        
        // Fight-specific
        if (lower.includes('fight')) {
          newKeywords.add('fight');
        }
        
        // Car park specific
        if (lower.includes('car park') || lower.includes('carpark')) {
          newKeywords.add('car park');
        }
      }
    });

    if (additions.length > 0) {
      const updatedFacts = currentFacts 
        ? `${currentFacts}\n\n${additions.join('\n')}`
        : additions.join('\n');
      
      onUpdateFactsObserved(updatedFacts);
      
      // Mark keywords as addressed
      setAddressedKeywords(prev => new Set([...prev, ...newKeywords]));
    }

    // Mark this set of suggestions as dismissed so it won't show again (use sorted suggestions for consistency)
    const suggestionsHash = analysis.suggestions.sort().join('|');
    setDismissedHashes(prev => new Set([...prev, suggestionsHash]));
    
    setShowModal(false);
    setSelectedSuggestions(new Set());
    setAdditionalInfo({});
    
    // Force re-analysis after a short delay to update the score
    setTimeout(() => {
      if (!analyzing) {
        analyzeIncidentQuality();
      }
    }, 500);
  };

  const handleDismissModal = () => {
    if (analysis) {
      // Mark this set of suggestions as dismissed (use sorted suggestions for consistency)
      const suggestionsHash = analysis.suggestions.sort().join('|');
      setDismissedHashes(prev => new Set([...prev, suggestionsHash]));
    }
    setShowModal(false);
  };

  if (!analysis && !analyzing) return null;

  return (
    <>
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

            {/* Suggestions Preview */}
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

      {/* Quality Improvement Modal */}
      <AnimatePresence>
        {showModal && analysis && analysis.score < 85 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Improve Log Quality
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Current score: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{analysis.score}/100</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismissModal}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Select recommendations to add to your incident log. You can customize the information for each suggestion.
                </p>

                {/* Suggestions List */}
                <div className="space-y-3">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedSuggestions.has(index)
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.has(index)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedSuggestions);
                            if (e.target.checked) {
                              newSelected.add(index);
                            } else {
                              newSelected.delete(index);
                              delete additionalInfo[index];
                            }
                            setSelectedSuggestions(newSelected);
                          }}
                          className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <label className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer">
                            {suggestion}
                          </label>
                          {selectedSuggestions.has(index) && (
                            <textarea
                              value={additionalInfo[index] || ''}
                              onChange={(e) => {
                                setAdditionalInfo(prev => ({
                                  ...prev,
                                  [index]: e.target.value
                                }));
                              }}
                              placeholder="Add specific details for this recommendation..."
                              className="mt-2 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                              rows={2}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
                <button
                  onClick={handleDismissModal}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleApplySuggestions}
                  disabled={selectedSuggestions.size === 0}
                  className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Apply to Facts Observed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default IncidentQualityCard;

