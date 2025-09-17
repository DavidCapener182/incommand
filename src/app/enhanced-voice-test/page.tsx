import { EnhancedVoiceInput } from '@/components/EnhancedVoiceInput';

export default function EnhancedVoiceTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Enhanced Voice Input Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Test Enhanced Voice Input Component
          </h2>
          
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Features to Test:</h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>✅ <strong>Live Transcription Mode:</strong> Continuous speech recognition with interim results</li>
                <li>✅ <strong>Voice Recording Mode:</strong> Audio recording with waveform visualization</li>
                <li>✅ <strong>Extended Timeout:</strong> 2 minutes instead of 30 seconds</li>
                <li>✅ <strong>Real-time Feedback:</strong> Live transcript updates and recording status</li>
                <li>✅ <strong>Error Handling:</strong> Comprehensive error recovery and user guidance</li>
                <li>✅ <strong>Mode Switching:</strong> Toggle between transcription and recording</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">Test Instructions:</h3>
              <ol className="text-green-800 space-y-2 text-sm">
                <li><strong>Live Transcription:</strong> Click &quot;Live Transcription&quot; mode, then &quot;Tap to start voice input...&quot; and speak a complete sentence</li>
                <li><strong>Voice Recording:</strong> Switch to &quot;Voice Recording&quot; mode, start recording, speak, then stop</li>
                <li><strong>Error Handling:</strong> Test with microphone permissions denied or network issues</li>
                <li><strong>Mode Switching:</strong> Try switching between modes during active sessions</li>
              </ol>
            </div>
            
            <EnhancedVoiceInput
              onTranscriptionComplete={(text: string) => {
                console.log('Transcription completed:', text);
                alert(`Transcription: "${text}"`);
              }}
              onRecordingComplete={(result) => {
                console.log('Recording completed:', result);
                alert(`Recording: ${result.duration}s, ${(result.blob.size / 1024).toFixed(1)}KB`);
              }}
              placeholder="Tap to start voice input or recording..."
              className="w-full"
            />
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">Expected Results:</h3>
              <div className="text-gray-700 text-sm space-y-1">
                <p>• <strong>Live Transcription:</strong> Should capture complete sentences without cutting off</p>
                <p>• <strong>Voice Recording:</strong> Should record full audio duration with visual feedback</p>
                <p>• <strong>Error Recovery:</strong> Should provide clear error messages and recovery options</p>
                <p>• <strong>Performance:</strong> Should handle continuous recognition for extended periods</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
