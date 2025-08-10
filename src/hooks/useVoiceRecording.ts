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

export const useVoiceRecording = (): UseVoiceRecordingReturn => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { addToast } = useToast();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const resetState = useCallback(() => {
    setRecordingState('idle');
    setRecordingDuration(0);
    setUploadProgress(0);
    audioChunksRef.current = [];
  }, []);

  const startRecording = useCallback(async () => {
    try {
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
          
          // Compress audio if file is too large (>5MB)
          let finalBlob = audioBlob;
          if (audioBlob.size > 5 * 1024 * 1024) {
            // Simple compression by reducing quality
            const audioContext = new AudioContext();
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
          }

          setRecordingState('uploading');
          
          // Upload to Supabase Storage
          const fileName = `voice_notes/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webm`;
          
          const { data, error } = await supabase.storage
            .from('voice_notes')
            .upload(fileName, finalBlob, {
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
            message: 'Failed to process voice recording'
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
  }, [recordingDuration, resetState]);

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
