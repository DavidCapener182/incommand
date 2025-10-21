'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { 
  PlusIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

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

interface Position {
  id: string
  callsign: string
  position: string
  department: string
  assigned_staff_id?: string
  assigned_staff_name?: string
  required_skills?: string[]
}

interface CallsignAssignmentTabProps {
  staff: StaffMember[]
  onStaffUpdate: () => void
  eventId?: string
}

// Common position templates
const POSITION_TEMPLATES = {
  Management: [
    { callsign: "ALPHA 1", position: "Head of Security (HOS)", required_skills: ["Head of Security (HOS)"] },
    { callsign: "ALPHA 2", position: "Assistant Head of Security", required_skills: ["Deputy Head of Security"] },
    { callsign: "ALPHA 3", position: "Site Coordinator", required_skills: ["Security Manager"] },
  ],
  External: [
    { callsign: "SIERRA 1", position: "Queue Management", required_skills: ["Crowd Management"] },
    { callsign: "SIERRA 7", position: "Access Escort", required_skills: ["Access Control"] },
    { callsign: "SIERRA 8", position: "Hotel Gate", required_skills: ["Access Control"] },
    { callsign: "SIERRA 12", position: "Side Gate", required_skills: ["Access Control"] },
    { callsign: "SIERRA 16", position: "E3 Car Park", required_skills: ["Access Control"] },
  ],
  Internal: [
    { callsign: "SIERRA 2", position: "BOH Supervisor", required_skills: ["Supervisor"] },
    { callsign: "SIERRA 3", position: "Pit Supervisor", required_skills: ["Supervisor"] },
    { callsign: "SIERRA 4", position: "Mezzanine", required_skills: ["Crowd Management"] },
    { callsign: "SIERRA 5", position: "Stage Right", required_skills: ["Crowd Management"] },
    { callsign: "SIERRA 6", position: "Stage Left", required_skills: ["Crowd Management"] },
    { callsign: "SIERRA 9", position: "Mezzanine Clicker", required_skills: ["Crowd Management"] },
    { callsign: "SIERRA 10", position: "Mixer", required_skills: ["Crowd Management"] },
    { callsign: "SIERRA 11", position: "BOH Fire Exits", required_skills: ["Emergency Response"] },
    { callsign: "SIERRA 15", position: "Cloakroom", required_skills: ["Access Control"] },
    { callsign: "RESPONSE 1", position: "Response Team", required_skills: ["Response Team (SIA)"] },
  ],
  Control: [
    { callsign: "CONTROL 1", position: "Control Room Operator", required_skills: ["Control Room Operator"] },
    { callsign: "CONTROL 2", position: "Radio Controller", required_skills: ["Radio Controller"] },
    { callsign: "CONTROL 3", position: "Event Control Manager", required_skills: ["Event Control Manager"] },
  ],
  Medical: [
    { callsign: "MEDICAL 1", position: "First Aid Lead", required_skills: ["First Aid"] },
    { callsign: "MEDICAL 2", position: "First Aid Support", required_skills: ["First Aid"] },
  ]
}

export default function CallsignAssignmentTab({ staff, onStaffUpdate, eventId }: CallsignAssignmentTabProps) {
  const { addToast } = useToast()
  const [positions, setPositions] = useState<Position[]>([])
  // Remove availableStaff state - use staff prop directly
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [showAddPositionModal, setShowAddPositionModal] = useState(false)
  const [showEditPositionModal, setShowEditPositionModal] = useState(false)
  const [showAssignStaffModal, setShowAssignStaffModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [newPosition, setNewPosition] = useState({
    callsign: '',
    position: '',
    department: 'Internal',
    required_skills: [] as string[]
  })
  const [editPosition, setEditPosition] = useState({
    callsign: '',
    position: '',
    department: 'Internal',
    required_skills: [] as string[]
  })
  const [loading, setLoading] = useState(false)

  // Load positions from database or create default ones
  useEffect(() => {
    loadPositions()
  }, [eventId])


  const loadPositions = async () => {
    setLoading(true)
    try {
      // Create default positions from templates
      const defaultPositions: Position[] = []
      
      Object.entries(POSITION_TEMPLATES).forEach(([department, deptPositions]) => {
        deptPositions.forEach(template => {
          defaultPositions.push({
            id: `${department}-${template.callsign}`,
            callsign: template.callsign,
            position: template.position,
            department,
            required_skills: template.required_skills
          })
        })
      })

      // If we have an event ID, load existing assignments
      if (eventId) {
        try {
          const response = await fetch(`/api/v1/staff/assignments?event_id=${eventId}`)
          if (response.ok) {
            const data = await response.json()
            const assignments = data.assignments || []
            
            // Merge assignments with default positions
            const updatedPositions = defaultPositions.map(position => {
              const assignment = assignments.find((a: any) => a.position_id === position.id)
              if (assignment && assignment.staff) {
                return {
                  ...position,
                  assigned_staff_id: assignment.staff.id,
                  assigned_staff_name: assignment.staff.full_name
                }
              }
              return position
            })
            
            setPositions(updatedPositions)
          } else {
            setPositions(defaultPositions)
          }
        } catch (error) {
          console.error('Failed to load assignments:', error)
          setPositions(defaultPositions)
        }
      } else {
        setPositions(defaultPositions)
      }
    } catch (error) {
      console.error('Error loading positions:', error)
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load positions',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  const assignStaffToPosition = async (positionId: string, staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId)
    const position = positions.find(p => p.id === positionId)
    if (!staffMember || !position || !eventId) return

    try {
      const response = await fetch('/api/v1/staff/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          staff_id: staffId,
          position_id: positionId,
          callsign: position.callsign,
          position_name: position.position,
          department: position.department
        })
      })

      if (response.ok) {
        setPositions(prev => prev.map(pos => 
          pos.id === positionId 
            ? { 
                ...pos, 
                assigned_staff_id: staffId, 
                assigned_staff_name: staffMember.name 
              }
            : pos
        ))

        addToast({
          type: 'success',
          title: 'Assignment Saved',
          message: `${staffMember.name} assigned to ${position.callsign}`,
          duration: 4000
        })
        onStaffUpdate()
      } else {
        throw new Error('Failed to save assignment')
      }
    } catch (error) {
      console.error('Failed to assign staff:', error)
      addToast({
        type: 'error',
        title: 'Assignment Failed',
        message: 'Failed to save assignment',
        duration: 4000
      })
    }
  }

  const unassignStaffFromPosition = async (positionId: string) => {
    const position = positions.find(p => p.id === positionId)
    if (!position || !position.assigned_staff_id || !eventId) return

    try {
      // Find the assignment to delete
      const response = await fetch(`/api/v1/staff/assignments?event_id=${eventId}`)
      if (response.ok) {
        const data = await response.json()
        const assignment = data.assignments.find((a: any) => a.position_id === positionId)
        
        if (assignment) {
          const deleteResponse = await fetch(`/api/v1/staff/assignments?id=${assignment.id}`, {
            method: 'DELETE'
          })
          
          if (deleteResponse.ok) {
            // Staff is already available in the staff prop, no need to add back

            setPositions(prev => prev.map(pos => 
              pos.id === positionId 
                ? { 
                    ...pos, 
                    assigned_staff_id: undefined, 
                    assigned_staff_name: undefined 
                  }
                : pos
            ))

            addToast({
              type: 'success',
              title: 'Staff Unassigned',
              message: `Staff unassigned from ${position.callsign}`,
              duration: 4000
            })
            onStaffUpdate()
          } else {
            throw new Error('Failed to delete assignment')
          }
        }
      } else {
        throw new Error('Failed to fetch assignments')
      }
    } catch (error) {
      console.error('Failed to unassign staff:', error)
      addToast({
        type: 'error',
        title: 'Unassign Failed',
        message: 'Failed to unassign staff',
        duration: 4000
      })
    }
  }

  const addNewPosition = () => {
    if (!newPosition.callsign || !newPosition.position) {
      addToast({
        type: 'error',
        title: 'Missing Details',
        message: 'Callsign and position are required',
        duration: 4000
      })
      return
    }

    const position: Position = {
      id: `${newPosition.department}-${newPosition.callsign}-${Date.now()}`,
      callsign: newPosition.callsign.toUpperCase(),
      position: newPosition.position,
      department: newPosition.department,
      required_skills: newPosition.required_skills
    }

    setPositions(prev => [...prev, position])
    setNewPosition({
      callsign: '',
      position: '',
      department: 'Internal',
      required_skills: []
    })
    setShowAddPositionModal(false)
    addToast({
      type: 'success',
      title: 'Position Added',
      message: 'Position added successfully',
      duration: 4000
    })
  }

  const openEditModal = (position: Position) => {
    setSelectedPosition(position)
    setEditPosition({
      callsign: position.callsign,
      position: position.position,
      department: position.department,
      required_skills: position.required_skills || []
    })
    setShowEditPositionModal(true)
  }

  const saveEditedPosition = () => {
    if (!editPosition.callsign || !editPosition.position || !selectedPosition) {
      addToast({
        type: 'error',
        title: 'Missing Details',
        message: 'Callsign and position are required',
        duration: 4000
      })
      return
    }

    setPositions(prev => prev.map(pos =>
      pos.id === selectedPosition.id
        ? {
            ...pos,
            callsign: editPosition.callsign.toUpperCase(),
            position: editPosition.position,
            department: editPosition.department,
            required_skills: editPosition.required_skills
          }
        : pos
    ))

    setShowEditPositionModal(false)
    setSelectedPosition(null)
    addToast({
      type: 'success',
      title: 'Position Updated',
      message: 'Position updated successfully',
      duration: 4000
    })
  }

  const openAssignStaffModal = (position: Position) => {
    setSelectedPosition(position)
    setShowAssignStaffModal(true)
  }

  const deletePosition = (positionId: string) => {
    if (!window.confirm('Are you sure you want to delete this position?')) return
    
    const position = positions.find(p => p.id === positionId)
    if (position?.assigned_staff_id) {
      unassignStaffFromPosition(positionId)
    }

    setPositions(prev => prev.filter(p => p.id !== positionId))
    addToast({
      type: 'success',
      title: 'Position Removed',
      message: 'Position deleted',
      duration: 4000
    })
  }

  const getStaffSuggestions = (position: Position) => {
    // First, filter out assigned staff
    const assignedStaffIds = positions.filter(p => p.assigned_staff_id).map(p => p.assigned_staff_id)
    const unassignedStaff = staff.filter(staffMember => !assignedStaffIds.includes(staffMember.id))
    
    // Management and Event Control positions require specific skills
    const restrictedSkills = ['Head of Security (HOS)', 'Deputy Head of Security', 'Security Manager', 'Event Control Manager', 'Control Room Operator']
    
    // Check if position requires restricted skills
    const hasRestrictedSkills = position.required_skills?.some(skill => 
      restrictedSkills.includes(skill)
    )
    
    // If position has restricted skills, only show staff with those skills
    if (hasRestrictedSkills) {
      return unassignedStaff.filter(staffMember =>
        position.required_skills?.some(skill =>
          restrictedSkills.includes(skill) && staffMember.qualifications.includes(skill)
        )
      )
    }
    
    // For non-restricted positions, show all unassigned staff (prefer those with matching skills)
    if (!position.required_skills?.length) return unassignedStaff
    
    // Return unassigned staff, but prioritize those with matching skills
    const staffWithSkills = unassignedStaff.filter(staffMember =>
      position.required_skills?.some(skill =>
        staffMember.qualifications.includes(skill)
      )
    )
    
    const staffWithoutSkills = unassignedStaff.filter(staffMember =>
      !position.required_skills?.some(skill =>
        staffMember.qualifications.includes(skill)
      )
    )
    
    return [...staffWithSkills, ...staffWithoutSkills]
  }

  const filteredPositions = positions.filter(position => {
    const matchesDepartment = selectedDepartment === 'all' || position.department === selectedDepartment
    const matchesSearch = searchTerm === '' || 
      position.callsign.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (position.assigned_staff_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    
    return matchesDepartment && matchesSearch
  })

  const departments = ['all', ...new Set(positions.map(p => p.department))]
  const assignedCount = positions.filter(p => p.assigned_staff_id).length
  const vacantCount = positions.length - assignedCount

  return (
    <div className="space-y-6">
      {/* Top Section Container - Stats & Filters */}
      <section className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-1 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Callsign Assignment
            </h2>
          </div>
          <button
            onClick={() => setShowAddPositionModal(true)}
            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <PlusIcon className="h-4 w-4 inline mr-2" />
            Add Position
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Total Positions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{positions.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <CheckIcon className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Assigned</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{assignedCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <XMarkIcon className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Vacant</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{vacantCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <UserGroupIcon className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Available Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{staff.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by callsign, role, or staff name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept === 'all' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Available Staff */}
      {(() => {
        // Filter out assigned staff
        const assignedStaffIds = positions.filter(p => p.assigned_staff_id).map(p => p.assigned_staff_id)
        const availableStaff = staff.filter(staffMember => !assignedStaffIds.includes(staffMember.id))
        
        return availableStaff.length > 0 && (
          <section className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-1 rounded-full bg-gradient-to-b from-green-500 to-emerald-500" />
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Available Staff
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableStaff.map((staffMember, index) => {
                console.log(`Rendering available staff ${index}:`, staffMember.id, staffMember.name)
                return (
                  <span
                    key={staffMember.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                  >
                    {staffMember.name}
                    {staffMember.callsign && (
                      <span className="ml-2 text-xs bg-green-200 dark:bg-green-800 px-2 py-0.5 rounded">
                        {staffMember.callsign}
                      </span>
                    )}
                  </span>
                )
              })}
            </div>
          </section>
        )
      })()}

      {/* Positions by Department */}
      {Object.entries(
        filteredPositions.reduce((acc, position) => {
          if (!acc[position.department]) acc[position.department] = []
          acc[position.department].push(position)
          return acc
        }, {} as Record<string, Position[]>)
      ).map(([department, deptPositions]) => (
        <section key={department} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-1 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                {department}
                <span className="ml-2 text-xs normal-case text-gray-500 dark:text-gray-400">
                  ({deptPositions.length} positions, {deptPositions.filter(p => p.assigned_staff_id).length} assigned)
                </span>
              </h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {deptPositions.map(position => (
              <div
                key={position.id}
                className={`rounded-xl border shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 p-4 sm:p-5 ${
                  position.assigned_staff_id 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">{position.callsign}</p>
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">{position.position}</h4>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(position)}
                      className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                      title="Edit position"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deletePosition(position.id)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                      title="Delete position"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {position.assigned_staff_id ? (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CheckIcon className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        {position.assigned_staff_name}
                      </span>
                    </div>
                    <button
                      onClick={() => unassignStaffFromPosition(position.id)}
                      className="text-xs text-red-600 hover:text-red-800 dark:hover:text-red-400 font-medium"
                    >
                      Unassign
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Available for assignment</p>
                    <button
                      onClick={() => openAssignStaffModal(position)}
                      className="w-full text-xs bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Assign Staff
                    </button>
                    {getStaffSuggestions(position).length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Suggested staff:</p>
                        {getStaffSuggestions(position).slice(0, 3).map(staffMember => (
                          <button
                            key={staffMember.id}
                            onClick={() => assignStaffToPosition(position.id, staffMember.id)}
                            className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                          >
                            {staffMember.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Add Position Modal */}
      {showAddPositionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowAddPositionModal(false)}
            />
            
            <div
              className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Position</h3>
                  <button
                    onClick={() => setShowAddPositionModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Callsign *
                    </label>
                    <input
                      type="text"
                      value={newPosition.callsign}
                      onChange={(e) => setNewPosition(prev => ({ ...prev, callsign: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="e.g., SIERRA 1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Position *
                    </label>
                    <input
                      type="text"
                      value={newPosition.position}
                      onChange={(e) => setNewPosition(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="e.g., Queue Management"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department
                    </label>
                    <select
                      value={newPosition.department}
                      onChange={(e) => setNewPosition(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="Management">Management</option>
                      <option value="External">External</option>
                      <option value="Internal">Internal</option>
                      <option value="Control">Control</option>
                      <option value="Medical">Medical</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowAddPositionModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addNewPosition}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                  >
                    Add Position
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Position Modal */}
      {showEditPositionModal && selectedPosition && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowEditPositionModal(false)}
            />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Position</h3>
                <button
                  onClick={() => setShowEditPositionModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Callsign
                  </label>
                  <input
                    type="text"
                    value={editPosition.callsign}
                    onChange={(e) => setEditPosition({ ...editPosition, callsign: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., SIERRA 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position Name
                  </label>
                  <input
                    type="text"
                    value={editPosition.position}
                    onChange={(e) => setEditPosition({ ...editPosition, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Queue Management"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department
                  </label>
                  <select
                    value={editPosition.department}
                    onChange={(e) => setEditPosition({ ...editPosition, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Management">Management</option>
                    <option value="External">External</option>
                    <option value="Internal">Internal</option>
                    <option value="Control">Control</option>
                    <option value="Medical">Medical</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowEditPositionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditedPosition}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {showAssignStaffModal && selectedPosition && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowAssignStaffModal(false)}
            />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Assign Staff to {selectedPosition.callsign}
                </h3>
                <button
                  onClick={() => setShowAssignStaffModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Position: {selectedPosition.position}
                </p>
                {selectedPosition.required_skills && selectedPosition.required_skills.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Required skills: {selectedPosition.required_skills.join(', ')}
                  </p>
                )}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(() => {
                    const qualifiedStaff = getStaffSuggestions(selectedPosition)
                    if (qualifiedStaff.length === 0) {
                      return (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          No qualified staff members available
                        </p>
                      )
                    }
                    return qualifiedStaff.map(staffMember => (
                      <button
                        key={staffMember.id}
                        onClick={() => {
                          assignStaffToPosition(selectedPosition.id, staffMember.id)
                          setShowAssignStaffModal(false)
                        }}
                        className="w-full text-left px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {staffMember.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {staffMember.qualifications.join(', ')}
                        </div>
                      </button>
                    ))
                  })()}
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowAssignStaffModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
