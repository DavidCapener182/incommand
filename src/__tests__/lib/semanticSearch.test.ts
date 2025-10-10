/**
 * Semantic Search Unit Tests
 */

import { semanticSearch } from '@/lib/ai/semanticSearch'

describe('SemanticSearch', () => {
  const mockIncidents = [
    {
      id: '1',
      incident_type: 'Medical',
      occurrence: 'Person collapsed at main gate requiring immediate medical attention',
      action_taken: 'Medics dispatched',
      priority: 'high',
      callsign_from: 'Alpha 1',
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      incident_type: 'Ejection',
      occurrence: 'Individual ejected from section A for aggressive behavior',
      action_taken: 'Escorted out by security',
      priority: 'medium',
      callsign_from: 'Bravo 2',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    },
    {
      id: '3',
      incident_type: 'Theft',
      occurrence: 'Reported stolen wallet at merchandise stand',
      action_taken: 'Incident logged, CCTV review initiated',
      priority: 'low',
      callsign_from: 'Charlie 3',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
    }
  ]

  describe('search', () => {
    it('should return all incidents when no query provided', async () => {
      const results = await semanticSearch.search(mockIncidents, {
        query: '',
        limit: 10
      })

      expect(results).toHaveLength(3)
      expect(results[0].score).toBe(1.0)
    })

    it('should find exact phrase matches with high scores', async () => {
      const results = await semanticSearch.search(mockIncidents, {
        query: 'main gate',
        limit: 10
      })

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].incident.id).toBe('1')
      expect(results[0].score).toBeGreaterThan(0.5)
    })

    it('should match incident type', async () => {
      const results = await semanticSearch.search(mockIncidents, {
        query: 'medical',
        limit: 10
      })

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].incident.incident_type).toBe('Medical')
    })

    it('should match priority levels', async () => {
      const results = await semanticSearch.search(mockIncidents, {
        query: 'high priority',
        limit: 10
      })

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].incident.priority).toBe('high')
    })

    it('should provide highlights for matches', async () => {
      const results = await semanticSearch.search(mockIncidents, {
        query: 'collapsed',
        limit: 10
      })

      expect(results[0].highlights.length).toBeGreaterThan(0)
      expect(results[0].highlights[0]).toContain('collapsed')
    })

    it('should respect threshold filtering', async () => {
      const results = await semanticSearch.search(mockIncidents, {
        query: 'random unmatched query xyz123',
        limit: 10,
        threshold: 0.5
      })

      expect(results).toHaveLength(0)
    })

    it('should apply filters correctly', async () => {
      const results = await semanticSearch.search(mockIncidents, {
        query: '',
        filters: {
          priority: 'high'
        },
        limit: 10
      })

      expect(results).toHaveLength(1)
      expect(results[0].incident.priority).toBe('high')
    })

    it('should filter by date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const results = await semanticSearch.search(mockIncidents, {
        query: '',
        filters: {
          dateRange: { start: yesterday, end: tomorrow }
        },
        limit: 10
      })

      expect(results.length).toBeGreaterThan(0)
      expect(results.length).toBeLessThan(3) // Should exclude older incidents
    })
  })

  describe('getSuggestions', () => {
    it('should provide relevant suggestions', () => {
      const suggestions = semanticSearch.getSuggestions(mockIncidents, 'med')

      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.some(s => s.toLowerCase().includes('med'))).toBe(true)
    })

    it('should suggest incident types', () => {
      const suggestions = semanticSearch.getSuggestions(mockIncidents, 'medi')

      expect(suggestions).toContain('Medical')
    })

    it('should limit suggestions to 8', () => {
      const suggestions = semanticSearch.getSuggestions(mockIncidents, 'a')

      expect(suggestions.length).toBeLessThanOrEqual(8)
    })
  })
})
