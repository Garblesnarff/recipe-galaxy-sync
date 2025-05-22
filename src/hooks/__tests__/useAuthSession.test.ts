import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { mockSupabaseClient } from '@/test/mocks'

describe('useAuthSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with checking state true', () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    const { result } = renderHook(() => useAuthSession())
    
    expect(result.current.isChecking).toBe(true)
    expect(result.current.session).toBe(null)
    expect(result.current.userId).toBe(null)
  })

  it('updates session when user is authenticated', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token-123'
    }

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    const { result } = renderHook(() => useAuthSession())

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false)
    })

    expect(result.current.session).toEqual(mockSession)
    expect(result.current.userId).toBe('user-123')
  })

  it('handles auth state changes', () => {
    const mockUnsubscribe = vi.fn();
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    });

    renderHook(() => useAuthSession());

    expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalled();
    // If you need to test the callback itself, you'd need a more advanced mock
    // that captures the callback and allows you to invoke it.
  });
})
