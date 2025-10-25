#!/usr/bin/env ts-node

/**
 * Environment validation script for CI/CD
 * Ensures all required environment variables are present before deployment
 */

import { env } from '../config/env'

console.log('🔍 Validating environment variables...')

try {
  // This will throw if any required env vars are missing
  const validatedEnv = env
  
  console.log('✅ Environment validation passed')
  console.log(`📊 Environment: ${validatedEnv.NODE_ENV}`)
  console.log(`🔗 Supabase URL configured: ${validatedEnv.SUPABASE_URL ? 'Yes' : 'No'}`)
  console.log(`🔑 Service role key configured: ${validatedEnv.SUPABASE_SERVICE_ROLE_KEY ? 'Yes' : 'No'}`)
  console.log(`🌐 Public URL configured: ${validatedEnv.NEXT_PUBLIC_SUPABASE_URL ? 'Yes' : 'No'}`)
  console.log(`🔐 Public anon key configured: ${validatedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Yes' : 'No'}`)
  
  // Additional security checks
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SECURITY VIOLATION: SUPABASE_SERVICE_ROLE_KEY is exposed to client!')
    process.exit(1)
  }
  
  console.log('🚀 Environment is ready for deployment')
  process.exit(0)
  
} catch (error) {
  console.error('❌ Environment validation failed:')
  console.error(error instanceof Error ? error.message : 'Unknown error')
  process.exit(1)
}
