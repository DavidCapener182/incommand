'use client'

import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TransportConfig, TransportIssue } from '@/types/football'
import { Plus, Trash2, AlertTriangle, CheckCircle, Clock, MapPin, Settings } from 'lucide-react'
import { geocodeAddress } from '@/utils/geocoding'

interface TransportModalProps {
  onSave?: () => void
}

// Current Tab Component - Live Transport Monitoring
export function TransportCurrent({ onSave }: TransportModalProps) {
  const [transportConfig, setTransportConfig] = useState<TransportConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [realTimeStatus, setRealTimeStatus] = useState<any[]>([])
  const [arrivalPlanning, setArrivalPlanning] = useState<any>(null)
  const [newIssue, setNewIssue] = useState<Partial<TransportIssue>>({
    type: '',
    description: '',
    severity: 'low'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // First, try to fetch the current event to get venue information
      let eventVenueName = null
      let eventVenueAddress = null
      
      try {
        const eventRes = await fetch('/api/get-current-event')
        if (eventRes.ok) {
          const eventData = await eventRes.json()
          console.log('Event API response:', eventData)
          if (eventData.event) {
            eventVenueName = eventData.event.venue_name || eventData.event.venue_address
            eventVenueAddress = eventData.event.venue_address
            console.log('Event venue found:', { eventVenueName, eventVenueAddress })
          } else {
            console.log('No event in response, data:', eventData)
          }
        } else {
          console.log('Event API returned error:', eventRes.status, eventRes.statusText)
        }
      } catch (error) {
        console.error('Could not fetch event data, continuing with transport config:', error)
      }
      
      // Fetch transport config
      const res = await fetch('/api/football/transport?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (res.ok) {
        const data = await res.json()
        console.log('Transport data loaded:', {
          hasLocation: !!data.location,
          hasCoordinates: !!data.coordinates,
          realTimeStatusCount: data.realTimeStatus?.length || 0,
          hasArrivalPlanning: !!data.arrivalPlanning,
          eventVenueName,
          eventVenueAddress
        })
        
        // If transport config doesn't have location but event has venue, auto-populate
        // Also check if venue name matches but location field is different
        const hasLocation = data.location && data.location.trim().length > 0
        const needsLocation = !hasLocation && !data.coordinates && (eventVenueName || eventVenueAddress)
        
        if (needsLocation) {
          console.log('Auto-populating transport location from event venue')
          
          // Try to geocode the venue address to get coordinates
          let coordinates = data.coordinates
          
          // Check for well-known venues first (before attempting geocoding)
          if (eventVenueName?.toLowerCase().includes('anfield') && !coordinates) {
            coordinates = { lat: 53.4308, lng: -2.9608 }
            console.log('Using known Anfield coordinates')
          } else if (eventVenueAddress && !coordinates) {
            try {
              const coords = await geocodeAddress(eventVenueAddress)
              coordinates = { lat: coords.lat, lng: coords.lon }
              console.log('Geocoded venue address:', coordinates)
            } catch (error) {
              console.log('Could not geocode venue address, continuing without coordinates:', error)
            }
          }
          
          // Auto-save the venue location to transport config
          try {
            const locationToSave = eventVenueName || eventVenueAddress
            console.log('Saving transport location:', {
              location: locationToSave,
              coordinates,
              existingPostcode: data.postcode,
              existingRadius: data.radius || 3
            })
            
            const updateRes = await fetch('/api/football/transport', {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'x-company-id': '550e8400-e29b-41d4-a716-446655440000',
                'x-event-id': '550e8400-e29b-41d4-a716-446655440001'
              },
              body: JSON.stringify({
                action: 'config',
                data: {
                  location: locationToSave,
                  postcode: data.postcode || undefined, // Keep existing if set
                  coordinates: coordinates || undefined,
                  radius: data.radius || 3,
                  providers: data.providers || []
                }
              })
            })
            
            if (updateRes.ok) {
              console.log('Transport location saved successfully, reloading data...')
              // Reload data after updating
              const updatedRes = await fetch('/api/football/transport?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
              if (updatedRes.ok) {
                const updatedData = await updatedRes.json()
                console.log('Reloaded transport data:', {
                  location: updatedData.location,
                  hasCoordinates: !!updatedData.coordinates
                })
                setTransportConfig(updatedData)
                setRealTimeStatus(updatedData.realTimeStatus || [])
                setArrivalPlanning(updatedData.arrivalPlanning || null)
                return
              } else {
                console.error('Failed to reload transport data after save')
              }
            } else {
              const errorText = await updateRes.text()
              console.error('Failed to save transport location:', updateRes.status, errorText)
            }
          } catch (error) {
            console.error('Failed to auto-save venue location:', error)
          }
        }
        
        setTransportConfig(data)
        setRealTimeStatus(data.realTimeStatus || [])
        setArrivalPlanning(data.arrivalPlanning || null)
      } else {
        console.error('Failed to load transport data:', res.status, res.statusText)
      }
    } catch (error) {
      console.error('Failed to load transport data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddIssue = async () => {
    if (!transportConfig || !newIssue.type || !newIssue.description) return

    try {
      await fetch('/api/football/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newIssue.type,
          description: newIssue.description,
          severity: newIssue.severity
        }),
      })
      
      // Reload data to get updated issues
      await loadData()
      setNewIssue({ type: '', description: '', severity: 'low' })
    } catch (error) {
      console.error('Failed to add transport issue:', error)
    }
  }

  const removeIssue = (issueId: string) => {
    if (!transportConfig) return

    const updatedIssues = transportConfig.issues?.filter(issue => issue.id !== issueId) || []
    setTransportConfig({ ...transportConfig, issues: updatedIssues })
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  if (!transportConfig) {
    return <div className="p-4 text-center text-red-600">Failed to load transport data</div>
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4" />
      case 'medium': return <Clock className="h-4 w-4" />
      case 'low': return <CheckCircle className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bus': return '🚌'
      case 'rail': return '🚆'
      case 'road': return '🚧'
      case 'tube': return '🚇'
      case 'tram': return '🚊'
      default: return '🚗'
    }
  }

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-200px)] pr-2">
      <div className="text-sm text-muted-foreground mb-4">
        Monitor transport disruptions and report local issues. Changes are saved automatically.
      </div>
      
      {/* Location info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-900">Monitoring Location</span>
        </div>
        {transportConfig.location || transportConfig.coordinates ? (
          <>
        <div className="text-sm text-blue-700">
              {transportConfig.location || 'Location configured'}
          {transportConfig.postcode && ` (${transportConfig.postcode})`}
              {transportConfig.coordinates && !transportConfig.location && 
                ` (${transportConfig.coordinates.lat.toFixed(4)}, ${transportConfig.coordinates.lng.toFixed(4)})`}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Radius: {transportConfig.radius} miles • Providers: {transportConfig.providers.length > 0 ? transportConfig.providers.join(', ') : 'None configured'}
            </div>
          </>
        ) : (
          <div className="text-sm text-amber-700">
            <p className="font-medium mb-1">⚠️ Location Not Configured</p>
            <p className="text-xs">Go to the <strong>Setup</strong> tab to configure venue location (name, postcode, or coordinates) to enable transport monitoring.</p>
          </div>
        )}
      </div>

      {/* Real-time API status */}
      {realTimeStatus.length > 0 ? (
        <div className="border rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-green-900">Real-Time Transport Status</h4>
            <div className="text-xs text-gray-600">
              {realTimeStatus.some(s => s.type === 'tube' || s.type === 'bus') ? '✅ Live' : '⚠️ Estimated'}
            </div>
          </div>
          <div className="space-y-2">
            {realTimeStatus.map((status, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center gap-2">
                  {status.type === 'rail' && '🚆'}
                  {status.type === 'bus' && '🚌'}
                  {status.type === 'tube' && '🚇'}
                  {status.type === 'taxi' && '🚖'}
                  {status.type === 'road' && '🚧'}
                  <span className="text-sm font-medium capitalize">{status.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  {status.status === 'normal' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {status.status === 'delayed' && <Clock className="h-4 w-4 text-amber-600" />}
                  {status.status === 'disrupted' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                  {status.status === 'severe' && <AlertTriangle className="h-4 w-4 text-red-700" />}
                  <span className={`text-sm ${
                    status.status === 'normal' ? 'text-green-700' :
                    status.status === 'delayed' ? 'text-amber-700' :
                    'text-red-700'
                  }`}>
                    {status.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Last updated: {realTimeStatus[0]?.lastUpdated ? new Date(realTimeStatus[0].lastUpdated).toLocaleTimeString() : 'Just now'}
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-amber-50">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">No Transport Data Available</span>
          </div>
          <p className="text-xs text-amber-700 mt-2">
            {transportConfig.location || transportConfig.coordinates 
              ? 'Transport data is being fetched. If this persists, check the Setup tab to ensure location is configured correctly.'
              : 'Configure venue location in the Setup tab to enable real-time transport monitoring.'}
          </p>
        </div>
      )}

      {/* Arrival Planning Section */}
      {arrivalPlanning && (
        <div className="border rounded-lg p-4 bg-purple-50">
          <h4 className="font-medium mb-3 text-purple-900 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Customer Arrival Planning
          </h4>
          
          {/* Estimated Arrival Time */}
          <div className="mb-4 p-3 bg-white rounded border border-purple-200">
            <div className="text-xs text-purple-600 mb-1">Estimated Travel Time</div>
            <div className="text-lg font-semibold text-purple-900">{arrivalPlanning.estimatedArrivalTime}</div>
            <div className="text-xs text-gray-500 mt-1">from nearby transport hubs</div>
      </div>

          {/* Warnings */}
          {arrivalPlanning.warnings && arrivalPlanning.warnings.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Warnings
              </div>
              <ul className="space-y-1">
                {arrivalPlanning.warnings.map((warning: string, index: number) => (
                  <li key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {arrivalPlanning.recommendations && arrivalPlanning.recommendations.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Recommendations
              </div>
              <ul className="space-y-1">
                {arrivalPlanning.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-sm text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Nearby Bus Stops */}
          {arrivalPlanning.nearbyStops && arrivalPlanning.nearbyStops.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                🚌 Nearby Bus Stops
              </div>
              <div className="space-y-2">
                {arrivalPlanning.nearbyStops.slice(0, 3).map((stop: any, index: number) => (
                  <div key={index} className="bg-white p-2 rounded border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{stop.stop}</span>
                      <span className="text-xs text-gray-500">{stop.distance.toFixed(1)}km away</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Routes: <span className="font-semibold">{stop.routes.join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add new issue */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-3">Report Transport Issue</h4>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={newIssue.type || ''}
            onChange={(e) => setNewIssue({ ...newIssue, type: e.target.value })}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value="">Select Type</option>
            <option value="Bus">🚌 Bus</option>
            <option value="Rail">🚆 Rail</option>
            <option value="Road">🚧 Road</option>
            <option value="Tube">🚇 Tube</option>
            <option value="Tram">🚊 Tram</option>
            <option value="Other">🚗 Other</option>
          </select>
          <select
            value={newIssue.severity || 'low'}
            onChange={(e) => setNewIssue({ ...newIssue, severity: e.target.value as 'low' | 'medium' | 'high' })}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value="low">Low Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="high">High Severity</option>
          </select>
          <Input
            placeholder="Issue description"
            value={newIssue.description || ''}
            onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
            className="col-span-2"
          />
          <Button 
            onClick={handleAddIssue} 
            disabled={!newIssue.type || !newIssue.description}
            className="col-span-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Report Issue
          </Button>
        </div>
      </div>

      {/* Current issues */}
      <div className="space-y-2">
        <h4 className="font-medium">Current Transport Issues</h4>
        {transportConfig.issues && transportConfig.issues.length > 0 ? (
          transportConfig.issues.map((issue) => (
            <div key={issue.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(issue.type)}</span>
                  <span className="font-medium">{issue.type}</span>
                  <Badge className={getSeverityColor(issue.severity)}>
                    {getSeverityIcon(issue.severity)}
                    <span className="ml-1 capitalize">{issue.severity}</span>
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeIssue(issue.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
              
              <div className="text-xs text-muted-foreground">
                Reported at {new Date(issue.timestamp).toLocaleString()}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No transport issues reported
          </div>
        )}
      </div>
    </div>
  )
}

// Setup Tab Component - Transport Configuration
export function TransportSetup({ onSave }: TransportModalProps) {
  const [transportConfig, setTransportConfig] = useState<TransportConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [escalationRules, setEscalationRules] = useState({
    auto_escalate_high_severity: true,
    auto_escalate_medium_severity: false,
    escalation_time_minutes: 15, // Minutes before auto-escalating
    notify_on_high_severity: true,
    notify_on_multiple_issues: true,
    multiple_issues_threshold: 3 // Number of issues before notification
  })

  const loadData = async () => {
    try {
      const res = await fetch('/api/football/transport?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (res.ok) {
        const data = await res.json()
        setTransportConfig(data)
      }
    } catch (error) {
      console.error('Failed to load transport data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEscalationRules = async () => {
    try {
      const res = await fetch('/api/football/settings?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001&tool_type=transport')
      if (res.ok) {
        const data = await res.json()
        if (data.settings_json) {
          setEscalationRules({
            auto_escalate_high_severity: data.settings_json.auto_escalate_high_severity ?? true,
            auto_escalate_medium_severity: data.settings_json.auto_escalate_medium_severity ?? false,
            escalation_time_minutes: data.settings_json.escalation_time_minutes || 15,
            notify_on_high_severity: data.settings_json.notify_on_high_severity ?? true,
            notify_on_multiple_issues: data.settings_json.notify_on_multiple_issues ?? true,
            multiple_issues_threshold: data.settings_json.multiple_issues_threshold || 3
          })
        }
      }
    } catch (error) {
      console.error('Failed to load escalation rules:', error)
    }
  }

  const saveEscalationRules = async () => {
    try {
      await fetch('/api/football/settings?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_type: 'transport',
          settings_json: escalationRules
        })
      })
      alert('Escalation rules saved successfully')
    } catch (error) {
      console.error('Failed to save escalation rules:', error)
      alert('Failed to save escalation rules')
    }
  }

  useEffect(() => {
    loadData()
    loadEscalationRules()
  }, [])

  const handleSave = async () => {
    if (!transportConfig) return
    
    setSaving(true)
    try {
      await fetch('/api/football/transport', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: transportConfig.location,
          postcode: transportConfig.postcode,
          coordinates: transportConfig.coordinates,
          providers: transportConfig.providers,
          radius: transportConfig.radius,
        }),
      })
      onSave?.()
    } catch (error) {
      console.error('Failed to save transport configuration:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (updates: Partial<TransportConfig>) => {
    if (!transportConfig) return
    setTransportConfig({ ...transportConfig, ...updates })
  }

  const addProvider = (provider: string) => {
    if (!transportConfig || !provider.trim()) return
    const updatedProviders = [...transportConfig.providers, provider.trim()]
    updateConfig({ providers: updatedProviders })
  }

  const removeProvider = (provider: string) => {
    if (!transportConfig) return
    const updatedProviders = transportConfig.providers.filter(p => p !== provider)
    updateConfig({ providers: updatedProviders })
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  if (!transportConfig) {
    return <div className="p-4 text-center text-red-600">Failed to load transport data</div>
  }

  const commonProviders = ['TfL', 'National Rail', 'Highways England', 'Metro', 'Bus Companies', 'Local Authority']

  return (
    <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-200px)] pr-2">
      {/* Escalation Rules Configuration Section */}
      <div className="border rounded-lg p-4 space-y-4">
        <div>
          <h4 className="font-medium mb-1">Escalation Rules</h4>
          <p className="text-xs text-muted-foreground">
            Configure automatic escalation and notification rules for transport issues.
          </p>
        </div>

    <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm">Auto-escalate High Severity Issues</label>
              <input
                type="checkbox"
                checked={escalationRules.auto_escalate_high_severity}
                onChange={(e) => setEscalationRules({
                  ...escalationRules,
                  auto_escalate_high_severity: e.target.checked
                })}
                className="w-4 h-4"
              />
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Automatically escalate high severity transport issues
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm">Auto-escalate Medium Severity Issues</label>
              <input
                type="checkbox"
                checked={escalationRules.auto_escalate_medium_severity}
                onChange={(e) => setEscalationRules({
                  ...escalationRules,
                  auto_escalate_medium_severity: e.target.checked
                })}
                className="w-4 h-4"
              />
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Automatically escalate medium severity transport issues
            </p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Escalation Time (minutes)</label>
            <Input
              type="number"
              value={escalationRules.escalation_time_minutes}
              onChange={(e) => setEscalationRules({
                ...escalationRules,
                escalation_time_minutes: parseInt(e.target.value) || 15
              })}
              min="1"
              max="120"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Time before issues are automatically escalated
            </p>
          </div>

          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <label className="text-sm">Notify on High Severity</label>
              <input
                type="checkbox"
                checked={escalationRules.notify_on_high_severity}
                onChange={(e) => setEscalationRules({
                  ...escalationRules,
                  notify_on_high_severity: e.target.checked
                })}
                className="w-4 h-4"
              />
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Send notifications when high severity issues are reported
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm">Notify on Multiple Issues</label>
              <input
                type="checkbox"
                checked={escalationRules.notify_on_multiple_issues}
                onChange={(e) => setEscalationRules({
                  ...escalationRules,
                  notify_on_multiple_issues: e.target.checked
                })}
                className="w-4 h-4"
              />
            </div>
            <div className="ml-6">
              <Input
                type="number"
                value={escalationRules.multiple_issues_threshold}
                onChange={(e) => setEscalationRules({
                  ...escalationRules,
                  multiple_issues_threshold: parseInt(e.target.value) || 3
                })}
                min="1"
                max="20"
                className="w-24 mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Number of active issues before sending notification
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={saveEscalationRules} size="sm">
            Save Escalation Rules
          </Button>
        </div>
      </div>

      {/* Transport Configuration Section */}
      <div className="border rounded-lg p-4">
      <div className="text-sm text-muted-foreground mb-4">
        Configure transport monitoring location and providers. Changes require explicit save.
      </div>
      
      {/* Location configuration */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3">Venue Location</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Location Name</label>
            <Input
              value={transportConfig.location}
              onChange={(e) => updateConfig({ location: e.target.value })}
              className="mt-1"
              placeholder="e.g., Anfield Stadium"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Postcode</label>
            <Input
              value={transportConfig.postcode || ''}
              onChange={(e) => updateConfig({ postcode: e.target.value })}
              className="mt-1"
              placeholder="e.g., L4 0TH"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Latitude</label>
            <Input
              type="number"
              step="any"
              value={transportConfig.coordinates?.lat || ''}
              onChange={(e) => updateConfig({ 
                coordinates: { 
                  lat: parseFloat(e.target.value) || 0,
                  lng: transportConfig.coordinates?.lng || 0
                } 
              })}
              className="mt-1"
              placeholder="53.4308"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Longitude</label>
            <Input
              type="number"
              step="any"
              value={transportConfig.coordinates?.lng || ''}
              onChange={(e) => updateConfig({ 
                coordinates: { 
                  lat: transportConfig.coordinates?.lat || 0,
                  lng: parseFloat(e.target.value) || 0 
                } 
              })}
              className="mt-1"
              placeholder="-2.9608"
            />
          </div>
        </div>
      </div>

      {/* Monitoring configuration */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3">Monitoring Settings</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Monitoring Radius (miles)</label>
            <Input
              type="number"
              value={transportConfig.radius}
              onChange={(e) => updateConfig({ radius: parseInt(e.target.value) || 3 })}
              className="mt-1"
              min="1"
              max="50"
            />
          </div>
        </div>
      </div>

      {/* Providers configuration */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3">Transport Providers</h4>
        
        {/* Add new provider */}
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Add provider (e.g., TfL)"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addProvider(e.currentTarget.value)
                e.currentTarget.value = ''
              }
            }}
            className="flex-1"
          />
          <Button onClick={() => {
            const input = document.querySelector('input[placeholder="Add provider (e.g., TfL)"]') as HTMLInputElement
            if (input?.value) {
              addProvider(input.value)
              input.value = ''
            }
          }}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Current providers */}
        <div className="space-y-2">
          {transportConfig.providers.map((provider) => (
            <div key={provider} className="flex items-center justify-between bg-gray-50 rounded p-2">
              <span className="text-sm">{provider}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeProvider(provider)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Quick add common providers */}
        <div className="mt-3">
          <div className="text-xs text-muted-foreground mb-2">Quick add:</div>
          <div className="flex flex-wrap gap-1">
            {commonProviders
              .filter(p => !transportConfig.providers.includes(p))
              .map((provider) => (
                <Button
                  key={provider}
                  variant="outline"
                  size="sm"
                  onClick={() => addProvider(provider)}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {provider}
                </Button>
              ))}
          </div>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <div className="text-sm font-medium">
          Monitoring {transportConfig.providers.length} providers within {transportConfig.radius} miles
        </div>
        </div>
      </div>
    </div>
  )
}
