'use client'

import React, { useState } from 'react';
import { useVoiceRecording, RecordingResult } from '@/hooks/useVoiceRecording';

export default function VoiceRecordingTest() {
  const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
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

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleStartRecording = async () => {
    try {
      addDebugLog('Starting recording...');
      await startRecording();
      addDebugLog('Recording started successfully');
      console.log('Recording started');
    } catch (error) {
      const errorMsg = `Failed to start recording: ${error}`;
      addDebugLog(errorMsg);
      console.error(errorMsg, error);
    }
  };

  const handleStopRecording = async () => {
    try {
      addDebugLog('Stopping recording...');
      setIsProcessing(true);
      const result = await stopRecording();
      addDebugLog(`Recording completed: ${result.duration}s, ${(result.blob.size / 1024).toFixed(1)}KB`);
      console.log('Recording completed:', result);
      setRecordingResult(result);
    } catch (error) {
      const errorMsg = `Failed to stop recording: ${error}`;
      addDebugLog(errorMsg);
      console.error(errorMsg, error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelRecording = () => {
    addDebugLog('Cancelling recording...');
    cancelRecording();
    setRecordingResult(null);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${tenths}`;
  };

  const clearDebugLogs = () => {
    setDebugLogs([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
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
        <div className="p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
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

      {/* Debug Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Debug Info */}
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Debug Information</h3>
          <div className="text-xs font-mono space-y-1">
            <div>Recording State: {recordingState}</div>
            <div>Is Recording: {isRecording.toString()}</div>
            <div>Duration: {recordingDuration}ms</div>
            <div>Processing: {isProcessing.toString()}</div>
            <div>Result: {recordingResult ? 'Available' : 'None'}</div>
          </div>
        </div>

        {/* Debug Logs */}
        <div className="p-4 bg-gray-100 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-800">Debug Logs</h3>
            <button
              onClick={clearDebugLogs}
              className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto text-xs font-mono bg-gray-200 p-2 rounded">
            {debugLogs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} className="text-gray-700 mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Test Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">Test Instructions</h3>
        <div className="text-sm text-yellow-700 space-y-2">
          <p><strong>To test the fix for "only picking up first 2 words":</strong></p>
          <ol className="list-decimal list-inside ml-4 space-y-1">
            <li>Click "Start Recording" or hold Spacebar/V key</li>
            <li>Speak a complete sentence like: "There's a medical incident at the main stage"</li>
            <li>Release the key or click "Stop Recording"</li>
            <li>Check the debug logs to see audio chunk collection</li>
            <li>Verify the audio plays back completely</li>
          </ol>
          <p className="mt-2"><strong>Expected:</strong> Full audio capture without cutting off early</p>
        </div>
      </div>
    </div>
  );
}
