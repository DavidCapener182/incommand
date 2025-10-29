import { getServerClient } from '../supabase/server';

interface GenerateInvoiceOptions {
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  userEmail: string;
}

export async function generateInvoice({ organizationId, periodStart, periodEnd, userEmail }: GenerateInvoiceOptions) {
  const supabase = getServerClient();
  const { data: usage, error: usageError } = await supabase
    .from('subscription_usage')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('period_start', periodStart)
    .lte('period_end', periodEnd);

  if (usageError) {
    throw usageError;
  }

  const total = (usage ?? []).reduce((sum, item) => sum + (item.cost ?? 0), 0);

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      organization_id: organizationId,
      period_start: periodStart,
      period_end: periodEnd,
      total_amount: total,
      status: 'draft',
      metadata: { generated_by: userEmail },
    })
    .select()
    .single();

  if (invoiceError) {
    throw invoiceError;
  }

  return invoice;
}
