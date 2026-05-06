import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        setState(prev => ({
          ...prev,
          user: session?.user || null,
          loading: false,
        }))
      } catch (err) {
        console.error('Auth check failed:', err)
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Auth check failed',
          loading: false,
        }))
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({
        ...prev,
        user: session?.user || null,
      }))
    })

    return () => subscription?.unsubscribe()
  }, [])

  return state
}
