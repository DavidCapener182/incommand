"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRoleStates, useIsAdmin } from '@/hooks/useRole'
import RoleAccessErrorBoundary from '@/components/RoleAccessErrorBoundary'
import { PermissionGate, PERMISSIONS } from '@/components/PermissionGate'
import { 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  CalendarIcon, 
  UserIcon,
  CodeBracketIcon,
  ServerIcon,
  CogIcon,
  EyeIcon,
  FlagIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

const AdminPage = () => {
  let auth;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available in admin page:', error);
    auth = { user: null, loading: true, role: null };
  }
  const { user, loading: authLoading, role } = auth;
  const isAdmin = useIsAdmin()
  const router = useRouter()
  
  // Wait for role to resolve before deciding; avoid false access denied during role load
  if (authLoading || (user && role === null)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#15192c] flex items-center justify-center">
        <div className="bg-white dark:bg-[#23408e] shadow-sm rounded-2xl border border-gray-200 dark:border-[#2d437a] p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Checking permissions...</p>
          </div>
        </div>
      </div>
    )
  }
  // Simple state
  const [companies, setCompanies] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#15192c] flex items-center justify-center">
        <div className="bg-white dark:bg-[#23408e] shadow-sm rounded-2xl border border-gray-200 dark:border-[#2d437a] p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Checking permissions...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Show access denied if not admin
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#15192c] flex items-center justify-center">
        <div className="bg-white dark:bg-[#23408e] shadow-sm rounded-2xl border border-gray-200 dark:border-[#2d437a] p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You don't have permission to access the admin dashboard. Only administrators can view this page.
            </p>
            <button
              onClick={() => router.back()}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-semibold px-4 py-2 rounded-lg shadow transition-colors duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error if there's a data loading error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#15192c] flex items-center justify-center">
        <div className="bg-white dark:bg-[#23408e] shadow-sm rounded-2xl border border-gray-200 dark:border-[#2d437a] p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 mb-4">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Data Loading Error</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-semibold px-4 py-2 rounded-lg shadow transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Simple data fetching
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch basic data only
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, company_id')
        .order('full_name', { ascending: true })
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        setUsers([])
      } else {
        setUsers(usersData || [])
      }
      
      // Fetch companies with minimal fields
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, subscription_plan, account_status')
        .order('name', { ascending: true })
      
      if (companiesError) {
        console.error('Error fetching companies:', companiesError)
        setCompanies([])
      } else {
        setCompanies(companiesData || [])
      }
      
      // Skip events for now
      setEvents([])
      
      setLoading(false)
    } catch (err) {
      console.error('Unexpected error fetching admin data:', err)
      setError('Unexpected error fetching admin data')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Set a timeout to ensure loading doesn't get stuck
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 5000) // 5 second timeout
    
    return () => clearTimeout(timeout)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-[#101c36] py-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-[#23408e] rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-[#23408e] rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#23408e] shadow-sm rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6">
                  <div className="h-4 bg-gray-200 dark:bg-[#2d437a] rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 dark:bg-[#2d437a] rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <RoleAccessErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-[#15192c] transition-colors duration-300">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage and monitor your platform settings and data</p>
            </div>
          </div>

        {/* System Overview Card */}
        <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-sm rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-blue-200">System Overview</h2>
          <p className="text-gray-600 dark:text-blue-100 mb-4">Welcome to the admin dashboard. Here you can manage companies, users, and view system statistics.</p>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                <span className="font-semibold text-lg">Total Companies</span>
              </div>
              <span className="text-2xl font-bold">{companies.length}</span>
            </div>
            <div className="bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                <span className="font-semibold text-lg">Total Users</span>
              </div>
              <span className="text-2xl font-bold">{users.length}</span>
            </div>
            <div className="bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                <span className="font-semibold text-lg">Total Events</span>
              </div>
              <span className="text-2xl font-bold">{events.length}</span>
            </div>
            <div className="bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                <span className="font-semibold text-lg">Current User</span>
              </div>
              <span className="text-sm font-medium">{user?.email || 'Not logged in'}</span>
            </div>
          </div>
          
          {/* Simple User Info */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-[#1a2a57] rounded-xl border border-gray-200 dark:border-[#2d437a]">
            <h3 className="font-semibold text-gray-800 dark:text-blue-200 mb-2">Current User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-300">Email:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">{user?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-300">Role:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">{role || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-300">User ID:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">{user?.id || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-300">Admin Access:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">{isAdmin ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Management Section with granular permissions */}
        <PermissionGate permission={PERMISSIONS.USER_VIEW}>
          <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-sm rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 mb-8">
            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-blue-200">User Management</h2>
            <p className="text-gray-600 dark:text-blue-100 mb-4">Manage user accounts and permissions.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <PermissionGate permission={PERMISSIONS.USER_CREATE}>
                <div className="bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-[#2d437a] p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-blue-200 mb-2">Create User</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Add new users to the system</p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                    Add User
                  </button>
                </div>
              </PermissionGate>
              <PermissionGate permission={PERMISSIONS.USER_EDIT}>
                <div className="bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-[#2d437a] p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-blue-200 mb-2">Edit Users</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Modify user roles and permissions</p>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                    Manage Users
                  </button>
                </div>
              </PermissionGate>
            </div>
          </div>
        </PermissionGate>

        {/* Superadmin-only sections with granular permissions */}
        <PermissionGate permission={PERMISSIONS.SYSTEM_DEBUG}>
          {/* Development Tracking Section */}
          <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-sm rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 mb-8">
            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-blue-200">Development Tracking</h2>
            <p className="text-gray-600 dark:text-blue-100 mb-4">Superadmin-only development and debugging tools.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <CodeBracketIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                  <span className="font-semibold text-lg">Debug Tools</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Access advanced debugging and development features</span>
              </div>
              <div className="bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <ServerIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
                  <span className="font-semibold text-lg">Database Setup</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Manage database schemas and migrations</span>
              </div>
            </div>
          </div>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.SYSTEM_CONFIG}>
          {/* System Settings Section */}
          <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-sm rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 mb-8">
            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-blue-200">System Settings</h2>
            <p className="text-gray-600 dark:text-blue-100 mb-4">Manage system configuration, feature flags, and maintenance mode.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <a href="/admin/system-settings" className="bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 hover:bg-gray-100 dark:hover:bg-[#2d437a] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <CogIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-800 dark:text-blue-200">System Settings</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Configure system-wide settings and parameters</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FlagIcon className="h-4 w-4" />
                  <span>Feature flags active</span>
                </div>
              </a>
              
              <a href="/admin/audit-logs" className="bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 hover:bg-gray-100 dark:hover:bg-[#2d437a] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <EyeIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-gray-800 dark:text-blue-200">Audit Logs</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">View system activity and user actions</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Recent activity tracked</span>
                </div>
              </a>
              
              <div className="bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-[#2d437a] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <WrenchScrewdriverIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <h3 className="font-semibold text-gray-800 dark:text-blue-200">Maintenance Mode</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Enable maintenance mode for system updates</p>
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <span>System operational</span>
                </div>
              </div>
            </div>
          </div>
        </PermissionGate>
      </div>
    </div>
    </RoleAccessErrorBoundary>
  )
}

export default AdminPage 