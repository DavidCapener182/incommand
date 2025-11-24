'use client'

import React, { useState, useEffect } from 'react'
import { 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Sparkles, 
  Target,
  Search
} from 'lucide-react'

interface PredictiveForecast {
  metric: string
  currentValue: number
  predictedValue: number
  confidence: number
  timeframe: string
  factors: string[]
  recommendation: string
}

interface PredictionsCardProps {
  forecast?: PredictiveForecast | null
  className?: string
}

// Sub-Component for Prediction Row
interface PredictionMetricProps {
  label: string
  value: string
  subtext?: React.ReactNode
  highlight?: boolean
}

const PredictionMetric = ({ label, value, subtext, highlight = false }: PredictionMetricProps) => (
  <div className="flex justify-between items-baseline py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
    <div className="text-right">
      <span className={`text-base font-bold ${highlight ? 'text-purple-600 dark:text-purple-400' : 'text-slate-900 dark:text-white'}`}>
        {value}
      </span>
      {subtext && (
        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
          {subtext}
        </div>
      )}
    </div>
  </div>
)

export default function PredictionsCard({ forecast, className = '' }: PredictionsCardProps) {
  const [mounted, setMounted] = useState(false)
  const [confidenceWidth, setConfidenceWidth] = useState(0)

  useEffect(() => {
    setMounted(true)
    
    if (forecast) {
      const timer = setTimeout(() => {
        setConfidenceWidth(forecast.confidence)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [forecast])

  if (!mounted) return null

  // Calculate percent change for visual indicator
  const getTrendIndicator = () => {
    if (!forecast) return null
    const diff = forecast.predictedValue - forecast.currentValue
    const percent = (diff / (forecast.currentValue || 1)) * 100
    
    if (percent > 5) return { icon: TrendingUp, color: 'text-red-500', label: `+${percent.toFixed(0)}%` }
    if (percent < -5) return { icon: TrendingDown, color: 'text-emerald-500', label: `${percent.toFixed(0)}%` }
    return { icon: Minus, color: 'text-slate-400', label: 'Stable' }
  }

  const trend = getTrendIndicator()
  const TrendIcon = trend?.icon

  return (
    <div className={`w-full ${className}`}>
      {/* Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:scale-[1.005] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400 relative overflow-hidden group">
              <Eye className="w-5 h-5 relative z-10" />
              <div className="absolute inset-0 bg-purple-400/20 blur-md rounded-full transform scale-0 group-hover:animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Future Forecast
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                AI-driven predictive analysis
              </p>
            </div>
          </div>
          
          {/* Forecast Badge */}
          {forecast && (
            <div className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-100 dark:border-purple-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Active
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6">
          {forecast ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Column: Metrics */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Target className="w-3 h-3" /> Next 4 Hours
                  </h4>
                  
                  <div className="space-y-1">
                    <PredictionMetric 
                      label="Current Volume" 
                      value={`${forecast.currentValue} incidents`} 
                    />
                    <PredictionMetric 
                      label="Predicted Volume" 
                      value={`${forecast.predictedValue.toFixed(1)} incidents`} 
                      highlight 
                      subtext={
                        <span className={`flex items-center justify-end gap-1 ${trend?.color || ''}`}>
                          {trend?.label} {TrendIcon && <TrendIcon className="w-3 h-3" />}
                        </span>
                      }
                    />
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Model Confidence</span>
                    <span className="text-purple-600 dark:text-purple-400">{forecast.confidence.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all duration-1000 ease-out relative"
                      style={{ width: `${confidenceWidth}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/50 text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
                  <span className="font-semibold block mb-1 text-xs uppercase opacity-70">Recommendation</span>
                  {forecast.recommendation}
                </div>
              </div>

              {/* Right Column: Factors */}
              <div className="flex flex-col h-full">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Search className="w-3 h-3" /> Key Drivers
                </h4>
                
                <div className="flex flex-col gap-2">
                  {forecast.factors.map((factor, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 animate-in fade-in slide-in-from-right-4 fill-mode-backwards"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {factor}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-auto pt-6 text-xs text-slate-400 text-center italic">
                  Forecast updates every 15 minutes based on live data streams.
                </div>
              </div>

            </div>
          ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 text-slate-400">
                <Eye className="w-8 h-8 opacity-50" />
              </div>
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                Waiting for Signal
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                The forecast engine requires a minimum of 4 hours of continuous incident data to generate reliable predictions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

