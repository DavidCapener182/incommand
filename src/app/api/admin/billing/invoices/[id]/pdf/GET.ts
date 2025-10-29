import { NextRequest } from 'next/server';
import { renderInvoicePdf } from '@/lib/pdf/renderInvoice';
import { createHandlerContext, handleError } from '../../../../utils';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = await createHandlerContext(request);
    const { data, error } = await context.supabase
      .from('invoices')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      throw error;
    }

    const pdf = await renderInvoicePdf({
      invoiceNumber: data.number ?? data.id,
      amount: data.total_amount ?? 0,
      issuedAt: data.issued_at ?? new Date().toISOString(),
      dueAt: data.due_at,
      customerName: data.organization_name ?? undefined,
    });

    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${data.id}.pdf"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
