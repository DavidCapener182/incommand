import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse } from '@/lib/responses/json';
import { parseJson } from '@/lib/security/validate';
import { audit } from '@/lib/audit/log';
import { createHandlerContext, handleError } from '../../utils';

const schema = z.object({
  title: z.string().min(3).max(255),
  content: z.string().min(1),
  status: z.string().min(1).default('draft'),
  tags: z.array(z.string().min(1)).default([]),
  publishedAt: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const context = await createHandlerContext(request);
    const payload = await parseJson(request, schema);

    const { data, error } = await context.supabase
      .from('blog_posts')
      .insert({
        title: payload.title,
        content: payload.content,
        status: payload.status,
        tags: payload.tags,
        published_at: payload.publishedAt ?? null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await audit({
      action: 'create',
      entity: 'blog_post',
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
