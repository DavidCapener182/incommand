'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Card } from '@/components/ui/card'
import { Activity, UserX } from 'lucide-react'

interface ActivityHeatmapProps {
  activity: {
    attendanceTimelineData: Array<{ time: string; count: number; capacity: number }>
    ejectionPatternData: Array<{ hour: string; ejections: number }>
  }
}

export default function ActivityHeatmap({ activity }: ActivityHeatmapProps) {
  const chartData = useMemo(() => activity, [activity])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Attendance Timeline */}
      <Card className="rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-150 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attendance Timeline</h3>
        </div>
        <div className="h-[280px]">
          <ChartContainer config={{}}>
            <AreaChart data={chartData.attendanceTimelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey="count" 
                stackId="1" 
                stroke="#8B5CF6" 
                fill="#8B5CF6" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </Card>

      {/* Ejection/Refusal Patterns */}
      <Card className="rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-150 p-6">
        <div className="flex items-center gap-3 mb-4">
          <UserX className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ejection/Refusal Patterns</h3>
        </div>
        <div className="h-[280px]">
          <ChartContainer config={{}}>
            <LineChart data={chartData.ejectionPatternData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="ejections" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </Card>
    </div>
  )
}
