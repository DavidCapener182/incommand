import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse } from '@/lib/responses/json';
import { parseJson } from '@/lib/security/validate';
import { audit } from '@/lib/audit/log';
import { createHandlerContext, handleError } from '../../../utils';

const schema = z.object({
  status: z.string().min(1).max(50).optional(),
  dueAt: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = await createHandlerContext(request);
    const payload = await parseJson(request, schema);

    const updates: Record<string, unknown> = {};
    if (payload.status) updates.status = payload.status;
    if (payload.dueAt) updates.due_at = payload.dueAt;
    if (payload.notes) updates.notes = payload.notes;

    const { data, error } = await context.supabase
      .from('invoices')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await audit({
      action: 'update',
      entity: 'invoice',
      entityId: params.id,
      organizationId: data.organization_id,
      changes: payload,
      userEmail: context.adminEmail,
    });

    return jsonResponse({ data });
  } catch (error) {
    return handleError(error);
  }
}
