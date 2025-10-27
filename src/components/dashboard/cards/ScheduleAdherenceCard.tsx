'use client'

import React from 'react'
import { CalendarIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { mockEventData } from '@/data/mockEventData'
import MetricCard from './shared/MetricCard'

interface ScheduleAdherenceCardProps {
  className?: string
}

export default function ScheduleAdherenceCard({ className }: ScheduleAdherenceCardProps) {
  const schedule = mockEventData.festival?.schedule

  const adherence = schedule?.adherence ?? 0
  const onTime = schedule?.onTime ?? 0
  const delayed = schedule?.delayed ?? 0
  const cancelled = schedule?.cancelled ?? 0

  const emphasis = adherence >= 90 ? 'success' : adherence >= 75 ? 'warning' : 'danger'

  return (
    <MetricCard
      className={className}
      title="Schedule Adherence"
      icon={<CalendarIcon className="h-5 w-5 text-indigo-600" />}
      primaryMetric={{
        label: 'Current adherence',
        value: `${adherence}%`,
        emphasis
      }}
      secondaryMetrics={[
        {
          label: 'On time',
          value: (
            <span className="inline-flex items-center gap-1">
              <CheckCircleIcon className="h-4 w-4 text-emerald-500" /> {onTime}
            </span>
          )
        },
        {
          label: 'Delayed',
          value: (
            <span className="inline-flex items-center gap-1">
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" /> {delayed}
            </span>
          ),
          emphasis: delayed > 0 ? 'warning' : 'default'
        }
      ]}
      footer={<span>Cancelled sets: {cancelled}</span>}
    />
  )
}

export const supportedEventTypes = ['festival']
