import { getServerClient } from '../../lib/supabase/server';

export async function reconcileBilling(organizationId: string, periodStart: string, periodEnd: string) {
  const supabase = getServerClient();
  const { data: transactions, error } = await supabase
    .from('billing_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('processed_at', periodStart)
    .lte('processed_at', periodEnd);

  if (error) {
    throw error;
  }

  const total = (transactions ?? []).reduce((sum, item) => sum + (item.amount ?? 0), 0);

  return {
    organizationId,
    periodStart,
    periodEnd,
    total,
    transactions: transactions ?? [],
  };
}
