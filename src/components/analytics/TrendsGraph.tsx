'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Card } from '@/components/ui/card'
import { TrendingUp, BarChart3 } from 'lucide-react'

interface TrendsGraphProps {
  trends: {
    incidentVolumeData: Array<{ hour: string; count: number }>
    responseTimeData: Array<{ bucket: string; count: number }>
  }
}

export default function TrendsGraph({ trends }: TrendsGraphProps) {
  const chartData = useMemo(() => trends, [trends])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Incident Volume Over Time */}
      <Card className="rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-150 p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Incident Volume Over Time</h3>
        </div>
        <div className="h-[280px]">
          <ChartContainer config={{}}>
            <BarChart data={chartData.incidentVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={50}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ChartContainer>
        </div>
      </Card>

      {/* Response Time Distribution */}
      <Card className="rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-150 p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Response Time Distribution</h3>
        </div>
        <div className="h-[280px] w-full overflow-hidden">
          <ChartContainer config={{}}>
            <BarChart data={chartData.responseTimeData} layout="horizontal" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis type="number" domain={['dataMin', 'dataMax']} />
              <YAxis dataKey="bucket" type="category" width={90} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="#F59E0B" />
            </BarChart>
          </ChartContainer>
        </div>
      </Card>
    </div>
  )
}
