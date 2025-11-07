import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { deriveRole } from './roles';

export async function getServerUser() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { user: null, role: 'member' as const, tenantId: null, supabase };
    }

    const { data: profile, error: profileError } = await supabase
      .from<Database['public']['Tables']['profiles']['Row'], Database['public']['Tables']['profiles']['Update']>('profiles')
      .select('id,email,role,organization_id,company_id')
      .eq('id', user.id)
      .maybeSingle();

    // If profile query fails or no profile found, still derive role from email
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    const role = deriveRole(user.email, (profile as any)?.role);
    const tenantId = (profile as any)?.organization_id ?? (profile as any)?.company_id ?? null;

    return { user, role, tenantId, supabase };
  } catch (error) {
    console.error('Error in getServerUser:', error);
    // Return a safe fallback that allows the page to render
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
    return { user: null, role: 'member' as const, tenantId: null, supabase };
  }
}
