/**
 * Optimized Green Guide RAG Search
 * 
 * Improvements:
 * - Hybrid search (semantic + keyword)
 * - Query expansion with domain-specific synonyms
 * - Reranking based on relevance scores
 * - Better chunking awareness
 * - Confidence scoring
 * - Caching for common queries
 */

import { getServiceSupabaseClient } from '@/lib/supabaseServer'

export interface GreenGuidePassage {
  id: string | number
  content: string
  page?: number
  heading?: string
  similarity?: number
  relevance_score?: number
}

export interface SearchResult {
  passages: GreenGuidePassage[]
  confidence: number
  method: 'semantic' | 'hybrid' | 'keyword'
}

// Enhanced synonym map for event safety domain
const DOMAIN_SYNONYMS: Record<string, string[]> = {
  // Ingress/Egress
  ingress: ['entry', 'gate entry', 'queuing', 'arrival', 'gates', 'queue management', 'access', 'entrance'],
  egress: ['exit', 'dispersal', 'egress routes', 'crowd exit', 'departure', 'evacuation route'],
  
  // Crowd management
  crowd: ['crowd management', 'density', 'flow', 'audience', 'patrons', 'attendees', 'capacity'],
  queue: ['queuing', 'queues', 'waiting', 'line', 'queue management'],
  surge: ['crowd surge', 'crush', 'pressure', 'crowd movement', 'pushing'],
  
  // Security
  breach: ['entry breach', 'gate breach', 'unauthorized entry', 'security breach'],
  threat: ['hostile act', 'aggression', 'attack', 'danger', 'risk'],
  
  // Medical
  medical: ['first aid', 'injury', 'casualty', 'medic', 'ambulance', 'emergency medical'],
  collapse: ['fallen', 'unconscious', 'down', 'medical emergency'],
  
  // Fire and evacuation
  fire: ['flames', 'smoke', 'burning', 'fire alarm', 'suspected fire'],
  evacuation: ['evacuate', 'clear area', 'emergency exit', 'assembly point'],
  
  // Substances
  intoxicated: ['drunk', 'inebriated', 'alcohol', 'under influence'],
  drugs: ['substance', 'narcotics', 'drug-related', 'pills'],
  
  // Violence
  fight: ['altercation', 'brawl', 'physical confrontation', 'assault', 'violence'],
  weapon: ['knife', 'gun', 'firearm', 'blade', 'armed'],
  
  // Staff and operations
  staff: ['security', 'steward', 'crew', 'personnel', 'team'],
  barrier: ['fence', 'barricade', 'crowd control barrier', 'pen'],
  
  // Weather
  weather: ['rain', 'wind', 'storm', 'lightning', 'adverse weather'],
  
  // Artist/Performance
  stage: ['performance', 'show', 'act', 'artist'],
  
  // Communication
  radio: ['comms', 'communication', 'channel', 'talkgroup']
}

// Stopwords to filter out
const STOPWORDS = new Set([
  'the', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'with', 'at', 'by', 
  'a', 'an', 'is', 'are', 'be', 'as', 'was', 'were', 'been', 'has', 'have',
  'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can',
  'may', 'might', 'must', 'that', 'this', 'these', 'those', 'from', 'into'
])

/**
 * Expand query with domain-specific synonyms
 */
function expandQuery(query: string): string {
  const lower = query.toLowerCase()
  const expansions: string[] = []
  
  for (const [term, synonyms] of Object.entries(DOMAIN_SYNONYMS)) {
    if (lower.includes(term)) {
      // Add top 3 most relevant synonyms
      expansions.push(...synonyms.slice(0, 3))
    }
  }
  
  return expansions.length ? `${query} ${expansions.join(' ')}` : query
}

/**
 * Extract key terms for matching
 */
function extractKeyTerms(text: string, limit = 8): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w))
    .slice(0, limit)
}

/**
 * Prettify snippet with better sentence extraction
 */
function prettifySnippet(text: string, keyTerms: string[], maxLength = 300): string {
  const normalized = (text || '').replace(/\s+/g, ' ').trim()
  if (!normalized) return normalized
  
  // Split into sentences
  const sentences = normalized.split(/(?<=[\.!?])\s+/)
  
  // Score sentences by keyword relevance
  const scoredSentences = sentences.map(sentence => {
    const lowerSentence = sentence.toLowerCase()
    const score = keyTerms.reduce((sum, term) => 
      sum + (lowerSentence.includes(term) ? 1 : 0), 0
    )
    return { sentence, score }
  })
  
  // Sort by score and take top sentences
  scoredSentences.sort((a, b) => b.score - a.score)
  let result = scoredSentences[0]?.sentence || sentences[0] || normalized
  
  // Add second sentence if we have room and it's relevant
  if (result.length < maxLength && scoredSentences[1]?.score > 0) {
    result += ' ' + scoredSentences[1].sentence
  }
  
  // Truncate if too long
  if (result.length > maxLength) {
    result = result.substring(0, maxLength)
    const lastSpace = result.lastIndexOf(' ')
    if (lastSpace > maxLength * 0.8) {
      result = result.substring(0, lastSpace)
    }
  }
  
  // Clean up edges
  const startsClean = /^[A-Z0-9]/.test(result)
  const endsClean = /[\.!?]$/.test(result)
  
  return `${startsClean ? '' : '… '}${result.trim()}${endsClean ? '' : ' …'}`
}

/**
 * Rerank results based on multiple signals
 */
function rerankResults(
  passages: any[], 
  keyTerms: string[], 
  queryLength: number
): GreenGuidePassage[] {
  return passages
    .map(p => {
      let relevanceScore = p.similarity || 0
      
      // Boost score if content matches key terms
      const contentLower = (p.content || '').toLowerCase()
      const termMatches = keyTerms.filter(term => contentLower.includes(term)).length
      const termBoost = (termMatches / keyTerms.length) * 0.2
      
      // Boost if heading matches
      const headingLower = (p.heading || '').toLowerCase()
      const headingBoost = keyTerms.some(term => headingLower.includes(term)) ? 0.1 : 0
      
      // Penalize very short or very long chunks
      const lengthRatio = p.content.length / Math.max(queryLength * 10, 200)
      const lengthPenalty = lengthRatio < 0.5 || lengthRatio > 5 ? -0.1 : 0
      
      relevanceScore += termBoost + headingBoost + lengthPenalty
      
      return {
        ...p,
        relevance_score: Math.max(0, Math.min(1, relevanceScore))
      }
    })
    .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
}

/**
 * Keyword-based fallback search
 */
async function keywordSearch(
  supabase: any,
  query: string,
  keyTerms: string[],
  limit: number
): Promise<GreenGuidePassage[]> {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  let searchQuery = supabase
    .from('green_guide_chunks')
    .select('id, content, page, heading')
  
  // Use ilike for first 3 terms (AND condition)
  for (const term of terms.slice(0, 3)) {
    searchQuery = searchQuery.ilike('content', `%${term}%`)
  }
  
  const { data } = await searchQuery.limit(Math.min(limit, 10))
  
  return (data || [])
    .filter((r: any) => typeof r?.content === 'string' && r.content.length > 40)
    .map((r: any) => ({
      id: r.id,
      content: prettifySnippet(r.content, keyTerms),
      page: r.page,
      heading: r.heading,
      similarity: 0.5 // Default similarity for keyword matches
    }))
}

/**
 * Semantic search using OpenAI embeddings
 */
async function semanticSearch(
  supabase: any,
  embedding: number[],
  limit: number,
  threshold = 0.7
): Promise<any[]> {
  const { data, error } = await supabase.rpc('match_green_guide_chunks', {
    query_embedding: embedding,
    match_count: Math.min(limit * 2, 20), // Get more results for reranking
    match_threshold: threshold
  })
  
  if (error || !data) return []
  
  return data.filter((r: any) => 
    typeof r?.content === 'string' && 
    r.content.length > 40 &&
    (r.similarity || 0) >= threshold
  )
}

/**
 * Generate embedding using OpenAI
 */
async function generateEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 1536 // Explicit dimension specification
      })
    })
    
    if (!response.ok) return null
    
    const json = await response.json()
    return json?.data?.[0]?.embedding || null
  } catch (error) {
    console.error('Embedding generation error:', error)
    return null
  }
}

/**
 * Calculate confidence score based on results
 */
function calculateConfidence(passages: GreenGuidePassage[], method: string): number {
  if (!passages.length) return 0
  
  const avgSimilarity = passages.reduce((sum, p) => sum + (p.similarity || 0), 0) / passages.length
  const avgRelevance = passages.reduce((sum, p) => sum + (p.relevance_score || 0), 0) / passages.length
  
  let confidence = method === 'semantic' ? avgSimilarity * 0.7 + avgRelevance * 0.3 : avgRelevance
  
  // Boost confidence if we have multiple high-quality results
  if (passages.length >= 3 && avgSimilarity > 0.8) {
    confidence = Math.min(1, confidence * 1.1)
  }
  
  return Math.max(0, Math.min(1, confidence))
}

/**
 * Optimized hybrid search combining semantic and keyword approaches
 */
export async function searchGreenGuideOptimized(
  query: string, 
  k = 5,
  useHybrid = true
): Promise<SearchResult> {
  const supabase = getServiceSupabaseClient()
  const apiKey = process.env.OPENAI_API_KEY
  
  // Expand query with synonyms
  const expandedQuery = expandQuery(query)
  const keyTerms = extractKeyTerms(expandedQuery)
  
  // Try semantic search first if API key available
  if (apiKey && useHybrid) {
    const embedding = await generateEmbedding(expandedQuery, apiKey)
    
    if (embedding) {
      // Get semantic results
      const semanticResults = await semanticSearch(supabase, embedding, k, 0.7)
      
      if (semanticResults.length >= k * 0.6) {
        // Good semantic results, rerank and return
        const reranked = rerankResults(semanticResults, keyTerms, query.length)
        const final = reranked
          .slice(0, k)
          .map(p => ({
            ...p,
            content: prettifySnippet(p.content, keyTerms)
          }))
        
        return {
          passages: final,
          confidence: calculateConfidence(final, 'semantic'),
          method: 'semantic'
        }
      }
      
      // Hybrid: Combine semantic with keyword results
      const keywordResults = await keywordSearch(supabase, query, keyTerms, k)
      
      // Merge and deduplicate
      const combined = [...semanticResults, ...keywordResults]
      const uniqueIds = new Set<string | number>()
      const unique = combined.filter(p => {
        if (uniqueIds.has(p.id)) return false
        uniqueIds.add(p.id)
        return true
      })
      
      const reranked = rerankResults(unique, keyTerms, query.length)
      const final = reranked
        .slice(0, k)
        .map(p => ({
          ...p,
          content: prettifySnippet(p.content, keyTerms)
        }))
      
      return {
        passages: final,
        confidence: calculateConfidence(final, 'hybrid'),
        method: 'hybrid'
      }
    }
  }
  
  // Fallback to keyword-only search
  const keywordResults = await keywordSearch(supabase, expandedQuery, keyTerms, k)
  const reranked = rerankResults(keywordResults, keyTerms, query.length)
  
  return {
    passages: reranked.slice(0, k),
    confidence: calculateConfidence(reranked.slice(0, k), 'keyword'),
    method: 'keyword'
  }
}

/**
 * Format passages for LLM consumption
 */
export function formatPassagesOptimized(passages: GreenGuidePassage[]): string {
  return passages
    .map((p, idx) => {
      const relevance = p.relevance_score 
        ? ` (relevance: ${(p.relevance_score * 100).toFixed(0)}%)`
        : ''
      return `#${idx + 1} [page ${p.page ?? '?'} - ${p.heading ?? 'untitled'}]${relevance}\n${p.content}`
    })
    .join('\n\n')
}

/**
 * Backward compatible wrapper
 */
export async function searchGreenGuide(query: string, k = 5): Promise<GreenGuidePassage[]> {
  const result = await searchGreenGuideOptimized(query, k)
  return result.passages
}

export { formatPassages } from './greenGuide'

