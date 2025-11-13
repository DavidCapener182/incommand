import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/middleware/auth'
import { searchKnowledge } from '@/lib/knowledge/search'

/**
 * POST /api/knowledge/search
 * Search knowledge base documents using semantic search
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, 'content_editor', async (context) => {
    try {
      const body = await request.json()
      const { query, topK, organizationId, eventId, useHybrid } = body
      
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return NextResponse.json(
          { error: 'Query is required' },
          { status: 400 }
        )
      }
      
      // Determine organization context
      // Super admins can search without organizationId to find documents available to all companies
      let resolvedOrgId: string | undefined
      if (organizationId) {
        // Verify user has access to this organization
        if (context.highestRole !== 'super_admin' && 
            !context.organizationMemberships.includes(organizationId)) {
          return NextResponse.json(
            { error: 'Access denied to specified organization' },
            { status: 403 }
          )
        }
        resolvedOrgId = organizationId
      } else if (context.highestRole !== 'super_admin') {
        // Non-super-admins can only search their own organizations
        resolvedOrgId = context.defaultOrganizationId || context.organizationMemberships[0]
      }
      // For super admins with no organizationId specified, resolvedOrgId remains undefined
      // This allows searching across all organizations including documents with null organization_id
      
      // Perform search
      const results = await searchKnowledge({
        query: query.trim(),
        topK: Math.min(topK || 5, 20),
        organizationId: resolvedOrgId,
        eventId: eventId || undefined,
        useHybrid: useHybrid !== false, // Default to true
        includeSources: true
      })
      
      return NextResponse.json({
        results: results.map(r => ({
          knowledgeId: r.knowledgeId,
          title: r.title,
          content: r.content,
          score: r.score,
          metadata: r.metadata,
          source: r.source
        })),
        count: results.length
      })
      
    } catch (error: any) {
      console.error('Knowledge search error:', error)
      return NextResponse.json(
        { error: error.message || 'Search failed' },
        { status: 500 }
      )
    }
  })
}

