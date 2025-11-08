'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import {
  Users,
  RotateCcw,
  Search,
  Clock,
  RefreshCcw,
  Lightbulb,
  UserCheck,
  BarChart3,
  Radio,
  GraduationCap,
} from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Card } from '@/components/ui/card'
import StaffSkillsMatrix from '@/components/staff/StaffSkillsMatrix'
import StaffAvailabilityToggle from '@/components/staff/StaffAvailabilityToggle'
import StaffPerformanceDashboard from '@/components/staff/StaffPerformanceDashboard'
import RadioSignOutSystem from '@/components/radio/RadioSignOutSystem'
import AddStaffModal from '@/components/staff/AddStaffModal'
import CallsignAssignmentTab from '@/components/staff/CallsignAssignmentTab'
import { PageBackground } from '@/components/ui/PageBackground'
import { StackedPanel } from '@/components/ui/StackedPanel'
import { SectionContainer, SectionHeader } from '@/components/ui/SectionContainer'

interface StaffMember {
  id: string
  name: string
  callsign: string
  qualifications: string[]
  experience_level: 'junior' | 'intermediate' | 'senior'
  previous_events: string[]
  current_role?: string
  active_assignments?: number
}

interface DepartmentColumn {
  id: string
  name: string
  capacity: number
  colorClass: string
  description: string
}

interface DepartmentState extends DepartmentColumn {
  staff: StaffMember[]
}

interface RoleRecommendation {
  recommended_role: string
  confidence: number
  justification: string
  alternative_roles: Array<{ role: string; confidence: number }>
}

interface AssignmentHistoryEntry {
  staff_id: string
  staff_name: string
  from_department: string
  to_department: string
  timestamp: string
}

interface StaffingCentreProps {
  eventId?: string
}

const DEPARTMENTS: DepartmentColumn[] = [
  {
    id: 'crowd_management',
    name: 'Crowd Management',
    capacity: 15,
    colorClass: 'border-blue-300 bg-blue-50 dark:bg-blue-950/40',
    description: 'Front-of-house stewards and crowd flow guardians',
  },
  {
    id: 'control_room',
    name: 'Control Room',
    capacity: 8,
    colorClass: 'border-purple-300 bg-purple-50 dark:bg-purple-950/40',
    description: 'Coordinators and communications specialists',
  },
  {
    id: 'security',
    name: 'Security',
    capacity: 12,
    colorClass: 'border-red-300 bg-red-50 dark:bg-red-950/40',
    description: 'Static and roaming security officers',
  },
  {
    id: 'medical',
    name: 'Medical',
    capacity: 6,
    colorClass: 'border-green-300 bg-green-50 dark:bg-green-950/40',
    description: 'Clinicians and first responders',
  },
  {
    id: 'technical',
    name: 'Technical Support',
    capacity: 4,
    colorClass: 'border-amber-300 bg-amber-50 dark:bg-amber-950/40',
    description: 'AV, staging, and infrastructure specialists',
  },
]

const DEPARTMENT_SKILLS: Record<string, string[]> = {
  crowd_management: ['crowd', 'steward'],
  control_room: ['control', 'radio', 'communications'],
  security: ['security', 'sia'],
  medical: ['medical', 'first_aid', 'paramedic'],
  technical: ['technical', 'it', 'engineer', 'av'],
}

const DEFAULT_EXPERIENCE: StaffMember['experience_level'] = 'intermediate'

const StaffCard = React.forwardRef<HTMLDivElement, { staff: StaffMember; isDragging: boolean; onSelect: (staff: StaffMember) => void }>(
  ({ staff, isDragging, onSelect }, ref) => {
    return (
      <div
        ref={ref}
        onClick={() => onSelect(staff)}
        className={`rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 ${
          isDragging ? 'ring-2 ring-blue-200' : ''
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect(staff)
          }
        }}
        aria-label={`View recommendation for ${staff.name}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{staff.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{staff.callsign}</p>
          </div>
          {typeof staff.active_assignments === 'number' && staff.active_assignments > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              {staff.active_assignments} assigned
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {staff.qualifications.slice(0, 3).map((qualification) => (
            <span
              key={qualification}
              className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:bg-blue-900/40 dark:text-blue-200"
            >
              {qualification}
            </span>
          ))}
          {staff.qualifications.length > 3 && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:bg-blue-900/40 dark:text-blue-200">
              +{staff.qualifications.length - 3}
            </span>
          )}
        </div>
      </div>
    )
  }
)
StaffCard.displayName = 'StaffCard'

export default function StaffingCentre({ eventId: _eventId }: StaffingCentreProps) {
  const { addToast } = useToast()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([])
  const [columns, setColumns] = useState<Record<string, DepartmentState>>(() => {
    const initial: Record<string, DepartmentState> = {}
    DEPARTMENTS.forEach((department) => {
      initial[department.id] = { ...department, staff: [] }
    })
    return initial
  })
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [roleRecommendation, setRoleRecommendation] = useState<RoleRecommendation | null>(null)
  const [loadingRecommendation, setLoadingRecommendation] = useState(false)
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistoryEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const undoShortcutRef = useRef<(event: KeyboardEvent) => void>()
  
  // New Week 3 features state
  const [activeTab, setActiveTab] = useState<'callsign' | 'radio' | 'skills' | 'performance'>('callsign')
  const [currentEvent, setCurrentEvent] = useState<any>(null)
  const [showAddStaffModal, setShowAddStaffModal] = useState(false)

  // Fetch current event for Week 3 features
  useEffect(() => {
    const fetchCurrentEvent = async () => {
      try {
        // First try to get the event marked as current
        let { data: events } = await supabase
          .from('events')
          .select('*')
          .eq('is_current', true)
          .order('created_at', { ascending: false })
          .limit(1)

        // If no current event, get the most recent event
        if (!events || events.length === 0) {
          const { data: recentEvents } = await supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
          
        if (recentEvents && recentEvents.length > 0) {
          setCurrentEvent(recentEvents[0])
        }
      } else {
        setCurrentEvent(events[0])
      }
      } catch (error) {
        console.error('Error fetching current event:', error)
      }
    }

    fetchCurrentEvent()
  }, [])

  const handleUndo = useCallback(() => {
    setAssignmentHistory((previous) => {
      if (previous.length === 0) return previous
      const historyCopy = [...previous]
      const lastEntry = historyCopy.pop()
      if (!lastEntry) return previous

      setColumns((prevColumns) => {
        const next = { ...prevColumns }
        let updatedAvailable = [...availableStaff]

        const removeFromDestination = (columnId: string, staffId: string): StaffMember | null => {
          if (columnId === 'available') {
            const index = updatedAvailable.findIndex((staff) => staff.id === staffId)
            if (index === -1) return null
            const [removed] = updatedAvailable.splice(index, 1)
            setAvailableStaff(updatedAvailable)
            return removed
          }
          const column = next[columnId]
          if (!column) return null
          const index = column.staff.findIndex((staff) => staff.id === staffId)
          if (index === -1) return null
          const updated = [...column.staff]
          const [removed] = updated.splice(index, 1)
          next[columnId] = { ...column, staff: updated }
          return removed
        }

        const staff = removeFromDestination(lastEntry.to_department, lastEntry.staff_id)
        if (!staff) return prevColumns

        if (lastEntry.from_department === 'available') {
          updatedAvailable = [...updatedAvailable, staff]
          setAvailableStaff(updatedAvailable)
        } else {
          const column = next[lastEntry.from_department]
          if (column) {
            next[lastEntry.from_department] = {
              ...column,
              staff: [...column.staff, staff],
            }
          }
        }

        setAnnouncement(`${staff.name} moved back to ${lastEntry.from_department === 'available' ? 'Available pool' : next[lastEntry.from_department]?.name}`)
        return next
      })

      return historyCopy
    })
  }, [availableStaff])

  useEffect(() => {
    const registerShortcuts = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        handleUndo()
      }
    }
    undoShortcutRef.current = registerShortcuts
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', registerShortcuts)
      return () => {
        if (undoShortcutRef.current) {
          window.removeEventListener('keydown', undoShortcutRef.current)
        }
      }
    }
  }, [assignmentHistory, handleUndo])

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle()

      setCompanyId(profile?.company_id ?? null)
    }

    void fetchProfile()
  }, [])

  useEffect(() => {
    if (!companyId) return
    
    const fetchStaff = async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, full_name, contact_number, email, skill_tags, notes, active')
        .eq('company_id', companyId)
        .order('full_name', { ascending: true })

      if (error) {
        console.error('Failed to load staff roster', error)
        setAvailableStaff([])
        return
      }

      const normalized = (data ?? []).map((item, index) => normalizeStaffRecord(item, index))
      console.log('StaffingCentre: Loaded staff data:', data)
      console.log('StaffingCentre: Normalized staff:', normalized)
      
      // Remove duplicates based on ID
      const uniqueStaff = normalized.filter((staff, index, self) => 
        index === self.findIndex(s => s.id === staff.id)
      )
      console.log('StaffingCentre: Unique staff after deduplication:', uniqueStaff)
      
      distributeStaff(uniqueStaff)
    }

    void fetchStaff()
  }, [companyId, distributeStaff, normalizeStaffRecord])

  const normalizeStaffRecord = useCallback((record: any, index: number): StaffMember => {
    const qualifications = Array.isArray(record.skill_tags)
      ? record.skill_tags.filter((tag: unknown): tag is string => typeof tag === 'string')
      : []

    // Default to intermediate for staff table (doesn't have experience_level field)
    const experience: StaffMember['experience_level'] = 'intermediate'

    return {
      id: record.id,
      name: record.full_name || `Staff ${index + 1}`,
      callsign: record.full_name || `STAFF-${index + 1}`, // Staff table doesn't have callsign field
      qualifications,
      experience_level: experience,
      previous_events: [], // Staff table doesn't have previous_events field
      current_role: undefined, // Staff table doesn't have staff_role field
      active_assignments: record.active ? 1 : 0, // Use active field instead
    }
  }, [])

  const distributeStaff = useCallback((staffList: StaffMember[]) => {
    // For the new callsign assignment system, put all staff in available
    // The old drag-and-drop distribution is no longer used
    setAvailableStaff(staffList)
    
    // Still maintain the columns structure for any remaining drag-and-drop functionality
    const nextColumns: Record<string, DepartmentState> = {}
    DEPARTMENTS.forEach((department) => {
      nextColumns[department.id] = { ...department, staff: [] }
    })
    setColumns(nextColumns)
  }, [])

  const inferDepartmentFromSkills = (staff: StaffMember): string | null => {
    const tags = staff.qualifications.map((tag) => tag.toLowerCase())
    const match = Object.entries(DEPARTMENT_SKILLS).find(([departmentId, skills]) =>
      skills.some((skill) => tags.some((tag) => tag.includes(skill)))
    )

    return match ? match[0] : null
  }

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination } = result

      if (!destination) return
      if (source.droppableId === destination.droppableId && source.index === destination.index) return

      const sourceColumnId = source.droppableId
      const destinationColumnId = destination.droppableId

      let movingStaff: StaffMember | null = null

      const updatedColumns = { ...columns }
      let updatedAvailable = [...availableStaff]

      const removeFromList = (list: StaffMember[], index: number) => {
        const updated = [...list]
        const [removed] = updated.splice(index, 1)
        return { updated, removed }
      }

      if (sourceColumnId === 'available') {
        const { updated, removed } = removeFromList(updatedAvailable, source.index)
        updatedAvailable = updated
        movingStaff = removed
      } else {
        const column = updatedColumns[sourceColumnId]
        if (!column) return
        const { updated, removed } = removeFromList(column.staff, source.index)
        updatedColumns[sourceColumnId] = { ...column, staff: updated }
        movingStaff = removed
      }

      if (!movingStaff) return

      const addToList = (list: StaffMember[], index: number, staff: StaffMember) => {
        const updated = [...list]
        updated.splice(index, 0, staff)
        return updated
      }

      if (destinationColumnId === 'available') {
        updatedAvailable = addToList(updatedAvailable, destination.index, movingStaff)
      } else {
        const column = updatedColumns[destinationColumnId]
        if (!column) return
        updatedColumns[destinationColumnId] = {
          ...column,
          staff: addToList(column.staff, destination.index, movingStaff),
        }
      }

      const historyEntry: AssignmentHistoryEntry = {
        staff_id: movingStaff.id,
        staff_name: movingStaff.name,
        from_department: sourceColumnId,
        to_department: destinationColumnId,
        timestamp: new Date().toISOString(),
      }

      setAvailableStaff(updatedAvailable)
      setColumns(updatedColumns)
      setAssignmentHistory((previous) => [...previous, historyEntry])

      const destinationName =
        destinationColumnId === 'available'
          ? 'Available pool'
          : updatedColumns[destinationColumnId]?.name ?? destinationColumnId
      setAnnouncement(`${movingStaff.name} moved to ${destinationName}`)
    },
    [availableStaff, columns]
  )


  const filteredAvailableStaff = useMemo(() => {
    if (!searchTerm) return availableStaff
    const term = searchTerm.toLowerCase()
    return availableStaff.filter((staff) =>
      staff.name.toLowerCase().includes(term) ||
      staff.callsign.toLowerCase().includes(term) ||
      staff.qualifications.some((qualification) => qualification.toLowerCase().includes(term))
    )
  }, [availableStaff, searchTerm])

  const fetchRoleRecommendation = useCallback(async (staff: StaffMember) => {
    setLoadingRecommendation(true)
    setRoleRecommendation(null)
    try {
      const response = await fetch('/api/v1/staff/recommend-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staff.id,
          prior_events: staff.previous_events,
          qualifications: staff.qualifications,
          experience_level: staff.experience_level,
        }),
      })

      if (!response.ok) {
        throw new Error('Recommendation service unavailable')
      }

      const data = (await response.json()) as RoleRecommendation
      setRoleRecommendation(data)
    } catch (error) {
      console.error('Role recommendation error', error)
      addToast({
        type: 'error',
        title: 'Recommendation unavailable',
        message: 'Unable to fetch role recommendation. Using fallback guidance.',
      })
      setRoleRecommendation(null)
    } finally {
      setLoadingRecommendation(false)
    }
  }, [addToast])

  const handleStaffSelect = useCallback(
    (staff: StaffMember) => {
      setSelectedStaff(staff)
      void fetchRoleRecommendation(staff)
    },
    [fetchRoleRecommendation]
  )

  return (
    <PageBackground>
      <div>
        <StackedPanel className="space-y-8">
          <SectionContainer className="space-y-6">
            <SectionHeader
              title="Staffing Centre"
              accent="indigo"
              description="Manage team assignments, review skill coverage, and track performance"
              actions={
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(true)}
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  >
                    Add Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => distributeStaff([...availableStaff, ...Object.values(columns).flatMap((column) => column.staff)])}
                    className="text-gray-700 border border-gray-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
                  >
                    Rebalance
                  </button>
                </div>
              }
            />
            {currentEvent ? (
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Current Event: {currentEvent.event_name || currentEvent.name || currentEvent.title || 'Unnamed Event'}
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No active event selected. Assignments will be saved for future events.
              </p>
            )}
          </SectionContainer>

          <SectionContainer>
            <Card className="p-1.5 sm:p-2 overflow-x-auto">
              <nav className="flex space-x-1 sm:space-x-2 min-w-max sm:min-w-0">
            <button
              onClick={() => setActiveTab('callsign')}
              className={`${
                activeTab === 'callsign'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent'
              } touch-target whitespace-nowrap flex-shrink-0 sm:flex-1 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border-2 font-medium text-xs sm:text-sm transition-all duration-200`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Callsign Assignment</span>
                <span className="sm:hidden">Callsign</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('radio')}
              className={`${
                activeTab === 'radio'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent'
              } touch-target whitespace-nowrap flex-shrink-0 sm:flex-1 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border-2 font-medium text-xs sm:text-sm transition-all duration-200`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Radio className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Radio Sign-Out</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`${
                activeTab === 'skills'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent'
              } touch-target whitespace-nowrap flex-shrink-0 sm:flex-1 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border-2 font-medium text-xs sm:text-sm transition-all duration-200`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Skills Matrix</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`${
                activeTab === 'performance'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent'
              } touch-target whitespace-nowrap flex-shrink-0 sm:flex-1 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border-2 font-medium text-xs sm:text-sm transition-all duration-200`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Performance</span>
              </div>
            </button>
          </nav>
            </Card>
          </SectionContainer>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'callsign' && (
          <CallsignAssignmentTab 
            staff={availableStaff}
            eventId={currentEvent?.id}
            onStaffUpdate={() => {
              // Refresh staff data when assignments change
              if (companyId) {
                const fetchStaff = async () => {
                  const { data, error } = await supabase
                    .from('staff')
                    .select('id, full_name, contact_number, email, skill_tags, notes, active')
                    .eq('company_id', companyId)
                    .order('full_name', { ascending: true })

                  if (error) {
                    console.error('Failed to load staff roster', error)
                    return
                  }

                  const normalized = (data ?? []).map((item, index) => normalizeStaffRecord(item, index))
                  distributeStaff(normalized)
                }
                fetchStaff()
              }
            }}
          />
            )}

            {activeTab === 'radio' && (
          currentEvent ? (
            <RadioSignOutSystem 
              eventId={currentEvent.id}
            />
          ) : (
            <section className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <Radio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Active Event
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create an event to enable radio sign-out functionality
              </p>
            </section>
          )
            )}

            {activeTab === 'skills' && (
          <StaffSkillsMatrix 
            eventId={currentEvent?.id}
          />
            )}

            {activeTab === 'performance' && (
          currentEvent ? (
            <StaffPerformanceDashboard
              eventId={currentEvent.id}
            />
          ) : (
            <section className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Active Event
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create an event to view performance metrics
              </p>
            </section>
          )
            )}
          </div>
        </StackedPanel>
      </div>
      {/* Add Staff Modal */}
      <AddStaffModal
          isOpen={showAddStaffModal}
          onClose={() => setShowAddStaffModal(false)}
          onStaffAdded={() => {
            // Refresh staff data
            if (companyId) {
              const fetchStaff = async () => {
                const { data, error } = await supabase
                  .from('staff')
                  .select('id, full_name, contact_number, email, skill_tags, notes, active')
                  .eq('company_id', companyId)
                  .order('full_name', { ascending: true })

                if (error) {
                  console.error('Failed to load staff roster', error)
                  return
                }

                const normalized = (data ?? []).map((item, index) => normalizeStaffRecord(item, index))
                distributeStaff(normalized)
              }
              fetchStaff()
            }
          }}
          companyId={companyId || ''}
        />
    </PageBackground>
  )
}

function formatColumnLabel(columnId: string): string {
  if (columnId === 'available') return 'Available pool'
  const match = DEPARTMENTS.find((department) => department.id === columnId)
  return match ? match.name : columnId
}
