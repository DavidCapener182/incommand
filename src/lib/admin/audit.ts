import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { logger } from '@/lib/logger'

interface AdminAuditLogParams {
  organizationId: string
  actorId: string
  action: string
  resourceType: string
  resourceId?: string | null
  changes?: Record<string, unknown> | null
}

export async function recordAdminAudit(
  client: SupabaseClient<Database>,
  params: AdminAuditLogParams
) {
  const payload = {
    organization_id: params.organizationId,
    user_id: params.actorId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId ?? null,
    changes: params.changes ?? null,
  }

  const { error: auditError } = await client.from('audit_log' as any).insert(payload)
  if (auditError) {
    logger.error('Failed to record audit log entry', auditError, payload)
  }

  const { error: adminAuditError } = await client.from('admin_audit_log' as any).insert({
    action_type: params.action,
    admin_id: params.actorId,
    record_id: params.resourceId ?? '',
    table_name: params.resourceType,
    changes: params.changes ?? null,
  })

  if (adminAuditError) {
    logger.error('Failed to record admin audit entry', adminAuditError, payload)
  }
}
