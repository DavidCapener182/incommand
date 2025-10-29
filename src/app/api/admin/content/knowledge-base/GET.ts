import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse } from '@/lib/responses/json';
import { parseSearchParams } from '@/lib/security/validate';
import { createHandlerContext, getPagination, handleError } from '../../utils';

const querySchema = {
  search: z.string().min(1),
  category: z.string().min(1),
};

export async function GET(request: NextRequest) {
  try {
    const context = await createHandlerContext(request);
    const filters = parseSearchParams(request, querySchema);
    const pagination = getPagination(request);

    let query = context.supabase
      .from('knowledge_base')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(pagination.from, pagination.to);

    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
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
