import React, { useState } from 'react';
import { LocationRiskScore } from '../lib/riskScoring';

interface IncidentProbabilityMapProps {
  locationRisks: LocationRiskScore[];
  loading?: boolean;
  error?: string | null;
  className?: string;
  onLocationClick?: (location: string) => void;
}

interface VenueArea {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  riskScore: number;
  incidentTypes: string[];
}

export default function IncidentProbabilityMap({
  locationRisks,
  loading = false,
  error = null,
  className = "",
  onLocationClick
}: IncidentProbabilityMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-32 bg-gray-200 rounded mb-2"></div>
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
          <div className="text-sm">Error loading risk map</div>
          <div className="text-xs text-gray-500 mt-1">{error}</div>
        </div>
      </div>
    );
  }

  if (!locationRisks || locationRisks.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📍</div>
          <div className="text-sm">No location risk data available</div>
        </div>
      </div>
    );
  }

  // Create venue areas from location risks
  const venueAreas: VenueArea[] = locationRisks.map((location, index) => {
    // Simple grid layout - in a real implementation, this would be based on actual venue coordinates
    const gridSize = Math.ceil(Math.sqrt(locationRisks.length));
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    
    return {
      id: location.location,
      name: location.location,
      x: (col / gridSize) * 80 + 10, // 10% margin
      y: (row / gridSize) * 60 + 10,
      width: 80 / gridSize - 2,
      height: 60 / gridSize - 2,
      riskScore: location.riskScore,
      incidentTypes: location.incidentTypes
    };
  });

  const getRiskColor = (riskScore: number) => {
    if (riskScore < 30) return 'bg-green-500';
    if (riskScore < 60) return 'bg-yellow-500';
    if (riskScore < 80) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRiskBorderColor = (riskScore: number) => {
    if (riskScore < 30) return 'border-green-600';
    if (riskScore < 60) return 'border-yellow-600';
    if (riskScore < 80) return 'border-orange-600';
    return 'border-red-600';
  };

  const getRiskTextColor = (riskScore: number) => {
    if (riskScore < 30) return 'text-green-700';
    if (riskScore < 60) return 'text-yellow-700';
    if (riskScore < 80) return 'text-orange-700';
    return 'text-red-700';
  };

  const handleLocationClick = (locationId: string) => {
    setSelectedLocation(selectedLocation === locationId ? null : locationId);
    onLocationClick?.(locationId);
  };

  const selectedArea = venueAreas.find(area => area.id === selectedLocation);
  const hoveredArea = venueAreas.find(area => area.id === hoveredLocation);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">📍</span>
          <div>
            <h3 className="text-sm font-medium text-gray-900">Incident Risk Map</h3>
            <p className="text-xs text-gray-500">Venue risk assessment</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">High Risk Areas</div>
          <div className="text-sm font-semibold text-red-600">
            {locationRisks.filter(loc => loc.riskScore >= 60).length}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-gray-100 rounded-lg p-4 mb-4" style={{ height: '200px' }}>
        {/* Venue Areas */}
        {venueAreas.map((area) => (
          <div
            key={area.id}
            className={`absolute cursor-pointer transition-all duration-200 border-2 ${getRiskBorderColor(area.riskScore)} ${
              selectedLocation === area.id ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
            } ${hoveredLocation === area.id ? 'scale-105' : ''}`}
            style={{
              left: `${area.x}%`,
              top: `${area.y}%`,
              width: `${area.width}%`,
              height: `${area.height}%`,
              backgroundColor: area.riskScore < 30 ? '#10b981' :
                              area.riskScore < 60 ? '#f59e0b' :
                              area.riskScore < 80 ? '#f97316' : '#ef4444',
              opacity: 0.8
            }}
            onClick={() => handleLocationClick(area.id)}
            onMouseEnter={() => setHoveredLocation(area.id)}
            onMouseLeave={() => setHoveredLocation(null)}
            title={`${area.name}: ${area.riskScore.toFixed(0)}% risk`}
          >
            <div className="flex items-center justify-center h-full">
              <span className="text-xs font-bold text-white">
                {area.riskScore.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="absolute bottom-2 right-2 bg-white rounded-lg p-2 shadow-sm">
          <div className="text-xs font-medium text-gray-700 mb-1">Risk Levels</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-600">Low (0-30%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-xs text-gray-600">Medium (30-60%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-xs text-gray-600">High (60-80%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-xs text-gray-600">Critical (80%+)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Location Details */}
      {selectedArea && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-blue-900">{selectedArea.name}</h4>
            <div className={`px-2 py-1 rounded text-xs font-semibold ${getRiskTextColor(selectedArea.riskScore)} bg-white`}>
              {selectedArea.riskScore.toFixed(0)}% Risk
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-blue-700">
              <span className="font-medium">Incident Types:</span> {selectedArea.incidentTypes.join(', ')}
            </div>
            <div className="text-xs text-blue-600">
              <span className="font-medium">Risk Level:</span> {
                selectedArea.riskScore < 30 ? 'Low' :
                selectedArea.riskScore < 60 ? 'Medium' :
                selectedArea.riskScore < 80 ? 'High' : 'Critical'
              }
            </div>
          </div>
        </div>
      )}

      {/* Hover Tooltip */}
      {hoveredArea && !selectedArea && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900">{hoveredArea.name}</h4>
            <div className={`px-2 py-1 rounded text-xs font-semibold ${getRiskTextColor(hoveredArea.riskScore)} bg-white`}>
              {hoveredArea.riskScore.toFixed(0)}% Risk
            </div>
          </div>
          <div className="text-xs text-gray-600">
            Click for details • {hoveredArea.incidentTypes.length} incident type{hoveredArea.incidentTypes.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Risk Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">
            {locationRisks.filter(loc => loc.riskScore < 30).length}
          </div>
          <div className="text-xs text-gray-500">Low Risk</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-600">
            {locationRisks.filter(loc => loc.riskScore >= 30 && loc.riskScore < 60).length}
          </div>
          <div className="text-xs text-gray-500">Medium Risk</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">
            {locationRisks.filter(loc => loc.riskScore >= 60).length}
          </div>
          <div className="text-xs text-gray-500">High Risk</div>
        </div>
      </div>

      {/* Quick Actions */}
      {locationRisks.some(loc => loc.riskScore >= 60) && (
        <div className="border-t border-gray-200 pt-3">
          <div className="text-sm font-medium text-gray-700 mb-2">Recommended Actions</div>
          <div className="space-y-1">
            <div className="text-xs text-gray-600">• Increase security presence in high-risk areas</div>
            <div className="text-xs text-gray-600">• Deploy additional medical staff</div>
            <div className="text-xs text-gray-600">• Monitor high-risk locations closely</div>
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
