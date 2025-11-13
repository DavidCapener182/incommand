/**
 * Readiness Details Modal Component
 * Feature 1: Real-Time Operational Readiness Index
 * 
 * Detailed breakdown of operational readiness scores
 */

'use client'

import React from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface ReadinessDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  readiness: {
    overall_score: number
    component_scores: {
      staffing: { score: number; details: any; factors: Array<{ factor: string; impact: number; description: string }> }
      incident_pressure: { score: number; details: any; factors: Array<{ factor: string; impact: number; description: string }> }
      weather: { score: number; details: any; factors: Array<{ factor: string; impact: number; description: string }> }
      transport: { score: number; details: any; factors: Array<{ factor: string; impact: number; description: string }> }
      assets: { score: number; details: any; factors: Array<{ factor: string; impact: number; description: string }> }
      crowd_density: { score: number; details: any; factors: Array<{ factor: string; impact: number; description: string }> }
    }
    trend: 'improving' | 'stable' | 'declining'
    alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }>
    calculated_at: string
  }
  eventId: string | null
}

export default function ReadinessDetailsModal({
  isOpen,
  onClose,
  readiness,
  eventId,
}: ReadinessDetailsModalProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20'
    if (score >= 60) return 'bg-amber-100 dark:bg-amber-900/20'
    return 'bg-red-100 dark:bg-red-900/20'
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const components = [
    { key: 'staffing', label: 'Staffing', weight: '25%' },
    { key: 'incident_pressure', label: 'Incident Pressure', weight: '25%' },
    { key: 'weather', label: 'Weather', weight: '15%' },
    { key: 'transport', label: 'Transport', weight: '10%' },
    { key: 'assets', label: 'Assets', weight: '10%' },
    { key: 'crowd_density', label: 'Crowd Density', weight: '15%' },
  ] as const

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Operational Readiness Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Score */}
          <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className={`text-5xl font-bold ${getScoreColor(readiness.overall_score)} mb-2`}>
              {readiness.overall_score}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Calculated {formatTimestamp(readiness.calculated_at)}
            </div>
          </div>

          {/* Component Breakdown */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Component Scores</h3>
            <div className="space-y-3">
              {components.map((comp) => {
                const component = readiness.component_scores[comp.key]
                return (
                  <div key={comp.key} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{comp.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {comp.weight}
                        </Badge>
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(component.score)}`}>
                        {component.score}
                      </div>
                    </div>

                    {/* Factors */}
                    {component.factors && component.factors.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {component.factors.map((factor, idx) => (
                          <div key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">{factor.factor}:</span> {factor.description}
                            {factor.impact !== 0 && (
                              <span className={`ml-2 ${factor.impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ({factor.impact > 0 ? '+' : ''}{factor.impact})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Alerts */}
          {readiness.alerts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Alerts & Warnings</h3>
              <div className="space-y-2">
                {readiness.alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start space-x-2">
                      {alert.severity === 'high' && (
                        <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-medium">{alert.type.toUpperCase()}</div>
                        <div className="text-sm">{alert.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {readiness.component_scores.staffing.score < 70 && (
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  • Review staffing levels and fill critical position gaps
                </div>
              )}
              {readiness.component_scores.incident_pressure.score < 60 && (
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  • Consider additional resources to manage incident load
                </div>
              )}
              {readiness.component_scores.crowd_density.details.occupancy_percentage > 90 && (
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  • Monitor crowd density closely - approaching capacity
                </div>
              )}
              {readiness.overall_score >= 80 && (
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  • Operational readiness is optimal - maintain current levels
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

