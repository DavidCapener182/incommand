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
  sia_badge_number?: string
  expiry_date?: string
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [showAddSkillModal, setShowAddSkillModal] = useState(false)
  const [showEditSkillModal, setShowEditSkillModal] = useState(false)
  const [editingSkill, setEditingSkill] = useState<StaffSkill | null>(null)
  const [showSIABadgeModal, setShowSIABadgeModal] = useState(false)
  const [selectedMemberForSIA, setSelectedMemberForSIA] = useState<StaffMember | null>(null)
  const [siaBadgeNumber, setSiaBadgeNumber] = useState('')
  const [siaExpiryDate, setSiaExpiryDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [siaBadgeFilter, setSiaBadgeFilter] = useState('all')
  
  // Skills organized by the 5 main categories
  const getSkillsByCategory = () => {
    return {
      security: [
        'SIA Door Supervisor', 'SIA Security Officer', 'SIA CCTV Operator', 'SIA Close Protection', 'SIA Key Holding',
        'Security Manager', 'Deputy Security Manager', 'Head of Security (HOS)', 'Security Supervisor',
        'Control Room Operator', 'Radio Controller', 'Event Security', 'Crowd Control', 'Access Control',
        'Incident Response', 'Emergency Response', 'Conflict Resolution', 'Customer Service Security',
        'CCTV Operation', 'Alarm Systems', 'Access Control Systems', 'Fire Safety',
        'Evacuation Procedures', 'Emergency Procedures', 'Risk Management', 'Incident Reporting'
      ],
      operations: [
        'Operations Manager', 'Event Manager', 'Event Coordinator', 'Logistics Coordinator',
        'Senior Steward', 'Steward', 'Head Steward', 'Deputy Head Steward', 'Crowd Management',
        'Queue Management', 'Customer Service', 'Guest Relations', 'VIP Stewarding', 'Hospitality Steward',
        'Event Stewarding', 'Venue Stewarding', 'Concert Stewarding', 'Sports Stewarding',
        'Bar Manager', 'Deputy Bar Manager', 'Senior Bar Staff', 'Bar Staff', 'Cocktail Bartender',
        'Beer Service', 'Wine Service', 'Spirits Service', 'Cellar Management', 'Stock Control',
        'Cash Handling', 'Till Operation', 'Customer Service Bar', 'Barista', 'Coffee Service',
        'Food Service', 'Table Service', 'Kitchen Porter', 'Glass Collection',
        'Administration', 'Office Management', 'Data Entry', 'Report Writing', 'Scheduling',
        'Staff Coordination', 'Training Coordinator', 'Compliance Officer', 'Documentation'
      ],
      venue: [
        'Venue Manager', 'Deputy Venue Manager', 'Facilities Manager', 'Cleaning Supervisor',
        'Health & Safety Officer', 'Fire Marshal', 'Evacuation Coordinator', 'Crowd Safety',
        'Accessibility Coordinator', 'Disability Liaison', 'Customer Service Manager',
        'First Aid', 'Emergency First Aid', 'First Aid at Work', 'Paediatric First Aid', 'Mental Health First Aid',
        'CPR', 'AED Operation', 'Medical Response', 'Paramedic', 'Nurse', 'Medical Coordinator',
        'Health & Safety', 'Risk Assessment', 'Medical Equipment', 'Emergency Medical Response',
        'Radio Communication', 'Public Address', 'Complaint Handling', 'Language Skills', 'Sign Language', 'Translation', 'Public Speaking'
      ],
      maintenance: [
        'Maintenance', 'Cleaning Supervisor', 'Health & Safety Officer', 'Fire Marshal',
        'Health & Safety', 'Manual Handling', 'COSHH', 'RIDDOR', 'GDPR Compliance',
        'IT Support', 'Network Management', 'Digital Systems', 'Broadcast Technician'
      ],
      production: [
        'Sound Engineer', 'Lighting Technician', 'Stage Manager', 'Rigging', 'AV Technician',
        'Broadcast Technician', 'Digital Systems', 'Network Management'
      ]
    }
  }

  // Get all available skills
  const getAllAvailableSkills = () => {
    const skillsByCategory = getSkillsByCategory()
    const allSkills = Object.values(skillsByCategory).flat()
    
    // Get existing skills from staff
    const existingSkills = new Set<string>()
    staff.forEach(member => {
      member.skills.forEach(skill => {
        existingSkills.add(skill.skill_name)
      })
    })
    
    // Combine comprehensive skills with existing skills
    return [...new Set([...allSkills, ...existingSkills])].sort()
  }
  
  // Get skills that the selected staff member doesn't have yet
  const getAvailableSkillsForStaff = (staffMember: StaffMember) => {
    const allSkills = getAllAvailableSkills()
    const staffSkills = staffMember.skills.map(skill => skill.skill_name)
    return allSkills.filter(skill => !staffSkills.includes(skill))
  }
  const [newSkillName, setNewSkillName] = useState('')
  const [newCertificationDate, setNewCertificationDate] = useState('')
  const [newExpiryDate, setNewExpiryDate] = useState('')
  const [newCertificationNumber, setNewCertificationNumber] = useState('')
  const [newIssuingAuthority, setNewIssuingAuthority] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  // Handle skill checkbox selection
  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  // Get available skills for staff member by category
  const getAvailableSkillsForStaffByCategory = (staffMember: StaffMember) => {
    const skillsByCategory = getSkillsByCategory()
    const staffSkills = staffMember.skills.map(skill => skill.skill_name)
    
    const availableByCategory: { [key: string]: string[] } = {}
    Object.entries(skillsByCategory).forEach(([category, skills]) => {
      availableByCategory[category] = skills.filter(skill => !staffSkills.includes(skill))
    })
    
    return availableByCategory
  }

  const fetchStaffSkills = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Starting skills matrix fetch...')
      
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      try {
        // Try the main API first
        let response = await fetch('/api/v1/staff/skills-matrix', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        let data
        if (!response.ok) {
          // If main API fails, try the simple fallback
          console.log('Main API failed, trying simple fallback...')
          const fallbackController = new AbortController()
          const fallbackTimeout = setTimeout(() => fallbackController.abort(), 30000)
          
          try {
            response = await fetch('/api/v1/staff/skills-matrix/simple', {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              signal: fallbackController.signal
            })
            clearTimeout(fallbackTimeout)
          } catch (fallbackErr) {
            clearTimeout(fallbackTimeout)
            throw fallbackErr
          }
        }
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          console.error('Skills matrix API error response:', errorText)
          throw new Error(`Failed to fetch staff skills: ${response.status} ${response.statusText}`)
        }
        
        data = await response.json()
        console.log('Skills matrix data received:', data)
        setStaff(data.staff || data || [])
      } catch (fetchErr) {
        clearTimeout(timeoutId)
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          throw new Error('Request timed out after 30 seconds')
        }
        throw fetchErr
      }
    } catch (err) {
      console.error('Error fetching staff skills:', err)
      const errorMessage = err instanceof Error 
        ? (err.message.includes('Load failed') 
            ? 'Network error: Unable to connect to server. Please check if the server is running.' 
            : err.message)
        : 'Failed to fetch staff skills'
      setError(errorMessage)
      setStaff([]) // Set empty array on error so we don't stay in loading state
    } finally {
      setLoading(false)
    }
  }, [])

  const handleAddSkills = async () => {
    if (!selectedStaff || selectedSkills.length === 0) {
      setError('Please select at least one skill to add')
      return
    }

    // Check if required certification fields are filled for skills that need them
    const skillsRequiringCertification = ['SIA Door Supervisor', 'SIA Security Officer', 'SIA CCTV Operator', 'SIA Close Protection', 'SIA Key Holding']
    const skillsRequiringExpiry = ['SIA Door Supervisor', 'SIA Security Officer', 'SIA CCTV Operator', 'SIA Close Protection', 'SIA Key Holding', 'First Aid', 'Emergency First Aid', 'First Aid at Work', 'Paediatric First Aid', 'Mental Health First Aid', 'CPR', 'AED Operation']
    const skillsRequiringIssuingAuthority = ['SIA Door Supervisor', 'SIA Security Officer', 'SIA CCTV Operator', 'SIA Close Protection', 'SIA Key Holding', 'First Aid', 'Emergency First Aid', 'First Aid at Work', 'Paediatric First Aid', 'Mental Health First Aid', 'CPR', 'AED Operation', 'Health & Safety', 'Fire Marshal']

    // Check if any selected skill requires certification fields
    const requiresCertification = selectedSkills.some(skill => skillsRequiringCertification.includes(skill))
    const requiresExpiry = selectedSkills.some(skill => skillsRequiringExpiry.includes(skill))
    const requiresIssuingAuthority = selectedSkills.some(skill => skillsRequiringIssuingAuthority.includes(skill))

    if (requiresCertification && !newCertificationNumber.trim()) {
      setError('Certification number is required for one or more selected skills')
      return
    }

    if (requiresExpiry && !newExpiryDate) {
      setError('Expiry date is required for one or more selected skills')
      return
    }

    if (requiresIssuingAuthority && !newIssuingAuthority.trim()) {
      setError('Issuing authority is required for one or more selected skills')
      return
    }

    try {
      // Add each selected skill
      const promises = selectedSkills.map(skill => 
        fetch('/api/v1/staff/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile_id: selectedStaff.profile_id,
            skill_name: skill,
            certification_date: newCertificationDate || null,
            expiry_date: newExpiryDate || null,
            certification_number: newCertificationNumber.trim() || null,
            issuing_authority: newIssuingAuthority.trim() || null,
            notes: newNotes.trim() || null
          })
        })
      )

      const responses = await Promise.all(promises)
      const failedResponses = responses.filter(response => !response.ok)
      
      if (failedResponses.length > 0) {
        throw new Error(`Failed to add ${failedResponses.length} skill(s)`)
      }

      // Reset form
      setSelectedSkills([])
      setNewCertificationDate('')
      setNewExpiryDate('')
      setNewCertificationNumber('')
      setNewIssuingAuthority('')
      setNewNotes('')
      setShowAddSkillModal(false)
      
      // Refresh data
      await fetchStaffSkills()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add skills')
    }
  }

  const handleRemoveSkill = async (skillId: number) => {
    if (!confirm('Are you sure you want to remove this skill?')) {
      return
    }

    try {
      const response = await fetch(`/api/v1/staff/skills/${skillId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to remove skill')
      }

      // Refresh data
      await fetchStaffSkills()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove skill')
    }
  }

  useEffect(() => {
    // Ensure we're in the browser
    if (typeof window === 'undefined') {
      return
    }
    
    console.log('StaffSkillsMatrix: useEffect triggered, fetching skills...')
    let isMounted = true
    
    // Small delay to ensure page is fully loaded
    const timeoutId = setTimeout(() => {
      fetchStaffSkills().catch(err => {
        console.error('StaffSkillsMatrix: fetchStaffSkills promise rejection:', err)
        if (isMounted) {
          setLoading(false)
          setError('Failed to load skills matrix')
          setStaff([])
        }
      })
    }, 100)
    
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [fetchStaffSkills])

  const getSkillStatus = (skill: StaffSkill) => {
    if (!skill.expiry_date) return 'valid'
    
    const expiryDate = new Date(skill.expiry_date)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) return 'expired'
    return 'valid'
  }

  const getSkillStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'text-green-600 bg-green-100'
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
      case 'expired':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      default:
        return <AcademicCapIcon className="h-4 w-4" />
    }
  }

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
  }

  const hasSIASkills = (member: StaffMember) => {
    return member.skills.some(skill => 
      skill.skill_name.toLowerCase().includes('sia')
    )
  }

  const needsSIABadgeInfo = (member: StaffMember) => {
    return hasSIASkills(member) && (!member.sia_badge_number || !member.expiry_date)
  }

  const filteredStaff = staff.filter(member => {
    // Search by staff member name
    const nameMatch = searchTerm === '' || 
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filter by skill
    const skillMatch = skillFilter === '' || 
      member.skills.some(skill => 
        skill.skill_name.toLowerCase().includes(skillFilter.toLowerCase())
      )
    
    // Filter by SIA badge status
    let siaBadgeMatch = true
    if (siaBadgeFilter === 'has') {
      siaBadgeMatch = !!member.sia_badge_number
    } else if (siaBadgeFilter === 'missing') {
      siaBadgeMatch = !member.sia_badge_number
    } else if (siaBadgeFilter === 'expired') {
      siaBadgeMatch = Boolean(member.expiry_date && new Date(member.expiry_date) < new Date())
    } else if (siaBadgeFilter === 'expiring') {
      siaBadgeMatch = Boolean(member.expiry_date && isExpiringSoon(member.expiry_date))
    } else if (siaBadgeFilter === 'needs_sia') {
      siaBadgeMatch = needsSIABadgeInfo(member)
    }
    
    return nameMatch && skillMatch && siaBadgeMatch
  })

  const openSIABadgeModal = (member: StaffMember) => {
    setSelectedMemberForSIA(member)
    setSiaBadgeNumber(member.sia_badge_number || '')
    setSiaExpiryDate(member.expiry_date || '')
    setShowSIABadgeModal(true)
  }

  const handleSaveSIABadge = async () => {
    if (!selectedMemberForSIA || !siaBadgeNumber || !siaExpiryDate) {
      alert('Please fill in both SIA Badge Number and Expiry Date')
      return
    }

    try {
      const response = await fetch('/api/v1/staff/sia-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: selectedMemberForSIA.profile_id,
          sia_badge_number: siaBadgeNumber,
          expiry_date: siaExpiryDate
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save SIA badge information')
      }

      // Update local state
      setStaff(prevStaff => 
        prevStaff.map(member => 
          member.profile_id === selectedMemberForSIA.profile_id
            ? { ...member, sia_badge_number: siaBadgeNumber, expiry_date: siaExpiryDate }
            : member
        )
      )

      setShowSIABadgeModal(false)
      setSelectedMemberForSIA(null)
      setSiaBadgeNumber('')
      setSiaExpiryDate('')
    } catch (err) {
      console.error('Error saving SIA badge:', err)
      alert('Failed to save SIA badge information')
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


  if (loading) {
    return (
      <section className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Skills Matrix Error
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchStaffSkills}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
          >
            Retry
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-1 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Staff Skills Matrix
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Skills and certifications overview
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportSkillsMatrix}
              className="px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search by Staff Member */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Staff Member
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter staff name..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* Filter by Skill */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Skill
            </label>
            <input
              type="text"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="Enter skill name..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* Filter by SIA Badge Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SIA Badge Status
            </label>
            <select
              value={siaBadgeFilter}
              onChange={(e) => setSiaBadgeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">All Staff</option>
              <option value="has">Has SIA Badge</option>
              <option value="missing">Missing SIA Badge</option>
              <option value="expired">Expired Badge</option>
              <option value="expiring">Expiring Soon</option>
              <option value="needs_sia">Needs SIA Badge Info</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setSkillFilter('')
                setSiaBadgeFilter('all')
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredStaff.length} of {staff.length} staff members
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
                  SIA Badge Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Add Skill
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-lg font-medium">No staff members found</p>
                      <p className="text-sm">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
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
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="grid grid-cols-1 gap-1 max-h-20 overflow-y-auto">
                      {member.skills.map((skill) => {
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
                    </div>
                  </td>
                  <td 
                    className={`px-6 py-4 whitespace-nowrap ${needsSIABadgeInfo(member) ? 'bg-orange-50 dark:bg-orange-900/20 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30' : ''}`}
                    onClick={needsSIABadgeInfo(member) ? () => openSIABadgeModal(member) : undefined}
                  >
                    <div className="text-sm text-gray-900 dark:text-white">
                      {member.sia_badge_number || '—'}
                    </div>
                    {needsSIABadgeInfo(member) && (
                      <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                        ⚠️ SIA Badge Required - Click to add
                      </div>
                    )}
                  </td>
                  <td 
                    className={`px-6 py-4 whitespace-nowrap ${needsSIABadgeInfo(member) ? 'bg-orange-50 dark:bg-orange-900/20 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30' : ''}`}
                    onClick={needsSIABadgeInfo(member) ? () => openSIABadgeModal(member) : undefined}
                  >
                    <div className="text-sm text-gray-900 dark:text-white">
                      {member.expiry_date ? new Date(member.expiry_date).toLocaleDateString() : '—'}
                    </div>
                    {member.expiry_date && isExpiringSoon(member.expiry_date) && (
                      <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                        ⚠️ Expires Soon
                      </div>
                    )}
                    {needsSIABadgeInfo(member) && !member.expiry_date && (
                      <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                        ⚠️ Expiry Date Required - Click to add
                      </div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedStaff(member)
                        setShowAddSkillModal(true)
                      }}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Skill
                    </button>
                  </td>
                </motion.tr>
                ))
              )}
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
            style={{ backdropFilter: 'blur(8px)' }}
            onClick={() => setSelectedStaff(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {selectedStaff.full_name}
                      </h3>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedStaff.skills.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total Skills
                      </div>
                    </div>
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
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Skills & Certifications
                    </h4>
                    <button
                      onClick={() => setShowAddSkillModal(true)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Skill
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleRemoveSkill(skill.id)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="mt-2 space-y-1">
                              {skill.certification_date && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  <span className="font-medium">Certified:</span> {new Date(skill.certification_date).toLocaleDateString()}
                                </div>
                              )}
                              {skill.expiry_date && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  <span className="font-medium">Expires:</span> {new Date(skill.expiry_date).toLocaleDateString()}
                                </div>
                              )}
                              {skill.certification_number && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  <span className="font-medium">License #:</span> {skill.certification_number}
                                </div>
                              )}
                              {skill.issuing_authority && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  <span className="font-medium">Issued by:</span> {skill.issuing_authority}
                                </div>
                              )}
                              {skill.notes && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  <span className="font-medium">Notes:</span> {skill.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Skill Modal */}
      <AnimatePresence>
        {showAddSkillModal && selectedStaff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
            style={{ backdropFilter: 'blur(8px)' }}
            onClick={() => setShowAddSkillModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl w-[95vw] max-w-none max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add Skill for {selectedStaff.full_name}
                </h3>
              </div>
              
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Select Skills to Add for {selectedStaff.full_name}
                  </h4>
                  
                  {/* Selected Skills Summary */}
                  {selectedSkills.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Selected Skills ({selectedSkills.length})
                        </span>
                        <button
                          onClick={() => setSelectedSkills([])}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedSkills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                          >
                            {skill}
                            <button
                              onClick={() => handleSkillToggle(skill)}
                              className="ml-1 hover:text-blue-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {(() => {
                    const availableSkillsByCategory = getAvailableSkillsForStaffByCategory(selectedStaff)
                    const hasAnyAvailableSkills = Object.values(availableSkillsByCategory).some(skills => skills.length > 0)
                    
                    if (!hasAnyAvailableSkills) {
                      return (
                        <div className="text-center py-8">
                          <div className="text-gray-400 dark:text-gray-500 mb-2">
                            <AcademicCapIcon className="h-12 w-12 mx-auto" />
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedStaff.full_name} already has all available skills.
                          </p>
                        </div>
                      )
                    }
                    
                    return (
                      <div className="space-y-6">
                        {/* Security Skills */}
                        {availableSkillsByCategory.security.length > 0 && (
                          <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                            <h5 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-3 uppercase tracking-wide flex items-center">
                              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                              Security Skills ({availableSkillsByCategory.security.length})
                            </h5>
                            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                              {availableSkillsByCategory.security.map((skill) => (
                                <label key={skill} className="flex items-center space-x-2 cursor-pointer hover:bg-red-100 dark:hover:bg-red-800/30 p-2 rounded">
                                  <input
                                    type="checkbox"
                                    checked={selectedSkills.includes(skill)}
                                    onChange={() => handleSkillToggle(skill)}
                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                  />
                                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{skill}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Operations Skills */}
                        {availableSkillsByCategory.operations.length > 0 && (
                          <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                            <h5 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-3 uppercase tracking-wide flex items-center">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                              Operations Management Skills ({availableSkillsByCategory.operations.length})
                            </h5>
                            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                              {availableSkillsByCategory.operations.map((skill) => (
                                <label key={skill} className="flex items-center space-x-2 cursor-pointer hover:bg-green-100 dark:hover:bg-green-800/30 p-2 rounded">
                                  <input
                                    type="checkbox"
                                    checked={selectedSkills.includes(skill)}
                                    onChange={() => handleSkillToggle(skill)}
                                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                  />
                                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{skill}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Venue Skills */}
                        {availableSkillsByCategory.venue.length > 0 && (
                          <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                            <h5 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3 uppercase tracking-wide flex items-center">
                              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                              Venue Skills ({availableSkillsByCategory.venue.length})
                            </h5>
                            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                              {availableSkillsByCategory.venue.map((skill) => (
                                <label key={skill} className="flex items-center space-x-2 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-800/30 p-2 rounded">
                                  <input
                                    type="checkbox"
                                    checked={selectedSkills.includes(skill)}
                                    onChange={() => handleSkillToggle(skill)}
                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                  />
                                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{skill}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Maintenance Skills */}
                        {availableSkillsByCategory.maintenance.length > 0 && (
                          <div className="border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
                            <h5 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-3 uppercase tracking-wide flex items-center">
                              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                              Maintenance Skills ({availableSkillsByCategory.maintenance.length})
                            </h5>
                            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                              {availableSkillsByCategory.maintenance.map((skill) => (
                                <label key={skill} className="flex items-center space-x-2 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-800/30 p-2 rounded">
                                  <input
                                    type="checkbox"
                                    checked={selectedSkills.includes(skill)}
                                    onChange={() => handleSkillToggle(skill)}
                                    className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                                  />
                                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{skill}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Production Skills */}
                        {availableSkillsByCategory.production.length > 0 && (
                          <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                            <h5 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3 uppercase tracking-wide flex items-center">
                              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                              Production Skills ({availableSkillsByCategory.production.length})
                            </h5>
                            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                              {availableSkillsByCategory.production.map((skill) => (
                                <label key={skill} className="flex items-center space-x-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/30 p-2 rounded">
                                  <input
                                    type="checkbox"
                                    checked={selectedSkills.includes(skill)}
                                    onChange={() => handleSkillToggle(skill)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{skill}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>

                {/* Certification fields - only show when skills are selected */}
                {selectedSkills.length > 0 && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Certification Date
                          {selectedSkills.some(skill => ['SIA Door Supervisor', 'SIA Security Officer', 'SIA CCTV Operator', 'SIA Close Protection', 'SIA Key Holding', 'First Aid', 'Emergency First Aid', 'First Aid at Work', 'Paediatric First Aid', 'Mental Health First Aid', 'CPR', 'AED Operation', 'Health & Safety', 'Fire Marshal'].includes(skill)) && <span className="text-red-500"> *</span>}
                        </label>
                        <input
                          type="date"
                          value={newCertificationDate}
                          onChange={(e) => setNewCertificationDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Expiry Date
                          {selectedSkills.some(skill => ['SIA Door Supervisor', 'SIA Security Officer', 'SIA CCTV Operator', 'SIA Close Protection', 'SIA Key Holding', 'First Aid', 'Emergency First Aid', 'First Aid at Work', 'Paediatric First Aid', 'Mental Health First Aid', 'CPR', 'AED Operation'].includes(skill)) && <span className="text-red-500"> *</span>}
                        </label>
                        <input
                          type="date"
                          value={newExpiryDate}
                          onChange={(e) => setNewExpiryDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Certification Number
                        {selectedSkills.some(skill => ['SIA Door Supervisor', 'SIA Security Officer', 'SIA CCTV Operator', 'SIA Close Protection', 'SIA Key Holding'].includes(skill)) && <span className="text-red-500"> *</span>}
                      </label>
                      <input
                        type="text"
                        value={newCertificationNumber}
                        onChange={(e) => setNewCertificationNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter certification number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Issuing Authority
                        {selectedSkills.some(skill => ['SIA Door Supervisor', 'SIA Security Officer', 'SIA CCTV Operator', 'SIA Close Protection', 'SIA Key Holding', 'First Aid', 'Emergency First Aid', 'First Aid at Work', 'Paediatric First Aid', 'Mental Health First Aid', 'CPR', 'AED Operation', 'Health & Safety', 'Fire Marshal'].includes(skill)) && <span className="text-red-500"> *</span>}
                      </label>
                      <input
                        type="text"
                        value={newIssuingAuthority}
                        onChange={(e) => setNewIssuingAuthority(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter issuing authority"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter any additional notes"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddSkillModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSkills}
                  disabled={selectedSkills.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add {selectedSkills.length} Skill{selectedSkills.length !== 1 ? 's' : ''}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SIA Badge Modal */}
        {showSIABadgeModal && selectedMemberForSIA && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
            style={{ backdropFilter: 'blur(8px)' }}
            onClick={() => setShowSIABadgeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add SIA Badge Information
                </h3>
                <button
                  onClick={() => setShowSIABadgeModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Adding SIA badge information for <strong>{selectedMemberForSIA.full_name}</strong>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SIA Badge Number (16 digits)
                  </label>
                  <input
                    type="text"
                    value={siaBadgeNumber}
                    onChange={(e) => setSiaBadgeNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter 16-digit SIA badge number"
                    maxLength={16}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={siaExpiryDate}
                    onChange={(e) => setSiaExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSIABadgeModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSIABadge}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save SIA Badge
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
