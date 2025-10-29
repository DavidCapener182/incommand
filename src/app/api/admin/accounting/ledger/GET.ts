import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse } from '@/lib/responses/json';
import { parseSearchParams } from '@/lib/security/validate';
import { createHandlerContext, getPagination, handleError } from '../../utils';

const querySchema = {
  organizationId: z.string().min(1),
  type: z.string().min(1),
};

export async function GET(request: NextRequest) {
  try {
    const context = await createHandlerContext(request);
    const filters = parseSearchParams(request, querySchema);
    const pagination = getPagination(request);

    let query = context.supabase
      .from('ledger_entries')
      .select('*', { count: 'exact' })
      .order('posted_at', { ascending: false })
      .range(pagination.from, pagination.to);

    if (filters.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error, count } = await query;
    if (error) {
      throw error;
    }

    return jsonResponse({
      data: data ?? [],
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: count ?? data?.length ?? 0,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
