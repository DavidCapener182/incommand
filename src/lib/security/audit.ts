import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { logger } from '../logger'
import { sanitizeForLogging } from '../apiSecurity'

export type TypedSupabaseClient = SupabaseClient<Database>

interface AdminAuditLogOptions {
  adminId: string
  tableName: string
  recordId: string
  actionType: string
  changes?: Record<string, unknown> | null
  client?: TypedSupabaseClient
}

interface AdminActionLogOptions {
  adminId: string
  actionType: string
  status?: 'pending' | 'completed' | 'failed'
  details?: Record<string, unknown> | null
  client?: TypedSupabaseClient
}

async function withClient<T>(
  provided: TypedSupabaseClient | undefined,
  fallbackFactory: () => TypedSupabaseClient,
  executor: (client: TypedSupabaseClient) => Promise<T>
): Promise<T> {
  try {
    const client = provided ?? fallbackFactory()
    return await executor(client)
  } catch (error) {
    logger.error('Admin audit helper error', error)
    throw error
  }
}

export async function logAdminAuditEntry({
  adminId,
  tableName,
  recordId,
  actionType,
  changes = null,
  client,
}: AdminAuditLogOptions): Promise<void> {
  await withClient(client, () => {
    throw new Error('Supabase client is required for audit logging')
  }, async supabase => {
    const payload = {
      admin_id: adminId,
      table_name: tableName,
      record_id: recordId,
      action_type: actionType,
      changes: changes ? sanitizeForLogging(changes) : null,
    }

    const { error } = await supabase.from('admin_audit_log').insert([payload])

    if (error) {
      logger.error('Failed to write admin audit log', { error, payload })
    }
  })
}

export async function logAdminAction({
  adminId,
  actionType,
  status = 'completed',
  details = null,
  client,
}: AdminActionLogOptions): Promise<void> {
  await withClient(client, () => {
    throw new Error('Supabase client is required for admin action logging')
  }, async supabase => {
    const payload = {
      admin_id: adminId,
      action_type: actionType,
      status,
      details: details ? sanitizeForLogging(details) : null,
    }

    const { error } = await supabase.from('admin_actions').insert([payload])

    if (error) {
      logger.error('Failed to record admin action', { error, payload })
    }
  })
}
