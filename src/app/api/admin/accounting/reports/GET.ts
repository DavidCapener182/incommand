import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/responses/json';
import { createHandlerContext, handleError } from '../../utils';

export async function GET(request: NextRequest) {
  try {
    const context = await createHandlerContext(request);

    const [{ data: subscriptions = [] }, { data: invoices = [] }, { data: transactions = [] }] = await Promise.all([
      context.supabase.from('subscriptions').select('*').eq('status', 'active'),
      context.supabase.from('invoices').select('*'),
      context.supabase.from('billing_transactions').select('*'),
    ]);

    const mrr = subscriptions.reduce((sum: number, item: any) => {
      const amount = item.monthly_amount ?? item.amount ?? item.price ?? 0;
      return sum + amount;
    }, 0);

    const arr = mrr * 12;

    const outstanding = invoices
      .filter((invoice: any) => invoice.status !== 'paid')
      .reduce((sum: number, invoice: any) => sum + (invoice.total_amount ?? invoice.amount ?? 0), 0);

    const cashFlow = transactions.reduce((sum: number, tx: any) => sum + (tx.amount ?? 0), 0);

    return jsonResponse({
      data: {
        mrr,
        arr,
        outstanding,
        cashFlow,
        subscriptionCount: subscriptions.length,
        invoiceCount: invoices.length,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
