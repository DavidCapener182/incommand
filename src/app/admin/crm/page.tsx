import { redirect } from 'next/navigation'
import type { ComponentProps } from 'react'
import { getServerUser } from '@/lib/auth/getServerUser'
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout'
import CRMQuotesTable from '@/components/admin/crm/CRMQuotesTable'

type CRMQuote = ComponentProps<typeof CRMQuotesTable>['initialQuotes'][number]

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function CRMPage() {
  const { user, role, supabase } = await getServerUser()
  if (!user) redirect('/login')
  if (role !== 'superadmin') redirect('/admin')

  // Fetch companies directly
  const { data: companiesData, error: companiesError } = await supabase
    .from('companies')
    .select('id, name, subscription_plan, account_status, created_at')
    .order('created_at', { ascending: false })

  if (companiesError) {
    console.error('Error fetching companies:', companiesError)
  }

  const companies = companiesData || []
  
  // Fetch quotes directly from database
  const { data: quotesData, error: quotesError } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (quotesError) {
    console.error('Error fetching quotes:', quotesError)
  }

  const quotes: CRMQuote[] = (quotesData || []).map((quote) => {
    const quoteRecord = (quote || {}) as Record<string, any>
    return {
      ...quoteRecord,
      monthly_estimate: Number(quoteRecord.monthly_estimate ?? 0),
      annual_estimate: Number(quoteRecord.annual_estimate ?? 0),
      feature_add_ons: Array.isArray(quoteRecord.feature_add_ons) ? quoteRecord.feature_add_ons : [],
      breakdown: quoteRecord.breakdown ?? {},
    } as CRMQuote
  })

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CRM - Quote Register</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Track quotes, manage company plan levels, and follow up with prospects
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#23408e] rounded-lg border border-gray-200 dark:border-[#2d437a] p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Quotes</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {quotes.length}
            </div>
          </div>
          <div className="bg-white dark:bg-[#23408e] rounded-lg border border-gray-200 dark:border-[#2d437a] p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Draft Quotes</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {quotes.filter((q: any) => q.status === 'draft').length}
            </div>
          </div>
          <div className="bg-white dark:bg-[#23408e] rounded-lg border border-gray-200 dark:border-[#2d437a] p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Accepted Quotes</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {quotes.filter((q: any) => q.status === 'accepted').length}
            </div>
          </div>
          <div className="bg-white dark:bg-[#23408e] rounded-lg border border-gray-200 dark:border-[#2d437a] p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Companies</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {companies.length}
            </div>
          </div>
        </div>

        {/* Quotes Table */}
        <CRMQuotesTable initialQuotes={quotes} companies={companies} />
      </div>
    </SuperAdminLayout>
  )
}

