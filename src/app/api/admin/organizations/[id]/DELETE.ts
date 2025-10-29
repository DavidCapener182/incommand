import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/responses/json';
import { audit } from '@/lib/audit/log';
import { createHandlerContext, handleError } from '../../utils';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = await createHandlerContext(request);

    const { error } = await context.supabase
      .from('organizations')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw error;
    }

    await audit({
      action: 'delete',
      entity: 'organization',
      entityId: params.id,
      organizationId: params.id,
      userEmail: context.adminEmail,
      changes: null,
    });

    return jsonResponse({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
