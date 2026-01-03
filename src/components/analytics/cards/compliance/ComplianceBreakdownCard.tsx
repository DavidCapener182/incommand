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
import { ShieldCheck, ListChecks, Target } from 'lucide-react'

interface ComplianceBreakdownItem {
  name: string
  score: number
}

interface ComplianceBreakdownCardProps {
  breakdown?: ComplianceBreakdownItem[]
  className?: string
}

// --- Helper for Colors ---
const getScoreColor = (score: number) => {
  if (score >= 90) return '#10B981' // Emerald
  if (score >= 75) return '#3B82F6' // Blue
  if (score >= 60) return '#F59E0B' // Amber
  return '#EF4444' // Red
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const score = payload[0].value
    const color = getScoreColor(score)
    
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
          Category: {label}
        </p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {score.toFixed(1)}% <span className="font-normal text-slate-500">Compliance</span>
          </p>
        </div>
      </div>
    )
  }
  return null
}

export default function ComplianceBreakdownCard({ breakdown = [], className = '' }: ComplianceBreakdownCardProps) {
  const [mounted, setMounted] = useState(false)
  const [focusBar, setFocusBar] = useState<number | null>(null)

  // hydration fix
  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate average for summary
  const averageCompliance = useMemo(() => {
    if (!breakdown.length) return 0
    const total = breakdown.reduce((acc, curr) => acc + curr.score, 0)
    return (total / breakdown.length).toFixed(1)
  }, [breakdown])

  if (!mounted) return null

  return (
    <div className={`w-full ${className}`}>
      {/* Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:scale-[1.005] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg text-teal-600 dark:text-teal-400">
              <ListChecks className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Compliance Breakdown
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Detailed category analysis
              </p>
            </div>
          </div>
          
          {/* Summary Badge */}
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {averageCompliance}%
            </span>
            <span className="text-xs font-medium text-teal-500 flex items-center gap-1 mt-1">
              <Target className="w-3 h-3" /> Overall Avg.
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={breakdown} 
                layout="vertical"
                margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                barSize={24}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  horizontal={false} 
                  stroke="rgba(148, 163, 184, 0.15)" 
                />
                
                <XAxis 
                  type="number"
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                
                <YAxis 
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  width={100}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                />

                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: 'transparent' }}
                />

                <Bar 
                  dataKey="score" 
                  radius={[0, 4, 4, 0]}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  onMouseEnter={(_: any, index: number) => setFocusBar(index)}
                  onMouseLeave={() => setFocusBar(null)}
                  background={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                >
                  {breakdown.map((entry, index) => (
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
