-- AI Knowledge Base Migration
-- Extends knowledge_base table for document uploads and creates knowledge_embeddings table
-- Safe to run multiple times (uses IF NOT EXISTS guards)

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Extend knowledge_base table with document upload fields
DO $$
BEGIN
  -- Add type column for document format
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'knowledge_base' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.knowledge_base 
    ADD COLUMN type TEXT CHECK (type IN ('pdf','docx','txt','md','csv','unknown','article'));
  END IF;

  -- Add source column (user-upload vs system)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'knowledge_base' 
    AND column_name = 'source'
  ) THEN
    ALTER TABLE public.knowledge_base 
    ADD COLUMN source TEXT NOT NULL DEFAULT 'article' CHECK (source IN ('user-upload','system','article'));
  END IF;

  -- Add uploader_id column (separate from author_id for clarity)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'knowledge_base' 
    AND column_name = 'uploader_id'
  ) THEN
    ALTER TABLE public.knowledge_base 
    ADD COLUMN uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Add bytes column for file size
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'knowledge_base' 
    AND column_name = 'bytes'
  ) THEN
    ALTER TABLE public.knowledge_base 
    ADD COLUMN bytes INTEGER DEFAULT 0;
  END IF;

  -- Add error column for ingestion failures
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'knowledge_base' 
    AND column_name = 'error'
  ) THEN
    ALTER TABLE public.knowledge_base 
    ADD COLUMN error TEXT;
  END IF;

  -- Update status constraint to include ingestion statuses
  -- First, drop the existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'knowledge_base' 
    AND constraint_name = 'knowledge_base_status_check'
  ) THEN
    ALTER TABLE public.knowledge_base DROP CONSTRAINT knowledge_base_status_check;
  END IF;

  -- Add new constraint with ingestion statuses
  ALTER TABLE public.knowledge_base 
  ADD CONSTRAINT knowledge_base_status_check 
  CHECK (status IN ('draft','published','archived','pending','ingesting','ingested','failed'));

  -- Set default type for existing rows
  UPDATE public.knowledge_base 
  SET type = 'article', source = 'article' 
  WHERE type IS NULL OR source IS NULL;
END $$;

-- Create knowledge_embeddings table for storing document chunks and embeddings
CREATE TABLE IF NOT EXISTS public.knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_id UUID NOT NULL REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT knowledge_embeddings_knowledge_chunk_unique UNIQUE (knowledge_id, chunk_index)
);

-- Create indexes for knowledge_embeddings
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_knowledge_id 
  ON public.knowledge_embeddings(knowledge_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_metadata 
  ON public.knowledge_embeddings USING gin(metadata);

-- Create vector index for semantic search (using cosine similarity)
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_vector 
  ON public.knowledge_embeddings 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- Enable RLS on knowledge_embeddings
ALTER TABLE public.knowledge_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS policy for knowledge_embeddings: users can read embeddings for knowledge_base entries they can access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'knowledge_embeddings' 
    AND policyname = 'knowledge_embeddings_access'
  ) THEN
    CREATE POLICY knowledge_embeddings_access ON public.knowledge_embeddings
      FOR SELECT
      USING (
        knowledge_id IN (
          SELECT id FROM public.knowledge_base
          WHERE organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
          )
          OR EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'super_admin'
          )
        )
      );
  END IF;
END $$;

-- Create RPC function for semantic search (similar to green_guide_chunks)
CREATE OR REPLACE FUNCTION public.match_knowledge_embeddings(
  query_embedding vector(1536),
  match_count INTEGER DEFAULT 5,
  organization_filter UUID DEFAULT NULL,
  event_filter UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  knowledge_id UUID,
  content TEXT,
  chunk_index INTEGER,
  similarity FLOAT4,
  metadata JSONB
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    ke.id,
    ke.knowledge_id,
    ke.content,
    ke.chunk_index,
    (1 - (ke.embedding <=> query_embedding))::FLOAT4 AS similarity,
    ke.metadata
  FROM public.knowledge_embeddings ke
  INNER JOIN public.knowledge_base kb ON ke.knowledge_id = kb.id
  WHERE 
    kb.status IN ('ingested', 'published')
    AND (organization_filter IS NULL OR kb.organization_id = organization_filter)
    AND (event_filter IS NULL OR kb.event_id = event_filter)
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Add helpful indexes on knowledge_base for filtering
CREATE INDEX IF NOT EXISTS idx_knowledge_base_type ON public.knowledge_base(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_source ON public.knowledge_base(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_status ON public.knowledge_base(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_uploader ON public.knowledge_base(uploader_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_event ON public.knowledge_base(event_id);

-- Update existing knowledge_base rows to have proper defaults
UPDATE public.knowledge_base 
SET 
  type = COALESCE(type, 'article'),
  source = COALESCE(source, 'article'),
  uploader_id = COALESCE(uploader_id, author_id)
WHERE type IS NULL OR source IS NULL;



