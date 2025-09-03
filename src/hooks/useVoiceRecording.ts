import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'uploading';

export interface RecordingResult {
  url: string;
  duration: number;
  blob: Blob;
  fileName: string;
}

interface UseVoiceRecordingReturn {
  recordingState: RecordingState;
  isRecording: boolean;
  recordingDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<RecordingResult>;
  cancelRecording: () => void;
  uploadProgress: number;
  handleKeyDown: (event: KeyboardEvent) => void;
  handleKeyUp: (event: KeyboardEvent) => void;
}

export const useVoiceRecording = (): UseVoiceRecordingReturn => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { addToast } = useToast();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopRecordingPromiseRef = useRef<{
    resolve: (value: RecordingResult) => void;
    reject: (reason: any) => void;
  } | null>(null);

  const resetState = useCallback(() => {
    setRecordingState('idle');
    setRecordingDuration(0);
    setUploadProgress(0);
    audioChunksRef.current = [];
    stopRecordingPromiseRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setRecordingState('recording');
      audioChunksRef.current = [];
      setRecordingDuration(0);
      stopRecordingPromiseRef.current = null;

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
          
          // Basic validation
          if (audioBlob.size === 0) {
            throw new Error('Recording produced no audio data');
          }

          setRecordingState('uploading');
          
          // Upload to Supabase Storage
          const fileName = `voice_notes/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webm`;
          
          const { data, error } = await supabase.storage
            .from('voice_notes')
            .upload(fileName, audioBlob, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) {
            throw error;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('voice_notes')
            .getPublicUrl(fileName);

          const recordingResult: RecordingResult = {
            url: urlData.publicUrl,
            duration: Math.round(recordingDuration / 1000),
            blob: audioBlob,
            fileName
          };

          // Resolve the promise with the recording result
          if (stopRecordingPromiseRef.current) {
            stopRecordingPromiseRef.current.resolve(recordingResult);
          }

          resetState();
          
        } catch (error) {
          console.error('Error processing recording:', error);
          addToast({
            type: 'error',
            title: 'Processing Failed',
            message: 'Failed to process voice recording'
          });
          
          // Reject the promise if there was an error
          if (stopRecordingPromiseRef.current) {
            stopRecordingPromiseRef.current.reject(error);
          }
          
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
      throw error;
    }
  }, [recordingDuration, resetState, addToast]);

  const stopRecording = useCallback(async (): Promise<RecordingResult> => {
    if (!mediaRecorderRef.current || recordingState !== 'recording') {
      throw new Error('No active recording to stop');
    }

    // Create a promise that will be resolved when the recording is processed
    return new Promise<RecordingResult>((resolve, reject) => {
      stopRecordingPromiseRef.current = { resolve, reject };
      
      // Stop the recording
      mediaRecorderRef.current!.stop();
      
      // Stop the duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      // Stop the media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    });
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
      
      // Reject any pending promise
      if (stopRecordingPromiseRef.current) {
        stopRecordingPromiseRef.current.reject(new Error('Recording cancelled'));
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

  const handleKeyUp = useCallback(async (event: KeyboardEvent) => {
    // Stop recording on key release for push-to-talk
    if ((event.code === 'Space' || event.code === 'KeyV') && recordingState === 'recording') {
      event.preventDefault();
      try {
        const result = await stopRecording();
        console.log('Recording completed:', result);
        // You can handle the result here if needed
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
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

      // Reject any pending promise on cleanup
      if (stopRecordingPromiseRef.current) {
        stopRecordingPromiseRef.current.reject(new Error('Component unmounted'));
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
