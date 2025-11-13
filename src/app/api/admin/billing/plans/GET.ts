import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/responses/json';
import { createHandlerContext, handleError } from '../../utils';

export async function GET(request: NextRequest) {
  try {
    const context = await createHandlerContext(request);
    const { data, error } = await context.supabase
      .from('billing_plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      throw error;
    }

    return jsonResponse({ data: data ?? [] });
  } catch (error) {
    return handleError(error);
  }
}
