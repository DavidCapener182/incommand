import { generateInvoice } from '../../lib/billing/invoice';

export async function generateInvoiceForPeriod(
  organizationId: string,
  periodStart: string,
  periodEnd: string,
  userEmail: string,
) {
  return generateInvoice({ organizationId, periodStart, periodEnd, userEmail });
}
