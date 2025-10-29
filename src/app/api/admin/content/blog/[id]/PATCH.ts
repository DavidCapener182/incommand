import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse } from '@/lib/responses/json';
import { parseJson } from '@/lib/security/validate';
import { audit } from '@/lib/audit/log';
import { createHandlerContext, handleError } from '../../../utils';

const schema = z.object({
  title: z.string().min(3).max(255).optional(),
  content: z.string().optional(),
  status: z.string().optional(),
  tags: z.array(z.string().min(1)).optional(),
  publishedAt: z.string().nullable().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = await createHandlerContext(request);
    const payload = await parseJson(request, schema);

    const updates: Record<string, unknown> = { ...payload };
    if ('publishedAt' in updates) {
      updates.published_at = payload.publishedAt ?? null;
      delete updates.publishedAt;
    }

    const { data, error } = await context.supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await audit({
      action: 'update',
      entity: 'blog_post',
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
