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
import { BarChart2, Layers, Zap } from 'lucide-react'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

// --- Helper for Colors ---
const getScoreColor = (score: number): string => {
  if (score >= 90) return '#10B981' // Emerald
  if (score >= 75) return '#3B82F6' // Blue
  if (score >= 60) return '#F59E0B' // Amber
  return '#EF4444' // Red
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const score = payload[0].value
    const color = getScoreColor(score)
    
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
          Metric: {label}
        </p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {score} <span className="font-normal text-slate-500">/ 100</span>
          </p>
        </div>
      </div>
    )
  }
  return null
}

interface ScoreComponentsCardProps {
  completeness?: number
  timeliness?: number
  factualLanguage?: number
  className?: string
}

export default function ScoreComponentsCard({ 
  completeness = 0, 
  timeliness = 0, 
  factualLanguage = 0, 
  className = '' 
}: ScoreComponentsCardProps) {
  const [mounted, setMounted] = useState(false)
  const [focusBar, setFocusBar] = useState<number | null>(null)

  // hydration fix
  useEffect(() => {
    setMounted(true)
  }, [])

  const scoreBreakdown = useMemo(() => [
    { name: 'Completeness', score: completeness },
    { name: 'Timeliness', score: timeliness },
    { name: 'Factual Language', score: factualLanguage }
  ], [completeness, timeliness, factualLanguage])

  // Calculate average for summary
  const averageScore = useMemo(() => 
    Math.round((completeness + timeliness + factualLanguage) / 3), 
    [completeness, timeliness, factualLanguage])

  if (!mounted) return null

  return (
    <div className={`w-full ${className}`}>
      {/* Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:scale-[1.005] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Score Components
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Breakdown by category
              </p>
            </div>
          </div>
          
          {/* Summary Badge */}
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {averageScore}
            </span>
            <span className="text-xs font-medium text-indigo-500 flex items-center gap-1 mt-1">
              <Zap className="w-3 h-3" /> Avg. Component
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={scoreBreakdown} 
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barSize={60}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="rgba(148, 163, 184, 0.15)" 
                />
                
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                  dy={10}
                />
                
                <YAxis 
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />

                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: 'transparent' }}
                />

                <Bar 
                  dataKey="score" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  onMouseEnter={(_, index) => setFocusBar(index)}
                  onMouseLeave={() => setFocusBar(null)}
                >
                  {scoreBreakdown.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getScoreColor(entry.score)}
                      fillOpacity={focusBar === index ? 1 : (focusBar === null ? 0.85 : 0.4)}
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

