import React, { useState, useEffect } from 'react';

interface LiveTimerProps {
  timestamp: string;
  className?: string;
  compact?: boolean;
}

export default function LiveTimer({ timestamp, className = '', compact = false }: LiveTimerProps) {
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const incidentTime = new Date(timestamp).getTime();
      const elapsed = now - incidentTime;
      setElapsedTime(elapsed);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  // Format elapsed time
  const formatElapsedTime = (milliseconds: number) => {
    if (milliseconds < 0) return '00:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // Get urgency styling based on elapsed time
  const getUrgencyStyle = () => {
    const totalMinutes = Math.floor(elapsedTime / (1000 * 60));
    
    if (totalMinutes >= 60) { // 1+ hours
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: '🔴'
      };
    } else if (totalMinutes >= 30) { // 30+ minutes
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: '🟠'
      };
    } else if (totalMinutes >= 15) { // 15+ minutes
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        icon: '🟡'
      };
    } else { // Less than 15 minutes
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: '🟢'
      };
    }
  };

  const urgency = getUrgencyStyle();

  if (compact) {
    return (
      <div className={`flex items-center gap-1 text-xs ${urgency.color} ${className}`}>
        <span className="text-xs">{urgency.icon}</span>
        <span className="font-mono">{formatElapsedTime(elapsedTime)}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full border ${urgency.bgColor} ${urgency.borderColor} ${className}`}>
      <span className="text-xs">{urgency.icon}</span>
      <span className={`text-xs font-medium ${urgency.color}`}>
        {formatElapsedTime(elapsedTime)}
      </span>
      <span className="text-xs text-gray-500">elapsed</span>
    </div>
  );
}
