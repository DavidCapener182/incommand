/**
 * User role types for the application
 */
export type UserRole = 'user' | 'admin' | 'superadmin'

/**
 * Role constants to ensure consistency across the application
 */
export const ROLES = {
  USER: 'user' as const,
  ADMIN: 'admin' as const,
  SUPERADMIN: 'superadmin' as const,
} as const

/**
 * Extended AuthContext type that includes role information
 */
export interface AuthContextType {
  user: any | null
  role: UserRole | null
  loading: boolean
  signOut: () => Promise<void>
}

/**
 * Props for components that need role information
 */
export interface RoleBasedProps {
  requiredRole?: UserRole
  requiredRoles?: UserRole[]
  fallback?: React.ReactNode
  redirectTo?: string
  showAccessDenied?: boolean
}

/**
 * Utility type for role checking functions
 */
export type RoleChecker = (role: UserRole | null) => boolean

/**
 * Admin protection component props
 */
export interface AdminProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  showAccessDenied?: boolean
}

/**
 * Role-based access control utilities
 */
export const roleUtils = {
  /**
   * Check if user has admin or superadmin role
   */
  isAdmin: (role: UserRole | null): boolean => {
    return role === 'admin' || role === 'superadmin'
  },

  /**
   * Check if user is superadmin
   */
  isSuperAdmin: (role: UserRole | null): boolean => {
    return role === 'superadmin'
  },

  /**
   * Check if user has a specific role
   */
  hasRole: (role: UserRole | null, requiredRole: UserRole): boolean => {
    return role === requiredRole
  },

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole: (role: UserRole | null, requiredRoles: UserRole[]): boolean => {
    return role ? requiredRoles.includes(role) : false
  },

  /**
   * Get display name for a role
   */
  getDisplayName: (role: UserRole | null): string => {
    if (!role) return 'Unknown'
    
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'superadmin':
        return 'Super Admin'
      case 'user':
        return 'User'
      default:
        return (role as string).charAt(0).toUpperCase() + (role as string).slice(1)
    }
  },

  /**
   * Get role hierarchy level (higher number = more privileges)
   */
  getRoleLevel: (role: UserRole | null): number => {
    switch (role) {
      case 'superadmin':
        return 3
      case 'admin':
        return 2
      case 'user':
        return 1
      default:
        return 0
    }
  }
}
