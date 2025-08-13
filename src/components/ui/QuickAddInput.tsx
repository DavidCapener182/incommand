import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TypingIndicator } from '@/components/ui/TypingIndicator';
import { usePresence } from '@/hooks/usePresence';

interface QuickAddInputProps {
  onQuickAdd: (value: string) => void;
  isProcessing?: boolean;
  placeholder?: string;
  className?: string;
}

export const QuickAddInput: React.FC<QuickAddInputProps> = ({
  onQuickAdd,
  isProcessing = false,
  placeholder = 'Quick add: Medical at main stage, A1 responding...',
  className
}) => {
  const { users: presenceUsers, updateTyping, updateFocus } = usePresence('incident-quick-add');
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [justDone, setJustDone] = useState(false);
  const prevProcessingRef = useRef<boolean>(false);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSubmittedRef = useRef<string>('');

  const submit = useCallback(() => {
    if (!value.trim() || isProcessing) return;
    lastSubmittedRef.current = value.trim();
    onQuickAdd(value.trim());
  }, [value, isProcessing, onQuickAdd]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
      if (e.key === 'Escape') {
        setValue('');
      }
    };
    const el = inputRef.current;
    el?.addEventListener('keydown', handler as any);
    return () => el?.removeEventListener('keydown', handler as any);
  }, [submit]);

  useEffect(() => {
    if (prevProcessingRef.current && !isProcessing) {
      setJustDone(true);
      const t = setTimeout(() => setJustDone(false), 1500);
      return () => clearTimeout(t);
    }
    prevProcessingRef.current = isProcessing;
  }, [isProcessing]);

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

  return (
    <div className={`relative ${className || ''}`}>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            updateTyping('quick-add', true);
          }}
          onFocus={() => updateFocus('quick-add')}
          onBlur={() => updateTyping('quick-add', false)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border-2 border-green-300 dark:border-green-700 bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm"
        />
      </div>
      <TypingIndicator users={presenceUsers} fieldName="quick-add" position="bottom" />
      {isProcessing && (
        <div className="absolute right-2 -bottom-6 text-xs text-green-700 dark:text-green-300">Analyzing with AI…</div>
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


