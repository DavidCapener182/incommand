import { getServerClient } from '../supabase/server';

interface GenerateInvoiceOptions {
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  userEmail: string;
}

export async function generateInvoice({ organizationId, periodStart, periodEnd, userEmail }: GenerateInvoiceOptions) {
  const supabase = getServerClient();
  const parseRate = (value: string | undefined) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const rates = {
    apiCalls: parseRate(process.env.BILLING_RATE_API_CALL),
    emails: parseRate(process.env.BILLING_RATE_EMAIL),
    sms: parseRate(process.env.BILLING_RATE_SMS),
    storageGb: parseRate(process.env.BILLING_RATE_STORAGE_GB),
    events: parseRate(process.env.BILLING_RATE_EVENT),
    users: parseRate(process.env.BILLING_RATE_USER),
  } as const;
  const { data: usage, error: usageError } = await supabase
    .from('subscription_usage')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('period_start', periodStart)
    .lte('period_end', periodEnd);

  if (usageError) {
    throw usageError;
  }

  const total = (usage ?? []).reduce((sum, item) => {
    const apiCallCost = (item.api_calls ?? 0) * rates.apiCalls;
    const emailCost = (item.emails_sent ?? 0) * rates.emails;
    const smsCost = (item.sms_sent ?? 0) * rates.sms;
    const storageCost = Number(item.storage_gb ?? 0) * rates.storageGb;
    const eventsCost = (item.events_count ?? 0) * rates.events;
    const seatCost = (item.users_count ?? 0) * rates.users;

    return sum + apiCallCost + emailCost + smsCost + storageCost + eventsCost + seatCost;
  }, 0);

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
