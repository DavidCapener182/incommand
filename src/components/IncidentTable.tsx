'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import IncidentDetailsModal from './IncidentDetailsModal'

interface Incident {
  id: string
  log_number: string
  timestamp: string
  callsign_from: string
  callsign_to: string
  occurrence: string
  incident_type: string
  action_taken: string
  is_closed: boolean
}

const getIncidentTypeStyle = (type: string) => {
  switch(type) {
    case 'Code Red':
      return 'bg-red-100 text-red-800'
    case 'Refusal':
      return 'bg-yellow-100 text-yellow-800'
    case 'Code Green':
      return 'bg-green-100 text-green-800'
    case 'Code Purple':
      return 'bg-purple-100 text-purple-800'
    case 'Code White':
      return 'bg-gray-100 text-gray-800'
    case 'Code Black':
      return 'bg-black text-white'
    case 'Code Pink':
      return 'bg-pink-100 text-pink-800'
    case 'Attendance':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function IncidentTable() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentEventId, setCurrentEventId] = useState<string | null>(null)
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)

  useEffect(() => {
    fetchIncidents()

    // Set up real-time subscription
    const setupSubscription = async () => {
      // Get current event first
      const { data: currentEvent } = await supabase
        .from('events')
        .select('id')
        .eq('is_current', true)
        .single()

      if (!currentEvent) return

      setCurrentEventId(currentEvent.id)

      // Subscribe to changes
      const subscription = supabase
        .channel('incident_logs_changes')
        .on('postgres_changes', 
          {
            event: '*', // Listen to all changes (insert, update, delete)
            schema: 'public',
            table: 'incident_logs'
          }, 
          (payload) => {
            // Handle different types of changes
            if (payload.eventType === 'INSERT') {
              setIncidents(prev => [payload.new as Incident, ...prev])
            } else if (payload.eventType === 'UPDATE') {
              setIncidents(prev => 
                prev.map(incident => 
                  incident.id === payload.new.id ? payload.new as Incident : incident
                )
              )
            } else if (payload.eventType === 'DELETE') {
              setIncidents(prev => 
                prev.filter(incident => incident.id !== payload.old.id)
              )
            }
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }

    setupSubscription()
  }, [])

  const fetchIncidents = async () => {
    try {
      // Get current event first
      const { data: currentEvent } = await supabase
        .from('events')
        .select('id')
        .eq('is_current', true)
        .single()

      if (!currentEvent) {
        setIncidents([])
        return
      }

      // Then get incidents for this event
      const { data, error } = await supabase
        .from('incident_logs')
        .select('*')
        .eq('event_id', currentEvent.id)
        .order('timestamp', { ascending: false })

      if (error) throw error

      setIncidents(data || [])
    } catch (err) {
      console.error('Error fetching incidents:', err)
      setError('Failed to fetch incidents')
    } finally {
      setLoading(false)
    }
  }

  const toggleIncidentStatus = async (incident: Incident) => {
    try {
      const { error } = await supabase
        .from('incident_logs')
        .update({ is_closed: !incident.is_closed })
        .eq('id', incident.id)

      if (error) throw error

      await fetchIncidents()
    } catch (err) {
      console.error('Error updating incident status:', err)
    }
  }

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncidentId(incident.id)
    setIsDetailsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedIncidentId(null)
  }

  if (loading) {
    return (
      <div className="mt-4 bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (incidents.length === 0) {
    return (
      <div className="mt-4 bg-white shadow rounded-lg p-6 text-center text-gray-500">
        No incidents to display
      </div>
    )
  }

  return (
    <>
      <div className="mt-4 flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Log #
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      To
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Occurrence
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incidents.map((incident) => (
                    <tr 
                      key={incident.id}
                      onClick={() => handleIncidentClick(incident)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-blue-600">
                        {incident.log_number}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {new Date(incident.timestamp).toLocaleTimeString('en-GB')}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {incident.callsign_from}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {incident.callsign_to}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500 relative group">
                        <div className="line-clamp-2 max-w-md">
                          {incident.occurrence}
                        </div>
                        <div className="hidden group-hover:block absolute z-50 left-0 top-full mt-1 p-2 bg-gray-800 text-white text-sm rounded shadow-lg max-w-lg whitespace-pre-wrap">
                          {incident.occurrence}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getIncidentTypeStyle(incident.incident_type)}`}>
                          {incident.incident_type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500 relative group">
                        <div className="line-clamp-2 max-w-xs">
                          {incident.action_taken}
                        </div>
                        <div className="hidden group-hover:block absolute z-50 left-0 top-full mt-1 p-2 bg-gray-800 text-white text-sm rounded shadow-lg max-w-lg whitespace-pre-wrap">
                          {incident.action_taken}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {incident.incident_type === 'Sit Rep' ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                            Logged
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleIncidentStatus(incident)
                            }}
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              incident.is_closed
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            }`}
                          >
                            {incident.is_closed ? 'Closed' : 'Open'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <IncidentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseModal}
        incidentId={selectedIncidentId}
      />
    </>
  )
} 