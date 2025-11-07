'use client'

import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StaffingData, StaffingRole } from '@/types/football'
import { Plus, Trash2, Users, AlertTriangle, CheckCircle, Heart, Shield } from 'lucide-react'

interface StaffingModalProps {
  onSave?: () => void
}

// Icon mapping function
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    'heart': Heart,
    'shield': Shield,
    'users': Users,
  }
  
  const IconComponent = iconMap[iconName] || Users
  return <IconComponent className="w-6 h-6" />
}

// Actual Staffing Numbers Tab Component
export function StaffingActual({ onSave }: StaffingModalProps) {
  const [staffingData, setStaffingData] = useState<StaffingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [targetSettings, setTargetSettings] = useState({
    target_threshold: 90,
    alert_threshold: 85
  })

  const loadData = async () => {
    try {
      const res = await fetch('/api/football/staffing?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (res.ok) {
        const data = await res.json()
        setStaffingData({ roles: data.roles })
      }
    } catch (error) {
      console.error('Failed to load staffing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTargetSettings = async () => {
    try {
      const res = await fetch('/api/football/settings?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001&tool_type=staffing')
      if (res.ok) {
        const data = await res.json()
        if (data.settings_json) {
          setTargetSettings({
            target_threshold: data.settings_json.target_threshold || 90,
            alert_threshold: data.settings_json.alert_threshold || 85
          })
        }
      }
    } catch (error) {
      console.error('Failed to load target settings:', error)
    }
  }

  const getStatusForRole = (percentOfPlanned: number): { status: 'at-target' | 'near-target' | 'below-target', label: string, color: string } => {
    const targetThreshold = targetSettings.target_threshold
    const alertThreshold = targetSettings.alert_threshold

    if (percentOfPlanned >= targetThreshold) {
      return { status: 'at-target', label: 'At Target', color: 'green' }
    } else if (percentOfPlanned >= alertThreshold) {
      return { status: 'near-target', label: 'Near Target', color: 'amber' }
    } else {
      return { status: 'below-target', label: 'Below Target', color: 'red' }
    }
  }

  useEffect(() => {
    loadData()
    loadTargetSettings()
  }, [])

  const handleActualChange = async (roleId: string, actual: number) => {
    if (!staffingData) return

    const updatedRoles = staffingData.roles.map(role =>
      role.id === roleId ? { ...role, actual } : role
    )
    
    setStaffingData({ roles: updatedRoles })

    // Auto-save actual numbers
    try {
      await fetch('/api/football/staffing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId, actual }),
      })
    } catch (error) {
      console.error('Failed to auto-save actual staffing:', error)
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  if (!staffingData) {
    return <div className="p-4 text-center text-red-600">Failed to load staffing data</div>
  }

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-200px)] pr-2">
      <div className="text-sm text-muted-foreground mb-4">
        Input actual staffing numbers. Changes are saved automatically.
      </div>
      
      {staffingData.roles.map((role) => {
        const variance = role.actual - role.planned
        const percentOfPlanned = role.planned > 0 ? (role.actual / role.planned) * 100 : 0
        const status = getStatusForRole(percentOfPlanned)
        
        return (
          <div key={role.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getIconComponent(role.icon || 'users')}
                <h4 className="font-medium">{role.name}</h4>
                <Badge variant={role.color === 'blue' ? 'info' : role.color === 'orange' ? 'warning' : 'destructive'}>
                  {role.color}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  Planned: <span className="font-bold">{role.planned}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {percentOfPlanned.toFixed(1)}% of target
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-1">Actual Present</span>
                <Input
                  type="number"
                  value={role.actual}
                  onChange={(e) => handleActualChange(role.id, parseInt(e.target.value) || 0)}
                  className="w-32"
                  min="0"
                />
                </div>
                <div className="flex flex-col ml-4">
                  <span className="text-xs text-muted-foreground mb-1">Planned</span>
                  <div className="text-sm font-semibold text-gray-900 pt-2">{role.planned}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {status.status === 'below-target' ? (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">{status.label} - {Math.abs(variance)} below planned</span>
                  </div>
                ) : status.status === 'near-target' ? (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">{status.label} - {Math.abs(variance)} below planned</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {status.label}
                      {variance > 0 ? ` (+${variance} over planned)` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
      
      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Planned:</span> {staffingData.roles.reduce((sum, r) => sum + r.planned, 0)}
          </div>
          <div>
            <span className="font-medium">Total Actual:</span> {staffingData.roles.reduce((sum, r) => sum + r.actual, 0)}
          </div>
        </div>
      </div>
    </div>
  )
}

// Deployment Tab Component
export function StaffingDeployment({ onSave }: StaffingModalProps) {
  const [staffingData, setStaffingData] = useState<StaffingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newRole, setNewRole] = useState<Partial<StaffingRole>>({ 
    name: '', 
    planned: 0, 
    actual: 0, 
    icon: '👤', 
    color: 'blue' 
  })
  const [targetSettings, setTargetSettings] = useState({
    target_threshold: 90, // Percentage of planned that's considered "at target"
    alert_threshold: 85   // Percentage below which triggers alert
  })

  const loadTargetSettings = async () => {
    try {
      const res = await fetch('/api/football/settings?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001&tool_type=staffing')
      if (res.ok) {
        const data = await res.json()
        if (data.settings_json) {
          setTargetSettings({
            target_threshold: data.settings_json.target_threshold || 90,
            alert_threshold: data.settings_json.alert_threshold || 85
          })
        }
      }
    } catch (error) {
      console.error('Failed to load target settings:', error)
    }
  }

  const loadData = async () => {
    try {
      const res = await fetch('/api/football/staffing?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (res.ok) {
        const data = await res.json()
        setStaffingData({ roles: data.roles })
      }
    } catch (error) {
      console.error('Failed to load staffing data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    loadTargetSettings()
  }, [])

  const saveTargetSettings = async () => {
    try {
      await fetch('/api/football/settings?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_type: 'staffing',
          settings_json: targetSettings
        })
      })
      alert('Target settings saved successfully')
    } catch (error) {
      console.error('Failed to save target settings:', error)
      alert('Failed to save target settings')
    }
  }

  const handleSave = async () => {
    if (!staffingData) return
    
    setSaving(true)
    try {
      await fetch('/api/football/staffing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: staffingData.roles }),
      })
      onSave?.()
    } catch (error) {
      console.error('Failed to save staffing deployment:', error)
    } finally {
      setSaving(false)
    }
  }

  const addRole = () => {
    if (!staffingData || !newRole.name || newRole.planned === 0) return

    const role: StaffingRole = {
      id: `role-${Date.now()}`,
      name: newRole.name,
      planned: newRole.planned || 0,
      actual: newRole.actual || 0,
      icon: newRole.icon || 'users',
      color: newRole.color || 'blue',
    }

    const updatedRoles = [...staffingData.roles, role]
    setStaffingData({ roles: updatedRoles })
    setNewRole({ name: '', planned: 0, actual: 0, icon: 'users', color: 'blue' })
  }

  const removeRole = (roleId: string) => {
    if (!staffingData) return

    const updatedRoles = staffingData.roles.filter(r => r.id !== roleId)
    setStaffingData({ roles: updatedRoles })
  }

  const updateRole = (roleId: string, updates: Partial<StaffingRole>) => {
    if (!staffingData) return

    const updatedRoles = staffingData.roles.map(role =>
      role.id === roleId ? { ...role, ...updates } : role
    )
    
    setStaffingData({ roles: updatedRoles })
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  if (!staffingData) {
    return <div className="p-4 text-center text-red-600">Failed to load staffing data</div>
  }

  const colorOptions = [
    { value: 'blue', label: 'Blue', variant: 'info' as const },
    { value: 'orange', label: 'Orange', variant: 'warning' as const },
    { value: 'red', label: 'Red', variant: 'destructive' as const },
    { value: 'green', label: 'Green', variant: 'success' as const },
  ]

  const iconOptions = [
    { value: 'heart', label: 'Heart', icon: Heart },
    { value: 'shield', label: 'Shield', icon: Shield },
    { value: 'users', label: 'Users', icon: Users },
  ]

  return (
    <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-200px)] pr-2">
      {/* Target Configuration Section */}
      <div className="border rounded-lg p-4 space-y-4">
        <div>
          <h4 className="font-medium mb-1">Target Thresholds</h4>
          <p className="text-xs text-muted-foreground">
            Configure staffing target thresholds. These determine when staffing is considered &quot;at target&quot;, 
            &quot;near target&quot;, or &quot;below target&quot; based on percentage of planned staff.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Target Threshold (%)</label>
            <Input
              type="number"
              value={targetSettings.target_threshold}
              onChange={(e) => setTargetSettings({
                ...targetSettings,
                target_threshold: parseInt(e.target.value) || 90
              })}
              min="0"
              max="100"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              At or above this % of planned: &quot;At Target&quot;
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Alert Threshold (%)</label>
            <Input
              type="number"
              value={targetSettings.alert_threshold}
              onChange={(e) => setTargetSettings({
                ...targetSettings,
                alert_threshold: parseInt(e.target.value) || 85
              })}
              min="0"
              max="100"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Below this % of planned: &quot;Below Target&quot; (Alert)
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={saveTargetSettings} size="sm">
            Save Target Settings
          </Button>
        </div>
      </div>

      {/* Role Configuration Section */}
      <div className="border rounded-lg p-4">
      <div className="text-sm text-muted-foreground mb-4">
        Configure staffing roles and deployment numbers. Changes require explicit save.
      </div>
      
      {/* Add new role */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-3">Add New Role</h4>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Role name"
            value={newRole.name || ''}
            onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Planned count"
            value={newRole.planned || ''}
            onChange={(e) => setNewRole({ ...newRole, planned: parseInt(e.target.value) || 0 })}
            min="0"
          />
          <div className="flex gap-1">
            <select
              value={newRole.icon || 'users'}
              onChange={(e) => setNewRole({ ...newRole, icon: e.target.value })}
              className="px-2 py-1 border rounded text-sm"
            >
              {iconOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={newRole.color || 'blue'}
              onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
              className="px-2 py-1 border rounded text-sm"
            >
              {colorOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <Button onClick={addRole} disabled={!newRole.name || newRole.planned === 0}>
            <Plus className="h-4 w-4 mr-1" />
            Add Role
          </Button>
        </div>
      </div>
      
      {/* Roles list */}
      <div className="space-y-2">
        {staffingData.roles.map((role) => (
          <div key={role.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              {getIconComponent(role.icon || 'users')}
              <Badge variant={colorOptions.find(c => c.value === role.color)?.variant || 'default'}>
                {role.color}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Role Name</label>
                <Input
                  value={role.name}
                  onChange={(e) => updateRole(role.id, { name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Planned Count</label>
                <Input
                  type="number"
                  value={role.planned}
                  onChange={(e) => updateRole(role.id, { planned: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Icon</label>
                <select
                  value={role.icon || 'users'}
                  onChange={(e) => updateRole(role.id, { icon: e.target.value })}
                  className="w-full px-2 py-1 border rounded text-sm mt-1"
                >
                  {iconOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Color</label>
                <select
                  value={role.color || 'blue'}
                  onChange={(e) => updateRole(role.id, { color: e.target.value })}
                  className="w-full px-2 py-1 border rounded text-sm mt-1"
                >
                  {colorOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeRole(role.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t pt-4">
        <div className="text-sm font-medium">
          Total Planned Staff: {staffingData.roles.reduce((sum, r) => sum + r.planned, 0)}
        </div>
        </div>
      </div>
    </div>
  )
}
