import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse } from '@/lib/responses/json';
import { parseJson } from '@/lib/security/validate';
import { audit } from '@/lib/audit/log';
import { generateInvoice } from '@/lib/billing/invoice';
import { createHandlerContext, handleError } from '../../utils';

const schema = z.object({
  organizationId: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const context = await createHandlerContext(request);
    const payload = await parseJson(request, schema);

    const invoice = await generateInvoice({
      organizationId: payload.organizationId,
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
      userEmail: context.adminEmail,
    });

    await audit({
      action: 'create',
      entity: 'invoice',
      entityId: invoice.id,
      organizationId: payload.organizationId,
      changes: payload,
      userEmail: context.adminEmail,
    });

    return jsonResponse({ data: invoice }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
