import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  username: string
  tiktok_username: string
  coins: number
  worker_status: 'stopped' | 'running' | 'banned'
  is_admin: boolean
  created_at: string
  updated_at: string
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error

        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError) throw profileError

          setState(prev => ({
            ...prev,
            user: session.user,
            profile: profile as UserProfile,
            loading: false,
          }))
        } else {
          setState(prev => ({
            ...prev,
            user: null,
            profile: null,
            loading: false,
          }))
        }
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setState(prev => ({
          ...prev,
          user: session.user,
          profile: profile as UserProfile,
        }))
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          profile: null,
        }))
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, username: string, tiktokUsername: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Create profile with 50 free coins
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                username: username || 'User',
                tiktok_username: tiktokUsername || '@user',
                coins: 50, // Free starter coins
                worker_status: 'stopped',
                is_admin: false,
              }
            ])

          if (profileError) {
            console.error('Profile creation error:', profileError)
            // Try to update if insert fails (profile might already exist)
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                username: username || 'User',
                tiktok_username: tiktokUsername || '@user',
                coins: 50,
              })
              .eq('id', data.user.id)
            
            if (updateError) {
              console.error('Profile update error:', updateError)
            }
          }
        } catch (err) {
          console.error('Profile creation exception:', err)
        }

        // If email confirmation is required, user won't be logged in yet
        // So we just return success without setting user state
        setState(prev => ({
          ...prev,
          loading: false,
        }))
      }

      return { success: true, error: null }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Signup failed'
      setState(prev => ({
        ...prev,
        error: errorMsg,
        loading: false,
      }))
      return { success: false, error: errorMsg }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        setState(prev => ({
          ...prev,
          user: data.user,
          profile: profile as UserProfile,
          loading: false,
        }))
      }

      return { success: true, error: null }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed'
      setState(prev => ({
        ...prev,
        error: errorMsg,
        loading: false,
      }))
      return { success: false, error: errorMsg }
    }
  }

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setState(prev => ({
        ...prev,
        user: null,
        profile: null,
        loading: false,
      }))

      return { success: true, error: null }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Logout failed'
      setState(prev => ({
        ...prev,
        error: errorMsg,
        loading: false,
      }))
      return { success: false, error: errorMsg }
    }
  }

  return {
    user: state.user,
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    signUp,
    signIn,
    signOut,
  }
}
