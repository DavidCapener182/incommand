import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/getServerUser';
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout';
import { sa_billingOverview } from '@/hooks/useSuperAdmin';
import GenerateInvoiceDialog from '@/components/admin/billing/GenerateInvoiceDialog'
import CreatePlanDialog from '@/components/admin/billing/CreatePlanDialog'
import SyncMarketingPlansButton from '@/components/admin/billing/SyncMarketingPlansButton'
import { defaultMarketingPlans } from '@/data/marketingPlans'
import { 
  CreditCardIcon, 
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

export default async function BillingPage() {
  const { user, role } = await getServerUser();
  if (!user) redirect('/login');
  if (role !== 'superadmin') redirect('/admin');

  const billing = await sa_billingOverview();
  // Load plans from API (DB-backed if available)
  let plans: any[] = []
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/billing/plans`, { cache: 'no-store' })
    if (res.ok) {
      const json = await res.json()
      plans = json.plans ?? []
    }
  } catch {}
  if (!plans || plans.length === 0) {
    plans = defaultMarketingPlans.map(p => ({
      id: p.code,
      name: p.name,
      code: p.code,
      price_monthly: p.priceMonthly,
      currency: 'GBP',
      metadata: { features: p.features },
      is_active: true,
    }))
  }
  
  // Use real data from billing overview
  const stats = billing.stats || {
    totalRevenue: 0,
    monthlyRecurringRevenue: 0,
    activeSubscriptions: 0,
    pendingInvoices: 0
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Revenue</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Manage billing, subscriptions, and revenue across all companies</p>
        </div>

        {/* Revenue Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  £{stats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <CreditCardIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  £{stats.monthlyRecurringRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeSubscriptions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending Invoices</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingInvoices}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Growth</h3>
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">+0%</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">vs last month</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Churn Rate</h3>
            <div className="flex items-center">
              <ArrowTrendingDownIcon className="h-8 w-8 text-red-600 dark:text-red-400 mr-3" />
              <div>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">0%</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">monthly churn</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Invoices</h2>
            {/* @ts-expect-error client component */}
            <GenerateInvoiceDialog companies={(billing?.companies ?? []).map((c: any) => ({ id: c.id, name: c.name }))} />
          </div>

          {billing.invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-[#1a2a57]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#23408e] divide-y divide-gray-200 dark:divide-gray-700">
                  {billing.invoices.slice(0, 10).map((invoice: any, index: number) => (
                    <tr key={invoice.id || index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        #{invoice.invoice_number || `INV-${1000 + index}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {invoice.company_name || 'Company Name'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        £{invoice.amount || (1000 + index * 100).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : invoice.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {invoice.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {invoice.due_date || '2024-01-15'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                          View
                        </button>
                        <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No invoices found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Invoices will appear here when generated.</p>
            </div>
          )}
        </div>

        {/* Subscription Plans */}
        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Subscription Plans</h2>
            {/* @ts-expect-error client component */}
            <CreatePlanDialog />
          </div>

          <div className="flex justify-end mb-4">
            {/* @ts-expect-error client component */}
            <SyncMarketingPlansButton />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.length === 0 ? (
              <div className="text-gray-500">No plans found.</div>
            ) : (
              plans.map((p: any) => (
                <div key={p.id} className="border border-gray-200 dark:border-[#2d437a] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{p.name}</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">£{(p.price_monthly ?? 0).toString()}<span className="text-lg text-gray-500">/month</span></p>
                  {p.metadata?.features && Array.isArray(p.metadata.features) ? (
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      {p.metadata.features.map((f: string) => (<li key={f}>• {f}</li>))}
                    </ul>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

