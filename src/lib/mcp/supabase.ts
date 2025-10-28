// MCP Supabase integration
// This file provides a wrapper around the MCP Supabase tools

import { createClient } from '@supabase/supabase-js'
import { env } from '@/config/env'

// Helper function to get project ID from environment
export function getSupabaseProjectId(): string {
  const projectId = process.env.SUPABASE_PROJECT_ID || 'wngqphzpxhderwfjjzla'
  return projectId
}

// Get Supabase client using existing configuration
export function getSupabaseClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}

// MCP Supabase execute SQL function
// This simulates the MCP tool call for database operations
export async function mcp_supabase_execute_sql({ project_id, query, params = [] }: {
  project_id: string
  query: string
  params?: any[]
}) {
  // For now, we'll use a direct Supabase client approach
  // In a real MCP environment, this would call the MCP Supabase tool
  
  const supabase = await getSupabaseClient()
  
  // Execute the raw SQL query using Supabase RPC
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: query,
    query_params: params
  })
  
  if (error) {
    console.error('MCP Supabase SQL execution error:', error)
    throw error
  }
  
  return { data, error: null, rows: data }
}

// Helper function for common database operations
export async function executeQuery(query: string, params: any[] = []) {
  return await mcp_supabase_execute_sql({
    project_id: getSupabaseProjectId(),
    query,
    params
  })
}
