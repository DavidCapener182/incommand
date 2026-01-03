'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Scale, Download, ShieldCheck, FileCheck, AlertOctagon } from 'lucide-react'

interface LegalReadinessCardProps {
  legalReadinessScore: 'A' | 'B' | 'C' | 'D' | 'F'
  overallCompliance: number
  totalIncidents: number
  onExport?: () => void
  className?: string
}

// --- Configuration Helper ---
const GRADE_CONFIG = {
  A: {
    label: 'Excellent',
    gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
    border: 'border-emerald-100 dark:border-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    icon: ShieldCheck
  },
  B: {
    label: 'Good',
    gradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    border: 'border-blue-100 dark:border-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    icon: FileCheck
  },
  C: {
    label: 'Fair',
    gradient: 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20',
    border: 'border-amber-100 dark:border-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    icon: Scale
  },
  D: {
    label: 'Poor',
    gradient: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
    border: 'border-orange-100 dark:border-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-900/50',
    icon: AlertOctagon
  },
  F: {
    label: 'Critical',
    gradient: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
    border: 'border-red-100 dark:border-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/50',
    icon: AlertOctagon
  }
}

export default function LegalReadinessCard({ 
  legalReadinessScore = 'C', 
  overallCompliance = 0, 
  totalIncidents = 0, 
  onExport,
  className = '' 
}: LegalReadinessCardProps) {
  const [mounted, setMounted] = useState(false)
  const [displayCompliance, setDisplayCompliance] = useState(0)

  const config = useMemo(() => GRADE_CONFIG[legalReadinessScore] || GRADE_CONFIG.C, [legalReadinessScore])
  const Icon = config.icon

  // Hydration & Animation
  useEffect(() => {
    setMounted(true)
    
    // Animate percentage count up
    let start = 0
    const duration = 1500
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 4)
      
      setDisplayCompliance(start + (overallCompliance - start) * easeOut)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [overallCompliance])

  if (!mounted) return null

  return (
    <div className={`w-full ${className}`}>
      {/* Main Colored Card Container */}
      <div className={`
        relative overflow-hidden rounded-2xl p-8 transition-all duration-300 ease-out hover:shadow-xl hover:scale-[1.005]
        bg-gradient-to-br ${config.gradient} border ${config.border} shadow-sm
        animate-in fade-in slide-in-from-bottom-4
      `}>
        
        {/* Background Pattern Overlay (Optional subtle texture) */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Left Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className={`p-2 rounded-lg ${config.iconBg} ${config.text}`}>
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                JESIP/JDM Compliance Grade
              </h3>
            </div>

            <div className="flex items-center gap-6">
              {/* Big Letter Grade */}
              <div className={`
                text-8xl font-black tracking-tighter leading-none drop-shadow-sm transform transition-all duration-700 hover:scale-110 origin-left
                ${config.text}
              `}>
                {legalReadinessScore}
              </div>

              {/* Details */}
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${config.text}`}>
                  {config.label}
                </p>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                  {displayCompliance.toFixed(1)}% <span className="text-slate-500 dark:text-slate-400 text-base font-normal">Compliant</span>
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Based on {totalIncidents.toLocaleString()} analyzed incidents
                </p>
              </div>
            </div>
          </div>

          {/* Right Action: Export Button */}
          {onExport && (
            <button
              onClick={onExport}
              className="
                group flex items-center gap-2 px-5 py-3 rounded-xl
                bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-white/50 dark:border-slate-700/50
                text-slate-700 dark:text-slate-200 font-medium
                shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-900
                transition-all duration-200
              "
            >
              <Download className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
              <span>Export Report</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
