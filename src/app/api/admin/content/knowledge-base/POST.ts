import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse } from '@/lib/responses/json';
import { parseJson } from '@/lib/security/validate';
import { audit } from '@/lib/audit/log';
import { createHandlerContext, handleError } from '../../utils';

const schema = z.object({
  title: z.string().min(3).max(255),
  content: z.string().min(1),
  category: z.string().min(1).optional(),
  published: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const context = await createHandlerContext(request);
    const payload = await parseJson(request, schema);

    const { data, error } = await context.supabase
      .from('knowledge_base')
      .insert({
        title: payload.title,
        content: payload.content,
        category: payload.category ?? null,
        published: payload.published,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await audit({
      action: 'create',
      entity: 'knowledge_base',
      entityId: data.id,
      organizationId: null,
      changes: payload,
      userEmail: context.adminEmail,
    });

    return jsonResponse({ data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
