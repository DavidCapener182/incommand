/**
 * Semantic Search Engine
 * AI-powered natural language incident search
 */

export interface SearchResult {
  incident: any
  score: number
  highlights: string[]
  relevanceReason: string
}

export interface SearchOptions {
  query: string
  filters?: {
    eventId?: string
    incidentType?: string
    priority?: string
    dateRange?: { start: Date; end: Date }
    status?: 'open' | 'closed'
  }
  limit?: number
  threshold?: number // Minimum similarity score (0-1)
}

export class SemanticSearch {
  /**
   * Search incidents using natural language
   */
  async search(incidents: any[], options: SearchOptions): Promise<SearchResult[]> {
    const { query, filters, limit = 20, threshold = 0.3 } = options

    // Apply filters first
    let filteredIncidents = this.applyFilters(incidents, filters)

    // If query is empty, return filtered results
    if (!query.trim()) {
      return filteredIncidents.slice(0, limit).map(incident => ({
        incident,
        score: 1.0,
        highlights: [],
        relevanceReason: 'No search query - showing all filtered results'
      }))
    }

    // Calculate relevance scores
    const scoredResults = filteredIncidents.map(incident => {
      const score = this.calculateRelevanceScore(incident, query)
      const highlights = this.extractHighlights(incident, query)
      const relevanceReason = this.generateRelevanceReason(incident, query, score)

      return {
        incident,
        score,
        highlights,
        relevanceReason
      }
    })

    // Filter by threshold and sort by score
    const results = scoredResults
      .filter(result => result.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return results
  }

  /**
   * Calculate relevance score using multiple factors
   */
  private calculateRelevanceScore(incident: any, query: string): number {
    const queryLower = query.toLowerCase()
    const queryWords = this.tokenize(queryLower)
    let score = 0
    let maxScore = 0

    // Exact phrase match (highest weight)
    if (incident.occurrence?.toLowerCase().includes(queryLower)) {
      score += 50
    }
    maxScore += 50

    // Word matches in occurrence
    const occurrenceWords = this.tokenize(incident.occurrence?.toLowerCase() || '')
    const occurrenceMatches = queryWords.filter(word => occurrenceWords.includes(word)).length
    score += (occurrenceMatches / Math.max(1, queryWords.length)) * 20
    maxScore += 20

    // Word matches in action_taken
    const actionWords = this.tokenize(incident.action_taken?.toLowerCase() || '')
    const actionMatches = queryWords.filter(word => actionWords.includes(word)).length
    score += (actionMatches / Math.max(1, queryWords.length)) * 15
    maxScore += 15

    // Incident type match
    if (incident.incident_type?.toLowerCase().includes(queryLower)) {
      score += 10
    }
    maxScore += 10

    // Priority match
    if (queryWords.includes(incident.priority?.toLowerCase())) {
      score += 5
    }
    maxScore += 5

    // Callsign matches
    const callsigns = [incident.callsign_from, incident.callsign_to, incident.logged_by_callsign]
    if (callsigns.some(callsign => callsign?.toLowerCase().includes(queryLower))) {
      score += 5
    }
    maxScore += 5

    // Temporal relevance (recent incidents score higher)
    const age = Date.now() - new Date(incident.timestamp).getTime()
    const daysSinceIncident = age / (1000 * 60 * 60 * 24)
    const recencyScore = Math.max(0, 5 * (1 - daysSinceIncident / 30)) // Decay over 30 days
    score += recencyScore
    maxScore += 5

    // Semantic similarity for complex queries
    if (queryWords.length > 2) {
      const semanticScore = this.calculateSemanticSimilarity(incident, queryWords)
      score += semanticScore * 10
      maxScore += 10
    }

    // Normalize score to 0-1 range
    return maxScore > 0 ? score / maxScore : 0
  }

  /**
   * Calculate semantic similarity using word embeddings approximation
   */
  private calculateSemanticSimilarity(incident: any, queryWords: string[]): number {
    // Simplified semantic similarity based on related terms
    const semanticGroups: Record<string, string[]> = {
      medical: ['health', 'injury', 'sick', 'ambulance', 'medic', 'first aid', 'casualty', 'patient'],
      security: ['threat', 'danger', 'suspicious', 'concern', 'alarm', 'breach', 'unauthorized'],
      violence: ['fight', 'assault', 'attack', 'aggression', 'altercation', 'conflict'],
      emergency: ['urgent', 'critical', 'immediate', 'emergency', 'serious', 'severe'],
      crowd: ['crowding', 'surge', 'crush', 'capacity', 'overcrowding', 'dense'],
      fire: ['smoke', 'flames', 'burning', 'evacuation', 'alarm'],
      theft: ['stolen', 'missing', 'robbery', 'pickpocket', 'shoplifting'],
      lost: ['missing', 'lost', 'separated', 'wandering', 'unaccompanied']
    }

    const incidentText = `${incident.occurrence} ${incident.action_taken} ${incident.incident_type}`.toLowerCase()
    
    let similarityScore = 0
    for (const [category, relatedWords] of Object.entries(semanticGroups)) {
      const queryHasCategory = queryWords.some(word => 
        relatedWords.includes(word) || category === word
      )
      const incidentHasCategory = relatedWords.some(word => incidentText.includes(word))
      
      if (queryHasCategory && incidentHasCategory) {
        similarityScore += 1
      }
    }

    return Math.min(1, similarityScore / Object.keys(semanticGroups).length)
  }

  /**
   * Extract highlight snippets
   */
  private extractHighlights(incident: any, query: string): string[] {
    const highlights: string[] = []
    const queryLower = query.toLowerCase()
    const queryWords = this.tokenize(queryLower)

    // Check occurrence
    if (incident.occurrence) {
      const sentences = incident.occurrence.split(/[.!?]+/)
      for (const sentence of sentences) {
        if (sentence.toLowerCase().includes(queryLower) || 
            queryWords.some(word => sentence.toLowerCase().includes(word))) {
          highlights.push(sentence.trim())
          if (highlights.length >= 3) break
        }
      }
    }

    // Check action_taken if not enough highlights
    if (highlights.length < 2 && incident.action_taken) {
      const sentences = incident.action_taken.split(/[.!?]+/)
      for (const sentence of sentences) {
        if (sentence.toLowerCase().includes(queryLower) ||
            queryWords.some(word => sentence.toLowerCase().includes(word))) {
          highlights.push(sentence.trim())
          if (highlights.length >= 3) break
        }
      }
    }

    return highlights
  }

  /**
   * Generate relevance explanation
   */
  private generateRelevanceReason(incident: any, query: string, score: number): string {
    const reasons: string[] = []
    const queryLower = query.toLowerCase()

    if (incident.occurrence?.toLowerCase().includes(queryLower)) {
      reasons.push('exact phrase match in occurrence')
    }

    if (incident.incident_type?.toLowerCase().includes(queryLower)) {
      reasons.push('matches incident type')
    }

    if (incident.priority?.toLowerCase() === queryLower) {
      reasons.push('matches priority level')
    }

    const callsigns = [incident.callsign_from, incident.callsign_to, incident.logged_by_callsign]
    if (callsigns.some(c => c?.toLowerCase().includes(queryLower))) {
      reasons.push('matches callsign')
    }

    if (score > 0.7) {
      reasons.push('highly relevant')
    } else if (score > 0.5) {
      reasons.push('moderately relevant')
    }

    const age = Date.now() - new Date(incident.timestamp).getTime()
    if (age < 24 * 60 * 60 * 1000) {
      reasons.push('recent incident')
    }

    return reasons.length > 0 ? reasons.join(', ') : 'partial match'
  }

  /**
   * Apply filters to incidents
   */
  private applyFilters(incidents: any[], filters?: SearchOptions['filters']): any[] {
    if (!filters) return incidents

    return incidents.filter(incident => {
      if (filters.eventId && incident.event_id !== filters.eventId) return false
      if (filters.incidentType && incident.incident_type !== filters.incidentType) return false
      if (filters.priority && incident.priority !== filters.priority) return false
      if (filters.status === 'open' && incident.is_closed) return false
      if (filters.status === 'closed' && !incident.is_closed) return false
      
      if (filters.dateRange) {
        const incidentDate = new Date(incident.timestamp)
        if (incidentDate < filters.dateRange.start || incidentDate > filters.dateRange.end) {
          return false
        }
      }

      return true
    })
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
  }

  /**
   * Get search suggestions
   */
  getSuggestions(incidents: any[], partialQuery: string): string[] {
    const suggestions: Set<string> = new Set()

    // Extract common terms from incidents
    incidents.forEach(incident => {
      // Incident types
      if (incident.incident_type?.toLowerCase().startsWith(partialQuery.toLowerCase())) {
        suggestions.add(incident.incident_type)
      }

      // Priority
      if (incident.priority?.toLowerCase().startsWith(partialQuery.toLowerCase())) {
        suggestions.add(incident.priority + ' priority')
      }

      // Common words from occurrences
      const words = this.tokenize(incident.occurrence || '')
      words.forEach(word => {
        if (word.toLowerCase().startsWith(partialQuery.toLowerCase()) && word.length > 3) {
          suggestions.add(word)
        }
      })
    })

    return Array.from(suggestions).slice(0, 8)
  }
}

// Export singleton instance
export const semanticSearch = new SemanticSearch()
