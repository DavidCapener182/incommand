import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserGroupIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'

interface StaffSkill {
  id: number
  profile_id: string
  skill_name: string
  certification_date: string | null
  expiry_date: string | null
  verified: boolean
  verified_by: string | null
  verified_at: string | null
  certification_number: string | null
  issuing_authority: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface StaffMember {
  profile_id: string
  full_name: string
  email: string
  callsign: string | null
  skills: StaffSkill[]
  certifications_expiring_30_days: number
  verified_skills_count: number
  total_skills_count: number
}

interface StaffSkillsMatrixProps {
  eventId?: string
  className?: string
}

export default function StaffSkillsMatrix({ 
  eventId, 
  className = '' 
}: StaffSkillsMatrixProps) {
  const { user } = useAuth()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [showAddSkillModal, setShowAddSkillModal] = useState(false)
  const [showEditSkillModal, setShowEditSkillModal] = useState(false)
  const [editingSkill, setEditingSkill] = useState<StaffSkill | null>(null)

  const fetchStaffSkills = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/v1/staff/skills-matrix', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch staff skills')
      }
      
      const data = await response.json()
      setStaff(data.staff)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaffSkills()
  }, [])

  const getSkillStatus = (skill: StaffSkill) => {
    if (!skill.expiry_date) return 'valid'
    
    const expiryDate = new Date(skill.expiry_date)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) return 'expired'
    if (daysUntilExpiry <= 30) return 'expiring'
    return 'valid'
  }

  const getSkillStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'text-green-600 bg-green-100'
      case 'expiring':
        return 'text-yellow-600 bg-yellow-100'
      case 'expired':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getSkillStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'expiring':
        return <ClockIcon className="h-4 w-4" />
      case 'expired':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      default:
        return <AcademicCapIcon className="h-4 w-4" />
    }
  }

  const exportSkillsMatrix = async () => {
    try {
      const response = await fetch('/api/v1/staff/skills-matrix/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error('Failed to export skills matrix')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `skills-matrix-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  const toggleSkillVerification = async (skillId: number, verified: boolean) => {
    try {
      const response = await fetch(`/api/v1/staff/skills/${skillId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update skill verification')
      }
      
      // Refresh the skills matrix
      fetchStaffSkills()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Skills Matrix Error
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchStaffSkills}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Staff Skills Matrix
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Skills and certifications overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportSkillsMatrix}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowAddSkillModal(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add Skill
            </button>
          </div>
        </div>
      </div>

      {/* Skills Matrix Grid */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Skills
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Verified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expiring Soon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {staff.map((member) => (
                <motion.tr
                  key={member.profile_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {member.full_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.full_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {member.callsign || member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {member.skills.slice(0, 3).map((skill) => {
                        const status = getSkillStatus(skill)
                        return (
                          <span
                            key={skill.id}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getSkillStatusColor(status)}`}
                          >
                            {getSkillStatusIcon(status)}
                            {skill.skill_name}
                          </span>
                        )
                      })}
                      {member.skills.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{member.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {member.verified_skills_count}/{member.total_skills_count}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {member.total_skills_count > 0 
                        ? Math.round((member.verified_skills_count / member.total_skills_count) * 100) 
                        : 0}% verified
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.certifications_expiring_30_days > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-yellow-800 bg-yellow-100">
                        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                        {member.certifications_expiring_30_days} expiring
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedStaff(member)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View Details
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {staff.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <UserGroupIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No staff members found</p>
          </div>
        )}
      </div>

      {/* Staff Details Modal */}
      <AnimatePresence>
        {selectedStaff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedStaff(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedStaff.full_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedStaff.callsign || selectedStaff.email}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedStaff(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Skills & Certifications
                    </h4>
                    <div className="space-y-3">
                      {selectedStaff.skills.map((skill) => {
                        const status = getSkillStatus(skill)
                        return (
                          <div key={skill.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getSkillStatusColor(status)}`}>
                                  {getSkillStatusIcon(status)}
                                  {skill.skill_name}
                                </span>
                                {skill.verified && (
                                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingSkill(skill)}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            {skill.certification_date && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Certified: {new Date(skill.certification_date).toLocaleDateString()}
                              </div>
                            )}
                            
                            {skill.expiry_date && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Expires: {new Date(skill.expiry_date).toLocaleDateString()}
                              </div>
                            )}
                            
                            {skill.issuing_authority && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Issued by: {skill.issuing_authority}
                              </div>
                            )}
                            
                            {skill.notes && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Notes: {skill.notes}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Summary
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedStaff.total_skills_count}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Total Skills
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedStaff.verified_skills_count}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Verified Skills
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <div className="text-2xl font-bold text-yellow-600">
                          {selectedStaff.certifications_expiring_30_days}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Expiring Soon
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
