import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse } from '@/lib/responses/json';
import { parseJson } from '@/lib/security/validate';
import { audit } from '@/lib/audit/log';
import { createHandlerContext, handleError } from '../../utils';

const schema = z.object({
  status: z.string().min(1).max(100).optional(),
  roleIds: z.array(z.string().min(1)).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = await createHandlerContext(request);
    const payload = await parseJson(request, schema);

    const updates: Record<string, unknown> = {};
    if (payload.status) {
      updates.status = payload.status;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await context.supabase
        .from('organization_members')
        .update(updates)
        .eq('id', params.id);

      if (error) {
        throw error;
      }
    }

    if (payload.roleIds) {
      const { data: member, error: memberError } = await context.supabase
        .from('organization_members')
        .select('user_id, organization_id')
        .eq('id', params.id)
        .single();

      if (memberError) {
        throw memberError;
      }

      await context.supabase
        .from('user_roles')
        .delete()
        .eq('user_id', member.user_id)
        .eq('organization_id', member.organization_id);

      if (payload.roleIds.length > 0) {
        await context.supabase
          .from('user_roles')
          .insert(payload.roleIds.map((roleId) => ({
            role_id: roleId,
            user_id: member.user_id,
            organization_id: member.organization_id,
          })));
      }
    }

    await audit({
      action: 'update',
      entity: 'organization_member',
      entityId: params.id,
      organizationId: undefined,
      changes: payload,
      userEmail: context.adminEmail,
    });

    return jsonResponse({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
