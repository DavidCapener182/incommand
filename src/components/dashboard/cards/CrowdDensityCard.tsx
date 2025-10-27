'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersIcon, ExclamationTriangleIcon, MapIcon, EyeIcon } from '@heroicons/react/24/outline';
import { mockEventData } from '@/data/mockEventData';
import { useEventContext } from '@/contexts/EventContext';

interface CrowdDensityCardProps {
  // Add any props if needed, e.g., eventId
}

export const supportedEventTypes = ['concert'];

export default function CrowdDensityCard({}: CrowdDensityCardProps) {
  const { eventType } = useEventContext();
  const data = eventType === 'concert' ? mockEventData.concert : mockEventData.concert; // Fallback to concert

  // Calculate density level based on capacity
  const getDensityLevel = (capacity: number) => {
    if (capacity < 50) return { level: 'Low', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/20' };
    if (capacity < 75) return { level: 'Moderate', color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' };
    if (capacity < 90) return { level: 'High', color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/20' };
    return { level: 'Critical', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/20' };
  };

  const densityInfo = getDensityLevel(data.currentCapacityPercentage);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Crowd Density</CardTitle>
        <UsersIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div className="space-y-3">
          <div className={`p-3 rounded-lg ${densityInfo.bgColor}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Density</span>
              <span className={`text-lg font-bold ${densityInfo.color}`}>
                {densityInfo.level}
              </span>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>0%</span>
                <span>{data.currentCapacityPercentage}%</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    data.currentCapacityPercentage < 50 ? 'bg-green-500' :
                    data.currentCapacityPercentage < 75 ? 'bg-yellow-500' :
                    data.currentCapacityPercentage < 90 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${data.currentCapacityPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <MapIcon className="h-4 w-4 mr-1 text-blue-500" />
              <span>Heatmap: <span className="font-bold">{data.crowdDensityHeatmap}</span></span>
            </div>
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-orange-500" />
              <span>Alerts: <span className="font-bold">{data.zoneCongestionAlerts}</span></span>
            </div>
            <div className="flex items-center col-span-2">
              <EyeIcon className="h-4 w-4 mr-1 text-purple-500" />
              <span>Overlap Density: <span className="font-bold">{data.overlappingCrowdDensity}%</span></span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Real-time crowd density monitoring and congestion alerts.
        </p>
      </CardContent>
    </Card>
  );
}
