import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface VoiceMessageBubbleProps {
  url: string;
  duration: number;
  senderName: string;
  timestamp: string;
  isOwnMessage: boolean;
}

export const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({
  url,
  duration,
  senderName,
  timestamp,
  isOwnMessage
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayback = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      } else {
        setIsLoading(true);
        await audioRef.current.play();
        setIsPlaying(true);
        setIsLoading(false);
        
        // Start progress tracking
        progressIntervalRef.current = setInterval(() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsLoading(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const progressPercentage = (currentTime / duration) * 100;

  return (
    <motion.div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`max-w-xs ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {/* Sender name */}
        <div className={`text-xs text-gray-500 mb-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          {senderName}
        </div>
        
        {/* Voice message bubble */}
        <div
          className={`rounded-lg p-3 ${
            isOwnMessage 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Play/Pause button */}
            <button
              onClick={togglePlayback}
              disabled={isLoading}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isOwnMessage 
                  ? 'bg-white bg-opacity-20 hover:bg-opacity-30' 
                  : 'bg-gray-200 hover:bg-gray-300'
              } ${isLoading ? 'opacity-50' : ''}`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Waveform/Progress bar */}
            <div className="flex-1">
              <div
                className="relative h-8 bg-black bg-opacity-10 rounded cursor-pointer"
                onClick={handleSeek}
              >
                {/* Progress bar */}
                <motion.div
                  className={`absolute top-0 left-0 h-full rounded ${
                    isOwnMessage ? 'bg-white bg-opacity-30' : 'bg-gray-300'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.1 }}
                />
                
                {/* Waveform visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-end gap-0.5 h-4">
                    {Array.from({ length: 20 }, (_, i) => (
                      <motion.div
                        key={i}
                        className={`w-0.5 rounded-full ${
                          isOwnMessage ? 'bg-white bg-opacity-60' : 'bg-gray-400'
                        }`}
                        animate={{
                          height: isPlaying 
                            ? [2, 8, 4, 12, 6, 10, 3, 7, 5, 9][i % 10]
                            : [3, 6, 4, 8, 5, 7, 2, 6, 4, 8][i % 10]
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: isPlaying ? Infinity : 0,
                          delay: i * 0.1
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Time display */}
              <div className="flex justify-between text-xs mt-1 opacity-75">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Timestamp */}
        <div className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          {timestamp}
        </div>
      </div>
      
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={url}
        onEnded={handleAudioEnded}
        onError={() => {
          setIsLoading(false);
          setIsPlaying(false);
        }}
      />
    </motion.div>
  );
};
