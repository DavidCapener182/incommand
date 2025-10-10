'use client'

import React from 'react'
import { ChartBarIcon, MapPinIcon, UsersIcon, BellIcon } from '@heroicons/react/24/outline'

export const WIDGET_LIBRARY = {
  incidentCounter: { name: 'Incident Counter', icon: ChartBarIcon, size: 'small' },
  liveMap: { name: 'Live Map', icon: MapPinIcon, size: 'large' },
  staffStatus: { name: 'Staff Status', icon: UsersIcon, size: 'medium' },
  alertFeed: { name: 'Alert Feed', icon: BellIcon, size: 'medium' },
  heatMap: { name: 'Incident Heat Map', icon: MapPinIcon, size: 'large' },
  trendChart: { name: 'Trend Chart', icon: ChartBarIcon, size: 'medium' },
  priorityGauge: { name: 'Priority Gauge', icon: ChartBarIcon, size: 'small' },
  responseTime: { name: 'Response Time', icon: ChartBarIcon, size: 'small' },
  qualityScore: { name: 'Quality Score', icon: ChartBarIcon, size: 'small' },
  complianceRate: { name: 'Compliance Rate', icon: ChartBarIcon, size: 'small' }
}

export default function WidgetLibrary({ onSelectWidget }: { onSelectWidget: (widget: any) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Object.entries(WIDGET_LIBRARY).map(([key, widget]) => (
        <button
          key={key}
          onClick={() => onSelectWidget({ ...widget, id: key })}
          className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <widget.icon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
          <div className="text-sm font-medium">{widget.name}</div>
        </button>
      ))}
    </div>
  )
}
