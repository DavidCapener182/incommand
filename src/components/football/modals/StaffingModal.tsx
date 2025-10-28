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

  useEffect(() => {
    loadData()
  }, [])

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
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Input actual staffing numbers. Changes are saved automatically.
      </div>
      
      {staffingData.roles.map((role) => {
        const variance = role.actual - role.planned
        const percentOfPlanned = role.planned > 0 ? (role.actual / role.planned) * 100 : 0
        const isUnderstaffed = percentOfPlanned < 90
        const isOverstaffed = role.actual > role.planned
        
        return (
          <div key={role.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getIconComponent(role.icon)}
                <h4 className="font-medium">{role.name}</h4>
                <Badge variant={role.color === 'blue' ? 'info' : role.color === 'orange' ? 'warning' : 'destructive'}>
                  {role.color}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  Planned: {role.planned}
                </div>
                <div className="text-xs text-muted-foreground">
                  {percentOfPlanned.toFixed(1)}% of target
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={role.actual}
                  onChange={(e) => handleActualChange(role.id, parseInt(e.target.value) || 0)}
                  className="w-32"
                  min="0"
                />
                <span className="text-sm text-muted-foreground">actual present</span>
              </div>
              
              <div className="flex items-center gap-2">
                {isUnderstaffed ? (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Understaffed by {Math.abs(variance)}</span>
                  </div>
                ) : isOverstaffed ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Overstaffed by {variance}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">At target</span>
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

  useEffect(() => {
    loadData()
  }, [])

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
      planned: newRole.planned,
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
    <div className="space-y-4">
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
              {getIconComponent(role.icon)}
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
  )
}
