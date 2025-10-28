'use client'

import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TransportConfig, TransportIssue } from '@/types/football'
import { Plus, Trash2, AlertTriangle, CheckCircle, Clock, MapPin, Settings } from 'lucide-react'

interface TransportModalProps {
  onSave?: () => void
}

// Current Tab Component - Live Transport Monitoring
export function TransportCurrent({ onSave }: TransportModalProps) {
  const [transportConfig, setTransportConfig] = useState<TransportConfig | null>(null)
  const [loading, setLoading] = useState(true)
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
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Monitor transport disruptions and report local issues. Changes are saved automatically.
      </div>
      
      {/* Location info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-900">Monitoring Location</span>
        </div>
        <div className="text-sm text-blue-700">
          {transportConfig.location}
          {transportConfig.postcode && ` (${transportConfig.postcode})`}
        </div>
        <div className="text-xs text-blue-600 mt-1">
          Radius: {transportConfig.radius} miles • Providers: {transportConfig.providers.join(', ')}
        </div>
      </div>

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

  useEffect(() => {
    loadData()
  }, [])

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
    <div className="space-y-4">
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
  )
}
