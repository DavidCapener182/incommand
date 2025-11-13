# Green Guide System Analysis

## Overview

The Green Guide system provides RAG (Retrieval-Augmented Generation) capabilities for event safety documentation. It ingests a PDF document, chunks it, generates embeddings, and enables semantic search for AI-powered responses.

## Current Architecture

### Data Flow

```
PDF Document (docs/green-guide.pdf)
    ↓
[Ingestion Script: scripts/ingest-green-guide.ts]
    ├─ Extract text (pdf-parse)
    ├─ Chunk text (700 chars, 120 overlap)
    ├─ Generate embeddings (OpenAI text-embedding-3-small, 1536 dims)
    └─ Store in Supabase (green_guide_chunks table)
         ↓
[Search Layer: src/lib/rag/greenGuide.ts]
    ├─ Semantic search (vector similarity)
    ├─ Keyword fallback (ILIKE queries)
    └─ Hybrid reranking (semantic + keyword scores)
         ↓
[API Endpoints]
    ├─ /api/green-guide-search (POST)
    ├─ /api/green-guide-reindex (POST)
    └─ /api/green-guide-stats (GET)
         ↓
[AI Integration]
    └─ Injected into chat prompts via aiChatService.ts
```

### Database Schema

**Table: `green_guide_chunks`**
- `id` (uuid, PK)
- `content` (text) - Chunk text content
- `page` (int, nullable) - Page number if available
- `heading` (text, nullable) - Section heading if available
- `embedding` (vector(1536)) - OpenAI embedding vector
- `created_at` (timestamptz)

**Indexes:**
- `green_guide_chunks_embedding_idx` - IVFFlat index for vector similarity search (L2 distance)

**RPC Function:**
- `match_green_guide_chunks(query_embedding vector, match_count int)` - Performs cosine similarity search (currently commented out in code)

### Ingestion Process

**Script: `scripts/ingest-green-guide.ts`**

1. **Text Extraction:**
   - Uses `pdf-parse` library (dynamic import)
   - Reads PDF from `docs/green-guide.pdf`
   - Removes null characters (`\u0000`)

2. **Chunking Strategy:**
   - Size: 700 characters per chunk
   - Overlap: 120 characters
   - Normalization: Replaces whitespace sequences with single space, trims

3. **Embedding Generation:**
   - Model: `text-embedding-3-small`
   - Dimension: 1536
   - Batch size: 64 chunks per API call
   - API: OpenAI `/v1/embeddings`

4. **Storage:**
   - Upsert batch size: 200 chunks
   - Table: `green_guide_chunks`
   - No page/heading extraction currently (both set to null)

### Search Implementation

**Module: `src/lib/rag/greenGuide.ts`**

**Search Methods:**

1. **Semantic Search (Primary):**
   - Generates query embedding using OpenAI
   - Uses pgvector cosine similarity (`<->` operator)
   - Falls back to in-memory ranking if RPC unavailable
   - Currently RPC function is commented out, falls back to keyword search

2. **Keyword Search (Fallback):**
   - Extracts key terms (length > 3, not stopwords)
   - Uses Supabase ILIKE queries (up to 3 terms)
   - Scores based on keyword matches

3. **Hybrid Reranking:**
   - Combines semantic (60%) + keyword (30%) + heading bonus (15%)
   - Sorts by relevance score
   - Extracts snippets around best-matching sentences

**Query Expansion:**
- Domain-specific synonyms (ingress → entry, gate entry, queuing, etc.)
- Event safety domain vocabulary
- Expands query before embedding generation

**Snippet Extraction:**
- Finds sentences with highest keyword matches
- Includes context (sentence before/after)
- Adds ellipsis for incomplete boundaries

### API Endpoints

**`/api/green-guide-search` (POST)**
- Input: `{ query: string, topK?: number }`
- Output: `{ results: Array<{id, content, page, heading}> }`
- Flow:
  1. Expand query with synonyms
  2. Generate embedding
  3. Query database (with fallback to in-memory ranking)
  4. Sanitize and prettify snippets
  5. Return top K results

**`/api/green-guide-reindex` (POST)**
- Quick reindex endpoint (placeholder implementation)
- Checks if >100 chunks exist, returns early
- For full reindex, recommends CLI script

**`/api/green-guide-stats` (GET)**
- Returns chunk count and sample row
- Used for monitoring/indexing status

### AI Integration Points

**`src/lib/ai/aiChatService.ts`:**
- `searchGreenGuide(query, eventId)` method
- Detects if query needs Green Guide context (regex: `/best practice|procedure|how should|what should we do|safety|green guide|barrier|capacity|crowd|ingress|egress/i`)
- Calls `/api/green-guide-search`
- Formats citations as `[GG p.<page>]`

**`src/app/api/chat/ai/route.ts`:**
- Checks `wantsGreenGuide` flag
- Fetches Green Guide context
- Injects into system prompt: `\nGreen Guide Context:\n${greenGuideContext}`

## Reuse Plan

### Components to Abstract

1. **Text Extraction (`lib/knowledge/extract.ts`):**
   - PDF parsing (reuse `pdf-parse` pattern)
   - DOCX parsing (add `docx` library)
   - TXT/MD/CSV parsing (simple file reading)
   - Unified interface: `extractText(file: File, type: string): Promise<string>`

2. **Chunking (`lib/knowledge/chunk.ts`):**
   - Current: 700 chars, 120 overlap
   - Proposed: Configurable size (800-1200 tokens ≈ 3000-4000 chars), overlap (150-200 chars)
   - Preserve paragraph boundaries when possible
   - Add chunk metadata (index, document title, section)

3. **Embedding (`lib/knowledge/embed.ts`):**
   - Reuse OpenAI embedding API call pattern
   - Standardize on `text-embedding-3-large` (1536 dims) for consistency
   - Batch processing (64 chunks per call)
   - Error handling and retries

4. **Search (`lib/knowledge/search.ts`):**
   - Unified search interface accepting query + filters
   - Semantic search with pgvector
   - Keyword fallback
   - Hybrid reranking
   - Query expansion (domain synonyms)
   - Snippet extraction

5. **Storage (`lib/knowledge/store.ts`):**
   - Generic upsert pattern (batch size 200)
   - Status tracking (pending → ingesting → ingested/failed)
   - Error handling and rollback

### Refactoring Strategy

**Phase 1: Create Shared Modules**
- Extract common functions to `lib/knowledge/`
- Keep Green Guide code working (no breaking changes)

**Phase 2: Migrate Green Guide**
- Update `scripts/ingest-green-guide.ts` to use shared `ingestDocument()`
- Update `src/lib/rag/greenGuide.ts` to use shared `searchKnowledge()`
- Preserve existing API contracts

**Phase 3: Enable RPC Function**
- Uncomment and test `match_green_guide_chunks` RPC
- Use for faster semantic search

## Gaps & Risks

### Current Limitations

1. **No RPC Function Usage:**
   - RPC `match_green_guide_chunks` exists but is commented out
   - Falls back to fetching all chunks and ranking in-memory (inefficient for large datasets)
   - **Risk:** Performance degradation as chunks grow

2. **Fixed Chunk Size:**
   - 700 chars may be too small for some content types
   - No paragraph/section awareness
   - **Risk:** Context fragmentation

3. **No Metadata Extraction:**
   - Page numbers and headings not extracted from PDF
   - **Risk:** Reduced citation accuracy

4. **Single Source:**
   - Only supports PDF ingestion
   - **Risk:** Cannot ingest DOCX, TXT, MD, CSV documents

5. **No Organization/Event Scoping:**
   - Green Guide is global (no multi-tenancy)
   - **Risk:** Cannot restrict access or associate with events

6. **No Status Tracking:**
   - No ingestion status (pending/ingesting/ingested/failed)
   - **Risk:** No visibility into ingestion failures

7. **Basic RLS:**
   - `allow_read` policy allows all authenticated users
   - **Risk:** No organization-level access control

### Migration Considerations

1. **Embedding Model Consistency:**
   - Green Guide uses `text-embedding-3-small`
   - Plan specifies `text-embedding-3-large`
   - **Decision:** Use `text-embedding-3-large` for new knowledge base, keep Green Guide on `-small` for now (can migrate later)

2. **Chunk Size Migration:**
   - Green Guide: 700 chars
   - New KB: 3000-4000 chars
   - **Decision:** Keep separate chunking strategies initially, unify later if needed

3. **Vector Dimension:**
   - Both models use 1536 dimensions
   - **Decision:** Compatible, can use same pgvector column type

4. **Search Interface:**
   - Green Guide has domain-specific synonyms
   - New KB may need different synonyms
   - **Decision:** Make synonym expansion configurable per source

## Recommendations

1. **Enable RPC Function:**
   - Uncomment `match_green_guide_chunks` usage in `greenGuide.ts`
   - Test performance with full dataset
   - Use for semantic search (fallback to in-memory only if RPC fails)

2. **Extract Shared Utilities:**
   - Create `lib/knowledge/` modules as specified
   - Make chunking/embedding configurable
   - Support multiple file types

3. **Add Metadata Extraction:**
   - Extract page numbers from PDF (pdf-parse provides page info)
   - Extract headings using heuristics or PDF structure
   - Store in chunk metadata

4. **Implement Status Tracking:**
   - Add status column to `knowledge_base` table
   - Track ingestion progress
   - Log errors for debugging

5. **Enhance RLS:**
   - Add organization_id filtering
   - Restrict access based on user roles
   - Super admin can see all, org users see only their org's docs

6. **Unified Search Interface:**
   - Create `retrieveContext()` function combining Green Guide + KB search
   - Use in all AI pipelines (chat, insights, decision support)
   - Maintain source attribution (Green Guide vs uploaded docs)

## Implementation Notes

- Green Guide ingestion is a one-time script (not API-driven)
- New KB will support API-driven uploads
- Both systems can coexist and be searched together
- Consider creating a unified `knowledge_sources` view that combines both tables for search



