'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function SupabaseTest() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  let auth;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available in SupabaseTest:', error);
    auth = { user: null };
  }
  const { user } = auth;

  useEffect(() => {
    async function testConnection() {
      try {
        // First test the connection
        const { error: healthError } = await supabase.from('_healthy').select('*').limit(1)
        if (healthError) {
          console.error('Health check error:', healthError)
          setError('Database connection error')
          setIsConnected(false)
          return
        }

        // Then test authentication
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (authError) {
          console.error('Auth error:', authError)
          setError('Authentication error')
          setIsConnected(false)
          return
        }

        if (!session) {
          setError('No active session')
          setIsConnected(false)
          return
        }

        setIsConnected(true)
        setError(null)
      } catch (error) {
        console.error('Supabase connection error:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
        setIsConnected(false)
      }
    }

    if (user) {
      testConnection()
    }
  }, [user])

  return (
    <div className="p-4 bg-white shadow rounded-lg m-4">
      <h2 className="text-lg font-semibold mb-2">Supabase Connection Status:</h2>
      {isConnected === null ? (
        <p className="text-gray-600">Testing connection...</p>
      ) : isConnected ? (
        <p className="text-green-600">Connected to Supabase</p>
      ) : (
        <div>
          <p className="text-red-600">Failed to connect to Supabase</p>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
      )}
    </div>
  )
} 