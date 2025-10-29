import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';
import { getServiceClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type InvoiceRow = Database['public']['Tables']['invoices']['Row'];
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type TypedSupabaseClient = SupabaseClient<Database>;

interface AdminAuditEntry {
  organizationId?: string;
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: InvoiceRow;
}

export async function POST(request: Request) {
  try {
    const supabase = getServiceClient();
    const payload = (await request.json()) as InvoiceInsert;

    const { data, error } = await supabase
      .from('invoices')
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to create invoice:', error);
      return NextResponse.json({ error: 'Invoice creation failed' }, { status: 400 });
    }

    const invoice = data as InvoiceRow;

    const actorId = request.headers.get('x-user-id') ?? invoice.created_by ?? undefined;

    await recordAdminAudit(supabase, {
      organizationId: invoice.organization_id ?? undefined,
      actorId: actorId ?? undefined,
      action: 'create_invoice',
      resourceType: 'invoices',
      resourceId: invoice.id,
      changes: invoice,
    });

    return NextResponse.json({ data: invoice });
  } catch (unknownError) {
    console.error('Unexpected error creating invoice:', unknownError);
    return NextResponse.json({ error: 'Invoice creation failed' }, { status: 500 });
  }
}

async function recordAdminAudit(
  client: TypedSupabaseClient,
  entry: AdminAuditEntry
) {
  const { error } = await client.from('audit_logs').insert({
    action: entry.action,
    action_type: entry.actorId ? 'user' : 'system',
    performed_by: entry.actorId ?? null,
    details: {
      organizationId: entry.organizationId ?? null,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      changes: entry.changes,
    },
  });

  if (error) {
    console.error('Failed to record admin audit log:', error);
  }
}
