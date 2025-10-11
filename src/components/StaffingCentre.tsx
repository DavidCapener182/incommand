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
import StaffSkillsMatrix from '@/components/staff/StaffSkillsMatrix'
import StaffAvailabilityToggle from '@/components/staff/StaffAvailabilityToggle'
import StaffPerformanceDashboard from '@/components/staff/StaffPerformanceDashboard'
import RadioSignOutSystem from '@/components/radio/RadioSignOutSystem'
import AddStaffModal from '@/components/staff/AddStaffModal'
import CallsignAssignmentTab from '@/components/staff/CallsignAssignmentTab'

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
        const { data: events } = await supabase
          .from('events')
          .select('*')
          .eq('is_current', true)
          .order('created_at', { ascending: false })
          .limit(1)

        if (events && events.length > 0) {
          setCurrentEvent(events[0])
        }
      } catch (error) {
        console.error('Error fetching current event:', error)
      }
    }

    fetchCurrentEvent()
  }, [])

  useEffect(() => {
    const registerShortcuts = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        handleUndo()
      }
    }
    undoShortcutRef.current = registerShortcuts
    window.addEventListener('keydown', registerShortcuts)
    return () => {
      if (undoShortcutRef.current) {
        window.removeEventListener('keydown', undoShortcutRef.current)
      }
    }
  }, [assignmentHistory])

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
      distributeStaff(normalized)
    }

    void fetchStaff()
  }, [companyId])

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
    const nextColumns: Record<string, DepartmentState> = {}
    DEPARTMENTS.forEach((department) => {
      nextColumns[department.id] = { ...department, staff: [] }
    })

    const unassigned: StaffMember[] = []

    staffList.forEach((staff) => {
      let targetDepartmentId: string | null = null

      if (staff.current_role) {
        const match = DEPARTMENTS.find((department) => department.name.toLowerCase() === staff.current_role?.toLowerCase())
        if (match) {
          targetDepartmentId = match.id
        }
      }

      if (!targetDepartmentId) {
        targetDepartmentId = inferDepartmentFromSkills(staff)
      }

      if (targetDepartmentId && nextColumns[targetDepartmentId]) {
        nextColumns[targetDepartmentId].staff.push(staff)
      } else {
        unassigned.push(staff)
      }
    })

    setColumns(nextColumns)
    setAvailableStaff(unassigned)
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
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-gray-200/70 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/70 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Staffing Centre</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drag and drop to balance teams, review skill coverage, and request AI-backed role recommendations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
            <input
              type="search"
              placeholder="Search staff"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-56 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <button
            type="button"
            onClick={() => distributeStaff([...availableStaff, ...Object.values(columns).flatMap((column) => column.staff)])}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden />
            Rebalance
          </button>
          <button
            type="button"
            onClick={handleUndo}
            disabled={assignmentHistory.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Undo
          </button>
          <button
            type="button"
            onClick={() => setShowAddStaffModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Users className="h-4 w-4" aria-hidden />
            Add Staff
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: 'callsign', name: 'Callsign Assignment', icon: UserCheck },
            { id: 'radio', name: 'Radio Sign Out', icon: Radio },
            { id: 'skills', name: 'Skills Matrix', icon: GraduationCap },
            { id: 'performance', name: 'Performance', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon
                  className={`mr-2 h-5 w-5 ${
                    isActive
                      ? 'text-blue-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'callsign' && (
        <CallsignAssignmentTab 
          staff={availableStaff}
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
            className="mb-8"
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <Radio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Active Event
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create an event to enable radio sign-out functionality
            </p>
          </div>
        )
      )}

      {activeTab === 'skills' && (
        <StaffSkillsMatrix 
          eventId={currentEvent?.id}
          className="mb-8"
        />
      )}

      {activeTab === 'performance' && (
        currentEvent ? (
          <StaffPerformanceDashboard
            eventId={currentEvent.id}
            className="mb-8"
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Active Event
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create an event to view performance metrics
            </p>
          </div>
        )
      )}

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
    </div>
  )
}

function formatColumnLabel(columnId: string): string {
  if (columnId === 'available') return 'Available pool'
  const match = DEPARTMENTS.find((department) => department.id === columnId)
  return match ? match.name : columnId
}
