import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse } from '@/lib/responses/json';
import { parseSearchParams } from '@/lib/security/validate';
import { createHandlerContext, getPagination, handleError } from '../../utils';

const querySchema = {
  organizationId: z.string().min(1),
  model: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
};

export async function GET(request: NextRequest) {
  try {
    const context = await createHandlerContext(request);
    const filters = parseSearchParams(request, querySchema);
    const pagination = getPagination(request);

    let query = context.supabase
      .from('logAIUsage')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(pagination.from, pagination.to);

    if (filters.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }
    if (filters.model) {
      query = query.eq('model', filters.model);
    }
    if (filters.from) {
      query = query.gte('created_at', filters.from);
    }
    if (filters.to) {
      query = query.lte('created_at', filters.to);
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
