import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'uploading';

interface UseVoiceRecordingReturn {
  recordingState: RecordingState;
  isRecording: boolean;
  recordingDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  uploadProgress: number;
  handleKeyDown: (event: KeyboardEvent) => void;
  handleKeyUp: (event: KeyboardEvent) => void;
}

// Browser compatibility check for MediaRecorder API
const isMediaRecorderSupported = () => {
  return typeof window !== 'undefined' && 
         'MediaRecorder' in window && 
         'getUserMedia' in navigator.mediaDevices;
};

// Retry logic with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3, 
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

export const useVoiceRecording = (): UseVoiceRecordingReturn => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { addToast } = useToast();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const resetState = useCallback(() => {
    setRecordingState('idle');
    setRecordingDuration(0);
    setUploadProgress(0);
    audioChunksRef.current = [];
    
    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // Check if voice_notes storage bucket exists
  const validateStorageBucket = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) {
        console.error('Error checking storage buckets:', error);
        return false;
      }
      
      const voiceNotesBucket = data?.find(bucket => bucket.name === 'voice_notes');
      return !!voiceNotesBucket;
    } catch (error) {
      console.error('Error validating storage bucket:', error);
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Check browser compatibility
      if (!isMediaRecorderSupported()) {
        addToast({
          type: 'error',
          title: 'Browser Not Supported',
          message: 'Voice recording is not supported in this browser. Please use a modern browser.'
        });
        return;
      }

      // Validate storage bucket exists
      const bucketExists = await validateStorageBucket();
      if (!bucketExists) {
        addToast({
          type: 'error',
          title: 'Storage Not Available',
          message: 'Voice message storage is not configured. Please contact your administrator.'
        });
        return;
      }

      setRecordingState('recording');
      audioChunksRef.current = [];
      setRecordingDuration(0);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;

      // Create MediaRecorder with WebM format
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setRecordingState('processing');
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Compress audio if file is too large (>5MB) with better error handling
          let finalBlob = audioBlob;
          if (audioBlob.size > 5 * 1024 * 1024) {
            try {
              // Create audio context for compression
              audioContextRef.current = new AudioContext();
              const audioContext = audioContextRef.current;
              
              const arrayBuffer = await audioBlob.arrayBuffer();
              const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
              
              // Create a new audio buffer with reduced sample rate
              const compressedBuffer = audioContext.createBuffer(
                1, // mono
                audioBuffer.length * 0.5, // reduce length
                22050 // reduced sample rate
              );
              
              const channelData = audioBuffer.getChannelData(0);
              const compressedData = compressedBuffer.getChannelData(0);
              
              for (let i = 0; i < compressedData.length; i++) {
                compressedData[i] = channelData[i * 2];
              }
              
              // Convert back to blob
              const mediaStreamDestination = audioContext.createMediaStreamDestination();
              const source = audioContext.createBufferSource();
              source.buffer = compressedBuffer;
              source.connect(mediaStreamDestination);
              source.start();
              
              const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
              const chunks: Blob[] = [];
              
              mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
              mediaRecorder.onstop = () => {
                finalBlob = new Blob(chunks, { type: 'audio/webm' });
              };
              
              mediaRecorder.start();
              setTimeout(() => mediaRecorder.stop(), compressedBuffer.duration * 1000);
              
              // Clean up audio context after compression
              audioContext.close();
              audioContextRef.current = null;
            } catch (compressionError) {
              console.error('Audio compression failed:', compressionError);
              addToast({
                type: 'warning',
                title: 'Compression Failed',
                message: 'Audio compression failed, uploading original file.'
              });
              // Continue with original blob if compression fails
            }
          }

          setRecordingState('uploading');
          
          // Upload to Supabase Storage with retry logic
          const fileName = `voice_notes/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webm`;
          
          const uploadResult = await retryWithBackoff(async () => {
            const { data, error } = await supabase.storage
              .from('voice_notes')
              .upload(fileName, finalBlob, {
                cacheControl: '3600',
                upsert: false
              });

            if (error) {
              throw error;
            }

            return data;
          }, 3, 1000);

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('voice_notes')
            .getPublicUrl(fileName);

          resetState();
          
          // Return the file URL and duration for the calling component
          return {
            url: urlData.publicUrl,
            duration: Math.round(recordingDuration / 1000)
          };
          
        } catch (error) {
          console.error('Error processing recording:', error);
          addToast({
            type: 'error',
            title: 'Processing Failed',
            message: 'Failed to process voice recording. Please try again.'
          });
          resetState();
        }
      };

      mediaRecorder.start(1000); // Collect data every second

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1000);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      addToast({
        type: 'error',
        title: 'Recording Failed',
        message: 'Failed to start recording. Please check microphone permissions.'
      });
      resetState();
    }
  }, [recordingDuration, resetState, validateStorageBucket, addToast]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [recordingState]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      resetState();
    }
  }, [recordingState, resetState]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Spacebar or 'V' key for push-to-talk
    if ((event.code === 'Space' || event.code === 'KeyV') && recordingState === 'idle') {
      event.preventDefault();
      startRecording();
    }
  }, [recordingState, startRecording]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    // Stop recording on key release for push-to-talk
    if ((event.code === 'Space' || event.code === 'KeyV') && recordingState === 'recording') {
      event.preventDefault();
      stopRecording();
    }
  }, [recordingState, stopRecording]);

  useEffect(() => {
    // Add keyboard event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      
      // Cleanup on unmount
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [handleKeyDown, handleKeyUp]);

  return {
    recordingState,
    isRecording: recordingState === 'recording',
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    uploadProgress,
    handleKeyDown,
    handleKeyUp
  };
};
