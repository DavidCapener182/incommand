import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/getServerUser';
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout';
import SuperAdminDashboard from '@/components/admin/SuperAdminDashboard';
import CompanyAdminDashboard from '@/components/admin/CompanyAdminDashboard';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  try {
    const { user, role } = await getServerUser();
    if (!user) redirect('/login');

    if (role === 'superadmin') {
      return (
        <SuperAdminLayout>
          <SuperAdminDashboard />
        </SuperAdminLayout>
      );
    }

    return <CompanyAdminDashboard />;
  } catch (error) {
    console.error('Error in AdminPage:', error);
    // Redirect to login on error
    redirect('/login');
  }
} 
