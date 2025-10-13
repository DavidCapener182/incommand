-- RPC to perform pgvector similarity search
-- Requires: create function with sql security definer if desired

create or replace function public.match_green_guide_chunks(
  query_embedding vector,
  match_count int default 5
)
returns table(id uuid, content text, page int, heading text, similarity float4)
language sql
stable
as $$
  select g.id, g.content, g.page, g.heading,
         (1 - (g.embedding <-> query_embedding))::float4 as similarity
  from public.green_guide_chunks g
  order by g.embedding <-> query_embedding
  limit match_count;
$$;


