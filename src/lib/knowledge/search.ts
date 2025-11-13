/**
 * Knowledge Base Search Module
 * 
 * Provides semantic search capabilities for knowledge base documents
 * Supports hybrid search (semantic + keyword) with reranking
 * 
 * SERVER-ONLY: This module uses server-side environment variables and should not be imported in client components
 */

import { getServiceSupabaseClient } from '@/lib/supabaseServer'

export interface SearchOptions {
  query: string
  topK?: number
  organizationId?: string
  eventId?: string
  includeSources?: boolean
  useHybrid?: boolean
}

export interface SearchHit {
  knowledgeId: string
  title: string
  content: string
  score: number
  metadata: {
    chunkIndex: number
    documentTitle: string
    organizationId?: string
    eventId?: string
    [key: string]: any
  }
  source?: 'knowledge-base' | 'green-guide'
}

// Domain-specific synonyms for query expansion
const DOMAIN_SYNONYMS: Record<string, string[]> = {
  ingress: ['entry', 'gate entry', 'queuing', 'arrival', 'gates', 'queue management', 'access', 'entrance'],
  egress: ['exit', 'dispersal', 'egress routes', 'crowd exit', 'departure', 'evacuation route'],
  crowd: ['crowd management', 'density', 'flow', 'audience', 'patrons', 'attendees', 'capacity'],
  queue: ['queuing', 'queues', 'waiting', 'line', 'queue management'],
  surge: ['crowd surge', 'crush', 'pressure', 'crowd movement', 'pushing'],
  breach: ['entry breach', 'gate breach', 'unauthorized entry', 'security breach'],
  threat: ['hostile act', 'aggression', 'attack', 'danger', 'risk'],
  medical: ['first aid', 'injury', 'casualty', 'medic', 'ambulance', 'emergency medical'],
  collapse: ['fallen', 'unconscious', 'down', 'medical emergency'],
  fire: ['flames', 'smoke', 'burning', 'fire alarm', 'suspected fire'],
  evacuation: ['evacuate', 'clear', 'emergency exit', 'leave venue'],
  weather: ['rain', 'wind', 'storm', 'lightning', 'conditions'],
  accessibility: ['disabled', 'wheelchair', 'accessible', 'mobility', 'assistance'],
  intoxicated: ['drunk', 'alcohol', 'drugs', 'substance'],
  lost: ['missing', 'cannot find', 'misplaced', 'separated'],
  delay: ['postpone', 'hold', 'wait', 'pause'],
  cancel: ['cancelled', 'stopped', 'terminated', 'abandoned'],
}

const STOPWORDS = new Set([
  'the', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'with', 'at', 'by',
  'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'as', 'from'
])

/**
 * Expand query with domain-specific synonyms
 */
function expandQuery(query: string): string {
  const lower = query.toLowerCase()
  const expansions: string[] = []
  
  for (const [term, synonyms] of Object.entries(DOMAIN_SYNONYMS)) {
    if (lower.includes(term)) {
      expansions.push(...synonyms.slice(0, 3))
    }
  }
  
  return expansions.length > 0 ? `${query} ${expansions.join(' ')}` : query
}

/**
 * Extract key terms from query for keyword matching
 */
export function extractKeyTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w))
    .slice(0, 10)
}

/**
 * Score a passage based on keyword matches
 */
export function scoreKeywordMatch(content: string, keyTerms: string[]): number {
  const lower = content.toLowerCase()
  let score = 0
  
  for (const term of keyTerms) {
    const occurrences = (lower.match(new RegExp(term, 'g')) || []).length
    score += occurrences * 0.1
  }
  
  return Math.min(score, 1.0)
}

/**
 * Extract relevant snippet from content
 */
export function extractSnippet(content: string, keyTerms: string[]): string {
  const text = (content || '').replace(/\s+/g, ' ').trim()
  if (!text) return text
  
  const sentences = text.split(/(?<=[.!?])\s+/)
  
  // Score each sentence by keyword relevance
  const scoredSentences = sentences.map((s, idx) => {
    const lower = s.toLowerCase()
    const score = keyTerms.reduce((acc, term) => 
      acc + (lower.includes(term) ? 1 : 0), 0
    )
    return { sentence: s, score, index: idx }
  })
  
  // Sort by score and take best match
  scoredSentences.sort((a, b) => b.score - a.score)
  
  const bestSentence = scoredSentences[0]
  if (bestSentence.score > 0) {
    // Include context (sentence before and after if available)
    const start = Math.max(0, bestSentence.index - 1)
    const end = Math.min(sentences.length, bestSentence.index + 2)
    const snippet = sentences.slice(start, end).join(' ')
    
    const startsClean = /^[A-Z0-9]/.test(snippet)
    const endsClean = /[.!?]$/.test(snippet)
    return `${startsClean ? '' : '… '}${snippet}${endsClean ? '' : ' …'}`
  }
  
  // Fallback to first 2 sentences
  const fallback = sentences.slice(0, 2).join(' ')
  const startsClean = /^[A-Z0-9]/.test(fallback)
  const endsClean = /[.!?]$/.test(fallback)
  return `${startsClean ? '' : '… '}${fallback}${endsClean ? '' : ' …'}`
}

/**
 * Generate embedding for query text
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }
  
  const expandedQuery = expandQuery(query)
  
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-large',
      input: expandedQuery
    })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Embedding failed: ${response.status} - ${errorText}`)
  }
  
  const json = await response.json()
  const embedding = json.data?.[0]?.embedding
  
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('Invalid embedding response')
  }
  
  if (embedding.length !== 1536) {
    throw new Error(`Invalid embedding dimension: ${embedding.length}, expected 1536`)
  }
  
  return embedding
}

/**
 * Perform semantic search using pgvector
 */
async function semanticSearch(
  queryEmbedding: number[],
  options: SearchOptions
  ): Promise<SearchHit[]> {
    const supabase = getServiceSupabaseClient()
    const topK = Math.min(options.topK || 5, 20)
    
    try {
      // Try RPC function first (faster)
      // Note: When organizationId is undefined, we want to search ALL documents (for super admins)
      // The RPC function with null filter only returns documents with null org_id, so we skip RPC in that case
      // and use the fallback in-memory search which handles undefined correctly
      if (options.organizationId !== undefined) {
        const { data: rpcResults, error: rpcError } = await (supabase as any).rpc(
          'match_knowledge_embeddings',
          {
            query_embedding: queryEmbedding,
            match_count: options.useHybrid ? topK * 2 : topK,
            organization_filter: options.organizationId || null, // null = documents available to all companies
            event_filter: options.eventId || null,
          }
        )
        
        if (!rpcError && rpcResults && rpcResults.length > 0) {
          // Fetch knowledge_base metadata for results
          const knowledgeIds = Array.from(
            new Set(rpcResults.map((r: any) => String(r.knowledge_id)))
          ) as string[]
          const { data: kbEntries } = await supabase
            .from('knowledge_base')
            .select('id, title, organization_id, event_id')
            .in('id', knowledgeIds)
          
          const kbMap = new Map((kbEntries || []).map(kb => [kb.id, kb]))
          
          return rpcResults.map((r: any) => ({
            knowledgeId: r.knowledge_id,
            title: kbMap.get(r.knowledge_id)?.title || 'Unknown',
            content: r.content,
            score: r.similarity || 0,
            metadata: {
              chunkIndex: r.chunk_index,
              documentTitle: kbMap.get(r.knowledge_id)?.title || 'Unknown',
              organizationId: kbMap.get(r.knowledge_id)?.organization_id,
              eventId: kbMap.get(r.knowledge_id)?.event_id,
              ...(r.metadata || {}),
            },
            source: 'knowledge-base' as const,
          }))
        }
    }
  } catch (error) {
    console.warn('RPC search failed, falling back to in-memory ranking:', error)
  }
  
  // Fallback: fetch embeddings and rank in-memory
  let query = supabase
    .from('knowledge_embeddings')
    .select('id, knowledge_id, chunk_index, content, embedding, metadata')
    .limit(2000)
  
  const { data: embeddings, error } = await query
  
  if (error) {
    throw new Error(`Failed to fetch embeddings: ${error.message}`)
  }
  
  if (!embeddings || embeddings.length === 0) {
    return []
  }
  
  // Filter by organization/event if specified
  const knowledgeIds = [...new Set(embeddings.map(e => e.knowledge_id))]
  const { data: kbEntries } = await supabase
    .from('knowledge_base')
    .select('id, title, organization_id, event_id, status')
    .in('id', knowledgeIds)
    .in('status', ['ingested', 'published'])
  
  const kbMap = new Map((kbEntries || []).map(kb => [kb.id, kb]))
  
  // Filter embeddings by organization/event
  const filteredEmbeddings = embeddings.filter(e => {
    const kb = kbMap.get(e.knowledge_id)
    if (!kb) return false
    // If organizationId is specified, only include matching documents
    // If organizationId is undefined, include all documents (including null org_id for all-company access)
    if (options.organizationId !== undefined && kb.organization_id !== options.organizationId) return false
    if (options.eventId && kb.event_id !== options.eventId) return false
    return true
  })
  
  // Calculate cosine similarity
  const norm = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
  const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * (b[i] || 0), 0)
  const embNorm = norm(queryEmbedding)
  
  const scored = filteredEmbeddings
    .filter((e: any) => Array.isArray(e.embedding) && e.embedding.length === 1536)
    .map((e: any) => {
      const similarity = dot(queryEmbedding, e.embedding) / (embNorm * norm(e.embedding))
      const kb = kbMap.get(e.knowledge_id)
      return {
        knowledgeId: e.knowledge_id,
        title: kb?.title || 'Unknown',
        content: e.content,
        score: similarity,
        metadata: {
          chunkIndex: e.chunk_index,
          documentTitle: kb?.title || 'Unknown',
          organizationId: kb?.organization_id,
          eventId: kb?.event_id,
          ...(e.metadata || {})
        },
        source: 'knowledge-base' as const
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, options.useHybrid ? topK * 2 : topK)
  
  return scored
}

/**
 * Perform keyword search as fallback
 */
async function keywordSearch(options: SearchOptions): Promise<SearchHit[]> {
  const supabase = getServiceSupabaseClient()
  const topK = Math.min(options.topK || 5, 20)
  const keyTerms = extractKeyTerms(options.query)
  
  if (keyTerms.length === 0) {
    return []
  }
  
  let query = supabase
    .from('knowledge_embeddings')
    .select('id, knowledge_id, chunk_index, content, metadata')
    .limit(500)
  
  // Build ILIKE query for first 3 terms
  for (const term of keyTerms.slice(0, 3)) {
    query = query.ilike('content', `%${term}%`)
  }
  
  const { data: results, error } = await query
  
  if (error) {
    throw new Error(`Keyword search failed: ${error.message}`)
  }
  
  if (!results || results.length === 0) {
    return []
  }
  
  // Fetch knowledge_base metadata
  const knowledgeIds = [...new Set(results.map(r => r.knowledge_id))]
  const { data: kbEntries } = await supabase
    .from('knowledge_base')
    .select('id, title, organization_id, event_id, status')
    .in('id', knowledgeIds)
    .in('status', ['ingested', 'published'])
  
  const kbMap = new Map((kbEntries || []).map(kb => [kb.id, kb]))
  
  // Filter and score results
  const scored = results
    .map((r: any) => {
      const kb = kbMap.get(r.knowledge_id)
      if (!kb) return null
      // If organizationId is specified, only include matching documents
      // If organizationId is undefined, include all documents (including null org_id)
        if (options.organizationId !== undefined && kb.organization_id !== options.organizationId) return null
        if (options.eventId && kb.event_id !== options.eventId) return null
        
        const keywordScore = scoreKeywordMatch(r.content, keyTerms)
        
        return {
          knowledgeId: r.knowledge_id,
          title: kb.title,
          content: extractSnippet(r.content, keyTerms),
          score: keywordScore,
          metadata: {
            chunkIndex: r.chunk_index,
            documentTitle: kb.title,
            organizationId: kb.organization_id,
            eventId: kb.event_id,
            ...(r.metadata || {}),
          },
          source: 'knowledge-base' as const,
        } as SearchHit
    })
    .filter((r): r is SearchHit => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
  
  return scored
}

/**
 * Rerank results using hybrid scoring
 */
function rerankResults(
  results: SearchHit[],
  keyTerms: string[],
  useHybrid: boolean
): SearchHit[] {
  if (!useHybrid) return results
  
  return results
    .map(hit => {
      const keywordScore = scoreKeywordMatch(hit.content, keyTerms)
      const semanticScore = hit.score
      
      // Combined relevance score: 60% semantic, 30% keyword, 10% bonus for title matches
      const titleBonus = keyTerms.some(term => 
        hit.title.toLowerCase().includes(term)
      ) ? 0.1 : 0
      
      const relevanceScore = (semanticScore * 0.6) + (keywordScore * 0.3) + titleBonus
      
      return {
        ...hit,
        score: relevanceScore
      }
    })
    .sort((a, b) => b.score - a.score)
}

/**
 * Search knowledge base documents
 */
export async function searchKnowledge(options: SearchOptions): Promise<SearchHit[]> {
  const topK = Math.min(options.topK || 5, 20)
  const keyTerms = extractKeyTerms(options.query)
  
  try {
    // Try semantic search first
    const queryEmbedding = await generateQueryEmbedding(options.query)
    const semanticResults = await semanticSearch(queryEmbedding, options)
    
    if (semanticResults.length > 0) {
      // Rerank if hybrid mode
      const reranked = options.useHybrid !== false
        ? rerankResults(semanticResults, keyTerms, true)
        : semanticResults
      
      // Extract snippets for final results
      return reranked
        .slice(0, topK)
        .map(hit => ({
          ...hit,
          content: extractSnippet(hit.content, keyTerms)
        }))
    }
  } catch (error) {
    console.warn('Semantic search failed, falling back to keyword search:', error)
  }
  
  // Fallback to keyword search
  const keywordResults = await keywordSearch(options)
  return keywordResults.slice(0, topK)
}

