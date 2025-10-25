import React, { useState, useEffect, useCallback } from 'react';
// Removed direct import of server-only escalationEngine
type EscalationEvent = {
  id: string;
  incident_id: string;
  action?: string;
  timestamp?: string;
  reason?: string;
  escalation_level?: number;
  escalated_at?: string | Date;
  notes?: string;
  resolution_time?: number | string;
};

interface EscalationTimerProps {
  incidentId: string;
  escalationLevel: number;
  escalateAt: string | null;
  escalated: boolean;
  incidentType: string;
  priority: string;
  onEscalationChange?: () => void;
  className?: string;
}

export default function EscalationTimer({
  incidentId,
  escalationLevel,
  escalateAt,
  escalated,
  incidentType,
  priority,
  onEscalationChange,
  className = ''
}: EscalationTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [escalationHistory, setEscalationHistory] = useState<EscalationEvent[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate time remaining until escalation
  const calculateTimeRemaining = useCallback(() => {
    try {
      if (!escalateAt || escalated || isPaused) {
        setTimeRemaining(0);
        return;
      }

      const now = new Date().getTime();
      const escalationTime = new Date(escalateAt).getTime();
      
      // Check for invalid dates
      if (isNaN(escalationTime)) {
        console.warn('Invalid escalation time:', escalateAt);
        setTimeRemaining(0);
        return;
      }
      
      const remaining = Math.max(0, escalationTime - now);
      setTimeRemaining(remaining);
    } catch (error) {
      console.error('Error calculating time remaining:', error);
      setTimeRemaining(0);
    }
  }, [escalateAt, escalated, isPaused]);

  // Update timer every second
  useEffect(() => {
    calculateTimeRemaining();
    
    const interval = setInterval(() => {
      calculateTimeRemaining();
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeRemaining]);

  // Load escalation history
  const loadEscalationHistory = useCallback(async () => {
    if (!showHistory) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/escalations/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId })
      });
      
      if (response.ok) {
        const { history } = await response.json();
        setEscalationHistory(history || []);
      } else {
        throw new Error('Failed to fetch escalation history');
      }
    } catch (error) {
      console.error('Error loading escalation history:', error);
      // Set empty history and show user-friendly error state
      setEscalationHistory([]);
      setError('Failed to load escalation history');
    } finally {
      setLoading(false);
    }
  }, [incidentId, showHistory]);

  useEffect(() => {
    loadEscalationHistory();
  }, [loadEscalationHistory]);

  // Handle pause/resume escalation
  const handlePauseResume = useCallback(async () => {
    try {
      if (isPaused) {
        // Resume escalation
        const response = await fetch('/api/escalations/resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incidentId, reason: 'user' })
        });
        const { success } = response.ok ? await response.json() : { success: false };
        if (success) {
          setIsPaused(false);
          onEscalationChange?.();
        } else {
          console.error('Failed to resume escalation timer');
        }
      } else {
        // Pause escalation
        const response = await fetch('/api/escalations/pause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incidentId, reason: 'user' })
        });
        const { success } = response.ok ? await response.json() : { success: false };
        if (success) {
          setIsPaused(true);
          onEscalationChange?.();
        } else {
          console.error('Failed to pause escalation timer');
        }
      }
    } catch (error) {
      console.error('Error pausing/resuming escalation:', error);
      // Show user-friendly error message or retry mechanism could be added here
    }
  }, [incidentId, isPaused, onEscalationChange]);

  // Format time remaining
  const formatTimeRemaining = useCallback((milliseconds: number) => {
    if (milliseconds <= 0) return '00:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Get urgency level and styling
  const getUrgencyLevel = useCallback(() => {
    if (escalated) return { level: 'escalated', color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-300' };
    if (isPaused) return { level: 'paused', color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-300' };
    if (!escalateAt) return { level: 'no-timer', color: 'text-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };

    const totalMinutes = Math.floor(timeRemaining / (1000 * 60));
    const percentageRemaining = (timeRemaining / (new Date(escalateAt).getTime() - new Date().getTime())) * 100;

    if (totalMinutes <= 1) return { level: 'critical', color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-300' };
    if (totalMinutes <= 5 || percentageRemaining <= 20) return { level: 'urgent', color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-300' };
    if (totalMinutes <= 15 || percentageRemaining <= 50) return { level: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-300' };
    return { level: 'normal', color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-300' };
  }, [escalated, isPaused, escalateAt, timeRemaining]);

  // Get escalation level description
  const getEscalationLevelDescription = useCallback((level: number) => {
    switch (level) {
      case 0:
        return 'Normal';
      case 1:
        return 'Supervisor';
      case 2:
        return 'Manager';
      case 3:
        return 'Director';
      default:
        return `Level ${level}`;
    }
  }, []);

  // Get next escalation target
  const getNextEscalationTarget = useCallback(() => {
    const nextLevel = escalationLevel + 1;
    return getEscalationLevelDescription(nextLevel);
  }, [escalationLevel, getEscalationLevelDescription]);

  const urgency = getUrgencyLevel();

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Timer Display */}
      <div className={`p-4 rounded-lg border ${urgency.bgColor} ${urgency.borderColor}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Escalation Timer</span>
            {escalated && (
              <span className="px-2 py-1 text-xs bg-red-200 text-red-800 rounded-full">
                Escalated
              </span>
            )}
            {isPaused && (
              <span className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded-full">
                Paused
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              {showHistory ? 'Hide' : 'Show'} History
            </button>
            {escalateAt && !escalated && (
              <button
                onClick={handlePauseResume}
                className={`px-2 py-1 text-xs rounded ${
                  isPaused
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            )}
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center">
          {escalated ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold text-red-600">
                ESCALATED
              </div>
              <div className="text-sm text-gray-600">
                Level {escalationLevel} - {getEscalationLevelDescription(escalationLevel)}
              </div>
            </div>
          ) : isPaused ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-600">
                PAUSED
              </div>
              <div className="text-sm text-gray-500">
                Timer paused by user
              </div>
            </div>
          ) : !escalateAt ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-500">
                NO TIMER
              </div>
              <div className="text-sm text-gray-500">
                No escalation configured
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className={`text-3xl font-bold ${urgency.color} ${
                urgency.level === 'critical' ? 'animate-pulse' : ''
              }`}>
                {formatTimeRemaining(timeRemaining)}
              </div>
              <div className="text-sm text-gray-600">
                until escalation to {getNextEscalationTarget()}
              </div>
            </div>
          )}
        </div>

        {/* Incident Info */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-1 font-medium">{incidentType}</span>
            </div>
            <div>
              <span className="text-gray-500">Priority:</span>
              <span className="ml-1 font-medium">{priority}</span>
            </div>
            <div>
              <span className="text-gray-500">Current Level:</span>
              <span className="ml-1 font-medium">
                {escalationLevel} - {getEscalationLevelDescription(escalationLevel)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className={`ml-1 font-medium ${urgency.color}`}>
                {urgency.level.charAt(0).toUpperCase() + urgency.level.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Escalation History */}
      {showHistory && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Escalation History</h4>
          
          {loading ? (
            <div className="text-center text-gray-500 py-4">Loading history...</div>
          ) : escalationHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              {error ? 'Failed to load escalation history' : 'No escalation history'}
            </div>
          ) : (
            <div className="space-y-3">
              {escalationHistory.map((event, index) => (
                <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">{event.escalation_level}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">
                        Escalated to Level {event.escalation_level}
                      </div>
                      <div className="text-xs text-gray-500">
                        {event.escalated_at ? new Date(event.escalated_at).toLocaleString() : ''}
                      </div>
                    </div>
                    {event.notes && (
                      <div className="text-xs text-gray-600 mt-1">{event.notes}</div>
                    )}
                    {event.resolution_time && (
                      <div className="text-xs text-green-600 mt-1">
                        Resolved in {event.resolution_time}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Progress Bar (for active timers) */}
      {escalateAt && !escalated && !isPaused && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Time Remaining</span>
            <span>{formatTimeRemaining(timeRemaining)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${
                urgency.level === 'critical' ? 'bg-red-500' :
                urgency.level === 'urgent' ? 'bg-orange-500' :
                urgency.level === 'warning' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{
                width: `${Math.max(0, Math.min(100, (timeRemaining / (new Date(escalateAt).getTime() - new Date().getTime())) * 100))}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
