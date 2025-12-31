import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  return withAdminAuth(request, 'content_editor', async (context) => {
    try {
      const body = await request.json().catch(() => ({}))
      const { knowledgeId } = body as { knowledgeId?: string }

      if (!knowledgeId) {
        return NextResponse.json({ error: 'knowledgeId is required' }, { status: 400 })
      }

      const { data: knowledge, error } = await context.serviceClient
        .from('knowledge_base')
        .select('*')
        .eq('id', knowledgeId)
        .single()

      if (error || !knowledge) {
        return NextResponse.json({ error: 'Knowledge document not found' }, { status: 404 })
      }

      const knowledgeData = knowledge as any;

      if (knowledgeData.organization_id && context.highestRole !== 'super_admin') {
        if (!context.organizationMemberships.includes(knowledgeData.organization_id)) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      }

      if (knowledgeData.status !== 'ingesting') {
        return NextResponse.json({ error: 'Document is not currently ingesting' }, { status: 400 })
      }

      const { error: updateError } = await (context.serviceClient as any)
        .from('knowledge_base')
        .update({
          status: 'failed',
          error: 'Ingestion cancelled by user',
          updated_at: new Date().toISOString()
        })
        .eq('id', knowledgeId)

      if (updateError) {
        console.error('Failed to cancel ingestion:', updateError)
        return NextResponse.json({ error: 'Failed to cancel ingestion' }, { status: 500 })
      }

        await recordAdminAudit(context.serviceClient, {
          organizationId: knowledgeData.organization_id ?? context.defaultOrganizationId ?? '00000000-0000-0000-0000-000000000000',
        actorId: context.user.id,
        action: 'cancel_ingest_knowledge',
        resourceType: 'knowledge_base',
        resourceId: knowledgeId,
        changes: {
          title: knowledgeData.title,
          previousStatus: knowledgeData.status,
          newStatus: 'failed'
        }
      })

      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('Cancel ingestion error:', error)
      return NextResponse.json({ error: error.message || 'Failed to cancel ingestion' }, { status: 500 })
    }
  })
}


