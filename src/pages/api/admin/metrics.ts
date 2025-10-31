import { NextApiRequest, NextApiResponse } from 'next';
import { getServerUser } from '@/lib/auth/getServerUser';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication and role
    const { user, role } = await getServerUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get system-wide metrics
    const [companiesCount, usersCount, eventsCount] = await Promise.all([
      supabase.from('companies').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true })
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
