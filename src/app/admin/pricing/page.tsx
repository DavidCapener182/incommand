import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/getServerUser'
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout'
import PricingPlansManager from '@/components/admin/pricing/PricingPlansManager'
import QuoteCalculator from '@/components/admin/pricing/QuoteCalculator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const { user, role } = await getServerUser()
  if (!user) redirect('/login')
  if (role !== 'superadmin') redirect('/admin')

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pricing Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage subscription plans, pricing tiers, and feature limits
          </p>
        </div>

        {/* Pricing Plans Manager */}
        <PricingPlansManager />

        {/* Quote Calculator */}
        <QuoteCalculator />
      </div>
    </SuperAdminLayout>
  )
}

