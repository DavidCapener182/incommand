import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/getServerUser'
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout'
import SSOIntegration from '@/components/features/sso-integration'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function AdminSSOSettingsPage() {
  const { user, role } = await getServerUser()
  if (!user) redirect('/login')
  if (role !== 'superadmin') redirect('/admin')

  return (
    <SuperAdminLayout>
      <SSOIntegration />
    </SuperAdminLayout>
  )
}
