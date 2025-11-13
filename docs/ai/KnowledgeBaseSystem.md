# Knowledge Base System Architecture

## Overview

The Knowledge Base System is an AI-powered document ingestion and retrieval system that enables semantic search across uploaded documents (PDF, DOCX, TXT, MD, CSV) and integrates with the existing Green Guide RAG system. It provides unified context retrieval for AI-powered features including chat, insights, and decision support.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin UI                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Upload     │  │    Search    │  │   Status     │     │
│  │   (Drag &    │  │   (Semantic) │  │   Tracking   │     │
│  │    Drop)     │  │              │  │              │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼─────────────────┼─────────────┘
          │                  │                 │
          ▼                  ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer                                │
│  ┌──────────────┐              ┌──────────────┐            │
│  │ /api/        │              │ /api/        │            │
│  │ knowledge/   │              │ knowledge/   │            │
│  │ upload       │              │ search      │            │
│  └──────┬───────┘              └──────┬───────┘            │
└─────────┼──────────────────────────────┼───────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Ingestion & Search Layer                        │
│  ┌──────────────┐              ┌──────────────┐            │
│  │ lib/         │              │ lib/         │            │
│  │ knowledge/   │              │ knowledge/   │            │
│  │ ingest.ts    │              │ search.ts    │            │
│  │              │              │              │            │
│  │ - Extract    │              │ - Semantic   │            │
│  │ - Chunk      │              │ - Hybrid     │            │
│  │ - Embed      │              │ - Rerank     │            │
│  │ - Store      │              │ - Snippets   │            │
│  └──────┬───────┘              └──────┬───────┘            │
└─────────┼──────────────────────────────┼───────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│  ┌──────────────┐              ┌──────────────┐            │
│  │ knowledge_   │              │ knowledge_   │            │
│  │ base         │              │ embeddings   │            │
│  │              │              │              │            │
│  │ - Metadata   │              │ - Chunks     │            │
│  │ - Status     │              │ - Vectors    │            │
│  │ - Files      │              │ - Metadata   │            │
│  └──────────────┘              └──────┬───────┘            │
│                                       │                     │
│                              ┌────────▼────────┐            │
│                              │  pgvector       │            │
│                              │  (cosine sim)   │            │
│                              └─────────────────┘            │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Integration Layer                             │
│  ┌──────────────┐              ┌──────────────┐            │
│  │ lib/ai/       │              │ lib/rag/     │            │
│  │ retrieve      │              │ greenGuide  │            │
│  │ Context.ts    │              │             │            │
│  │               │              │             │            │
│  │ - Unified     │◄─────────────┤ - Green     │            │
│  │   Search      │              │   Guide     │            │
│  │ - Format      │              │   Search    │            │
│  │   Context     │              │             │            │
│  └──────┬───────┘              └──────────────┘            │
│         │                                                    │
│         ▼                                                    │
│  ┌────────────────────────────────────────────┐             │
│  │  AI Pipelines                              │             │
│  │  - Chat (/api/chat/ai)                     │             │
│  │  - Insights (eventSummaryGenerator)        │             │
│  │  - Decision Support (decisionSupport)      │             │
│  └────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Ingestion Flow

1. **Upload**: User uploads file via admin UI (drag-and-drop or file picker)
2. **Validation**: File type detection, size validation (max 25MB)
3. **Storage**: Raw file stored in Supabase Storage; `knowledge_base` record created with status `pending`
4. **Ingestion Trigger**: Admin clicks “Ingest” (or retry) which calls `/api/knowledge/ingest`
5. **Extraction**: Text extracted from stored file (PDF → `pdf-parse`, DOCX → `pizzip` + `docxtemplater`, TXT/MD/CSV → direct read)
6. **Chunking**: Text split into overlapping chunks (~3000 chars, 200 overlap)
7. **Embedding**: Generate embeddings using OpenAI `text-embedding-3-small` (1536 dims) and store in `knowledge_embeddings`
8. **Status Update**: Update record to `ingesting` during processing, `ingested` on success, `failed` with error on issues

### Search Flow

1. **Query**: User submits search query
2. **Query Expansion**: Add domain-specific synonyms
3. **Embedding**: Generate query embedding
4. **Semantic Search**: 
   - Try RPC function `match_knowledge_embeddings` (fastest)
   - Fallback to in-memory cosine similarity ranking
   - Filter by organization/event if specified
5. **Hybrid Reranking**: Combine semantic (60%) + keyword (30%) + title bonus (10%)
6. **Snippet Extraction**: Extract relevant sentences with context
7. **Results**: Return top K results with scores and metadata

### AI Integration Flow

1. **Query Detection**: Check if query needs knowledge context
2. **Unified Retrieval**: Search both Knowledge Base and Green Guide in parallel
3. **Context Formatting**: Format results for LLM prompt injection
4. **Prompt Enhancement**: Add formatted context to system prompt
5. **Response Generation**: LLM generates response with citations

## Database Schema

### `knowledge_base` Table

```sql
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('pdf','docx','txt','md','csv','unknown','article')),
  source TEXT DEFAULT 'article' CHECK (source IN ('user-upload','system','article')),
  uploader_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  event_id UUID REFERENCES events(id),
  tags TEXT[] DEFAULT '{}',
  bytes INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('draft','published','archived','pending','ingesting','ingested','failed')),
  error TEXT,
  body TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  version INTEGER DEFAULT 1,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `knowledge_embeddings` Table

```sql
CREATE TABLE knowledge_embeddings (
  id UUID PRIMARY KEY,
  knowledge_id UUID NOT NULL REFERENCES knowledge_base(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(knowledge_id, chunk_index)
);

-- Indexes
CREATE INDEX idx_knowledge_embeddings_knowledge_id ON knowledge_embeddings(knowledge_id);
CREATE INDEX idx_knowledge_embeddings_metadata ON knowledge_embeddings USING gin(metadata);
CREATE INDEX idx_knowledge_embeddings_vector ON knowledge_embeddings 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### RPC Function

```sql
CREATE FUNCTION match_knowledge_embeddings(
  query_embedding vector(1536),
  match_count INTEGER DEFAULT 5,
  organization_filter UUID DEFAULT NULL,
  event_filter UUID DEFAULT NULL
)
RETURNS TABLE(id UUID, knowledge_id UUID, content TEXT, chunk_index INTEGER, similarity FLOAT4, metadata JSONB)
```

## API Contracts

### POST `/api/knowledge/upload`

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `file`: File (required)
  - `title`: string (optional, defaults to filename)
  - `organizationId`: UUID (optional)
  - `eventId`: UUID (optional)
  - `tags`: comma-separated string (optional)

**Response:**
```json
{
  "success": true,
  "knowledgeId": "uuid",
  "status": "pending",
  "bytes": 1024000,
  "type": "pdf",
  "storagePath": "uuid/1699472231-document.pdf",
  "message": "File uploaded successfully. Start ingestion when ready."
}
```

**Errors:**
- `400`: Missing file, invalid file type, file too large
- `403`: Access denied to organization
- `500`: Ingestion failure

### POST `/api/knowledge/ingest`

**Request:**
- Method: POST
- Content-Type: application/json
- Body:
  - `knowledgeId`: UUID (required)

**Response:**
```json
{
  "success": true,
  "knowledgeId": "uuid",
  "chunksCreated": 42,
  "bytes": 1024000,
  "type": "pdf"
}
```

### POST `/api/knowledge/search`

**Request:**
```json
{
  "query": "What is the capacity of Creamfields?",
  "topK": 5,
  "organizationId": "uuid",
  "eventId": "uuid",
  "useHybrid": true
}
```

**Response:**
```json
{
  "results": [
    {
      "knowledgeId": "uuid",
      "title": "Creamfields Briefing.pdf",
      "content": "The site capacity is limited to 70,000 attendees...",
      "score": 0.92,
      "metadata": {
        "chunkIndex": 5,
        "documentTitle": "Creamfields Briefing.pdf",
        "organizationId": "uuid",
        "eventId": "uuid"
      },
      "source": "knowledge-base"
    }
  ],
  "count": 1
}
```

## Security & Access Control

### Row-Level Security (RLS)

**`knowledge_base`:**
- Users can view entries for organizations they're members of
- Super admins can view all entries
- Organization owners can modify their organization's entries

**`knowledge_embeddings`:**
- Inherits access from `knowledge_base` via join
- Users can only search embeddings for accessible knowledge_base entries

### Authentication

- All API endpoints require authentication via `withAdminAuth` middleware
- Minimum role: `content_editor`
- Organization context enforced for non-super-admin users

## Limits & Constraints

### File Limits
- **Max file size**: 25MB
- **Max chunks per document**: 2,000 chunks
- **Supported formats**: PDF, DOCX, TXT, MD, CSV

### Chunking Configuration
- **Chunk size**: ~3,000 characters (~800-1200 tokens)
- **Overlap**: 200 characters
- **Preserve paragraphs**: Attempts to maintain paragraph boundaries

### Embedding Configuration
- **Model**: `text-embedding-3-large`
- **Dimension**: 1536
- **Batch size**: 64 chunks per API call
- **Storage batch**: 200 chunks per upsert

### Search Configuration
- **Default topK**: 5 results per source
- **Max topK**: 20 results
- **Hybrid scoring**: 60% semantic + 30% keyword + 10% title bonus
- **RPC fallback**: In-memory ranking if RPC unavailable

## Telemetry & Monitoring

### Ingestion Metrics
- Duration (start to completion)
- Chunks created
- Bytes processed
- Success/failure rate
- Error messages logged

### Search Metrics
- Query count
- Average response time
- Zero-result queries
- RPC vs fallback usage

### Logging
- Console logs for ingestion progress
- Error logging with stack traces
- Search query logging (without sensitive data)

## Environment Variables

Required:
- `OPENAI_API_KEY`: For embedding generation
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: For service-level operations

Optional:
- `NEXT_PUBLIC_SUPABASE_URL`: For client-side operations
- `SUPABASE_ANON_KEY`: For RLS-enabled queries

## Integration Points

### Green Guide Integration

The system reuses patterns from Green Guide ingestion:
- **Chunking**: Similar overlap strategy (adapted for larger chunks)
- **Embedding**: Same OpenAI API, upgraded to `text-embedding-3-large`
- **Search**: Unified interface combining both sources
- **RPC Function**: Similar pattern to `match_green_guide_chunks`

### AI Pipeline Integration

**Chat (`/api/chat/ai`):**
- Uses `retrieveContext()` to get unified knowledge
- Formats context for LLM prompt injection
- Includes citations in response

**Insights (`eventSummaryGenerator.ts`):**
- Can reference knowledge base for event-specific context
- Example: "Capacity exceeded 90% of documented limit"

**Decision Support (`decisionSupport.ts`):**
- Can retrieve relevant procedures from knowledge base
- Example: "As per briefing document, staff threshold is 400"

## Example Use Cases

### Use Case 1: Capacity Query

**User Query:** "What is the capacity of Creamfields?"

**Flow:**
1. Query detected as needing knowledge context
2. Search Knowledge Base for "capacity Creamfields"
3. Find chunk: "Creamfields 2024 Site Briefing: Capacity limited to 70,000 attendees"
4. Inject into LLM prompt
5. **Response:** "According to the Creamfields briefing document, the site capacity is 70,000 attendees."

### Use Case 2: AI Insight Generation

**Context:** Event dashboard showing 69,200 current attendance

**AI Insight:** "The current attendance projection for Creamfields is 69,200 — 99% of the documented capacity limit (70,000) from the uploaded briefing document."

### Use Case 3: Procedure Lookup

**User Query:** "What should we do if capacity is exceeded?"

**Flow:**
1. Search both Green Guide and Knowledge Base
2. Find Green Guide: Crowd management procedures
3. Find Knowledge Base: Event-specific capacity protocols
4. Combine and format for LLM
5. **Response:** Provides both general best practices and event-specific procedures

## Troubleshooting

### Common Issues

**Issue: DOCX parsing fails**
- **Cause**: Missing `pizzip` and `docxtemplater` packages
- **Solution**: `npm install pizzip docxtemplater`

**Issue: Embedding generation fails**
- **Cause**: Missing or invalid `OPENAI_API_KEY`
- **Solution**: Verify API key in environment variables

**Issue: Search returns no results**
- **Cause**: No documents ingested or RLS blocking access
- **Solution**: Check ingestion status, verify organization access

**Issue: Slow search performance**
- **Cause**: RPC function not available, using in-memory ranking
- **Solution**: Verify RPC function exists, check vector index

### Debugging

Enable detailed logging:
```typescript
console.log('Ingestion:', { knowledgeId, chunksCreated, duration })
console.log('Search:', { query, resultsCount, method })
```

Check ingestion status:
```sql
SELECT id, title, status, error, updated_at 
FROM knowledge_base 
WHERE status IN ('ingesting', 'failed')
ORDER BY updated_at DESC;
```

## Future Enhancements

1. **Metadata Extraction**: Extract page numbers, headings from PDFs
2. **Incremental Updates**: Re-ingest only changed sections
3. **Multi-language Support**: Language detection and translation
4. **Document Versioning**: Track document versions and changes
5. **Advanced RLS**: Fine-grained access control per document
6. **Caching**: Cache frequent queries and embeddings
7. **Analytics Dashboard**: Visualize search patterns and usage

## Related Documentation

- [Green Guide Analysis](./GreenGuide_Analysis.md) - Details on Green Guide system and reuse
- [API Documentation](../../API_DOCUMENTATION.md) - General API reference
- [Security Guide](../../SECURITY.md) - Security best practices

