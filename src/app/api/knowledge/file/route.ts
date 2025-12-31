import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/middleware/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STORAGE_BUCKET = 'knowledge-uploads'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, 'content_editor', async (context) => {
    const url = new URL(request.url)
    const knowledgeId = url.searchParams.get('id')

    if (!knowledgeId) {
      return NextResponse.json({ error: 'Missing knowledge id' }, { status: 400 })
    }

    const { data: knowledge, error } = await context.serviceClient
      .from('knowledge_base')
      .select('id, organization_id, storage_path, original_filename')
      .eq('id', knowledgeId)
      .single()

    if (error || !knowledge) {
      return NextResponse.json({ error: 'Knowledge document not found' }, { status: 404 })
    }

    const knowledgeData = knowledge as any;

    if (!knowledgeData.storage_path) {
      return NextResponse.json({ error: 'No stored file for this document' }, { status: 400 })
    }

    if (knowledgeData.organization_id && context.highestRole !== 'super_admin') {
      if (!context.organizationMemberships.includes(knowledgeData.organization_id)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const { data: signedUrlData, error: signedUrlError } = await context.serviceClient.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(knowledgeData.storage_path, 60)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Failed to generate signed URL:', signedUrlError)
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 })
    }

    return NextResponse.json({
      url: signedUrlData.signedUrl,
      filename: knowledgeData.original_filename ?? 'document'
    })
  })
}


