'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showStayLoggedIn, setShowStayLoggedIn] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let logoutTimeout: NodeJS.Timeout | null = null;
    let stayLoggedInTimeout: NodeJS.Timeout | null = null;

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if (session) {
        // Supabase session.expires_at is UNIX timestamp (seconds)
        const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + 12 * 60 * 60 * 1000;
        const sessionStart = expiresAt - 12 * 60 * 60 * 1000;
        const now = Date.now();
        const ms12Hours = 12 * 60 * 60 * 1000;
        const ms11_5Hours = 11.5 * 60 * 60 * 1000;
        const timeElapsed = now - sessionStart;
        const timeToPrompt = ms11_5Hours - timeElapsed > 0 ? ms11_5Hours - timeElapsed : 0;
        const timeToLogout = ms12Hours - timeElapsed > 0 ? ms12Hours - timeElapsed : 0;

        if (timeToPrompt > 0) {
          stayLoggedInTimeout = setTimeout(() => setShowStayLoggedIn(true), timeToPrompt);
        }
        if (timeToLogout > 0) {
          logoutTimeout = setTimeout(() => signOut(), timeToLogout);
        }
      }
    })

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe();
      if (logoutTimeout) clearTimeout(logoutTimeout);
      if (stayLoggedInTimeout) clearTimeout(stayLoggedInTimeout);
    }
  }, [])

  // Temporarily disable route protection
  /*
  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login') {
        router.push('/login')
      } else if (user && pathname === '/login') {
        router.push('/incidents')
      }
    }
  }, [user, loading, pathname, router])
  */

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleStayLoggedIn = () => {
    setShowStayLoggedIn(false);
    window.location.reload(); // Refresh session
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {!loading && (
        <>
          {showStayLoggedIn && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg flex flex-col items-center">
                <p className="mb-4 text-lg font-semibold">Stay logged in?</p>
                <button
                  className="px-4 py-2 bg-[#2A3990] text-white rounded hover:bg-[#1e2a6a]"
                  onClick={handleStayLoggedIn}
                >
                  Yes, stay logged in
                </button>
              </div>
            </div>
          )}
          {children}
        </>
      )}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
} 