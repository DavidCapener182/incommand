import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/getServerUser';
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout';

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const { user, role, supabase } = await getServerUser();
  if (!user) redirect('/login');
  if (role !== 'superadmin') redirect('/admin');

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, subscription_plan, account_status, created_at')
    .eq('id', params.id)
    .maybeSingle();

  if (!company) {
    redirect('/admin/companies');
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{company.name}</h1>
          <p className="text-gray-600 dark:text-gray-300">Company details</p>
        </div>

        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-300">Subscription plan</dt>
              <dd className="text-lg text-gray-900 dark:text-white capitalize">{(company as any).subscription_plan || 'trial'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-300">Status</dt>
              <dd className="text-lg text-gray-900 dark:text-white capitalize">{(company as any).account_status || 'active'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-300">Created</dt>
              <dd className="text-lg text-gray-900 dark:text-white">{company.created_at ? new Date(company.created_at).toLocaleDateString() : 'N/A'}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <a href={`/admin/companies/${company.id}/edit`} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">Edit Company</a>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}


