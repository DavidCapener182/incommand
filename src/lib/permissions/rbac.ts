/**
 * Role-Based Access Control (RBAC) System
 * Granular permissions for multi-tenant environment
 */

export type Permission = 
  // Incident permissions
  | 'incidents:create'
  | 'incidents:read'
  | 'incidents:update'
  | 'incidents:delete'
  | 'incidents:close'
  | 'incidents:amend'
  | 'incidents:export'
  
  // Event permissions
  | 'events:create'
  | 'events:read'
  | 'events:update'
  | 'events:delete'
  | 'events:manage'
  
  // Staff permissions
  | 'staff:create'
  | 'staff:read'
  | 'staff:update'
  | 'staff:delete'
  | 'staff:assign'
  
  // Analytics permissions
  | 'analytics:view'
  | 'analytics:export'
  | 'analytics:custom_metrics'
  | 'analytics:benchmarking'
  
  // Settings permissions
  | 'settings:read'
  | 'settings:update'
  | 'settings:system'
  
  // Organization permissions
  | 'org:manage'
  | 'org:billing'
  | 'org:users'
  | 'org:api_keys'
  
  // Admin permissions
  | 'admin:all'

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  isSystemRole: boolean
  organizationId?: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  name: string
  organizationId: string
  roles: string[]
  customPermissions?: Permission[]
  isActive: boolean
}

export interface Organization {
  id: string
  name: string
  slug: string
  tier: 'free' | 'professional' | 'enterprise'
  settings: OrganizationSettings
  createdAt: string
  isActive: boolean
}

export interface OrganizationSettings {
  branding?: {
    logo?: string
    primaryColor?: string
    secondaryColor?: string
    customDomain?: string
  }
  features: {
    maxEvents: number
    maxUsers: number
    aiFeatures: boolean
    customMetrics: boolean
    apiAccess: boolean
    whiteLabel: boolean
  }
  limits: {
    storageGB: number
    apiCallsPerMonth: number
    emailsPerMonth: number
    smsPerMonth: number
  }
}

/**
 * RBAC Manager
 */
export class RBACManager {
  private roles: Map<string, Role> = new Map()
  private systemRoles: Map<string, Role> = new Map()

  constructor() {
    this.initializeSystemRoles()
  }

  /**
   * Check if user has permission
   */
  hasPermission(user: User, permission: Permission): boolean {
    // Admin has all permissions
    if (user.roles.includes('admin')) return true

    // Check custom permissions
    if (user.customPermissions?.includes(permission)) return true

    // Check role permissions
    for (const roleId of user.roles) {
      const role = this.roles.get(roleId) || this.systemRoles.get(roleId)
      if (role && role.permissions.includes(permission)) {
        return true
      }
    }

    return false
  }

  /**
   * Check multiple permissions (requires all)
   */
  hasAllPermissions(user: User, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission))
  }

  /**
   * Check multiple permissions (requires any)
   */
  hasAnyPermission(user: User, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission))
  }

  /**
   * Get user's effective permissions
   */
  getUserPermissions(user: User): Permission[] {
    const permissions = new Set<Permission>()

    // Add custom permissions
    user.customPermissions?.forEach(p => permissions.add(p))

    // Add role permissions
    for (const roleId of user.roles) {
      const role = this.roles.get(roleId) || this.systemRoles.get(roleId)
      if (role) {
        role.permissions.forEach(p => permissions.add(p))
      }
    }

    return Array.from(permissions)
  }

  /**
   * Create custom role
   */
  createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Role {
    const id = `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    const newRole: Role = {
      ...role,
      id,
      createdAt: now,
      updatedAt: now
    }

    this.roles.set(id, newRole)
    return newRole
  }

  /**
   * Get all roles
   */
  getRoles(organizationId?: string): Role[] {
    const systemRoles = Array.from(this.systemRoles.values())
    const customRoles = Array.from(this.roles.values())
      .filter(role => !organizationId || role.organizationId === organizationId)

    return [...systemRoles, ...customRoles]
  }

  /**
   * Initialize system roles
   */
  private initializeSystemRoles(): void {
    const now = new Date().toISOString()

    // Super Admin
    this.systemRoles.set('admin', {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access with all permissions',
      permissions: ['admin:all'],
      isSystemRole: true,
      createdAt: now,
      updatedAt: now
    })

    // Silver Commander
    this.systemRoles.set('silver_commander', {
      id: 'silver_commander',
      name: 'Silver Commander',
      description: 'Tactical command with full operational control',
      permissions: [
        'incidents:create', 'incidents:read', 'incidents:update', 'incidents:close', 'incidents:amend', 'incidents:export',
        'events:read', 'events:update', 'events:manage',
        'staff:read', 'staff:assign',
        'analytics:view', 'analytics:export', 'analytics:custom_metrics', 'analytics:benchmarking',
        'settings:read', 'settings:update'
      ],
      isSystemRole: true,
      createdAt: now,
      updatedAt: now
    })

    // Bronze Commander
    this.systemRoles.set('bronze_commander', {
      id: 'bronze_commander',
      name: 'Bronze Commander',
      description: 'Operational command with incident management',
      permissions: [
        'incidents:create', 'incidents:read', 'incidents:update', 'incidents:close', 'incidents:amend',
        'events:read',
        'staff:read',
        'analytics:view', 'analytics:export',
        'settings:read'
      ],
      isSystemRole: true,
      createdAt: now,
      updatedAt: now
    })

    // Supervisor
    this.systemRoles.set('supervisor', {
      id: 'supervisor',
      name: 'Supervisor',
      description: 'Team supervision with limited management access',
      permissions: [
        'incidents:create', 'incidents:read', 'incidents:update', 'incidents:close',
        'events:read',
        'staff:read',
        'analytics:view',
        'settings:read'
      ],
      isSystemRole: true,
      createdAt: now,
      updatedAt: now
    })

    // Operator
    this.systemRoles.set('operator', {
      id: 'operator',
      name: 'Operator',
      description: 'Standard operational access for incident logging',
      permissions: [
        'incidents:create', 'incidents:read', 'incidents:update',
        'events:read',
        'staff:read',
        'settings:read'
      ],
      isSystemRole: true,
      createdAt: now,
      updatedAt: now
    })

    // Observer
    this.systemRoles.set('observer', {
      id: 'observer',
      name: 'Observer',
      description: 'Read-only access for monitoring and reporting',
      permissions: [
        'incidents:read',
        'events:read',
        'staff:read',
        'analytics:view',
        'settings:read'
      ],
      isSystemRole: true,
      createdAt: now,
      updatedAt: now
    })

    // Client
    this.systemRoles.set('client', {
      id: 'client',
      name: 'Client',
      description: 'Limited access for venue clients',
      permissions: [
        'incidents:read',
        'events:read',
        'analytics:view',
        'analytics:export'
      ],
      isSystemRole: true,
      createdAt: now,
      updatedAt: now
    })
  }
}

// Export singleton instance
export const rbacManager = new RBACManager()

// Permission guard decorator for API routes
export function requirePermission(permission: Permission) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const user = args[0] // Assumes first arg is user
      
      if (!rbacManager.hasPermission(user, permission)) {
        throw new Error(`Permission denied: ${permission}`)
      }

      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}
