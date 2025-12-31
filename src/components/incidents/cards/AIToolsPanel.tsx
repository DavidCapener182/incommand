'use client'

import React, { useState, useEffect } from 'react'
import {
  SparklesIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline'
import IncidentQualityCard from './IncidentQualityCard'
import RiskMatrixCard from './RiskMatrixCard'
import PatternAlert from './PatternAlert'
import PredictiveTagsCard from './PredictiveTagsCard'
import SmartChecklistCard from './SmartChecklistCard'
import DispatchAdvisorCard from './DispatchAdvisorCard'
import EthanCard from './EthanCard'
import CommunicationAssistCard from './CommunicationAssistCard'
import TranslationCard from './TranslationCard'
import TimelineExtractorCard from './TimelineExtractorCard'
import GreenGuideBestPracticesCard from './GreenGuideBestPracticesCard'

interface IncidentFormData {
  callsign_from: string
  callsign_to: string
  occurrence?: string
  incident_type: string
  action_taken?: string
  priority: string
  facts_observed?: string
  actions_taken?: string
  outcome?: string
  headline?: string
  source?: string
  location?: string
}

export interface AIGeneratedData {
  tags?: string[]
  riskMatrix?: any
  logQualityScore?: number
  dispatchAdvisor?: any
  ethaneReport?: any
  radioScript?: string
  translatedText?: string
  chronology?: any[]
}

interface AIToolsPanelProps {
  formData: IncidentFormData
  onApplySuggestion?: (field: string, value: string) => void
  onUpdateFactsObserved?: (updatedText: string) => void
  guidedActionsApplied?: boolean
  incidentType?: string
  showBestPracticeHints?: boolean
  onShowBestPracticeHintsChange?: (value: boolean) => void
  onOccurrenceAppend?: (text: string) => void
  onActionsTakenAppend?: (text: string) => void
  onAIDataChange?: (data: AIGeneratedData) => void
  onPriorityChange?: (priority: string) => void
}

export default function AIToolsPanel({
  formData,
  onApplySuggestion,
  onUpdateFactsObserved,
  guidedActionsApplied,
  incidentType,
  showBestPracticeHints,
  onShowBestPracticeHintsChange,
  onOccurrenceAppend,
  onActionsTakenAppend,
  onAIDataChange,
  onPriorityChange,
}: AIToolsPanelProps) {
  const [activeTab, setActiveTab] = useState('audit')
  const [aiData, setAiData] = useState<AIGeneratedData>({})

  // Update parent whenever AI data changes
  useEffect(() => {
    if (onAIDataChange) {
      onAIDataChange(aiData)
    }
  }, [aiData, onAIDataChange])

  const tabs = [
    { id: 'audit', label: 'Audit', icon: SparklesIcon },
    { id: 'ops', label: 'Ops', icon: UserGroupIcon },
    { id: 'utils', label: 'Tools', icon: WrenchScrewdriverIcon },
    { id: 'guide', label: 'Guide', icon: BookOpenIcon },
  ]

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-[10px] font-medium border-b-2 transition-all flex flex-col items-center gap-1 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {activeTab === 'audit' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            <IncidentQualityCard
              formData={formData}
              onApplySuggestion={onApplySuggestion}
              onUpdateFactsObserved={onUpdateFactsObserved}
              guidedActionsApplied={guidedActionsApplied}
              onScoreChange={(score) => setAiData(prev => ({ ...prev, logQualityScore: score }))}
            />
            <RiskMatrixCard 
              factsObserved={formData.facts_observed}
              currentPriority={formData.priority}
              onRiskMatrixChange={(matrix) => {
                setAiData(prev => ({ ...prev, riskMatrix: matrix }))
                // Automatically adjust priority downward based on risk matrix
                // Only adjust downward (High → Medium) when risk is low, not upward automatically
                if (matrix && onPriorityChange) {
                  const riskLevel = matrix.level?.toLowerCase()
                  const currentPriority = formData.priority?.toLowerCase()
                  
                  // If risk is Low and current priority is High/Urgent, automatically reduce to Medium
                  if (riskLevel === 'low' && (currentPriority === 'high' || currentPriority === 'urgent')) {
                    onPriorityChange('medium')
                  }
                  // If risk is Medium with low score (≤8) and current priority is High/Urgent, reduce to Medium
                  else if (riskLevel === 'medium' && matrix.score <= 8 && (currentPriority === 'high' || currentPriority === 'urgent')) {
                    onPriorityChange('medium')
                  }
                  // Note: We don't automatically increase priority upward - only suggest in UI
                }
              }}
            />
            <PatternAlert incidentType={formData.incident_type} location={formData.location} />
            <PredictiveTagsCard 
              factsObserved={formData.facts_observed}
              onTagsChange={(tags) => {
                setAiData(prev => ({ ...prev, tags }))
              }}
              onTagClick={(tag) => {
                // Add clicked tag to occurrence field
                if (onOccurrenceAppend) {
                  onOccurrenceAppend(`#${tag}`)
                }
              }}
            />
          </div>
        )}
        {activeTab === 'ops' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            <SmartChecklistCard factsObserved={formData.facts_observed} />
            {/* Only show Dispatch Advisor for High Priority incidents */}
            {(formData.priority?.toLowerCase() === 'high' || formData.priority?.toLowerCase() === 'urgent') && (
              <DispatchAdvisorCard 
                incidentType={formData.incident_type} 
                priority={formData.priority}
                onAdviceChange={(advice) => setAiData(prev => ({ ...prev, dispatchAdvisor: advice }))}
              />
            )}
            <EthanCard 
              factsObserved={formData.facts_observed} 
              location={formData.location}
              onEthaneChange={(ethane) => setAiData(prev => ({ ...prev, ethaneReport: ethane }))}
            />
          </div>
        )}
        {activeTab === 'utils' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            <CommunicationAssistCard 
              factsObserved={formData.facts_observed}
              onScriptChange={(script) => setAiData(prev => ({ ...prev, radioScript: script ?? undefined }))}
            />
            <TranslationCard 
              factsObserved={formData.facts_observed}
              onTranslationChange={(text) => setAiData(prev => ({ ...prev, translatedText: text ?? undefined }))}
            />
            <TimelineExtractorCard 
              factsObserved={formData.facts_observed}
              onTimelineChange={(timeline) => setAiData(prev => ({ ...prev, chronology: timeline }))}
            />
          </div>
        )}
        {activeTab === 'guide' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <GreenGuideBestPracticesCard
              incidentType={incidentType || formData.incident_type}
              showBestPracticeHints={showBestPracticeHints ?? false}
              onShowBestPracticeHintsChange={onShowBestPracticeHintsChange ?? (() => {})}
              onOccurrenceAppend={onOccurrenceAppend ?? (() => {})}
              onActionsTakenAppend={onActionsTakenAppend ?? (() => {})}
            />
          </div>
        )}
      </div>
    </div>
  )
}

