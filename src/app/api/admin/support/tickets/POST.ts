import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse } from '@/lib/responses/json';
import { parseJson } from '@/lib/security/validate';
import { audit } from '@/lib/audit/log';
import { createHandlerContext, handleError } from '../../utils';

const schema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(3),
  description: z.string().min(1),
  priority: z.string().min(1).default('medium'),
  assignedTo: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const context = await createHandlerContext(request);
    const payload = await parseJson(request, schema);

    const { data, error } = await context.supabase
      .from('support_tickets')
      .insert({
        organization_id: payload.organizationId,
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        status: 'open',
        assigned_to: payload.assignedTo ?? null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await audit({
      action: 'create',
      entity: 'support_ticket',
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
