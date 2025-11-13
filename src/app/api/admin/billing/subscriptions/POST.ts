import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse } from '@/lib/responses/json';
import { parseJson } from '@/lib/security/validate';
import { audit } from '@/lib/audit/log';
import { createHandlerContext, handleError } from '../../utils';

const schema = z.object({
  organizationId: z.string().min(1),
  planId: z.string().min(1),
  status: z.string().min(1).max(50).default('active'),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const context = await createHandlerContext(request);
    const payload = await parseJson(request, schema);

    const { data, error } = await context.supabase
      .from('subscriptions')
      .insert({
        organization_id: payload.organizationId,
        plan_id: payload.planId,
        status: payload.status,
        period_start: payload.periodStart ?? null,
        period_end: payload.periodEnd ?? null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await audit({
      action: 'create',
      entity: 'subscription',
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
