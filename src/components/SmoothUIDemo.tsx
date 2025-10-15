/**
 * Demo component showing SmoothUI components integrated into InCommand
 * This demonstrates how to use the newly installed SmoothUI components
 * for improving the incident management UI
 */

import { useState } from 'react'
import AnimatedProgressBar from './smoothui/ui/AnimatedProgressBar'
import AnimatedInput from './smoothui/ui/AnimatedInput'
import RichPopover from './smoothui/ui/RichPopover'
import BasicToast from './smoothui/ui/BasicToast'

interface SmoothUIDemoProps {
  className?: string
}

export default function SmoothUIDemo({ className = '' }: SmoothUIDemoProps) {
  const [incidentProgress, setIncidentProgress] = useState(75)
  const [searchValue, setSearchValue] = useState('')
  const [showToast, setShowToast] = useState(false)

  return (
    <div className={`p-6 space-y-6 bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">SmoothUI Components Demo</h2>
        <p className="text-gray-600">
          These components are now available for enhancing your incident management UI
        </p>
      </div>

      {/* Animated Progress Bar - Perfect for incident status tracking */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">Incident Resolution Progress</h3>
        <AnimatedProgressBar
          value={incidentProgress}
          label={`Incident Resolution: ${incidentProgress}%`}
          color="#10b981"
          className="max-w-md"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setIncidentProgress(Math.max(0, incidentProgress - 25))}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            -25%
          </button>
          <button
            onClick={() => setIncidentProgress(Math.min(100, incidentProgress + 25))}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            +25%
          </button>
        </div>
      </div>

      {/* Animated Input - Great for search and form inputs */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">Incident Search</h3>
        <AnimatedInput
          value={searchValue}
          onChange={setSearchValue}
          label="Search incidents"
          placeholder="Type to search incidents..."
          className="max-w-md"
          icon={
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
      </div>

      {/* Rich Popover - Perfect for context menus and detailed info */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">Incident Details</h3>
        <RichPopover
          trigger={
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              View Incident Details
            </button>
          }
          title="Incident #INC-2024-001"
          description="Medical emergency at Main Stage Area"
          meta="14:23 UTC"
          actionLabel="View Full Report"
          onActionClick={() => alert('Viewing full report...')}
        />
      </div>

      {/* Basic Toast - Great for notifications */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
        <button
          onClick={() => setShowToast(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          Show Incident Alert
        </button>
        
        {showToast && (
          <BasicToast
            message="New Incident Alert: Medical emergency reported at Main Stage. M2 responding."
            type="warning"
            onClose={() => setShowToast(false)}
            duration={5000}
          />
        )}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Available Components</h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div>• AnimatedProgressBar</div>
          <div>• AnimatedInput</div>
          <div>• RichPopover</div>
          <div>• BasicToast</div>
          <div>• And 70+ more...</div>
          <div>• Visit smoothui.dev</div>
        </div>
      </div>
    </div>
  )
}
