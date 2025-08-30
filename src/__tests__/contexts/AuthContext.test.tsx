import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { mockUser } from '@/__tests__/utils/test-utils'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Test component to access context
const TestComponent = () => {
  const { user, role, loading, signOut, systemSettings, userPreferences } = useAuth()
  
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No user'}</div>
      <div data-testid="role">{role || 'No role'}</div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="system-settings">{systemSettings ? 'Settings loaded' : 'No settings'}</div>
      <div data-testid="user-preferences">{userPreferences ? 'Preferences loaded' : 'No preferences'}</div>
      <button data-testid="sign-out" onClick={signOut}>
        Sign Out
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear sessionStorage
    if (typeof window !== 'undefined') {
      window.sessionStorage.clear()
    }
  })

  describe('AuthProvider', () => {
    it('renders children without crashing', () => {
      render(
        <AuthProvider>
          <div data-testid="test-child">Test Child</div>
        </AuthProvider>
      )
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })

    it('provides initial loading state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
    })

    it('handles user authentication state', async () => {
      // Mock successful user fetch
      const { supabase } = require('@/lib/supabase')
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })
    })

    it('handles authentication errors gracefully', async () => {
      // Mock authentication error
      const { supabase } = require('@/lib/supabase')
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
      })
    })

    it('fetches user role when user is authenticated', async () => {
      // Mock successful user fetch
      const { supabase } = require('@/lib/supabase')
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('profiles')
      })
    })

    it('caches user role in sessionStorage', async () => {
      // Mock successful user fetch
      const { supabase } = require('@/lib/supabase')
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('role')).toHaveTextContent('admin')
      })

      // Check if role was cached
      const cachedRole = sessionStorage.getItem(`user_role_${mockUser.id}`)
      expect(cachedRole).toBeTruthy()
    })

    it('loads cached role on subsequent renders', async () => {
      // Pre-populate cache
      const cacheData = {
        role: 'superadmin',
        timestamp: Date.now(),
        userId: mockUser.id,
      }
      sessionStorage.setItem(`user_role_${mockUser.id}`, JSON.stringify(cacheData))

      // Mock successful user fetch
      const { supabase } = require("@/lib/supabase"); supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('role')).toHaveTextContent('superadmin')
      })
    })

    it('handles sign out functionality', async () => {
      // Mock successful user fetch
      const { supabase } = require("@/lib/supabase"); supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)
      })

      // Click sign out button
      const signOutButton = screen.getByTestId('sign-out')
      await act(async () => {
        signOutButton.click()
      })

      // Check if signOut was called
      expect(const { supabase } = require("@/lib/supabase"); supabase.auth.signOut).toHaveBeenCalled()
    })

    it('loads system settings', async () => {
      // Mock successful user fetch
      const { supabase } = require("@/lib/supabase"); supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('system-settings')).toHaveTextContent('Settings loaded')
      })
    })

    it('loads user preferences', async () => {
      // Mock successful user fetch
      const { supabase } = require("@/lib/supabase"); supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user-preferences')).toHaveTextContent('Preferences loaded')
      })
    })

    it('handles database errors gracefully', async () => {
      // Mock successful user fetch but database error
      const { supabase } = require("@/lib/supabase"); supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const { supabase } = require("@/lib/supabase"); supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' } 
        }),
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })
    })

    it('handles sessionStorage errors gracefully', async () => {
      // Mock sessionStorage error
      const originalGetItem = sessionStorage.getItem
      sessionStorage.getItem = jest.fn(() => {
        throw new Error('Storage error')
      })

      // Mock successful user fetch
      const { supabase } = require("@/lib/supabase"); supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      // Restore original function
      sessionStorage.getItem = originalGetItem
    })

    it('sets up auth state change listener', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(const { supabase } = require("@/lib/supabase"); supabase.auth.onAuthStateChange).toHaveBeenCalled()
      })
    })

    it('handles auth state changes', async () => {
      let authStateCallback: any
      const { supabase } = require("@/lib/supabase"); supabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authStateCallback).toBeDefined()
      })

      // Simulate auth state change
      await act(async () => {
        authStateCallback('SIGNED_IN', { user: mockUser })
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)
      })
    })
  })

  describe('useAuth Hook', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = jest.fn()

      expect(() => {
        render(<TestComponent />)
      }).toThrow()

      console.error = originalError
    })

    it('provides correct context values', async () => {
      // Mock successful user fetch
      const { supabase } = require("@/lib/supabase"); supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)
        expect(screen.getByTestId('role')).toHaveTextContent('admin')
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })
    })
  })

  describe('Role Caching', () => {
    it('expires cached roles after TTL', async () => {
      // Pre-populate cache with expired timestamp
      const cacheData = {
        role: 'superadmin',
        timestamp: Date.now() - (6 * 60 * 1000), // 6 minutes ago (expired)
        userId: mockUser.id,
      }
      sessionStorage.setItem(`user_role_${mockUser.id}`, JSON.stringify(cacheData))

      // Mock successful user fetch
      const { supabase } = require("@/lib/supabase"); supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        // Should fetch fresh role from database instead of using expired cache
        expect(const { supabase } = require("@/lib/supabase"); supabase.from).toHaveBeenCalledWith('profiles')
      })
    })

    it('clears cache when user signs out', async () => {
      // Pre-populate cache
      const cacheData = {
        role: 'admin',
        timestamp: Date.now(),
        userId: mockUser.id,
      }
      sessionStorage.setItem(`user_role_${mockUser.id}`, JSON.stringify(cacheData))

      // Mock successful user fetch
      const { supabase } = require("@/lib/supabase"); supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)
      })

      // Click sign out button
      const signOutButton = screen.getByTestId('sign-out')
      await act(async () => {
        signOutButton.click()
      })

      // Check if cache was cleared
      const cachedRole = sessionStorage.getItem(`user_role_${mockUser.id}`)
      expect(cachedRole).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      // Mock network error
      const { supabase } = require("@/lib/supabase"); supabase.auth.getUser.mockRejectedValue(new Error('Network error'))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
      })
    })

    it('handles malformed cache data', async () => {
      // Pre-populate cache with malformed data
      sessionStorage.setItem(`user_role_${mockUser.id}`, 'invalid json')

      // Mock successful user fetch
      const { supabase } = require("@/lib/supabase"); supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })
    })
  })
})
