'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { TrendingUp, Activity } from 'lucide-react'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
          Time: {label}
        </p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {payload[0].value} <span className="font-normal text-slate-500">Incidents</span>
          </p>
        </div>
      </div>
    )
  }
  return null
}

interface IncidentVolumeCardProps {
  incidentVolumeData?: Array<{ hour: string; count: number }>
  className?: string
}

export default function IncidentVolumeCard({ incidentVolumeData = [], className = '' }: IncidentVolumeCardProps) {
  const [mounted, setMounted] = useState(false)
  const [focusBar, setFocusBar] = useState<number | null>(null)

  // hydration fix
  useEffect(() => {
    setMounted(true)
  }, [])

  const chartData = useMemo(() => incidentVolumeData, [incidentVolumeData])

  // Calculate total for summary
  const totalIncidents = useMemo(() => 
    chartData.reduce((acc, curr) => acc + curr.count, 0), 
    [chartData]
  )

  if (!mounted) return null

  return (
    <div className={`w-full ${className}`}>
      {/* Card Container with entrance animation and hover lift */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:scale-[1.005] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Incident Volume
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Traffic over the last 24 hours
              </p>
            </div>
          </div>
          
          {/* Summary Badge */}
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {totalIncidents}
            </span>
            <span className="text-xs font-medium text-green-500 flex items-center gap-1 mt-1">
              <Activity className="w-3 h-3" /> Total Events
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.6} />
                  </linearGradient>
                </defs>

                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="rgba(148, 163, 184, 0.15)" 
                />
                
                <XAxis 
                  dataKey="hour" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  dy={10}
                />
                
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />

                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: 'transparent' }}
                />

                <Bar 
                  dataKey="count" 
                  radius={[6, 6, 0, 0]}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  onMouseEnter={(_, index) => setFocusBar(index)}
                  onMouseLeave={() => setFocusBar(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill="url(#barGradient)"
                      fillOpacity={focusBar === index ? 1 : (focusBar === null ? 0.9 : 0.5)}
                      className="transition-all duration-300 cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

