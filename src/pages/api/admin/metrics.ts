import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { getServiceClient } from '@/lib/supabaseServer';
import { deriveRole } from '@/lib/auth/roles';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication and role
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .maybeSingle();

    const role = deriveRole(user.email, (profile as any)?.role);
    if (role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Use service client for system-wide queries (bypasses RLS)
    const serviceClient = getServiceClient();

    // Get system-wide metrics
    const [companiesCount, usersCount, eventsCount] = await Promise.all([
      serviceClient.from('companies').select('id', { count: 'exact', head: true }),
      serviceClient.from('profiles').select('id', { count: 'exact', head: true }),
      serviceClient.from('events').select('id', { count: 'exact', head: true })
    ]);

    const metrics = {
      totalCompanies: companiesCount.count ?? 0,
      totalUsers: usersCount.count ?? 0,
      totalEvents: eventsCount.count ?? 0,
      systemHealth: 'operational' // Placeholder
    };

    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ error: 'Failed to fetch system metrics' });
  }
}
