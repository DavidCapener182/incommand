import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RadioIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'

interface RadioSignOut {
  id: number
  radio_number: string
  user_id: string
  event_id: string
  signed_out_at: string
  signed_out_signature: string
  signed_out_notes: string | null
  signed_in_at: string | null
  signed_in_signature: string | null
  signed_in_notes: string | null
  condition_on_return: string | null
  status: 'out' | 'returned' | 'overdue' | 'lost'
  equipment_signed_out?: {
    pitCans?: boolean
    earpiece?: boolean
    spareBattery?: boolean
  }
  equipment_returned?: {
    pitCans?: boolean
    earpiece?: boolean
    spareBattery?: boolean
  }
  profile: {
    id: string
    full_name: string
    callsign: string | null
    email: string
  }
}

interface RadioSignOutSystemProps {
  eventId: string
  className?: string
}

export default function RadioSignOutSystem({ 
  eventId,
  className = '' 
}: RadioSignOutSystemProps) {
  const { user } = useAuth()
  const [signOuts, setSignOuts] = useState<RadioSignOut[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [selectedSignOut, setSelectedSignOut] = useState<RadioSignOut | null>(null)
  const [assignedStaff, setAssignedStaff] = useState<any[]>([])
  
  // Sign-out form
  const [radioNumber, setRadioNumber] = useState('')
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [equipment, setEquipment] = useState({
    pitCans: false,
    earpiece: false,
    spareBattery: false
  })
  
  // Sign-in form
  const [signInEquipment, setSignInEquipment] = useState({
    pitCans: false,
    earpiece: false,
    spareBattery: false
  })

  const fetchSignOuts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/v1/radio-signout?event_id=${eventId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch radio sign-outs')
      }
      
      const data = await response.json()
      setSignOuts(data.signOuts || [])
      setAssignedStaff(data.assignedStaff || []) // Get assigned staff from the same API call
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (eventId) {
      fetchSignOuts()
    }
  }, [eventId])

  // Auto-refresh every 30 seconds to keep data in sync
  useEffect(() => {
    if (!eventId) return

    const interval = setInterval(() => {
      console.log('Auto-refreshing radio signouts...')
      fetchSignOuts()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [eventId])

  // Equipment handlers
  const handleEquipmentChange = (item: keyof typeof equipment) => {
    setEquipment(prev => ({
      ...prev,
      [item]: !prev[item]
    }))
  }

  const handleSignInEquipmentChange = (item: keyof typeof signInEquipment) => {
    setSignInEquipment(prev => ({
      ...prev,
      [item]: !prev[item]
    }))
  }

  const handleSignOut = async () => {
    console.log('handleSignOut called with:', { radioNumber, selectedStaffId, eventId, equipment })
    
    if (!radioNumber || !selectedStaffId) {
      setError('Please enter a radio number and select a staff member')
      return
    }
    
    if (!eventId) {
      setError('Event ID is missing')
      return
    }
    
    try {
      const requestBody = {
        radio_number: radioNumber,
        event_id: eventId,
        staff_id: selectedStaffId,
        equipment: equipment
      }
      console.log('Sending request:', requestBody)
      
      const response = await fetch('/api/v1/radio-signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      console.log('Response status:', response.status)
      const responseData = await response.json()
      console.log('Response data:', responseData)
      
      if (!response.ok) {
        throw new Error(`Failed to sign out radio: ${responseData.error || 'Unknown error'}`)
      }
      
      // Reset form and refresh list
      setRadioNumber('')
      setSelectedStaffId('')
      setEquipment({ pitCans: false, earpiece: false, spareBattery: false })
      setShowSignOutModal(false)
      await fetchSignOuts()
      console.log('Sign-out completed, list refreshed')
    } catch (err) {
      console.error('Sign out error:', err)
      setError(err instanceof Error ? err.message : 'Sign out failed')
    }
  }

  const handleSignIn = async () => {
    if (!selectedSignOut) {
      setError('No radio selected')
      return
    }

    // Check for missing equipment returns
    const missingEquipment = []
    const originalEquipment = selectedSignOut.equipment_signed_out || {}
    
    if (originalEquipment.pitCans && !signInEquipment.pitCans) {
      missingEquipment.push('Pit Cans')
    }
    if (originalEquipment.earpiece && !signInEquipment.earpiece) {
      missingEquipment.push('Earpiece')
    }
    if (originalEquipment.spareBattery && !signInEquipment.spareBattery) {
      missingEquipment.push('Spare Battery')
    }

    if (missingEquipment.length > 0) {
      const missingList = missingEquipment.join(', ')
      const confirmMessage = `Warning: The following equipment was signed out but not marked as returned: ${missingList}\n\nAre you sure you want to continue?`
      
      if (!confirm(confirmMessage)) {
        return
      }
    }

    try {
      const response = await fetch('/api/v1/radio-signout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signout_id: selectedSignOut.id,
          signed_in_at: new Date().toISOString(),
          status: 'returned',
          equipment_returned: signInEquipment
        })
      })

      if (!response.ok) {
        throw new Error('Failed to sign in radio')
      }

      // Reset form and refresh list
      setSelectedSignOut(null)
      setSignInEquipment({ pitCans: false, earpiece: false, spareBattery: false })
      setShowSignInModal(false)
      await fetchSignOuts()
      console.log('Sign-in completed, list refreshed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    }
  }

  const handleDeleteLog = async (logId: number) => {
    if (!confirm('Are you sure you want to delete this radio log? This action cannot be undone.')) {
      return
    }

    try {
      console.log('Deleting radio log with ID:', logId)
      console.log('Delete URL:', `/api/v1/radio-signout?id=${logId}`)
      
      const response = await fetch(`/api/v1/radio-signout?id=${logId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      console.log('Delete response status:', response.status)
      console.log('Delete response headers:', response.headers)
      
      let responseData
      try {
        responseData = await response.json()
        console.log('Delete response data:', responseData)
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError)
        const textResponse = await response.text()
        console.log('Delete response text:', textResponse)
        throw new Error('Invalid response format')
      }

      if (!response.ok) {
        throw new Error(`Failed to delete radio log: ${responseData?.error || 'Unknown error'}`)
      }

      console.log('Delete successful, refreshing list...')
      // Refresh the list
      await fetchSignOuts()
      console.log('List refreshed after delete')
    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const exportCSV = async () => {
    try {
      const response = await fetch(`/api/v1/events/${eventId}/radio-signouts/export`, {
        method: 'GET'
      })
      
      if (!response.ok) {
        throw new Error('Failed to export')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `radio-signouts-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  const outRadios = signOuts.filter(s => s.status === 'out' || s.status === 'overdue')
  const returnedRadios = signOuts.filter(s => s.status === 'returned')
  const overdueRadios = signOuts.filter(s => s.status === 'overdue')

  return (
    <section className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-1 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Radio Sign-Out System
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Track radio equipment with digital signatures
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowSignOutModal(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <RadioIcon className="h-4 w-4" />
              Sign Out Radio
            </button>
          </div>
        </div>
      </div>

      {/* Assigned Staff */}
      {assignedStaff.length > 0 && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
            Assigned Staff Available for Radio Assignment
          </h4>
          <div className="flex flex-wrap gap-2">
            {assignedStaff.map((staff) => (
              <span
                key={staff.profile.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
              >
                {staff.profile.full_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{outRadios.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Currently Out</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{returnedRadios.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Returned</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{overdueRadios.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Overdue</div>
        </div>
      </div>

      {/* Radio List */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {outRadios.map((signOut) => (
            <motion.div
              key={signOut.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 sm:p-5 rounded-xl border shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ${
                signOut.status === 'overdue'
                  ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0">
                  <RadioIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 uppercase">Radio #{signOut.radio_number}</p>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {signOut.profile.full_name}
                    {signOut.profile.callsign && ` (${signOut.profile.callsign})`}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Signed out: {new Date(signOut.signed_out_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedSignOut(signOut)
                  // Reset equipment checkboxes to unchecked - user must actively check what's being returned
                  setSignInEquipment({ pitCans: false, earpiece: false, spareBattery: false })
                  setShowSignInModal(true)
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-sm font-medium"
              >
                Sign In
              </button>
            </motion.div>
          ))}
        </div>

        {outRadios.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 text-center">
              <RadioIcon className="h-8 w-8 mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No Radios Signed Out</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">All radios are available</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 text-center">
              <CheckCircleIcon className="h-8 w-8 mx-auto mb-3 text-green-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Ready</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Ready for radio assignments</p>
            </div>
          </div>
        )}
      </div>

      {/* Radio Log Table */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Radio Log
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track all sign-out and sign-in times
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Radio Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Signed Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Signed In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {signOuts.map((radio) => (
                <tr key={radio.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    Radio {radio.radio_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {radio.profile?.full_name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {radio.signed_out_at ? new Date(radio.signed_out_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {radio.signed_in_at ? new Date(radio.signed_in_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <button
                      onClick={() => handleDeleteLog(radio.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      title="Delete radio log"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {signOuts.length === 0 && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            No radio logs yet.
          </div>
        )}
      </div>

      {/* Sign-Out Modal */}
      <AnimatePresence>
        {showSignOutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
            style={{ backdropFilter: 'blur(8px)' }}
            onClick={() => setShowSignOutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Sign Out Radio
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Radio Number
                  </label>
                  <input
                    type="text"
                    value={radioNumber}
                    onChange={(e) => setRadioNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., R-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign to Staff Member
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select staff member...</option>
                    {assignedStaff.map((staff) => (
                      <option key={staff.profile.id} value={staff.profile.id}>
                        {staff.profile.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Equipment Included
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={equipment.pitCans}
                        onChange={() => handleEquipmentChange('pitCans')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Pit Cans</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={equipment.earpiece}
                        onChange={() => handleEquipmentChange('earpiece')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Earpiece</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={equipment.spareBattery}
                        onChange={() => handleEquipmentChange('spareBattery')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Spare Battery</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowSignOutModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign-In Modal - Similar structure */}
      <AnimatePresence>
        {showSignInModal && selectedSignOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
            style={{ backdropFilter: 'blur(8px)' }}
            onClick={() => setShowSignInModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Sign In Radio #{selectedSignOut.radio_number}
                </h3>
              </div>
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Return {selectedSignOut.profile.full_name}'s radio?
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Equipment Being Returned
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Check all equipment that was originally signed out with this radio
                  </p>
                  <div className="space-y-3">
                    {selectedSignOut.equipment_signed_out?.pitCans && (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={signInEquipment.pitCans}
                          onChange={() => handleSignInEquipmentChange('pitCans')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Pit Cans <span className="text-xs text-blue-600">(signed out)</span>
                        </span>
                      </label>
                    )}
                    {selectedSignOut.equipment_signed_out?.earpiece && (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={signInEquipment.earpiece}
                          onChange={() => handleSignInEquipmentChange('earpiece')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Earpiece <span className="text-xs text-blue-600">(signed out)</span>
                        </span>
                      </label>
                    )}
                    {selectedSignOut.equipment_signed_out?.spareBattery && (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={signInEquipment.spareBattery}
                          onChange={() => handleSignInEquipmentChange('spareBattery')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Spare Battery <span className="text-xs text-blue-600">(signed out)</span>
                        </span>
                      </label>
                    )}
                    {(!selectedSignOut.equipment_signed_out?.pitCans && 
                      !selectedSignOut.equipment_signed_out?.earpiece && 
                      !selectedSignOut.equipment_signed_out?.spareBattery) && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        No equipment was signed out with this radio.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowSignInModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignIn}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
