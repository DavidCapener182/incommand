/**
 * Knowledge Base Document Ingestion Module
 * 
 * Handles file upload, text extraction, chunking, embedding, and storage
 * Reusable for both Green Guide and user-uploaded documents
 * 
 * SERVER-ONLY: This module uses server-side environment variables and should not be imported in client components
 */

import { Buffer } from 'node:buffer'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'

export type FileType = 'pdf' | 'docx' | 'txt' | 'md' | 'csv' | 'unknown'

export interface IngestInput {
  file?: File | Buffer
  title: string
  uploaderId: string
  organizationId?: string
  eventId?: string
  tags?: string[]
  type?: FileType
  knowledgeId?: string
  originalFilename?: string
  storagePath?: string
  textContent?: string
  source?: string
}

export interface IngestResult {
  knowledgeId: string
  chunksCreated: number
  bytes: number
  type: string
}

export interface ChunkMetadata {
  chunkIndex: number
  documentTitle: string
  section?: string
  page?: number
  charStart?: number
  charEnd?: number
  [key: string]: any
}

// Configuration constants
const CHUNK_SIZE = 2000 // ~500-700 tokens per chunk to stay well under 8192 token limit
const CHUNK_OVERLAP = 150
const EMBEDDING_MODEL = 'text-embedding-3-small' // Matches Green Guide and database schema (1536 dims)
const EMBEDDING_DIMENSION = 1536 // Matches database schema vector(1536)
const BATCH_SIZE_EMBED = 10 // Reduced batch size to avoid token limit issues (10 chunks * ~700 tokens = ~7000 tokens max)
const BATCH_SIZE_UPSERT = 200
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const MAX_CHUNKS_PER_DOC = 2000
const MAX_TOKENS_PER_CHUNK = 7000 // Safety limit: well under 8192 token limit

/**
 * Detect file type from file name or MIME type
 */
export function detectFileType(file: File | { name?: string; type?: string }): FileType {
  const name =
    typeof file === 'object' && 'name' in file && typeof file.name === 'string'
      ? file.name
      : ''
  const mimeType = 'type' in file ? file.type : ''
  
  const ext = name.split('.').pop()?.toLowerCase() || ''
  
  if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf'
  if (ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx'
  if (ext === 'txt' || mimeType === 'text/plain') return 'txt'
  if (ext === 'md' || mimeType === 'text/markdown') return 'md'
  if (ext === 'csv' || mimeType === 'text/csv') return 'csv'
  
  return 'unknown'
}

/**
 * Extract text from PDF file
 */
async function extractPdfText(file: File | Buffer): Promise<string> {
  try {
    const pdfParse = await import('pdf-parse')
    const pdf: any = (pdfParse as any).default ?? pdfParse
    
    let buffer: Buffer
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else {
      buffer = file
    }
    
    // Add timeout for PDF parsing (30 seconds)
    const parsePromise = pdf(buffer)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('PDF parsing timed out after 30 seconds')), 30000)
    )
    
    const data = await Promise.race([parsePromise, timeoutPromise]) as any
    const text = (data.text || '').replace(/\u0000/g, '').trim()
    
    if (!text || text.length === 0) {
      throw new Error('PDF appears to be empty or contains no extractable text')
    }
    
    return text
  } catch (error: any) {
    if (error.message?.includes('Object.defineProperty')) {
      throw new Error('PDF file appears to be corrupted or in an unsupported format. Please try re-saving the PDF or converting it to a different format.')
    }
    if (error.message?.includes('timed out')) {
      throw new Error('PDF parsing timed out. The file may be too large or corrupted. Try converting to DOCX or TXT format.')
    }
    if (error.message?.includes('Invalid PDF')) {
      throw new Error('Invalid PDF format. Please try re-saving the PDF or converting it to DOCX/TXT format.')
    }
    // Provide more helpful error messages
    const errorMsg = error.message || 'Unknown error'
    if (errorMsg.includes('PDF') || errorMsg.includes('pdf')) {
      throw new Error(`PDF parsing failed: ${errorMsg}. Try converting the PDF to DOCX or TXT format.`)
    }
    throw new Error(`Failed to extract PDF text: ${errorMsg}`)
  }
}

/**
 * Extract text from DOCX file
 * Note: Requires 'pizzip' and 'docxtemplater' packages
 * Install with: npm install pizzip docxtemplater
 */
async function extractDocxText(file: File | Buffer): Promise<string> {
  // Check if we're in a Node.js environment
  const isServer = typeof window === 'undefined'
  
  if (!isServer) {
    throw new Error(
      'DOCX parsing is only available on the server. ' +
      'Please ensure the file is processed server-side.'
    )
  }
  
  try {
    // Use eval to prevent webpack from statically analyzing the require
    // This ensures the build succeeds even if the modules aren't installed
    // eslint-disable-next-line no-eval
    const pizzipModule = eval('require')('pizzip')
    // eslint-disable-next-line no-eval
    const docxtemplaterModule = eval('require')('docxtemplater')
    
    const PizZip = pizzipModule.default || pizzipModule
    const Docxtemplater = docxtemplaterModule.default || docxtemplaterModule
    
    let buffer: Buffer
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else {
      buffer = file
    }
    
    const zip = new PizZip(buffer)
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })
    
    // Extract text by rendering with empty data
    const text = doc.getFullText()
    return text.trim()
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND' || 
        error.message?.includes('Cannot find module') ||
        error.message?.includes('require is not defined')) {
      throw new Error(
        'DOCX parsing requires additional dependencies. ' +
        'Install with: npm install pizzip docxtemplater'
      )
    }
    throw new Error(`Failed to extract DOCX text: ${error.message}`)
  }
}

/**
 * Extract text from plain text file
 */
async function extractTextFile(file: File | Buffer): Promise<string> {
  if (file instanceof File) {
    return await file.text()
  } else {
    return file.toString('utf-8')
  }
}

/**
 * Extract text from CSV file
 */
async function extractCsvText(file: File | Buffer): Promise<string> {
  const text = await extractTextFile(file)
  // Convert CSV to readable text format
  const lines = text.split('\n')
  return lines.map((line, idx) => {
    if (idx === 0) return `Headers: ${line}`
    return `Row ${idx}: ${line}`
  }).join('\n')
}

/**
 * Extract text from file based on type
 */
export async function extractText(file: File | Buffer, type: FileType): Promise<string> {
  switch (type) {
    case 'pdf':
      return await extractPdfText(file)
    case 'docx':
      return await extractDocxText(file)
    case 'txt':
    case 'md':
      return await extractTextFile(file)
    case 'csv':
      return await extractCsvText(file)
    default:
      throw new Error(`Unsupported file type: ${type}`)
  }
}

/**
 * Chunk text into overlapping segments
 * Attempts to preserve paragraph boundaries when possible
 */
export function chunkText(
  text: string,
  size: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): Array<{ content: string; metadata: ChunkMetadata }> {
  const chunks: Array<{ content: string; metadata: ChunkMetadata }> = []
  
  // Split by paragraphs first to preserve boundaries
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  
  let currentChunk = ''
  let chunkIndex = 0
  let charIndex = 0
  
  for (const para of paragraphs) {
    const trimmedPara = para.trim()
    
    // If a single paragraph is larger than chunk size, split it
    if (trimmedPara.length > size) {
      // Finalize current chunk if it has content
      if (currentChunk.trim().length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            chunkIndex: chunkIndex++,
            documentTitle: '',
            charStart: charIndex - currentChunk.length,
            charEnd: charIndex
          }
        })
        currentChunk = ''
      }
      
      // Split large paragraph into smaller chunks
      let paraStart = 0
      while (paraStart < trimmedPara.length) {
        const paraEnd = Math.min(trimmedPara.length, paraStart + size)
        const paraChunk = trimmedPara.slice(paraStart, paraEnd)
        
        chunks.push({
          content: paraChunk.trim(),
          metadata: {
            chunkIndex: chunkIndex++,
            documentTitle: '',
            charStart: charIndex + paraStart,
            charEnd: charIndex + paraEnd
          }
        })
        
        paraStart = paraEnd - overlap // Overlap with next chunk
        charIndex += paraChunk.length
      }
      continue
    }
    
    // If adding this paragraph would exceed chunk size, finalize current chunk
    if (currentChunk.length + trimmedPara.length > size && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          chunkIndex: chunkIndex++,
          documentTitle: '', // Will be set later
          charStart: charIndex - currentChunk.length,
          charEnd: charIndex
        }
      })
      
      // Start new chunk with overlap from previous
      const overlapText = currentChunk.slice(-overlap)
      currentChunk = overlapText + '\n\n' + trimmedPara
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara
    }
    
    charIndex += trimmedPara.length + 2 // +2 for paragraph separator
  }
  
  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: {
        chunkIndex: chunkIndex++,
        documentTitle: '',
        charStart: charIndex - currentChunk.length,
        charEnd: charIndex
      }
    })
  }
  
  // Fallback: if no paragraphs found, use simple character-based chunking
  if (chunks.length === 0) {
    let i = 0
    while (i < text.length) {
      const end = Math.min(text.length, i + size)
      const slice = text.slice(i, end)
      chunks.push({
        content: slice.trim(),
        metadata: {
          chunkIndex: chunkIndex++,
          documentTitle: '',
          charStart: i,
          charEnd: end
        }
      })
      if (end === text.length) break
      i = end - overlap
    }
  }
  
  return chunks.map(c => ({
    ...c,
    content: c.content.replace(/\s+/g, ' ').trim()
  })).filter(c => c.content.length > 0)
}

/**
 * Generate embeddings for text chunks using OpenAI
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }
  
  const apiKey = process.env.OPENAI_API_KEY
  
  // Validate chunk sizes before embedding (rough estimate: 1 token ≈ 4 characters)
  // OpenAI allows up to 8192 tokens per input, so we cap at ~6000 tokens (~24000 chars) per chunk
  const MAX_CHUNK_CHARS = 24000
  const validatedTexts: string[] = []
  for (const text of texts) {
    if (text.length > MAX_CHUNK_CHARS) {
      console.warn(`Chunk exceeds max size (${text.length} chars), truncating to ${MAX_CHUNK_CHARS}`)
      validatedTexts.push(text.substring(0, MAX_CHUNK_CHARS))
    } else {
      validatedTexts.push(text)
    }
  }
  
  // Batch embeddings
  const embeddings: number[][] = []
  
  for (let i = 0; i < validatedTexts.length; i += BATCH_SIZE_EMBED) {
    const batch = validatedTexts.slice(i, i + BATCH_SIZE_EMBED)
    
    // Estimate total tokens for this batch (rough: 1 token ≈ 4 chars)
    const estimatedTokens = batch.reduce((sum, text) => sum + Math.ceil(text.length / 4), 0)
    if (estimatedTokens > 80000) { // Safety check: 10 chunks * 8000 tokens max
      console.warn(`Batch estimated tokens (${estimatedTokens}) is high, processing smaller batches`)
      // Process one at a time if batch is too large
      for (const singleText of batch) {
        const singleBatch = [singleText]
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: EMBEDDING_MODEL,
            input: singleBatch
          })
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Embedding failed: ${response.status} - ${errorText}`)
        }
        
        const json = await response.json()
        const batchEmbeddings = json.data.map((d: any) => d.embedding)
        
        if (batchEmbeddings.some((e: number[]) => e.length !== EMBEDDING_DIMENSION)) {
          throw new Error(`Invalid embedding dimension. Expected ${EMBEDDING_DIMENSION}`)
        }
        
        embeddings.push(...batchEmbeddings)
      }
      continue
    }
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: batch
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Embedding failed: ${response.status} - ${errorText}`)
    }
    
    const json = await response.json()
    const batchEmbeddings = json.data.map((d: any) => d.embedding)
    
    if (batchEmbeddings.some((e: number[]) => e.length !== EMBEDDING_DIMENSION)) {
      throw new Error(`Invalid embedding dimension. Expected ${EMBEDDING_DIMENSION}`)
    }
    
    embeddings.push(...batchEmbeddings)
  }
  
  return embeddings
}

/**
 * Ingest a document: extract, chunk, embed, and store
 */
export async function ingestDocument(input: IngestInput): Promise<IngestResult> {
  const supabase = getServiceSupabaseClient() as any
  const startTime = Date.now()
  const fallbackOrgId = '00000000-0000-0000-0000-000000000000'
  const organizationId = input.organizationId ?? fallbackOrgId
  
  // Validate file size
  let fileSize = 0
  let detectedType: FileType
  let file: File | Buffer | undefined = input.file
  
  if (file) {
    if (file instanceof File) {
      fileSize = file.size
    } else if (Buffer.isBuffer(file)) {
      fileSize = file.length
    }
    
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File size ${fileSize} exceeds maximum ${MAX_FILE_SIZE} bytes`)
    }
    
    detectedType = input.type || (file instanceof File ? detectFileType(file) : 'unknown')
    
    if (detectedType === 'unknown') {
      throw new Error('Unable to detect file type. Supported: PDF, DOCX, TXT, MD, CSV')
    }
  } else if (input.textContent) {
    fileSize = Buffer.byteLength(input.textContent, 'utf-8')
    detectedType = input.type || 'txt'
  } else {
    throw new Error('No file or text content provided for ingestion')
  }
  
  // Create knowledge_base entry with pending status
  let knowledgeId = input.knowledgeId
  if (knowledgeId) {
    const { error: updateExistingError } = await supabase
      .from('knowledge_base')
      .update({
        status: 'ingesting',
        error: null,
        bytes: fileSize,
        type: detectedType,
        title: input.title,
        uploader_id: input.uploaderId,
        organization_id: organizationId,
        event_id: input.eventId || null,
        tags: input.tags || [],
        body: '',
        updated_at: new Date().toISOString(),
        ...(input.storagePath !== undefined ? { storage_path: input.storagePath } : {}),
        ...(input.originalFilename !== undefined ? { original_filename: input.originalFilename } : {}),
      })
      .eq('id', knowledgeId)

    if (updateExistingError) {
      throw new Error(`Failed to prepare knowledge record for ingestion: ${updateExistingError.message}`)
    }
  } else {
    const { data: kbEntry, error: kbError } = await supabase
      .from('knowledge_base')
      .insert({
        title: input.title,
        type: detectedType,
        source: input.source || (input.textContent ? 'text-upload' : 'user-upload'),
        uploader_id: input.uploaderId,
        organization_id: organizationId,
        event_id: input.eventId || null,
        tags: input.tags || [],
        status: 'ingesting',
        bytes: fileSize,
        body: '',
        storage_path: input.storagePath ?? null,
        original_filename: input.originalFilename ?? null,
      })
      .select('id')
      .single()

    if (kbError || !kbEntry) {
      throw new Error(`Failed to create knowledge_base entry: ${kbError?.message || 'Unknown error'}`)
    }
    knowledgeId = kbEntry.id
  }

  if (!knowledgeId) {
    throw new Error('Knowledge ID could not be determined for ingestion')
  }
  
  // Helper function to update progress
  const updateProgress = async (stage: string, progress?: number) => {
    // Store progress in body field with a marker that won't conflict with document text
    const progressText = `[PROGRESS:${stage}${progress !== undefined ? `:${Math.round(progress)}%` : ''}]`
    
    // Get current body to preserve extracted text if it exists
    const { data: current } = await supabase
      .from('knowledge_base')
      .select('body')
      .eq('id', knowledgeId)
      .single()
    
    // If body contains actual document text (not just progress), prepend progress
    // Otherwise, just use progress text
    const newBody = current?.body && current.body.length > 100 && !current.body.includes('[PROGRESS:')
      ? `${progressText}\n\n${current.body}`
      : progressText
    
    await supabase
      .from('knowledge_base')
      .update({ 
        body: newBody,
        updated_at: new Date().toISOString()
      })
      .eq('id', knowledgeId)
  }
  
  // Set a maximum processing time (5 minutes)
  const maxProcessingTime = 5 * 60 * 1000 // 5 minutes
  const processingStartTime = Date.now()
  let progressCheckInterval: NodeJS.Timeout | undefined
  
  // Check for stuck ingestions periodically
  progressCheckInterval = setInterval(async () => {
    const elapsed = Date.now() - processingStartTime
    if (elapsed > maxProcessingTime) {
      if (progressCheckInterval) clearInterval(progressCheckInterval)
      await supabase
        .from('knowledge_base')
        .update({ 
          status: 'failed',
          error: 'Ingestion timed out after 5 minutes. The document may be too large or complex.'
        })
        .eq('id', knowledgeId)
      throw new Error('Ingestion timed out after 5 minutes')
    }
  }, 30000) // Check every 30 seconds
  
  try {
    // Stage 1: Extract or process text
    let extractedText: string
    if (input.textContent) {
      await updateProgress('Processing text')
      extractedText = input.textContent
    } else {
      await updateProgress('Parsing document')
      extractedText = await extractText(file as File | Buffer, detectedType)
    }
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text extracted from file')
    }
    
    // Stage 2: Chunk text (update progress first, then save text)
    await updateProgress('Chunking text', 25)
    
    let chunks: Array<{ content: string; metadata: ChunkMetadata }>
    try {
      chunks = chunkText(extractedText)
    } catch (error: any) {
      throw new Error(`Failed to chunk document: ${error.message || 'Unknown error'}. The document may be too large or contain invalid characters.`)
    }
    
    if (chunks.length === 0) {
      throw new Error('No chunks created from extracted text. The document may be empty or contain only whitespace.')
    }
    
    if (chunks.length > MAX_CHUNKS_PER_DOC) {
      throw new Error(`Document too large: ${chunks.length} chunks created (maximum is ${MAX_CHUNKS_PER_DOC}). Please split the document into smaller files.`)
    }
    
    // Update knowledge_base with extracted text AFTER chunking (so we know it's ready for embedding)
    // Don't overwrite progress - updateProgress will handle preserving both
    const { error: updateError } = await supabase
      .from('knowledge_base')
      .update({ body: extractedText })
      .eq('id', knowledgeId);
    
    if (updateError) {
      console.error('Failed to update body with extracted text:', updateError);
    }
    
    // Update progress to show chunking is complete (this will prepend to the body)
    await updateProgress('Chunking complete', 30)
    
    // Set document title in metadata
    chunks.forEach(chunk => {
      chunk.metadata.documentTitle = input.title
    })
    
    // Stage 3: Generate embeddings
    await updateProgress('Generating embeddings', 50)
    const texts = chunks.map(c => c.content)
    
    // Update progress as embeddings are generated
    let embeddingProgress = 50
    const progressInterval = setInterval(async () => {
      embeddingProgress = Math.min(embeddingProgress + 2, 90)
      await updateProgress('Generating embeddings', embeddingProgress)
    }, 2000) // Update every 2 seconds
    
    const embeddings = await generateEmbeddings(texts)
    clearInterval(progressInterval)
    clearInterval(progressCheckInterval) // Clear timeout check
    
    await updateProgress('Storing embeddings', 95)
    
    if (embeddings.length !== chunks.length) {
      throw new Error(`Embedding count mismatch: ${embeddings.length} vs ${chunks.length}`)
    }
    
    // Store chunks and embeddings
    const embeddingsToInsert = chunks.map((chunk, idx) => ({
      knowledge_id: knowledgeId,
      chunk_index: chunk.metadata.chunkIndex,
      content: chunk.content,
      embedding: embeddings[idx] as any, // Cast to any for pgvector
      metadata: {
        ...chunk.metadata,
        documentTitle: input.title,
        organizationId: input.organizationId,
        eventId: input.eventId
      }
    }))
    
    // Batch insert embeddings
    for (let i = 0; i < embeddingsToInsert.length; i += BATCH_SIZE_UPSERT) {
      const batch = embeddingsToInsert.slice(i, i + BATCH_SIZE_UPSERT)
      const { error: insertError } = await supabase
        .from('knowledge_embeddings')
        .insert(batch)
      
      if (insertError) {
        throw new Error(`Failed to insert embeddings batch: ${insertError.message}`)
      }
    }
    
    // Update status to ingested
    await supabase
      .from('knowledge_base')
      .update({ 
        status: 'ingested',
        body: extractedText, // Store final extracted text
        error: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', knowledgeId)
    
    // Clear timeout check interval
    if (progressCheckInterval) {
      clearInterval(progressCheckInterval)
    }
    
    const duration = Date.now() - startTime
    
    // Log telemetry (could be extended to write to a telemetry table)
    console.log(`Ingestion complete: ${input.title}`, {
      knowledgeId,
      chunksCreated: embeddings.length,
      bytes: fileSize,
      duration: `${duration}ms`,
      type: detectedType
    })
    
    return {
      knowledgeId,
      chunksCreated: embeddings.length,
      bytes: fileSize,
      type: detectedType
    }
    
  } catch (error: any) {
    // Clear intervals on error
    if (typeof progressCheckInterval !== 'undefined') {
      clearInterval(progressCheckInterval)
    }
    
    // Update status to failed with error message
    await supabase
      .from('knowledge_base')
      .update({ 
        status: 'failed',
        error: (error as Error).message,
        updated_at: new Date().toISOString()
      })
      .eq('id', knowledgeId)
    
    throw error
  }
}

/**
 * Reprocess knowledge base entries (re-ingest)
 */
export async function reprocessKnowledgeBase(filter?: {
  organizationId?: string
  eventId?: string
  knowledgeId?: string
}): Promise<{ processed: number; errors: number }> {
  const supabase = getServiceSupabaseClient() as any
  
  let query = supabase
    .from('knowledge_base')
    .select('id, title, type, body, uploader_id, organization_id, event_id, tags')
    .in('status', ['ingested', 'failed'])
  
  if (filter?.knowledgeId) {
    query = query.eq('id', filter.knowledgeId)
  } else {
    if (filter?.organizationId) {
      query = query.eq('organization_id', filter.organizationId)
    }
    if (filter?.eventId) {
      query = query.eq('event_id', filter.eventId)
    }
  }
  
  const { data: entries, error } = await query
  
  if (error) {
    throw new Error(`Failed to fetch knowledge_base entries: ${error.message}`)
  }
  
  if (!entries || entries.length === 0) {
    return { processed: 0, errors: 0 }
  }
  
  let processed = 0
  let errors = 0
  
  for (const entry of entries) {
    try {
      // Delete existing embeddings
      await supabase
        .from('knowledge_embeddings')
        .delete()
        .eq('knowledge_id', entry.id)
      
      // Re-ingest (convert body to Buffer for ingestion)
      const buffer = Buffer.from(entry.body || '', 'utf-8')
      await ingestDocument({
        file: buffer,
        title: entry.title,
        uploaderId: entry.uploader_id || '',
        organizationId: entry.organization_id || undefined,
        eventId: entry.event_id || undefined,
        tags: entry.tags || [],
        type: (entry.type as FileType) || 'unknown'
      })
      
      processed++
    } catch (error: any) {
      console.error(`Failed to reprocess ${entry.id}:`, error)
      errors++
    }
  }
  
  return { processed, errors }
}
