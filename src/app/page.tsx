import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/getServerUser';
import RootClientRedirect from './RootClientRedirect';

export default async function RootPage() {
  try {
    const { user, role } = await getServerUser();
    
    if (!user) {
      redirect('/login');
    }

    if (role === 'superadmin') {
      redirect('/admin');
    }

    redirect('/incidents');
  } catch (error) {
    console.error('Error in RootPage:', error);
    // Fallback to client-side redirect if server-side fails
    return <RootClientRedirect />;
  }

  // Client fallback (should not be reached if redirects worked server-side)
  return <RootClientRedirect />
}
