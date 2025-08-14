import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TypingIndicator } from '@/components/ui/TypingIndicator';
import { usePresence } from '@/hooks/usePresence';
import { ensureBrowserLLM, isBrowserLLMAvailable, getBrowserLLMStatus, cleanupBrowserLLM } from '@/services/browserLLMService';

interface QuickAddInputProps {
  onQuickAdd: (value: string) => void;
  isProcessing?: boolean;
  placeholder?: string;
  className?: string;
  onChangeValue?: (value: string) => void; // new: notify parent of input changes
  aiSource?: 'local' | 'cloud' | 'browser' | null;
}

export const QuickAddInput: React.FC<QuickAddInputProps> = ({
  onQuickAdd,
  isProcessing = false,
  placeholder = 'Quick add: Medical at main stage, A1 responding...',
  className,
  onChangeValue,
  aiSource = null
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
    onQuickAdd(value.trim());
  }, [value, isProcessing, onQuickAdd]);

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

  return (
    <div className={`relative ${className || ''}`}>
      <div className="flex items-center gap-2">
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
          className="w-full px-4 py-3 rounded-xl border-2 border-green-300 dark:border-green-700 bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm"
        />
        {/* Preload Local AI button hidden; OpenAI/cloud is primary */}
      </div>
      {!browserLLMReady && initTriggeredRef.current && !localAIError && (
        <div className="mt-1 h-1 w-24 bg-gray-200 dark:bg-gray-700 rounded">
          <div
            className="h-1 bg-green-500 rounded"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {!browserLLMReady && localAIError === 'unsupported' && (
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">Local AI unsupported on this browser.</div>
      )}
      {/* Hide local AI failure message to avoid confusion; cloud is primary */}
      <TypingIndicator users={presenceUsers} fieldName="quick-add" position="bottom" />
      {isProcessing && (
        <div className="absolute right-2 -bottom-6 text-xs text-green-700 dark:text-green-300">
          {aiSource === 'local' || aiSource === 'browser' ? 'Analyzing with local AI…' : 'Analyzing with AI…'}
        </div>
      )}
      {!isProcessing && justDone && (
        <div className="absolute right-2 -bottom-6 text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-600 text-white">✓</span>
          Processed
        </div>
      )}
    </div>
  );
};


