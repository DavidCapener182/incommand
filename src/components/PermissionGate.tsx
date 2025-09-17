'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRoleStates } from '@/hooks/useRole'

// Permission constants for granular access control
export const PERMISSIONS = {
  // User management permissions
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  
  // System permissions
  SYSTEM_DEBUG: 'system:debug',
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_LOGS: 'system:logs',
  
  // Company management permissions
  COMPANY_VIEW: 'company:view',
  COMPANY_EDIT: 'company:edit',
  COMPANY_DELETE: 'company:delete',
  
  // Event management permissions
  EVENT_VIEW: 'event:view',
  EVENT_CREATE: 'event:create',
  EVENT_EDIT: 'event:edit',
  EVENT_DELETE: 'event:delete',
  
  // Analytics permissions
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // Incident management permissions
  INCIDENT_VIEW: 'incident:view',
  INCIDENT_CREATE: 'incident:create',
  INCIDENT_EDIT: 'incident:edit',
  INCIDENT_DELETE: 'incident:delete',
} as const

// Permission mapping based on user roles
const ROLE_PERMISSIONS: Record<string, string[]> = {
  user: [
    PERMISSIONS.INCIDENT_VIEW,
    PERMISSIONS.INCIDENT_CREATE,
  ],
  admin: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.COMPANY_VIEW,
    PERMISSIONS.COMPANY_EDIT,
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.EVENT_EDIT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.INCIDENT_VIEW,
    PERMISSIONS.INCIDENT_CREATE,
    PERMISSIONS.INCIDENT_EDIT,
    // Allow admins to see system sections too
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.SYSTEM_DEBUG,
    PERMISSIONS.SYSTEM_LOGS,
  ],
  superadmin: [
    // All permissions
    ...Object.values(PERMISSIONS)
  ]
}

interface PermissionGateProps {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
  showAccessDenied?: boolean
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  children,
  fallback,
  showAccessDenied = false
}) => {
  const { role } = useAuth();
  const { isAdmin, isSuperAdmin } = useRoleStates()

  // Check if user has the required permission
  const hasPermission = (): boolean => {
    if (!role) return false
    
    // Superadmin has all permissions
    if (isSuperAdmin) return true
    
    // Get permissions for the user's role
    const userPermissions = ROLE_PERMISSIONS[role] || []
    
    return userPermissions.includes(permission)
  }

  // If user has permission, render children
  if (hasPermission()) {
    return <>{children}</>
  }

  // If custom fallback is provided, render it
  if (fallback) {
    return <>{fallback}</>
  }

  // If showAccessDenied is true, render access denied message
  if (showAccessDenied) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-red-800 dark:text-red-200 text-sm font-medium">
            Access denied: Insufficient permissions
          </span>
        </div>
      </div>
    )
  }

  // Default: render nothing
  return null
}

// Hook for checking permissions programmatically
export const usePermission = (permission: string): boolean => {
  const { role } = useAuth();
  const { isSuperAdmin } = useRoleStates()

  if (!role) return false
  if (isSuperAdmin) return true

  const userPermissions = ROLE_PERMISSIONS[role] || []
  return userPermissions.includes(permission)
}

// Hook for checking multiple permissions
export const usePermissions = (permissions: string[]): boolean => {
  const { role } = useAuth();
  const { isSuperAdmin } = useRoleStates()

  if (!role) return false
  if (isSuperAdmin) return true

  const userPermissions = ROLE_PERMISSIONS[role] || []
  return permissions.every(permission => userPermissions.includes(permission))
}
