/**
 * Knowledge Base Search Tests
 * Tests for semantic search functionality
 */

import { describe, it, expect } from '@jest/globals'
import { extractKeyTerms, scoreKeywordMatch, extractSnippet } from '@/lib/knowledge/search'

describe('Knowledge Base Search', () => {
  describe('extractKeyTerms', () => {
    it('should extract meaningful terms from query', () => {
      const terms = extractKeyTerms('What is the capacity of Creamfields?')
      expect(terms.length).toBeGreaterThan(0)
      expect(terms).toContain('capacity')
      expect(terms).toContain('creamfields')
    })

    it('should filter out stopwords', () => {
      const terms = extractKeyTerms('the and or capacity')
      expect(terms).not.toContain('the')
      expect(terms).not.toContain('and')
      expect(terms).toContain('capacity')
    })

    it('should filter out short words', () => {
      const terms = extractKeyTerms('a an the capacity')
      expect(terms).not.toContain('a')
      expect(terms).not.toContain('an')
      expect(terms).toContain('capacity')
    })
  })

  describe('scoreKeywordMatch', () => {
    it('should score content based on keyword matches', () => {
      const content = 'The capacity of Creamfields is 70,000 attendees.'
      const keyTerms = ['capacity', 'creamfields']
      const score = scoreKeywordMatch(content, keyTerms)
      
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(1.0)
    })

    it('should return 0 for no matches', () => {
      const content = 'This is unrelated content.'
      const keyTerms = ['capacity', 'creamfields']
      const score = scoreKeywordMatch(content, keyTerms)
      
      expect(score).toBe(0)
    })

    it('should cap score at 1.0', () => {
      const content = 'capacity capacity capacity '.repeat(50)
      const keyTerms = ['capacity']
      const score = scoreKeywordMatch(content, keyTerms)
      
      expect(score).toBeLessThanOrEqual(1.0)
    })
  })

  describe('extractSnippet', () => {
    it('should extract relevant snippet around keywords', () => {
      const content = 'This is some text. The capacity is 70,000. More text here.'
      const keyTerms = ['capacity']
      const snippet = extractSnippet(content, keyTerms)
      
      expect(snippet).toContain('capacity')
      expect(snippet.length).toBeGreaterThan(0)
    })

    it('should include context sentences', () => {
      const content = 'First sentence. Second sentence with capacity. Third sentence.'
      const keyTerms = ['capacity']
      const snippet = extractSnippet(content, keyTerms)
      
      // Should include multiple sentences
      expect(snippet.split('.').length).toBeGreaterThan(1)
    })

    it('should handle empty content', () => {
      const snippet = extractSnippet('', [])
      expect(snippet).toBe('')
    })

    it('should fallback to first sentences if no matches', () => {
      const content = 'First sentence. Second sentence. Third sentence.'
      const keyTerms = ['nonexistent']
      const snippet = extractSnippet(content, keyTerms)
      
      expect(snippet.length).toBeGreaterThan(0)
    })
  })
})



