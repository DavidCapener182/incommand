'use client'

import React, { useState, useEffect } from 'react'
import { ShieldCheck, CheckCircle2, AlertTriangle, Gavel } from 'lucide-react'

interface LegalReadinessChecklistCardProps {
  auditTrailCompleteness: number
  immutabilityScore: number
  timestampAccuracy: number
  amendmentJustificationRate: number
  overallCompliance: number
  legalReadinessScore: 'A' | 'B' | 'C' | 'D' | 'F'
  className?: string
}

// --- Sub-Component for Individual Checklist Item ---
interface ChecklistItemProps {
  label: string
  description: string
  isMet: boolean
  delay: number
}

const ChecklistItem = ({ label, description, isMet, delay }: ChecklistItemProps) => {
  return (
    <div 
      className={`
        flex items-start gap-4 p-4 rounded-xl border transition-all duration-300
        ${isMet 
          ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' 
          : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 hover:bg-amber-50 dark:hover:bg-amber-900/20'
        }
        animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`
        mt-0.5 p-1.5 rounded-full flex-shrink-0
        ${isMet ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'}
      `}>
        {isMet ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      </div>
      
      <div>
        <h5 className={`text-sm font-bold mb-0.5 ${isMet ? 'text-slate-800 dark:text-slate-200' : 'text-slate-800 dark:text-slate-200'}`}>
          {label}
        </h5>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}

export default function LegalReadinessChecklistCard({
  auditTrailCompleteness = 0,
  immutabilityScore = 0,
  timestampAccuracy = 0,
  amendmentJustificationRate = 0,
  overallCompliance = 0,
  legalReadinessScore = 'C',
  className = ''
}: LegalReadinessChecklistCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isCourtReady = legalReadinessScore === 'A' || legalReadinessScore === 'B'

  if (!mounted) return null

  return (
    <div className={`w-full ${className}`}>
      {/* Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:scale-[1.005] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Legal Readiness Checklist
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Court admissibility verification
              </p>
            </div>
          </div>
          
          {/* Summary Badge */}
          <div className="flex flex-col items-end">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isCourtReady ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
              {isCourtReady ? <Gavel className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {isCourtReady ? 'AUDIT READY' : 'ACTION REQUIRED'}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Column 1 */}
          <div className="space-y-4">
            <ChecklistItem 
              label="Complete Audit Trail"
              description="All incidents possess full, unbroken metadata chains."
              isMet={auditTrailCompleteness === 100}
              delay={100}
            />
            <ChecklistItem 
              label="Immutable Records"
              description="Zero destructive edits or unauthorized deletions found."
              isMet={immutabilityScore === 100}
              delay={200}
            />
            <ChecklistItem 
              label="Accurate Timestamps"
              description="Dual timestamps are properly recorded and synchronized."
              isMet={timestampAccuracy >= 95}
              delay={300}
            />
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <ChecklistItem 
              label="Justified Amendments"
              description="Every record modification includes a documented reason."
              isMet={amendmentJustificationRate === 100}
              delay={150}
            />
            <ChecklistItem 
              label="JESIP Standards"
              description="Fully aligned with Joint Doctrine Manual requirements."
              isMet={overallCompliance >= 95}
              delay={250}
            />
            <ChecklistItem 
              label="Court Ready"
              description="Audit trail quality is suitable for legal proceedings."
              isMet={isCourtReady}
              delay={350}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
