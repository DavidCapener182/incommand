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
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopRecordingPromiseRef = useRef<{
    resolve: (value: RecordingResult) => void;
    reject: (reason: any) => void;
  } | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef<number>(48000);

  const resetState = useCallback(() => {
    setRecordingState('idle');
    setRecordingDuration(0);
    setUploadProgress(0);
    audioChunksRef.current = [];
    stopRecordingPromiseRef.current = null;
    recordingStartTimeRef.current = 0;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setRecordingState('recording');
      audioChunksRef.current = [];
      setRecordingDuration(0);
      stopRecordingPromiseRef.current = null;
      recordingStartTimeRef.current = Date.now();

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        } 
      });
      
      streamRef.current = stream;

      // Create Audio Context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      sampleRateRef.current = audioContext.sampleRate;

      // Create media stream source
      const mediaStreamSource = audioContext.createMediaStreamSource(stream);
      mediaStreamSourceRef.current = mediaStreamSource;

      // Create script processor for audio data
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Handle audio data
      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Copy the audio data to avoid reference issues
        const audioData = new Float32Array(inputData.length);
        audioData.set(inputData);
        audioChunksRef.current.push(audioData);
        
        console.log('Audio chunk received:', audioData.length, 'samples');
      };

      // Connect the nodes
      mediaStreamSource.connect(processor);
      processor.connect(audioContext.destination);

      console.log('Web Audio API recording started');

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 100);
      }, 100);

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
  }, [resetState, addToast]);

  const stopRecording = useCallback(async (): Promise<RecordingResult> => {
    if (!audioContextRef.current || recordingState !== 'recording') {
      throw new Error('No active recording to stop');
    }

    console.log('Stopping recording...');

    return new Promise<RecordingResult>((resolve, reject) => {
      stopRecordingPromiseRef.current = { resolve, reject };
      
      // Add delay to ensure all audio data is captured
      setTimeout(async () => {
        try {
          console.log('Processing audio data...');
          setRecordingState('processing');
          
          // Stop the audio processing
          if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
          }
          
          if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
          }
          
          // Stop the media stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          
          // Stop the duration timer
          if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
          }
          
          // Process the audio data
          if (audioChunksRef.current.length === 0) {
            throw new Error('No audio data captured');
          }
          
          console.log('Total audio chunks:', audioChunksRef.current.length);
          const totalSamples = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
          console.log('Total samples:', totalSamples);
          
          // Calculate actual duration
          const actualDuration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
          console.log('Actual recording duration:', actualDuration, 'seconds');
          
          // Convert Float32Array chunks to audio blob
          const audioBlob = await convertFloat32ArrayToBlob(audioChunksRef.current, sampleRateRef.current);
          console.log('Final audio blob size:', audioBlob.size, 'bytes');
          
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
            duration: actualDuration,
            blob: audioBlob,
            fileName
          };

          console.log('Recording result:', recordingResult);
          resolve(recordingResult);
          resetState();
          
        } catch (error) {
          console.error('Error processing recording:', error);
          reject(error);
          resetState();
        }
      }, 500); // 500ms delay to ensure complete capture
    });
  }, [recordingState, resetState]);

  const cancelRecording = useCallback(() => {
    if (audioContextRef.current && recordingState === 'recording') {
      console.log('Cancelling recording...');
      
      // Stop the audio processing
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      
      if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
      }
      
      // Stop the media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Stop the duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
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

// Helper function to convert Float32Array chunks to audio blob
async function convertFloat32ArrayToBlob(audioChunks: Float32Array[], sampleRate: number): Promise<Blob> {
  // Concatenate all audio chunks
  const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const concatenated = new Float32Array(totalLength);
  
  let offset = 0;
  for (const chunk of audioChunks) {
    concatenated.set(chunk, offset);
    offset += chunk.length;
  }
  
  // Convert to 16-bit PCM
  const pcm16 = new Int16Array(concatenated.length);
  for (let i = 0; i < concatenated.length; i++) {
    const s = Math.max(-1, Math.min(1, concatenated[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  // Create WAV file
  const wavBlob = createWAVBlob(pcm16, sampleRate);
  return wavBlob;
}

// Helper function to create WAV blob
function createWAVBlob(pcmData: Int16Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + pcmData.length * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, pcmData.length * 2, true);
  
  // PCM data
  let offset = 44;
  for (let i = 0; i < pcmData.length; i++) {
    view.setInt16(offset, pcmData[i], true);
    offset += 2;
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
}
