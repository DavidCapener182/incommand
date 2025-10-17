import React, { useState, useMemo, useEffect } from 'react'
import {
  Shield,
  HeartPulse,
  Users,
  Cog,
  Music,
  Globe2,
  FlaskConical,
  ClipboardList,
} from 'lucide-react'
import { getIncidentTypeIcon } from '@/utils/incidentIcons'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface IncidentTypeCategoriesProps {
  selectedType: string
  onTypeSelect: (type: string) => void
  usageStats?: Record<string, number>
}

const INCIDENT_CATEGORIES = {
  'Security': {
    icon: '🛡️',
    types: [
      'Ejection', 'Refusal', 'Hostile Act', 'Counter-Terror Alert', 'Entry Breach', 
      'Theft', 'Fight', 'Weapon Related', 'Suspicious Behaviour'
    ],
    defaultExpanded: false
  },
  'Medical & Welfare': {
    icon: '🏥',
    types: [
      'Medical', 'Welfare', 'Missing Child/Person', 'Sexual Misconduct'
    ],
    defaultExpanded: false
  },
  'Crowd & Safety': {
    icon: '👥',
    types: [
      'Crowd Management', 'Evacuation', 'Fire', 'Fire Alarm', 'Suspected Fire', 
      'Queue Build-Up'
    ],
    defaultExpanded: false
  },
  'Operations': {
    icon: '⚙️',
    types: [
      'Attendance', 'Site Issue', 'Tech Issue', 'Environmental', 'Lost Property', 
      'Accreditation', 'Staffing', 'Accsessablity'
    ],
    defaultExpanded: false
  },
  'Event': {
    icon: '🎵',
    types: [
      'Artist Movement', 'Artist On Stage', 'Artist Off Stage', 'Event Timing', 
      'Timings', 'Sit Rep', 'Showdown', 'Emergency Show Stop'
    ],
    defaultExpanded: false
  },
  'Environment & Complaints': {
    icon: '🌍',
    types: [
      'Noise Complaint', 'Animal Incident', 'Environmental'
    ],
    defaultExpanded: false
  },
  'Substances': {
    icon: '🚫',
    types: [
      'Alcohol / Drug Related'
    ],
    defaultExpanded: false
  },
  'Other': {
    icon: '📋',
    types: [
      'Other'
    ],
    defaultExpanded: false
  }
} as const

const CATEGORY_ICONS: Record<keyof typeof INCIDENT_CATEGORIES, React.ComponentType<{ className?: string }>> = {
  Security: Shield,
  'Medical & Welfare': HeartPulse,
  'Crowd & Safety': Users,
  Operations: Cog,
  Event: Music,
  'Environment & Complaints': Globe2,
  Substances: FlaskConical,
  Other: ClipboardList,
}

export default function IncidentTypeCategories({ 
  selectedType, 
  onTypeSelect, 
  usageStats = {} 
}: IncidentTypeCategoriesProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Auto-expand category when incident type is selected
  useEffect(() => {
    if (selectedType) {
      // Find which category contains the selected type
      const categoryWithType = Object.entries(INCIDENT_CATEGORIES).find(([_, categoryData]) =>
        (categoryData.types as readonly string[]).includes(selectedType)
      )
      
      if (categoryWithType) {
        const [categoryName] = categoryWithType
        setExpandedCategory(categoryName)
      }
    }
  }, [selectedType])

  // Sort incident types within each category by usage stats
  const sortedCategories = useMemo(() => {
    return Object.entries(INCIDENT_CATEGORIES).map(([categoryName, categoryData]) => {
      const sortedTypes = [...categoryData.types].sort((a, b) => {
        const aUsage = usageStats[a] || 0
        const bUsage = usageStats[b] || 0
        return bUsage - aUsage // Sort by usage count descending
      })
      
      return {
        name: categoryName,
        ...categoryData,
        types: sortedTypes
      }
    })
  }, [usageStats])

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-muted-foreground">Incident Categories</h3>
        <p className="text-xs text-muted-foreground">
          Choose the category that best matches this incident.
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        value={expandedCategory ?? undefined}
        onValueChange={(value) => setExpandedCategory(value ?? null)}
        className="space-y-3"
      >
        {sortedCategories.map((category) => {
          const value = category.name
          const Icon =
            CATEGORY_ICONS[category.name as keyof typeof CATEGORY_ICONS] ?? ClipboardList
          const isSelectedCategory = (category.types as string[]).includes(selectedType)
          const isExpanded = expandedCategory === value

          return (
            <AccordionItem
              key={value}
              value={value}
              className={cn(
                'card-depth-subtle px-2',
                isSelectedCategory || isExpanded
                  ? 'border-primary/40 bg-muted/30'
                  : 'border-border/50'
              )}
            >
              <AccordionTrigger className="px-2 py-3 text-left text-sm font-medium">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Icon className="size-4" />
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {category.types.length} incident types
                      </p>
                    </div>
                  </div>
                  {isSelectedCategory && (
                    <span className="text-xs font-medium text-primary">Selected</span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2">
                <div className="grid gap-2">
                  {(category.types as string[]).map((type) => {
                    const iconConfig = getIncidentTypeIcon(type)
                    const IconComponent = iconConfig.icon
                    const isSelected = selectedType === type
                    const usageCount = usageStats[type] || 0

                    return (
                      <Button
                        key={type}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onTypeSelect(type)}
                        className={cn(
                          'justify-start gap-3 border border-transparent bg-transparent text-left font-medium transition-colors',
                          'hover:border-border/60 hover:bg-muted/40',
                          isSelected && 'border-primary/40 bg-muted/30 text-primary shadow-sm'
                        )}
                      >
                        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <IconComponent className="size-4" />
                        </span>
                        <span className="flex-1 text-sm">{type}</span>
                        {usageCount > 0 && (
                          <span className="text-xs font-medium text-muted-foreground">
                            {usageCount}×
                          </span>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      <div className="rounded-xl border border-dashed border-muted-foreground/20 bg-muted/30 p-3 text-xs text-muted-foreground">
        Tip: Categories are sorted by your team&apos;s recent usage. Expand a category to review
        all available incident types.
      </div>
    </div>
  )
}
