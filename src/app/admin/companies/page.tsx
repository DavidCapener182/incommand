import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/getServerUser';
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout';
import AddCompanyButton from '@/components/admin/companies/AddCompanyButton';
import ViewCompanyButton from '@/components/admin/companies/ViewCompanyButton';
import CompanyEditDialogButton from '@/components/admin/companies/CompanyEditDialogButton'
import DeleteCompanyButton from '@/components/admin/companies/DeleteCompanyButton'
import { sa_listCompanies } from '@/hooks/useSuperAdmin';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function CompaniesPage() {
  const { user, role } = await getServerUser();
  if (!user) redirect('/login');
  if (role !== 'superadmin') redirect('/admin');

  const companies = await sa_listCompanies();

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Companies</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Manage all companies in the system</p>
          </div>
          <AddCompanyButton />
        </div>

        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[#1a2a57]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#23408e] divide-y divide-gray-200 dark:divide-gray-700">
                {companies.length > 0 ? companies.map((company: any) => (
                  <tr key={company.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {company.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{(company as any).subscription_plan || 'trial'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (company as any).account_status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>{(company as any).account_status || 'active'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <ViewCompanyButton companyId={company.id} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" />
                      <CompanyEditDialogButton id={company.id} name={company.name} plan={(company as any).subscription_plan} status={(company as any).account_status} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300" />
                      <DeleteCompanyButton id={company.id} className="text-red-600 hover:text-red-800" />
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No companies found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
