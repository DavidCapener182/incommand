'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/Toast'
import { 
  PlusIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  Users,
  Search,
  BuildingOfficeIcon
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

export default function CallsignAssignmentTab({ staff, onStaffUpdate }: CallsignAssignmentTabProps) {
  const { addToast } = useToast()
  const [positions, setPositions] = useState<Position[]>([])
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [showAddPositionModal, setShowAddPositionModal] = useState(false)
  const [newPosition, setNewPosition] = useState({
    callsign: '',
    position: '',
    department: 'Internal',
    required_skills: [] as string[]
  })
  const [loading, setLoading] = useState(false)

  // Load positions from database or create default ones
  useEffect(() => {
    loadPositions()
  }, [])

  // Update available staff when staff prop changes
  useEffect(() => {
    setAvailableStaff(staff)
  }, [staff])

  const loadPositions = async () => {
    setLoading(true)
    try {
      // For now, create default positions from templates
      // In a real app, you'd load these from the database
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

      setPositions(defaultPositions)
    } catch (error) {
      console.error('Error loading positions:', error)
      addToast({
        type: 'error',
        message: 'Failed to load positions',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  const assignStaffToPosition = (positionId: string, staffId: string) => {
    const staffMember = availableStaff.find(s => s.id === staffId)
    if (!staffMember) return

    setPositions(prev => prev.map(pos => 
      pos.id === positionId 
        ? { 
            ...pos, 
            assigned_staff_id: staffId, 
            assigned_staff_name: staffMember.name 
          }
        : pos
    ))

    // Remove staff from available list
    setAvailableStaff(prev => prev.filter(s => s.id !== staffId))

    addToast({
      type: 'success',
      message: `${staffMember.name} assigned to ${positions.find(p => p.id === positionId)?.callsign}`,
      duration: 4000
    })
    onStaffUpdate()
  }

  const unassignStaffFromPosition = (positionId: string) => {
    const position = positions.find(p => p.id === positionId)
    if (!position || !position.assigned_staff_id) return

    const staffMember = staff.find(s => s.id === position.assigned_staff_id)
    if (staffMember) {
      // Add staff back to available list
      setAvailableStaff(prev => [...prev, staffMember])
    }

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
      message: `Staff unassigned from ${position.callsign}`,
      duration: 4000
    })
    onStaffUpdate()
  }

  const addNewPosition = () => {
    if (!newPosition.callsign || !newPosition.position) {
      addToast({
        type: 'error',
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
      message: 'Position added successfully',
      duration: 4000
    })
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
      message: 'Position deleted',
      duration: 4000
    })
  }

  const getStaffSuggestions = (position: Position) => {
    if (!position.required_skills?.length) return availableStaff

    return availableStaff.filter(staffMember =>
      position.required_skills?.some(skill =>
        staffMember.qualifications.includes(skill)
      )
    )
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Callsign Assignment</h2>
          <p className="text-gray-600 dark:text-gray-400">Assign your team to positions for the current event</p>
        </div>
        <button
          onClick={() => setShowAddPositionModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Position
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by callsign, role, or staff name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          {departments.map(dept => (
            <option key={dept} value={dept}>
              {dept === 'all' ? 'All Departments' : dept}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Positions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{positions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <CheckIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{assignedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <XMarkIcon className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vacant</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{vacantCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Staff</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{availableStaff.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Staff */}
      {availableStaff.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Available Staff</h3>
          <div className="flex flex-wrap gap-2">
            {availableStaff.map(staffMember => (
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
            ))}
          </div>
        </div>
      )}

      {/* Positions by Department */}
      {Object.entries(
        filteredPositions.reduce((acc, position) => {
          if (!acc[position.department]) acc[position.department] = []
          acc[position.department].push(position)
          return acc
        }, {} as Record<string, Position[]>)
      ).map(([department, deptPositions]) => (
        <div key={department} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {department}
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                ({deptPositions.length} positions, {deptPositions.filter(p => p.assigned_staff_id).length} assigned)
              </span>
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deptPositions.map(position => (
              <motion.div
                key={position.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border-2 ${
                  position.assigned_staff_id 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{position.callsign}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{position.position}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => deletePosition(position.id)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
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
                      className="text-xs text-red-600 hover:text-red-800 dark:hover:text-red-400"
                    >
                      Unassign
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Available for assignment</p>
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
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Add Position Modal */}
      <AnimatePresence>
        {showAddPositionModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={() => setShowAddPositionModal(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
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
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
