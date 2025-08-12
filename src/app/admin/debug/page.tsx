'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRole } from '@/hooks/useRole'
import { ROLES } from '@/types/auth'

export default function AdminDebugPage() {
  const { user, loading } = useAuth()
  const role = useRole()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Not authenticated</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Debug Page</h1>
      <div className="space-y-2">
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {role || 'No role'}</p>
        <p><strong>Is Admin:</strong> {role === ROLES.ADMIN || role === ROLES.SUPERADMIN ? 'Yes' : 'No'}</p>
        <p><strong>Is Super Admin:</strong> {role === ROLES.SUPERADMIN ? 'Yes' : 'No'}</p>
      </div>
    </div>
  )
}
