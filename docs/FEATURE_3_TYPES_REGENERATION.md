# Feature 3: Regenerating Supabase Types

After applying the database migration for Decision Logging, you need to regenerate the Supabase TypeScript types to include the new tables.

## Steps to Regenerate Types

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Generate types from your Supabase project**:
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
   ```

   Or if you have a local Supabase setup:
   ```bash
   npx supabase gen types typescript --local > src/types/supabase.ts
   ```

3. **Alternative: Use Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the TypeScript types
   - Replace the contents of `src/types/supabase.ts`

## What This Will Fix

After regenerating types, the following TypeScript errors will be resolved:
- `Property 'decisions' does not exist on type 'Tables'`
- `Property 'decision_evidence' does not exist on type 'Tables'`
- `Property 'decision_annotations' does not exist on type 'Tables'`
- Runtime errors related to type access

## Temporary Workaround

Until types are regenerated, the code uses fallback types defined in `src/types/decisions.ts`. These provide type safety but may not match the exact database schema.

