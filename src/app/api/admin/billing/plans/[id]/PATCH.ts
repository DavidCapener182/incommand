import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse } from '@/lib/responses/json';
import { parseJson } from '@/lib/security/validate';
import { audit } from '@/lib/audit/log';
import { createHandlerContext, handleError } from '../../../utils';

const schema = z.object({
  price: z.number().min(0).optional(),
  features: z.array(z.string().min(1)).optional(),
  currency: z.string().min(3).max(3).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = await createHandlerContext(request);
    const payload = await parseJson(request, schema);

    const { data, error } = await context.supabase
      .from('billing_plans')
      .update(payload)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await audit({
      action: 'update',
      entity: 'billing_plan',
      entityId: params.id,
      organizationId: null,
      changes: payload,
      userEmail: context.adminEmail,
    });

    return jsonResponse({ data });
  } catch (error) {
    return handleError(error);
  }
}
