/**
 * Knowledge Base Ingestion Tests
 * Tests for document ingestion, chunking, and embedding generation
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { detectFileType, chunkText, extractText } from '@/lib/knowledge/ingest'

describe('Knowledge Base Ingestion', () => {
  describe('detectFileType', () => {
    it('should detect PDF files', () => {
      const file = { name: 'test.pdf', type: 'application/pdf' } as File
      expect(detectFileType(file)).toBe('pdf')
    })

    it('should detect DOCX files', () => {
      const file = { name: 'test.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' } as File
      expect(detectFileType(file)).toBe('docx')
    })

    it('should detect TXT files', () => {
      const file = { name: 'test.txt', type: 'text/plain' } as File
      expect(detectFileType(file)).toBe('txt')
    })

    it('should detect MD files', () => {
      const file = { name: 'test.md', type: 'text/markdown' } as File
      expect(detectFileType(file)).toBe('md')
    })

    it('should detect CSV files', () => {
      const file = { name: 'test.csv', type: 'text/csv' } as File
      expect(detectFileType(file)).toBe('csv')
    })

    it('should return unknown for unsupported types', () => {
      const file = { name: 'test.xyz', type: 'application/unknown' } as File
      expect(detectFileType(file)).toBe('unknown')
    })
  })

  describe('chunkText', () => {
    it('should chunk text into overlapping segments', () => {
      const text = 'This is a test. '.repeat(100) // ~1600 chars
      const chunks = chunkText(text, 500, 100)
      
      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks[0].metadata.chunkIndex).toBe(0)
      expect(chunks[0].content.length).toBeLessThanOrEqual(500)
    })

    it('should preserve paragraph boundaries when possible', () => {
      const text = 'Paragraph one.\n\nParagraph two.\n\nParagraph three.'
      const chunks = chunkText(text, 50, 10)
      
      expect(chunks.length).toBeGreaterThan(0)
      // Should attempt to keep paragraphs together
      chunks.forEach(chunk => {
        expect(chunk.content.length).toBeGreaterThan(0)
      })
    })

    it('should handle empty text', () => {
      const chunks = chunkText('')
      expect(chunks.length).toBe(0)
    })

    it('should set document title in metadata', () => {
      const text = 'Test content here.'
      const chunks = chunkText(text)
      chunks.forEach(chunk => {
        expect(chunk.metadata.documentTitle).toBeDefined()
      })
    })
  })

  describe('chunkText metadata', () => {
    it('should include chunkIndex in metadata', () => {
      const text = 'Test '.repeat(200)
      const chunks = chunkText(text, 100, 20)
      
      chunks.forEach((chunk, idx) => {
        expect(chunk.metadata.chunkIndex).toBe(idx)
      })
    })
  })
})



