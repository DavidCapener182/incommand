import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RadioIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  ArrowDownTrayIcon
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
  const [signOutNotes, setSignOutNotes] = useState('')
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  
  // Sign-in form
  const [signInNotes, setSignInNotes] = useState('')
  const [conditionOnReturn, setConditionOnReturn] = useState<string>('good')
  const signInCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawingSignIn, setIsDrawingSignIn] = useState(false)

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

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleSignOut = async () => {
    const canvas = canvasRef.current
    if (!canvas || !radioNumber || !selectedStaffId) {
      setError('Please enter a radio number, select a staff member, and provide a signature')
      return
    }
    
    const signature = canvas.toDataURL()
    
    try {
      const response = await fetch('/api/v1/radio-signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          radio_number: radioNumber,
          event_id: eventId,
          staff_id: selectedStaffId,
          signed_out_signature: signature,
          signed_out_notes: signOutNotes
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to sign out radio')
      }
      
      // Reset form and refresh list
      setRadioNumber('')
      setSignOutNotes('')
      setSelectedStaffId('')
      clearSignature()
      setShowSignOutModal(false)
      fetchSignOuts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed')
    }
  }

  const handleSignIn = async () => {
    if (!selectedSignOut || !signInCanvasRef.current) {
      setError('Please provide a signature')
      return
    }
    
    const signature = signInCanvasRef.current.toDataURL()
    
    try {
      const response = await fetch('/api/v1/radio-signout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signout_id: selectedSignOut.id,
          signed_in_signature: signature,
          signed_in_notes: signInNotes,
          condition_on_return: conditionOnReturn
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to sign in radio')
      }
      
      // Reset form and refresh list
      setSignInNotes('')
      setConditionOnReturn('good')
      setSelectedSignOut(null)
      setShowSignInModal(false)
      fetchSignOuts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
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
                {staff.profile.callsign && (
                  <span className="ml-2 text-xs bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded">
                    {staff.profile.callsign}
                  </span>
                )}
                <span className="ml-2 text-xs bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded">
                  {staff.position_name}
                </span>
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
        <div className="space-y-3">
          {outRadios.map((signOut) => (
            <motion.div
              key={signOut.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ${
                signOut.status === 'overdue'
                  ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <RadioIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
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
                  setShowSignInModal(true)
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-sm font-medium"
              >
                Sign In
              </button>
            </motion.div>
          ))}
        </div>

        {outRadios.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <RadioIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No radios currently signed out</p>
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
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
                        {staff.profile.full_name} {staff.profile.callsign && `(${staff.profile.callsign})`} - {staff.position_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={signOutNotes}
                    onChange={(e) => setSignOutNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Any notes about the equipment..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Digital Signature
                  </label>
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white cursor-crosshair w-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  <button
                    onClick={clearSignature}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    Clear Signature
                  </button>
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
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
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Condition on Return
                  </label>
                  <select
                    value={conditionOnReturn}
                    onChange={(e) => setConditionOnReturn(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="good">Good</option>
                    <option value="damaged">Damaged</option>
                    <option value="missing_parts">Missing Parts</option>
                    <option value="faulty">Faulty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={signInNotes}
                    onChange={(e) => setSignInNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Any issues or notes..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Digital Signature
                  </label>
                  <canvas
                    ref={signInCanvasRef}
                    width={400}
                    height={150}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white cursor-crosshair w-full"
                    onMouseDown={(e) => {
                      setIsDrawingSignIn(true)
                      const canvas = signInCanvasRef.current
                      if (!canvas) return
                      const rect = canvas.getBoundingClientRect()
                      const ctx = canvas.getContext('2d')
                      if (!ctx) return
                      ctx.beginPath()
                      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
                    }}
                    onMouseMove={(e) => {
                      if (!isDrawingSignIn) return
                      const canvas = signInCanvasRef.current
                      if (!canvas) return
                      const rect = canvas.getBoundingClientRect()
                      const ctx = canvas.getContext('2d')
                      if (!ctx) return
                      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
                      ctx.strokeStyle = '#000'
                      ctx.lineWidth = 2
                      ctx.stroke()
                    }}
                    onMouseUp={() => setIsDrawingSignIn(false)}
                    onMouseLeave={() => setIsDrawingSignIn(false)}
                  />
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
                  Sign In
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
