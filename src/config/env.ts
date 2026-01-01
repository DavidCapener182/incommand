import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url().default('http://localhost:54321'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('service-role-placeholder'),
  SUPABASE_ANON_KEY: z.string().min(1).default('anon-key-placeholder'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default('http://localhost:54321'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default('public-anon-key-placeholder'),
  // Optional environment variables
  ANALYZE: z.string().optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.string().optional(),
})

export const env = envSchema.parse(process.env)

const missingKeys = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
].filter((key) => !process.env[key])

if (missingKeys.length > 0) {
  console.warn(
    `Missing environment variables: ${missingKeys.join(
      ', '
    )}. Using fallback values for build-time operations.`
  )
}

if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY must never be prefixed with NEXT_PUBLIC_ - this would expose server secrets to the client'
  )
}

export default env
