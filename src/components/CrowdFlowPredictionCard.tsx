import React from 'react';
import { CrowdFlowPrediction, OccupancyForecast } from '../lib/crowdFlowPrediction';

interface CrowdFlowPredictionCardProps {
  predictions: CrowdFlowPrediction[];
  forecast: OccupancyForecast | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export default function CrowdFlowPredictionCard({
  predictions,
  forecast,
  loading = false,
  error = null,
  className = ""
}: CrowdFlowPredictionCardProps) {
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
          <div className="text-sm">Error loading predictions</div>
          <div className="text-xs text-gray-500 mt-1">{error}</div>
        </div>
      </div>
    );
  }

  if (!forecast || predictions.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">👥</div>
          <div className="text-sm">No crowd predictions available</div>
        </div>
      </div>
    );
  }

  const currentTime = new Date();
  const nextHour = new Date(currentTime.getTime() + 60 * 60 * 1000);
  const nextFourHours = new Date(currentTime.getTime() + 4 * 60 * 60 * 1000);

  const nextHourPrediction = predictions.find(p => 
    p.timestamp >= currentTime && p.timestamp <= nextHour
  );

  const peakPrediction = predictions.reduce((max, pred) => 
    pred.predictedCount > max.predictedCount ? pred : max
  );

  const getOccupancyColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-600';
    if (percentage < 75) return 'text-yellow-600';
    if (percentage < 90) return 'text-orange-600';
    return 'text-red-600';
  };

  const getOccupancyBgColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-50';
    if (percentage < 75) return 'bg-yellow-50';
    if (percentage < 90) return 'bg-orange-50';
    return 'bg-red-50';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">👥</span>
          <div>
            <h3 className="text-sm font-medium text-gray-900">Crowd Flow Prediction</h3>
            <p className="text-xs text-gray-500">Next 4 hours forecast</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Confidence</div>
          <div className="text-sm font-semibold text-blue-600">
            {(forecast.confidence * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Current vs Predicted */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">
            {nextHourPrediction?.predictedCount.toLocaleString() || 'N/A'}
          </div>
          <div className="text-xs text-gray-500">Next Hour</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">
            {peakPrediction.predictedCount.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Peak Expected</div>
        </div>
      </div>

      {/* Peak Time Indicator */}
      {forecast.peakTime && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Peak Time</span>
            <span className="text-sm font-semibold text-blue-700">
              {new Date(forecast.peakTime).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Expected occupancy: {forecast.peakOccupancy.toLocaleString()}
          </div>
        </div>
      )}

      {/* Capacity Warnings */}
      {(forecast.capacityWarnings?.length ?? 0) > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-red-700 mb-2">⚠️ Capacity Warnings</div>
          <div className="space-y-2">
            {forecast.capacityWarnings!.slice(0, 2).map((warning, index) => (
              <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {warning}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Chart */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Prediction Timeline</div>
        <div className="space-y-2">
          {predictions.slice(0, 4).map((prediction, index) => {
            const timeDiff = prediction.timestamp.getTime() - currentTime.getTime();
            const hoursFromNow = Math.round(timeDiff / (1000 * 60 * 60));
            const percentage = (prediction.predictedCount / (forecast.peakOccupancy || 1000)) * 100;
            
            return (
              <div key={index} className="flex items-center space-x-3">
                <div className="text-xs text-gray-500 w-12">
                  {hoursFromNow === 0 ? 'Now' : `+${hoursFromNow}h`}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">
                      {prediction.predictedCount.toLocaleString()}
                    </span>
                    <span className={`text-xs font-semibold ${getOccupancyColor(percentage)}`}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getOccupancyBgColor(percentage).replace('bg-', 'bg-').replace('-50', '-500')}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      {(forecast.capacityWarnings?.length ?? 0) > 0 && (
        <div className="border-t border-gray-200 pt-3">
          <div className="text-sm font-medium text-gray-700 mb-2">Recommended Actions</div>
          <div className="space-y-1">
            <div className="text-xs text-gray-600">• Deploy additional crowd control staff</div>
            <div className="text-xs text-gray-600">• Open additional entrances</div>
            <div className="text-xs text-gray-600">• Monitor entry rates closely</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-3 mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <span>Auto-refresh: 5min</span>
        </div>
      </div>
    </div>
  );
}
