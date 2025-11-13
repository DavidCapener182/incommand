/**
 * Unified Context Retrieval for AI
 * 
 * Combines search results from both Green Guide and Knowledge Base
 * for use in AI chat, insights, and decision support
 * 
 * SERVER-ONLY: This module uses server-side modules and should only be imported in API routes
 */

import { searchKnowledge, SearchHit } from '@/lib/knowledge/search'
import { searchGreenGuide, GreenGuidePassage } from '@/lib/rag/greenGuide'

export interface RetrievedContext {
  content: string
  source: 'green-guide' | 'knowledge-base'
  metadata: {
    title?: string
    page?: number
    heading?: string
    knowledgeId?: string
    chunkIndex?: number
    score?: number
    [key: string]: any
  }
}

export interface RetrieveContextOptions {
  organizationId?: string
  eventId?: string
  topK?: number
  useHybrid?: boolean
}

/**
 * Retrieve context from both Green Guide and Knowledge Base
 * Returns unified results sorted by relevance
 */
export async function retrieveContext(
  query: string,
  options: RetrieveContextOptions = {}
): Promise<RetrievedContext[]> {
  const topK = options.topK || 5
  const useHybrid = options.useHybrid !== false

  try {
    // Search both sources in parallel
    const [kbResults, ggResults] = await Promise.all([
      searchKnowledge({
        query,
        topK,
        organizationId: options.organizationId,
        eventId: options.eventId,
        useHybrid
      }).catch(error => {
        console.warn('Knowledge base search failed:', error)
        return []
      }),
      searchGreenGuide(query, topK).catch(error => {
        console.warn('Green Guide search failed:', error)
        return []
      })
    ])

    // Convert Green Guide results to unified format
    const ggContext: RetrievedContext[] = ggResults.map((passage: GreenGuidePassage) => ({
      content: passage.content,
      source: 'green-guide' as const,
      metadata: {
        page: passage.page,
        heading: passage.heading,
        similarity: passage.similarity,
        relevance_score: passage.relevance_score
      }
    }))

    // Convert Knowledge Base results to unified format
    const kbContext: RetrievedContext[] = kbResults.map((hit: SearchHit) => ({
      content: hit.content,
      source: 'knowledge-base' as const,
      metadata: {
        title: hit.title,
        knowledgeId: hit.knowledgeId,
        chunkIndex: hit.metadata.chunkIndex,
        score: hit.score,
        organizationId: hit.metadata.organizationId,
        eventId: hit.metadata.eventId,
        ...hit.metadata
      }
    }))

    // Combine and sort by relevance score
    const combined = [...ggContext, ...kbContext]
      .sort((a, b) => {
        const scoreA = a.metadata.relevance_score || a.metadata.similarity || a.metadata.score || 0
        const scoreB = b.metadata.relevance_score || b.metadata.similarity || b.metadata.score || 0
        return scoreB - scoreA
      })
      .slice(0, topK * 2) // Return top 2x for filtering

    return combined
  } catch (error) {
    console.error('Context retrieval failed:', error)
    return []
  }
}

/**
 * Format retrieved context for LLM prompt injection
 */
export function formatContextForPrompt(contexts: RetrievedContext[]): string {
  if (contexts.length === 0) {
    return ''
  }

  const sections: string[] = []

  const ggContexts = contexts.filter(c => c.source === 'green-guide')
  if (ggContexts.length > 0) {
    sections.push('Green Guide Context:')
    ggContexts.forEach((ctx, idx) => {
      const page = ctx.metadata.page ? `p.${ctx.metadata.page}` : ''
      const heading = ctx.metadata.heading ? ` - ${ctx.metadata.heading}` : ''
      sections.push(`(${idx + 1}) ${page}${heading}: ${ctx.content}`)
    })
  }

  const kbContexts = contexts.filter(c => c.source === 'knowledge-base')
  if (kbContexts.length > 0) {
    sections.push('\nUploaded Knowledge Base Context:')
    kbContexts.forEach((ctx, idx) => {
      const title = ctx.metadata.title || 'Unknown Document'
      sections.push(`(${idx + 1}) [${title}]: ${ctx.content}`)
    })
  }

  return sections.join('\n')
}

/**
 * Check if query likely needs knowledge base context
 */
export function needsKnowledgeContext(query: string): boolean {
  const lower = query.toLowerCase()
  
  // Keywords that suggest knowledge base lookup
  const knowledgeKeywords = [
    'capacity', 'briefing', 'document', 'manual', 'procedure', 'policy',
    'guideline', 'specification', 'requirement', 'standard', 'protocol',
    'what is', 'how many', 'how much', 'what are', 'tell me about',
    'explain', 'describe', 'information about'
  ]
  
  return knowledgeKeywords.some(keyword => lower.includes(keyword))
}

/**
 * Check if query likely needs Green Guide context
 */
export function needsGreenGuideContext(query: string): boolean {
  const lower = query.toLowerCase()
  
  const greenGuideKeywords = [
    'best practice', 'procedure', 'how should', 'what should we do',
    'safety', 'green guide', 'barrier', 'crowd', 'ingress', 'egress',
    'evacuation', 'emergency', 'crowd management', 'security protocol'
  ]
  
  return greenGuideKeywords.some(keyword => lower.includes(keyword))
}

