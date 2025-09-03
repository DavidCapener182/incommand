'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicrophoneIcon, XMarkIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { useVoiceRecording, RecordingResult } from '@/hooks/useVoiceRecording';
import { useToast } from './Toast';

interface EnhancedVoiceInputProps {
  onTranscriptionComplete: (text: string) => void;
  onRecordingComplete?: (result: RecordingResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const EnhancedVoiceInput: React.FC<EnhancedVoiceInputProps> = ({
  onTranscriptionComplete,
  onRecordingComplete,
  placeholder = "Tap to start voice input...",
  className = "",
  disabled = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [recordingMode, setRecordingMode] = useState<'transcription' | 'recording'>('transcription');
  
  const { addToast } = useToast();
  const {
    recordingState,
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording
  } = useVoiceRecording();

  const recognitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyStoppingRef = useRef(false);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Enhanced recognition settings
      recognition.continuous = true; // Enable continuous recognition
      recognition.interimResults = true; // Get interim results
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      // Event handlers
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setVoiceError(null);
        setTranscript('');
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript + ' ');
          setInterimTranscript('');
        } else {
          setInterimTranscript(interimTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        let errorMessage = 'Voice recognition error';

        switch (event.error) {
          case 'aborted':
            if (!isManuallyStoppingRef.current) {
              errorMessage = 'Voice recognition was interrupted. Please try again.';
            }
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not found. Please check your microphone.';
            break;
          case 'bad-grammar':
            errorMessage = 'Speech recognition grammar error. Please try again.';
            break;
          case 'language-not-supported':
            errorMessage = 'Language not supported. Please try English.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please speak clearly.';
            break;
          case 'not-allowed':
            errorMessage = 'Voice recognition service not allowed. Please check browser settings.';
            break;
          default:
            errorMessage = `Voice recognition error: ${event.error}`;
        }

        setVoiceError(errorMessage);
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        
        if (recognitionTimeoutRef.current) {
          clearTimeout(recognitionTimeoutRef.current);
          recognitionTimeoutRef.current = null;
        }

        // Auto-submit if we have a transcript and no errors
        if (transcript.trim() && !voiceError && !isManuallyStoppingRef.current) {
          handleTranscriptionComplete();
        }
      };

      setRecognition(recognition);
    } else {
      setVoiceError('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognition) {
        try {
          isManuallyStoppingRef.current = true;
          recognition.stop();
        } catch (error) {
          console.error('Error stopping recognition during cleanup:', error);
        }
      }
      
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }
    };
  }, [recognition]);

  const handleTranscriptionComplete = useCallback(() => {
    if (transcript.trim()) {
      onTranscriptionComplete(transcript.trim());
      setTranscript('');
      setInterimTranscript('');
    }
  }, [transcript, onTranscriptionComplete]);

  const startVoiceRecognition = useCallback(async () => {
    if (!recognition) {
      setVoiceError('Voice recognition not available. Please refresh the page and try again.');
      return;
    }

    try {
      setVoiceError(null);
      setTranscript('');
      setInterimTranscript('');
      isManuallyStoppingRef.current = false;
      
      await recognition.start();
      
      // Set a longer timeout for continuous recognition
      recognitionTimeoutRef.current = setTimeout(() => {
        console.log('Auto-stopping voice recognition after extended timeout');
        recognition.stop();
      }, 120000); // 2 minutes instead of 30 seconds
      
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        setVoiceError('Microphone access denied. Please allow microphone permissions in your browser settings.');
      } else {
        console.error('Error starting voice recognition:', error);
        setVoiceError('Failed to start voice recognition. Please try again.');
      }
    }
  }, [recognition]);

  const stopVoiceRecognition = useCallback(() => {
    if (recognition && isListening) {
      try {
        isManuallyStoppingRef.current = true;
        recognition.stop();
        
        if (recognitionTimeoutRef.current) {
          clearTimeout(recognitionTimeoutRef.current);
          recognitionTimeoutRef.current = null;
        }
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }, [recognition, isListening]);

  const startVoiceRecording = useCallback(async () => {
    try {
      setRecordingMode('recording');
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      addToast({
        type: 'error',
        title: 'Recording Failed',
        message: 'Failed to start voice recording. Please try again.'
      });
    }
  }, [startRecording, addToast]);

  const stopVoiceRecording = useCallback(async () => {
    try {
      setIsProcessing(true);
      const result = await stopRecording();
      
      if (onRecordingComplete) {
        onRecordingComplete(result);
      }
      
      setRecordingMode('transcription');
      addToast({
        type: 'success',
        title: 'Recording Complete',
        message: `Voice recording saved (${result.duration}s)`
      });
    } catch (error) {
      console.error('Failed to stop recording:', error);
      addToast({
        type: 'error',
        title: 'Recording Failed',
        message: 'Failed to complete voice recording'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [stopRecording, onRecordingComplete, addToast]);

  const cancelVoiceRecording = useCallback(() => {
    cancelRecording();
    setRecordingMode('transcription');
  }, [cancelRecording]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setVoiceError(null);
  }, []);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setRecordingMode('transcription')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            recordingMode === 'transcription'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <SpeakerWaveIcon className="w-4 h-4 inline mr-2" />
          Live Transcription
        </button>
        <button
          onClick={() => setRecordingMode('recording')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            recordingMode === 'recording'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <MicrophoneIcon className="w-4 h-4 inline mr-2" />
          Voice Recording
        </button>
      </div>

      {/* Transcription Mode */}
      {recordingMode === 'transcription' && (
        <div className="space-y-3">
          {/* Voice Input Button */}
          <div className="flex gap-2">
            {!isListening ? (
              <button
                onClick={startVoiceRecognition}
                disabled={disabled || !recognition}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <MicrophoneIcon className="w-5 h-5" />
                {placeholder}
              </button>
            ) : (
              <button
                onClick={stopVoiceRecognition}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                Stop Listening
              </button>
            )}
            
            {(transcript || interimTranscript) && (
              <button
                onClick={clearTranscript}
                className="px-3 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Live Transcript Display */}
          <AnimatePresence>
            {(transcript || interimTranscript) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="text-sm text-gray-600 mb-2">Live Transcript:</div>
                
                {/* Final transcript */}
                {transcript && (
                  <div className="text-gray-800 mb-2 font-medium">
                    {transcript}
                  </div>
                )}
                
                {/* Interim transcript */}
                {interimTranscript && (
                  <div className="text-gray-500 italic">
                    {interimTranscript}
                    <span className="animate-pulse">...</span>
                  </div>
                )}
                
                {/* Submit button */}
                {transcript.trim() && (
                  <button
                    onClick={handleTranscriptionComplete}
                    className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Use This Text
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          {voiceError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm"
            >
              {voiceError}
            </motion.div>
          )}
        </div>
      )}

      {/* Recording Mode */}
      {recordingMode === 'recording' && (
        <div className="space-y-3">
          {/* Recording Controls */}
          <div className="flex gap-2">
            {!isRecording ? (
              <button
                onClick={startVoiceRecording}
                disabled={disabled}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <MicrophoneIcon className="w-5 h-5" />
                Start Recording
              </button>
            ) : (
              <>
                <button
                  onClick={stopVoiceRecording}
                  disabled={isProcessing}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-white rounded-full" />
                      Stop Recording
                    </>
                  )}
                </button>
                <button
                  onClick={cancelVoiceRecording}
                  className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          {/* Recording Status */}
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="text-red-800 font-medium">Recording...</div>
                  <div className="text-red-600 text-sm">
                    Duration: {formatDuration(recordingDuration)}
                  </div>
                </div>
              </div>
              
              {/* Real-time waveform visualization */}
              <div className="mt-3">
                <div className="flex items-end gap-1 h-8">
                  {Array.from({ length: 20 }, (_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-red-400 rounded-full"
                      animate={{
                        height: [2, 8, 4, 12, 6, 10, 3, 7, 5, 9][i % 10]
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.1
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
