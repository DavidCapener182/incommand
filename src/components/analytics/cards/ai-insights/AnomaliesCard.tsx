'use client'

import React, { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  ShieldCheck, 
  AlertOctagon, 
  AlertCircle, 
  Info 
} from 'lucide-react'

interface AnomalyDetection {
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  recommendation: string
}

interface AnomaliesCardProps {
  anomalies: AnomalyDetection[]
  className?: string
}

// Configuration
const SEVERITY_CONFIG = {
  low: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-100 dark:border-blue-900/30',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
  },
  medium: {
    icon: AlertTriangle,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-100 dark:border-orange-900/30',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'
  },
  high: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-100 dark:border-red-900/30',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  },
  critical: {
    icon: AlertOctagon,
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-900/30',
    badge: 'bg-rose-100 text-rose-900 dark:bg-rose-900/50 dark:text-rose-200 animate-pulse'
  }
}

// Sub-Component for Individual Anomaly
interface AnomalyItemProps {
  anomaly: AnomalyDetection
  index: number
}

const AnomalyItem = ({ anomaly, index }: AnomalyItemProps) => {
  const config = SEVERITY_CONFIG[anomaly.severity] || SEVERITY_CONFIG.low
  const Icon = config.icon

  return (
    <div 
      className={`
        group flex flex-col gap-3 p-4 rounded-xl border transition-all duration-300
        hover:shadow-md hover:scale-[1.01] bg-white dark:bg-slate-800
        ${config.border}
        animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards
      `}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 p-2 rounded-lg flex-shrink-0 ${config.bg} ${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {anomaly.description}
            </h4>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${config.badge}`}>
              {anomaly.severity}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono">
            {new Date(anomaly.timestamp).toLocaleString(undefined, { 
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            })}
          </p>
          
          {/* Recommendation Section */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Action:</span> {anomaly.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AnomaliesCard({ anomalies, className = '' }: AnomaliesCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4 flex flex-col h-full">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Anomalies Detected
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Unusual activity alerts
              </p>
            </div>
          </div>
          
          {/* Count Badge */}
          {anomalies.length > 0 ? (
            <div className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
              {anomalies.length} Alert{anomalies.length !== 1 ? 's' : ''}
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> All Clear
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 flex-1 overflow-y-auto">
          {anomalies.length > 0 ? (
            <div className="space-y-4">
              {anomalies.slice(0, 5).map((anomaly, index) => (
                <AnomalyItem 
                  key={index} 
                  anomaly={anomaly} 
                  index={index} 
                />
              ))}
              {anomalies.length > 5 && (
                <div className="text-center pt-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors">
                    + {anomalies.length - 5} more anomalies detected
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-emerald-100 dark:border-emerald-900/30 rounded-xl bg-emerald-50/30 dark:bg-emerald-900/10">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-full mb-3 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                System Nominal
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                No unusual spikes or deviations detected in the current timeframe. Monitoring continues.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

