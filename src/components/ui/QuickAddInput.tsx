import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TypingIndicator } from '@/components/ui/TypingIndicator';
import { usePresence } from '@/hooks/usePresence';
import { ensureBrowserLLM, isBrowserLLMAvailable, getBrowserLLMStatus, cleanupBrowserLLM } from '@/services/browserLLMService';
import { SparklesIcon } from '@heroicons/react/24/outline';
import VoiceInputButton from '@/components/VoiceInputButton';
import ParsedFieldsPreview from '@/components/ParsedFieldsPreview';

interface QuickAddInputProps {
  onQuickAdd: (value: string) => void;
  isProcessing?: boolean;
  placeholder?: string;
  className?: string;
  onChangeValue?: (value: string) => void; // new: notify parent of input changes
  aiSource?: 'local' | 'cloud' | 'browser' | null;
  onParsedData?: (data: ParsedIncidentData) => void;
  showParseButton?: boolean;
  autoParseOnEnter?: boolean;
}

export interface ParsedIncidentData {
  incidentType?: string;
  location?: string;
  callsignFrom?: string;
  callsignTo?: string;
  priority?: string;
  occurrence?: string;
  actionTaken?: string;
  confidence?: number;
}

export const QuickAddInput: React.FC<QuickAddInputProps> = ({
  onQuickAdd,
  isProcessing = false,
  placeholder = 'Quick add: Medical at main stage, A1 responding...',
  className,
  onChangeValue,
  aiSource = null,
  onParsedData,
  showParseButton = true,
  autoParseOnEnter = false
}) => {
  const { users: presenceUsers, updateTyping, updateFocus } = usePresence('incident-quick-add');
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [justDone, setJustDone] = useState(false);
  const prevProcessingRef = useRef<boolean>(false);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSubmittedRef = useRef<string>('');
  const [browserLLMReady, setBrowserLLMReady] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const initTriggeredRef = useRef<boolean>(false);
  const [localAIError, setLocalAIError] = useState<null | 'unsupported' | 'failed'>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedIncidentData | null>(null);
  const [showParsedPreview, setShowParsedPreview] = useState(false);

  const parseIncident = useCallback(async () => {
    if (!value.trim() || isParsing) return;

    setIsParsing(true);
    setParsedData(null);

    try {
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: value.trim(),
          action: 'parse'
        })
      });

      if (!response.ok) throw new Error('Parsing failed');

      const result = await response.json();
      
      const parsed: ParsedIncidentData = {
        incidentType: result.incidentType,
        location: result.location,
        callsignFrom: result.callsignFrom,
        callsignTo: result.callsignTo,
        priority: result.priority,
        occurrence: result.occurrence || value.trim(),
        actionTaken: result.actionTaken,
        confidence: result.confidence || 0.8
      };

      setParsedData(parsed);
      setShowParsedPreview(true);
    } catch (error) {
      console.error('Error parsing incident:', error);
      // Fallback: just submit as-is
      onQuickAdd(value.trim());
    } finally {
      setIsParsing(false);
    }
  }, [value, isParsing, onQuickAdd]);

  const submit = useCallback(() => {
    if (!value.trim() || isProcessing) return;
    
    // Cancel auto timer to prevent collision
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    
    // Check for duplicate submission
    if (lastSubmittedRef.current === value.trim()) {
      return;
    }
    
    lastSubmittedRef.current = value.trim();
    
    // If auto-parse is enabled, parse first
    if (autoParseOnEnter && onParsedData) {
      parseIncident();
    } else {
      onQuickAdd(value.trim());
    }
  }, [value, isProcessing, onQuickAdd, autoParseOnEnter, onParsedData, parseIncident]);

  // Use React onKeyDown instead of manual event listeners

  useEffect(() => {
    if (prevProcessingRef.current && !isProcessing) {
      setJustDone(true);
      const t = setTimeout(() => setJustDone(false), 1500);
      return () => clearTimeout(t);
    }
    prevProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Lazy-init Browser LLM: first keystroke or explicit preload
  const triggerInit = useCallback(async () => {
    if (initTriggeredRef.current || isBrowserLLMAvailable()) return;
    initTriggeredRef.current = true;
    try {
      await ensureBrowserLLM((p) => setProgress(Math.round(Math.max(0, Math.min(1, p)) * 100)));
      setBrowserLLMReady(true);
      setLocalAIError(null);
    } catch (error) {
      const status = getBrowserLLMStatus();
      if (!status.supported) {
        setLocalAIError('unsupported');
      } else {
        setLocalAIError('failed');
      }
      console.log('Browser LLM not available, will use fallback');
      setBrowserLLMReady(false);
      initTriggeredRef.current = false;
    }
  }, []);

  // Auto-submit shortly after the user stops typing
  useEffect(() => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    if (!value.trim()) return;
    autoTimerRef.current = setTimeout(() => {
      if (!isProcessing && value.trim() && lastSubmittedRef.current !== value.trim()) {
        submit();
      }
    }, 1200);
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [value, isProcessing, submit]);

  // Cleanup resources on unmount if we triggered init
  useEffect(() => {
    return () => {
      if (initTriggeredRef.current) {
        try { cleanupBrowserLLM(); } catch {}
      }
    };
  }, []);

  const handleVoiceTranscript = (text: string) => {
    setValue(text);
    onChangeValue?.(text);
  };

  const handleApplyParsed = () => {
    if (parsedData && onParsedData) {
      onParsedData(parsedData);
      setShowParsedPreview(false);
      setValue('');
      setParsedData(null);
    }
  };

  const handleEditManually = () => {
    setShowParsedPreview(false);
    // Keep the value so user can edit
  };

  const handleCancelParsed = () => {
    setShowParsedPreview(false);
    setParsedData(null);
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                onChangeValue?.(e.target.value);
                updateTyping('quick-add', true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
                if (e.key === 'Escape') {
                  setValue('');
                  onChangeValue?.('');
                }
              }}
              onFocus={() => updateFocus('quick-add')}
              onBlur={() => updateTyping('quick-add', false)}
              placeholder={placeholder}
              className="w-full px-4 py-4 pr-12 rounded-xl border-2 border-green-300 dark:border-green-700 bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm text-base"
            />
            {value.trim() && showParseButton && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <button
                  type="button"
                  onClick={parseIncident}
                  disabled={isParsing}
                  className="p-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 disabled:opacity-50 transition-colors"
                  title="Parse with AI"
                >
                  <SparklesIcon className={`h-5 w-5 ${isParsing ? 'animate-pulse' : ''}`} />
                </button>
              </div>
            )}
          </div>
          
          <VoiceInputButton
            onTranscript={handleVoiceTranscript}
            size="medium"
            variant="secondary"
            showTranscript={false}
          />
        </div>
        
        {!browserLLMReady && initTriggeredRef.current && !localAIError && (
          <div className="mt-2 h-1 w-24 bg-gray-200 dark:bg-gray-700 rounded">
            <div
              className="h-1 bg-green-500 rounded transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        <TypingIndicator users={presenceUsers} fieldName="quick-add" position="bottom" />
        
        {(isProcessing || isParsing) && (
          <div className="mt-2 text-xs text-green-700 dark:text-green-300 flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {isParsing ? 'Parsing with AI...' : (aiSource === 'local' || aiSource === 'browser' ? 'Analyzing with local AI…' : 'Analyzing with AI…')}
          </div>
        )}
        
        {!isProcessing && !isParsing && justDone && (
          <div className="mt-2 text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-600 text-white">✓</span>
            Processed
          </div>
        )}
      </div>

      {/* Parsed Fields Preview */}
      {showParsedPreview && parsedData && (
        <ParsedFieldsPreview
          fields={[
            { label: 'Incident Type', value: parsedData.incidentType || '' },
            { label: 'Location', value: parsedData.location || '' },
            { label: 'From', value: parsedData.callsignFrom || '' },
            { label: 'To', value: parsedData.callsignTo || '' },
            { label: 'Priority', value: parsedData.priority || '' },
            { label: 'Occurrence', value: parsedData.occurrence || '' }
          ]}
          onApply={handleApplyParsed}
          onEdit={handleEditManually}
          onCancel={handleCancelParsed}
        />
      )}
    </div>
  );
};


