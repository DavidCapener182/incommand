import { useAuth } from '@/contexts/AuthContext'
import { ROLES, UserRole } from '@/types/auth'
import { useMemo } from 'react'

/**
 * Hook to get the current user's role
 */
export const useRole = () => {
  let auth;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available in useRole:', error);
    auth = { role: null };
  }
  const { role } = auth;
  return role as UserRole | null
}

/**
 * Hook to check if user is admin or superadmin
 */
export const useIsAdmin = () => {
  let auth;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available in useIsAdmin:', error);
    auth = { role: null };
  }
  const { role } = auth;
  return useMemo(() => role === ROLES.ADMIN || role === ROLES.SUPERADMIN, [role])
}

/**
 * Hook to check if user is superadmin
 */
export const useIsSuperAdmin = () => {
  let auth;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available in useIsSuperAdmin:', error);
    auth = { role: null };
  }
  const { role } = auth;
  return useMemo(() => role === ROLES.SUPERADMIN, [role])
}

/**
 * Hook to check if user has a specific role
 */
export const useHasRole = (requiredRole: UserRole) => {
  let auth;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available in useHasRole:', error);
    auth = { role: null };
  }
  const { role } = auth;
  return useMemo(() => role === requiredRole, [role, requiredRole])
}

/**
 * Hook to check if user has any of the specified roles
 */
export const useHasAnyRole = (requiredRoles: UserRole[]) => {
  let auth;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available in useHasAnyRole:', error);
    auth = { role: null };
  }
  const { role } = auth;
  return useMemo(() => role ? requiredRoles.includes(role as UserRole) : false, [role, requiredRoles])
}

/**
 * Hook to check if user has all of the specified roles (useful for future multi-role support)
 */
export const useHasAllRoles = (requiredRoles: UserRole[]) => {
  let auth;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available in useHasAllRoles:', error);
    auth = { role: null };
  }
  const { role } = auth;
  return useMemo(() => role ? requiredRoles.every(r => r === role) : false, [role, requiredRoles])
}

/**
 * Single hook that returns multiple role states to prevent unnecessary re-renders
 * This is the recommended hook for components that need multiple role checks
 */
export const useRoleStates = () => {
  let auth;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available in useRoleStates:', error);
    auth = { role: null };
  }
  const { role } = auth;
  
  return useMemo(() => ({
    role: role as UserRole | null,
    isAdmin: role === ROLES.ADMIN || role === ROLES.SUPERADMIN,
    isSuperAdmin: role === ROLES.SUPERADMIN,
    isUser: role === ROLES.USER,
    hasRole: (requiredRole: UserRole) => role === requiredRole,
    hasAnyRole: (requiredRoles: UserRole[]) => role ? requiredRoles.includes(role as UserRole) : false,
    hasAllRoles: (requiredRoles: UserRole[]) => role ? requiredRoles.every(r => r === role) : false,
  }), [role])
}
