'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  ShieldCheckIcon,
  HeartIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  MusicalNoteIcon,
  TrophyIcon,
  ClockIcon,
  GlobeAltIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import { getIncidentTypeIcon } from '@/utils/incidentIcons'
import { cn } from '@/lib/utils'

// --- Configuration ---
const INCIDENT_CATEGORIES = {
  'Security': {
    icon: ShieldCheckIcon,
    color: 'text-red-600 bg-red-100',
    types: [
      'Ejection', 'Refusal', 'Hostile Act', 'Counter-Terror Alert', 'Entry Breach', 
      'Theft', 'Fight', 'Weapon Related', 'Suspicious Behaviour', 'Security Perimeter Breach'
    ],
  },
  'Medical & Welfare': {
    icon: HeartIcon,
    color: 'text-rose-600 bg-rose-100',
    types: [
      'Medical', 'Welfare', 'Missing Child/Person', 'Sexual Misconduct',
      'On-Field Medical Emergency', 'Player Safety Concern'
    ],
  },
  'Crowd & Safety': {
    icon: UserGroupIcon,
    color: 'text-amber-600 bg-amber-100',
    types: [
      'Crowd Management', 'Evacuation', 'Fire', 'Fire Alarm', 'Suspected Fire', 
      'Queue Build-Up', 'Crowd Surge'
    ],
  },
  'Operations': {
    icon: Cog6ToothIcon,
    color: 'text-slate-600 bg-slate-100',
    types: [
      'Attendance', 'Site Issue', 'Tech Issue', 'Environmental', 'Lost Property', 
      'Accreditation', 'Staffing', 'Accsessablity', 'Steward Deployment'
    ],
  },
  'Event': {
    icon: MusicalNoteIcon,
    color: 'text-purple-600 bg-purple-100',
    types: [
      'Artist Movement', 'Artist On Stage', 'Artist Off Stage', 'Event Timing', 
      'Timings', 'Sit Rep', 'Showdown', 'Emergency Show Stop'
    ],
  },
  'Match Operations': {
    icon: TrophyIcon,
    color: 'text-emerald-600 bg-emerald-100',
    types: [
      'Pitch Invasion', 'Fan Disorder', 'Pyrotechnic Incident', 'Stand Conflict',
      'Supporter Ejection', 'Segregation Breach', 'Disorder at Entry/Exit',
      'Offensive Chanting', 'Throwing Objects', 'Use of Flares / Smoke Devices',
      'Pitch Encroachment', 'Post-Match Incident', 'Half-Time Incident',
      'Match Abandonment', 'Referee / Official Abuse'
    ],
  },
  'Match Flow': {
    icon: ClockIcon,
    color: 'text-blue-600 bg-blue-100',
    types: [
      'Kick-Off (First Half)', 'Half-Time', 'Kick-Off (Second Half)', 
      'Full-Time', 'Home Goal', 'Away Goal'
    ],
  },
  'Environment & Complaints': {
    icon: GlobeAltIcon,
    color: 'text-cyan-600 bg-cyan-100',
    types: [
      'Noise Complaint', 'Animal Incident', 'Environmental'
    ],
  },
  'Substances': {
    icon: BeakerIcon,
    color: 'text-orange-600 bg-orange-100',
    types: [
      'Alcohol / Drug Related'
    ],
  },
  'Other': {
    icon: ClipboardDocumentListIcon,
    color: 'text-gray-600 bg-gray-100',
    types: [
      'Other'
    ],
  }
} as const

interface IncidentTypeCategoriesProps {
  selectedType: string
  onTypeSelect: (type: string) => void
  usageStats?: Record<string, number>
  availableTypes?: string[] 
}

export default function IncidentTypeCategories({ 
  selectedType, 
  onTypeSelect, 
  usageStats = {},
  availableTypes
}: IncidentTypeCategoriesProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Filter logic
  const filteredCategories = useMemo(() => {
    if (!availableTypes || availableTypes.length === 0) return INCIDENT_CATEGORIES;
    
    const filtered: Partial<typeof INCIDENT_CATEGORIES> = {};
    Object.entries(INCIDENT_CATEGORIES).forEach(([key, data]) => {
      const validTypes = data.types.filter(t => availableTypes.includes(t));
      if (validTypes.length > 0) {
        filtered[key as keyof typeof INCIDENT_CATEGORIES] = { ...data, types: validTypes as any };
      }
    });
    return filtered;
  }, [availableTypes]);

  // Auto-expand
  useEffect(() => {
    if (selectedType) {
      const found = Object.entries(filteredCategories).find(([_, data]) => 
        (data.types as readonly string[]).includes(selectedType)
      );
      if (found) setExpandedCategory(found[0]);
    }
  }, [selectedType, filteredCategories]);

  return (
    <div className="space-y-3 h-full overflow-y-auto custom-scrollbar pr-1">
      {/* Header */}
      <div className="mb-4 px-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categories</h3>
      </div>

      {/* Accordion List */}
      <div className="space-y-2">
        {Object.entries(filteredCategories).map(([name, data]) => {
          const isExpanded = expandedCategory === name;
          const Icon = data.icon;
          const hasSelection = (data.types as readonly string[]).includes(selectedType);

          return (
            <div 
              key={name} 
              className={cn(
                "rounded-lg border transition-all duration-200 overflow-hidden",
                isExpanded ? "border-blue-200 bg-white shadow-sm ring-1 ring-blue-100" : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : name)}
                className="w-full flex items-center justify-between p-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-1.5 rounded-md shrink-0", data.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className={cn("text-sm font-medium", isExpanded ? "text-slate-900" : "text-slate-700")}>
                      {name}
                    </h4>
                    <p className="text-[10px] text-slate-400">{data.types.length} types</p>
                  </div>
                </div>
                {hasSelection && (
                   <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                )}
              </button>

              {/* Incident Types List */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-2 space-y-1">
                  {(data.types as string[]).map((type) => {
                    const isSelected = selectedType === type;
                    const usage = usageStats[type] || 0;
                    
                    // Try to get specific icon if available
                    const specificIcon = getIncidentTypeIcon(type)?.icon;
                    const TypeIcon = specificIcon || Icon;

                    return (
                      <button
                        key={type}
                        onClick={() => onTypeSelect(type)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors",
                          isSelected 
                            ? "bg-blue-100 text-blue-700 font-medium" 
                            : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                        )}
                      >
                        <TypeIcon className={cn("h-4 w-4 shrink-0", isSelected ? "text-blue-600" : "text-slate-400")} />
                        <span className="flex-1 truncate">{type}</span>
                        {usage > 0 && (
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            {usage}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Footer Tip */}
      <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center">
         <p className="text-[10px] text-slate-400 leading-relaxed">
           Categories are sorted by recent usage. Expand a section to see options.
         </p>
      </div>
    </div>
  )
}