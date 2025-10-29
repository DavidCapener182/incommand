import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse } from '@/lib/responses/json';
import { parseJson } from '@/lib/security/validate';
import { audit } from '@/lib/audit/log';
import { createHandlerContext, handleError } from '../../utils';

const schema = z.object({
  organizationId: z.string().min(1),
  amount: z.number(),
  type: z.enum(['credit', 'debit']),
  description: z.string().min(1),
  reference: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const context = await createHandlerContext(request);
    const payload = await parseJson(request, schema);

    const { data, error } = await context.supabase
      .from('ledger_entries')
      .insert({
        organization_id: payload.organizationId,
        amount: payload.amount,
        type: payload.type,
        description: payload.description,
        reference: payload.reference ?? null,
        posted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await audit({
      action: 'create',
      entity: 'ledger_entry',
      entityId: data.id,
      organizationId: payload.organizationId,
      changes: payload,
      userEmail: context.adminEmail,
    });

    return jsonResponse({ data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
