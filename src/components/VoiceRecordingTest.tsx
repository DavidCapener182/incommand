'use client'

import React, { useState } from 'react';
import { useVoiceRecording, RecordingResult } from '@/hooks/useVoiceRecording';

export default function VoiceRecordingTest() {
  const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    recordingState,
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    handleKeyDown,
    handleKeyUp
  } = useVoiceRecording();

  const handleStartRecording = async () => {
    try {
      await startRecording();
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsProcessing(true);
      const result = await stopRecording();
      console.log('Recording completed:', result);
      setRecordingResult(result);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelRecording = () => {
    cancelRecording();
    setRecordingResult(null);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Voice Recording Test</h2>
      
      {/* Recording Status */}
      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <div className="text-sm font-medium text-gray-700">
          Status: <span className="capitalize">{recordingState}</span>
        </div>
        {isRecording && (
          <div className="text-lg font-bold text-red-600 mt-2">
            Recording: {formatDuration(recordingDuration)}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            disabled={recordingState !== 'idle'}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Start Recording
          </button>
        ) : (
          <>
            <button
              onClick={handleStopRecording}
              disabled={isProcessing}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Stop Recording'}
            </button>
            <button
              onClick={handleCancelRecording}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Keyboard Instructions */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>Keyboard Shortcuts:</strong>
          <br />• Press and hold <kbd className="px-2 py-1 bg-blue-200 rounded">Space</kbd> or <kbd className="px-2 py-1 bg-blue-200 rounded">V</kbd> for push-to-talk
          <br />• Release to stop recording
        </div>
      </div>

      {/* Recording Result */}
      {recordingResult && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">Recording Complete!</h3>
          <div className="space-y-2 text-sm text-green-700">
            <div><strong>Duration:</strong> {recordingResult.duration} seconds</div>
            <div><strong>File Name:</strong> {recordingResult.fileName}</div>
            <div><strong>File Size:</strong> {(recordingResult.blob.size / 1024).toFixed(1)} KB</div>
            <div><strong>URL:</strong> 
              <a 
                href={recordingResult.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {recordingResult.url}
              </a>
            </div>
          </div>
          
          {/* Audio Player */}
          <audio 
            controls 
            className="w-full mt-3"
            src={recordingResult.url}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* Debug Info */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
          Debug Information
        </summary>
        <div className="mt-2 p-3 bg-gray-100 rounded-lg text-xs font-mono">
          <div>Recording State: {recordingState}</div>
          <div>Is Recording: {isRecording.toString()}</div>
          <div>Duration: {recordingDuration}ms</div>
          <div>Processing: {isProcessing.toString()}</div>
        </div>
      </details>
    </div>
  );
}
