import { getServerUser } from '@/lib/auth/getServerUser';

// Superadmin-only data helpers (server-side only)
export async function sa_listCompanies() {
  try {
    const { role, supabase, user } = await getServerUser();
    console.log('sa_listCompanies: role check', { role, isSuperadmin: role === 'superadmin', userId: user?.id });
    
    if (role !== 'superadmin') {
      console.log('sa_listCompanies: Not superadmin, returning empty array');
      return [];
    }
    
    // First check if we can access the table at all
    const { data: testData, error: testError } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('sa_listCompanies: Initial table access error:', testError);
      console.error('sa_listCompanies: Error details:', JSON.stringify(testError, null, 2));
    }
    
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, subscription_plan, account_status, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('sa_listCompanies: Error fetching companies:', error);
      console.error('sa_listCompanies: Error code:', error.code);
      console.error('sa_listCompanies: Error message:', error.message);
      console.error('sa_listCompanies: Error details:', error.details);
      console.error('sa_listCompanies: Error hint:', error.hint);
      return [];
    }
    
    console.log('sa_listCompanies: Successfully fetched', data?.length || 0, 'companies');
    if (data && data.length > 0) {
      console.log('sa_listCompanies: Sample company:', data[0]);
    }
    return data ?? [];
  } catch (error) {
    console.error('sa_listCompanies: Exception caught:', error);
    if (error instanceof Error) {
      console.error('sa_listCompanies: Error stack:', error.stack);
    }
    return [];
  }
}

export async function sa_listUsers() {
  try {
    const { role, supabase } = await getServerUser();
    console.log('sa_listUsers: role check', { role, isSuperadmin: role === 'superadmin' });
    
    if (role !== 'superadmin') {
      console.log('sa_listUsers: Not superadmin, returning empty array');
      return [];
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, company_id, created_at, companies(name)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    
    console.log('sa_listUsers: Successfully fetched', data?.length || 0, 'users');
    return data ?? [];
  } catch (error) {
    console.error('Error in sa_listUsers:', error);
    return [];
  }
}

export async function sa_listEvents() {
  try {
    const { role, supabase } = await getServerUser();
    if (role !== 'superadmin') return [];
    
    const { data, error } = await supabase
      .from('events')
      .select('id, event_name, event_type, company_id, is_current, created_at, companies(name)')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }
    return data ?? [];
  } catch (error) {
    console.error('Error in sa_listEvents:', error);
    return [];
  }
}

export async function sa_billingOverview() {
  try {
    const { role, supabase } = await getServerUser();
    if (role !== 'superadmin') {
      return { invoices: [], subscriptions: [], transactions: [], stats: { totalRevenue: 0, monthlyRecurringRevenue: 0, activeSubscriptions: 0, pendingInvoices: 0 } };
    }
    
    // Fetch companies to calculate billing stats
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name, created_at');
    
    // Calculate billing stats from companies
    const activeCompanies = companies ?? [];
    const totalRevenue = activeCompanies.length * 29 * 1000; // Basic estimate
    const monthlyRecurringRevenue = activeCompanies.length * 29 * 1000;
    
    // Try to fetch billing data (these tables may not exist)
    const [invoices, subscriptions, transactions] = await Promise.allSettled([
      (supabase as any).from('invoices').select('*').order('created_at', { ascending: false }).limit(20).catch(() => ({ data: [] })),
      (supabase as any).from('subscriptions').select('*').order('created_at', { ascending: false }).limit(20).catch(() => ({ data: [] })),
      (supabase as any).from('billing_transactions').select('*').order('created_at', { ascending: false }).limit(20).catch(() => ({ data: [] }))
    ]);
    
    return {
      invoices: invoices.status === 'fulfilled' ? invoices.value?.data ?? [] : [],
      subscriptions: subscriptions.status === 'fulfilled' ? subscriptions.value?.data ?? [] : [],
      transactions: transactions.status === 'fulfilled' ? transactions.value?.data ?? [] : [],
      stats: {
        totalRevenue: totalRevenue * 1000, // Estimate
        monthlyRecurringRevenue: monthlyRecurringRevenue * 1000,
        activeSubscriptions: activeCompanies.length,
        pendingInvoices: 0
      }
    };
  } catch (error) {
    console.error('Error in sa_billingOverview:', error);
    return { invoices: [], subscriptions: [], transactions: [], stats: { totalRevenue: 0, monthlyRecurringRevenue: 0, activeSubscriptions: 0, pendingInvoices: 0 } };
  }
}

export async function sa_supportTickets() {
  try {
    const { role, supabase } = await getServerUser();
    if (role !== 'superadmin') return [];
    
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*, companies(name)')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching support tickets:', error);
      return [];
    }
    return data ?? [];
  } catch (error) {
    console.error('Error in sa_supportTickets:', error);
    return [];
  }
}

export async function sa_systemMetrics() {
  try {
    const { role, supabase } = await getServerUser();
    if (role !== 'superadmin') {
      return { totalCompanies: 0, totalUsers: 0, totalEvents: 0, systemHealth: 'operational' };
    }
    
    // Get system-wide metrics
    const [companiesCount, usersCount, eventsCount] = await Promise.all([
      supabase.from('companies').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true })
    ]);
    
    return {
      totalCompanies: companiesCount.count ?? 0,
      totalUsers: usersCount.count ?? 0,
      totalEvents: eventsCount.count ?? 0,
      systemHealth: 'operational' // Placeholder
    };
  } catch (error) {
    console.error('Error in sa_systemMetrics:', error);
    return { totalCompanies: 0, totalUsers: 0, totalEvents: 0, systemHealth: 'operational' };
  }
}

// Tenant-safe helpers (for company admins)
export async function tenant_listEvents() {
  const { role, tenantId, supabase } = await getServerUser();
  if (!tenantId && role !== 'superadmin') throw new Error('No tenant');
  
  const query = supabase.from('events').select('*').order('created_at', { ascending: false });
  if (role !== 'superadmin') query.eq('company_id', tenantId);
  
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function tenant_listUsers() {
  const { role, tenantId, supabase } = await getServerUser();
  if (!tenantId && role !== 'superadmin') throw new Error('No tenant');
  
  const query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (role !== 'superadmin') query.eq('company_id', tenantId);
  
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// Content Management Functions
export async function sa_listBlogPosts() {
  try {
    const { role, supabase } = await getServerUser();
    if (role !== 'superadmin') return [];
    
    const { data, error } = await (supabase as any)
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching blog posts:', error);
      return [];
    }
    return data ?? [];
  } catch (error) {
    console.error('Error in sa_listBlogPosts:', error);
    return [];
  }
}

export async function sa_createBlogPost(post: {
  title: string;
  slug: string;
  content: string;
  type: 'blog' | 'documentation' | 'announcement';
  status: 'draft' | 'published';
  author_id: string;
  excerpt?: string;
  tags?: string[];
}) {
  try {
    const { role, supabase } = await getServerUser();
    if (role !== 'superadmin') {
      throw new Error('Unauthorized');
    }
    
    const { data, error } = await (supabase as any)
      .from('blog_posts')
      .insert({
        ...post,
        published_at: post.status === 'published' ? new Date().toISOString() : null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating blog post:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error in sa_createBlogPost:', error);
    throw error;
  }
}

export async function sa_updateBlogPost(id: string, updates: {
  title?: string;
  slug?: string;
  content?: string;
  type?: 'blog' | 'documentation' | 'announcement';
  status?: 'draft' | 'published';
  excerpt?: string;
  tags?: string[];
}) {
  try {
    const { role, supabase } = await getServerUser();
    if (role !== 'superadmin') {
      throw new Error('Unauthorized');
    }
    
    const updateData: any = { ...updates };
    if (updates.status === 'published' && !updateData.published_at) {
      updateData.published_at = new Date().toISOString();
    }
    
    const { data, error } = await (supabase as any)
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating blog post:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error in sa_updateBlogPost:', error);
    throw error;
  }
}

export async function sa_deleteBlogPost(id: string) {
  try {
    const { role, supabase } = await getServerUser();
    if (role !== 'superadmin') {
      throw new Error('Unauthorized');
    }
    
    const { error } = await (supabase as any)
      .from('blog_posts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting blog post:', error);
      throw error;
    }
    return true;
  } catch (error) {
    console.error('Error in sa_deleteBlogPost:', error);
    throw error;
  }
}

export async function sa_getContentStats() {
  try {
    const { role, supabase } = await getServerUser();
    if (role !== 'superadmin') {
      return { totalPosts: 0, publishedPosts: 0, draftPosts: 0, totalViews: 0 };
    }
    
    const { data, error } = await (supabase as any)
      .from('blog_posts')
      .select('status, views');
    
    if (error) {
      console.error('Error fetching content stats:', error);
      return { totalPosts: 0, publishedPosts: 0, draftPosts: 0, totalViews: 0 };
    }
    
    const posts = data ?? [];
    const publishedPosts = posts.filter((p: any) => p.status === 'published').length;
    const draftPosts = posts.filter((p: any) => p.status === 'draft').length;
    const totalViews = posts.reduce((sum: number, p: any) => sum + (p.views || 0), 0);
    
    return {
      totalPosts: posts.length,
      publishedPosts,
      draftPosts,
      totalViews
    };
  } catch (error) {
    console.error('Error in sa_getContentStats:', error);
    return { totalPosts: 0, publishedPosts: 0, draftPosts: 0, totalViews: 0 };
  }
}

