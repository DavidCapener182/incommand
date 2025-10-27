'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartBarIcon, ClockIcon, MusicalNoteIcon, UsersIcon } from '@heroicons/react/24/outline';
import { mockEventData } from '@/data/mockEventData';
import { useEventContext } from '@/contexts/EventContext';

interface PerformanceChartProps {
  // Add any props if needed, e.g., eventId
}

export const supportedEventTypes = ['concert'];

export default function PerformanceChart({}: PerformanceChartProps) {
  const { eventType } = useEventContext();
  const data = eventType === 'concert' ? mockEventData.concert : mockEventData.concert; // Fallback to concert

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Performance Status</CardTitle>
        <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <MusicalNoteIcon className="h-4 w-4 mr-1 text-purple-500" />
            <span>Current Act: <span className="font-bold">Main Artist</span></span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1 text-blue-500" />
            <span>Stage Time: <span className="font-bold">45m</span></span>
          </div>
          <div className="flex items-center">
            <UsersIcon className="h-4 w-4 mr-1 text-green-500" />
            <span>Audience: <span className="font-bold">{data.currentCapacityPercentage}%</span></span>
          </div>
          <div className="flex items-center">
            <ChartBarIcon className="h-4 w-4 mr-1 text-orange-500" />
            <span>Energy Level: <span className="font-bold">High</span></span>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xs text-muted-foreground mb-1">Performance Timeline</div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: '75%' }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Start</span>
            <span>75% Complete</span>
            <span>End</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Live performance monitoring and audience engagement metrics.
        </p>
      </CardContent>
    </Card>
  );
}
