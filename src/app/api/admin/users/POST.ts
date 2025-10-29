import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse } from '@/lib/responses/json';
import { parseJson } from '@/lib/security/validate';
import { audit } from '@/lib/audit/log';
import { createHandlerContext, handleError } from '../utils';

const schema = z.object({
  userId: z.string().min(1),
  organizationId: z.string().min(1),
  roleIds: z.array(z.string().min(1)).default([]),
  status: z.string().min(1).max(100).default('active'),
});

export async function POST(request: NextRequest) {
  try {
    const context = await createHandlerContext(request);
    const payload = await parseJson(request, schema);

    const { data, error } = await context.supabase
      .from('organization_members')
      .insert({
        user_id: payload.userId,
        organization_id: payload.organizationId,
        status: payload.status,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (payload.roleIds.length > 0) {
      await context.supabase
        .from('user_roles')
        .insert(payload.roleIds.map((roleId) => ({
          role_id: roleId,
          user_id: payload.userId,
          organization_id: payload.organizationId,
        })));
    }

    await audit({
      action: 'create',
      entity: 'organization_member',
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
