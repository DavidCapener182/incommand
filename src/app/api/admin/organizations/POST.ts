import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse } from '@/lib/responses/json';
import { parseJson } from '@/lib/security/validate';
import { audit } from '@/lib/audit/log';
import { createHandlerContext, handleError } from '../utils';

const schema = z.object({
  name: z.string().min(2).max(255),
  domain: z.string().email().optional(),
  status: z.string().min(1).max(100).default('active'),
  plan: z.string().min(1).max(100).optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const context = await createHandlerContext(request);
    const payload = await parseJson(request, schema);

    const { data, error } = await context.supabase
      .from('organizations')
      .insert({
        name: payload.name,
        domain: payload.domain ?? null,
        status: payload.status,
        plan: payload.plan ?? null,
        metadata: payload.metadata ?? null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await audit({
      action: 'create',
      entity: 'organization',
      entityId: data.id,
      organizationId: data.id,
      changes: payload,
      userEmail: context.adminEmail,
    });

    return jsonResponse({ data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
