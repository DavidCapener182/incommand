import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/responses/json';
import { createHandlerContext, handleError } from '../../utils';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = await createHandlerContext(request);
    const { data, error } = await context.supabase
      .from('organizations')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      throw error;
    }

    return jsonResponse({ data });
  } catch (error) {
    return handleError(error);
  }
}
