import type { Json } from '@/types/supabase';
import { getServerClient } from '../supabase/server';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface AuditPayload {
  action: string;
  entity: string;
  entityId?: string | number | null;
  organizationId?: string | number | null;
  changes?: Json | null;
  userEmail: string;
  actionType?: string;
  performedBy?: string | null;
  profileId?: string | null;
}

export async function audit({
  action,
  entity,
  entityId,
  organizationId,
  changes,
  userEmail,
  actionType = 'ADMIN',
  performedBy,
  profileId,
}: AuditPayload) {
  const supabase = getServerClient();

  const details: Record<string, Json> = { userEmail };

  if (typeof organizationId !== 'undefined') {
    details.organizationId = organizationId;
  }

  if (typeof entityId !== 'undefined') {
    details.entityId = entityId;
  }

  if (typeof changes !== 'undefined' && changes !== null) {
    details.changes = changes;
  }

  const payload = {
    action,
    action_type: actionType,
    table_name: entity,
    record_id:
      typeof entityId === 'string' && UUID_REGEX.test(entityId) ? entityId : null,
    performed_by: performedBy ?? null,
    profile_id: profileId ?? null,
    details: Object.keys(details).length > 0 ? JSON.stringify(details) : null,
  };

  await supabase.from('audit_logs').insert(payload);
}
