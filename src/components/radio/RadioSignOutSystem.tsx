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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignedStaff = async () => {
    try {
      const response = await fetch(`/api/v1/staff/assigned?event_id=${eventId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch assigned staff')
      }
      
      const data = await response.json()
      setAssignedStaff(data.assignedStaff || [])
    } catch (err) {
      console.error('Failed to fetch assigned staff:', err)
    }
  }

  useEffect(() => {
    if (eventId) {
      fetchSignOuts()
      fetchAssignedStaff()
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
    if (!canvas || !radioNumber) {
      setError('Please enter a radio number and provide a signature')
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
      const response = await fetch(`/api/v1/radio-signout/${selectedSignOut.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signed_in_signature: signature,
          signed_in_notes: signInNotes,
          condition_on_return: conditionOnReturn,
          status: 'returned'
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
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Radio Sign-Out System
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Track radio equipment with digital signatures
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowSignOutModal(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RadioIcon className="h-4 w-4" />
              Sign Out Radio
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{outRadios.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Currently Out</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{returnedRadios.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Returned</div>
        </div>
        <div className="text-center">
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
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
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
                  <div className="font-medium text-gray-900 dark:text-white">
                    Radio #{signOut.radio_number}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
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
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Sign In
              </button>
            </motion.div>
          ))}
        </div>

        {outRadios.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <RadioIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No radios currently signed out</p>
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
              animate={{ scale: 1, opacity: 0 }}
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
    </div>
  )
}
