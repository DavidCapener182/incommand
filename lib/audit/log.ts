import { getServerClient } from '../supabase/server';

interface AuditPayload {
  action: string;
  entity: string;
  entityId?: string | number | null;
  organizationId?: string | number | null;
  changes?: Record<string, unknown> | null;
  userEmail: string;
}

export async function audit({ action, entity, entityId, organizationId, changes, userEmail }: AuditPayload) {
  const supabase = getServerClient();
  const payload = {
    action,
    entity,
    entity_id: entityId ?? null,
    organization_id: organizationId ?? null,
    changes: changes ?? null,
    user_email: userEmail,
  };

  await supabase.from('audit_logs').insert(payload);
}
