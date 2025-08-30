import React from 'react';
import { RiskScore } from '../lib/riskScoring';

interface RiskScoreIndicatorProps {
  riskScore: RiskScore | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function RiskScoreIndicator({
  riskScore,
  loading = false,
  error = null,
  className = "",
  showDetails = true,
  size = 'medium'
}: RiskScoreIndicatorProps) {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="text-center text-red-500">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-sm">Error loading risk score</div>
          <div className="text-xs text-gray-500 mt-1">{error}</div>
        </div>
      </div>
    );
  }

  if (!riskScore) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-sm">No risk data available</div>
        </div>
      </div>
    );
  }

  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: 'low', color: 'green', label: 'Low Risk' };
    if (score < 60) return { level: 'medium', color: 'yellow', label: 'Medium Risk' };
    if (score < 80) return { level: 'high', color: 'orange', label: 'High Risk' };
    return { level: 'critical', color: 'red', label: 'Critical Risk' };
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 60) return 'text-yellow-600';
    if (score < 80) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskBgColor = (score: number) => {
    if (score < 30) return 'bg-green-50';
    if (score < 60) return 'bg-yellow-50';
    if (score < 80) return 'bg-orange-50';
    return 'bg-red-50';
  };

  const getRiskBorderColor = (score: number) => {
    if (score < 30) return 'border-green-200';
    if (score < 60) return 'border-yellow-200';
    if (score < 80) return 'border-orange-200';
    return 'border-red-200';
  };

  const getProgressColor = (score: number) => {
    if (score < 30) return 'bg-green-500';
    if (score < 60) return 'bg-yellow-500';
    if (score < 80) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const riskInfo = getRiskLevel(riskScore.overallScore);

  const sizeClasses = {
    small: {
      container: 'p-3',
      title: 'text-sm',
      score: 'text-2xl',
      subtitle: 'text-xs'
    },
    medium: {
      container: 'p-4',
      title: 'text-sm',
      score: 'text-3xl',
      subtitle: 'text-xs'
    },
    large: {
      container: 'p-6',
      title: 'text-base',
      score: 'text-4xl',
      subtitle: 'text-sm'
    }
  };

  const currentSize = sizeClasses[size];

  const weatherScore = (riskScore as any).weatherScore ?? 0;
  const crowdScore = (riskScore as any).crowdScore ?? 0;
  const timeScore = (riskScore as any).timeScore ?? 0;
  const locationScore = (riskScore as any).locationScore ?? 0;
  const eventPhaseScore = (riskScore as any).eventPhaseScore ?? 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${getRiskBorderColor(riskScore.overallScore)} ${currentSize.container} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className={`font-medium text-gray-900 ${currentSize.title}`}>Overall Risk Score</h3>
            <p className={`text-gray-500 ${currentSize.subtitle}`}>Real-time assessment</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-bold ${getRiskColor(riskScore.overallScore)} ${currentSize.score}`}>
            {riskScore.overallScore.toFixed(1)}%
          </div>
          <div className={`text-xs font-medium ${getRiskColor(riskScore.overallScore)}`}>
            {riskInfo.label}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Risk Level</span>
          <span className="text-xs text-gray-500">Confidence: {(riskScore.confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(riskScore.overallScore)}`}
            style={{ width: `${riskScore.overallScore}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
          <span>Critical</span>
        </div>
      </div>

      {/* Risk Breakdown */}
      {showDetails && (
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700 mb-2">Risk Factors Breakdown</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-sm font-semibold text-blue-600">{weatherScore.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">Weather</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-purple-600">{crowdScore.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">Crowd</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-orange-600">{timeScore.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">Time</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-red-600">{locationScore.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">Location</div>
            </div>
          </div>

          {/* Contributing Factors */}
          {riskScore.contributingFactors.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-medium text-gray-700 mb-2">Top Contributing Factors</div>
              <div className="space-y-2">
                {riskScore.contributingFactors.slice(0, 3).map((factor, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        factor.factorType === 'weather' ? 'bg-blue-500' :
                        factor.factorType === 'crowd_density' ? 'bg-purple-500' :
                        factor.factorType === 'time_of_day' ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}></div>
                      <span className="text-xs font-medium capitalize">{factor.factorType}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {factor.factorValue.condition || factor.factorValue.densityRange || factor.factorValue.timeSlot || factor.factorValue.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Phase Risk */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-900">Event Phase Risk</span>
              <span className={`text-xs font-semibold ${getRiskColor(eventPhaseScore)}`}>
                {eventPhaseScore.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-blue-700 mt-1">
              Based on current event timing and phase
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {riskScore.overallScore >= 60 && (
        <div className="border-t border-gray-200 pt-3 mt-4">
          <div className="text-xs font-medium text-gray-700 mb-2">Recommended Actions</div>
          <div className="space-y-1">
            {riskScore.overallScore >= 80 && (
              <div className="text-xs text-red-600">• Activate emergency response protocols</div>
            )}
            {riskScore.overallScore >= 60 && (
              <>
                <div className="text-xs text-gray-600">• Increase security presence</div>
                <div className="text-xs text-gray-600">• Deploy additional medical staff</div>
                <div className="text-xs text-gray-600">• Monitor high-risk areas closely</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-3 mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Valid until: {riskScore.lastUpdated.toLocaleTimeString()}</span>
          <span>Auto-refresh: 5min</span>
        </div>
      </div>
    </div>
  );
}
