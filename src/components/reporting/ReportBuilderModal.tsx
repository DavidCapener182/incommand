'use client'

import React, { useState } from 'react'
import { XMarkIcon, DocumentTextIcon, ChartBarIcon, CalendarIcon } from '@heroicons/react/24/outline'

interface ReportSection {
  id: string
  type: 'summary' | 'metrics' | 'incidents' | 'analytics' | 'custom'
  title: string
  enabled: boolean
}

export default function ReportBuilderModal({ isOpen, onClose, onGenerate }: any) {
  const [reportName, setReportName] = useState('')
  const [sections, setSections] = useState<ReportSection[]>([
    { id: '1', type: 'summary', title: 'Executive Summary', enabled: true },
    { id: '2', type: 'metrics', title: 'Key Metrics', enabled: true },
    { id: '3', type: 'incidents', title: 'Incident Log', enabled: true },
    { id: '4', type: 'analytics', title: 'Analytics Dashboard', enabled: false }
  ])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Custom Report Builder</h2>
          <button onClick={onClose}><XMarkIcon className="h-6 w-6" /></button>
        </div>
        
        <div className="space-y-4">
          <input
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            placeholder="Report Name"
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          {sections.map(section => (
            <label key={section.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <input
                type="checkbox"
                checked={section.enabled}
                onChange={(e) => setSections(sections.map(s => 
                  s.id === section.id ? { ...s, enabled: e.target.checked } : s
                ))}
              />
              <span>{section.title}</span>
            </label>
          ))}
          
          <button
            onClick={() => onGenerate({ name: reportName, sections: sections.filter(s => s.enabled) })}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium"
          >
            Generate Report
          </button>
        </div>
      </div>
    </div>
  )
}
