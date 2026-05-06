import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://glavmoosywxyekcomwtn.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsYXZtb29zeXd4eWVrY29td3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTg5NDMsImV4cCI6MjA5MzYzNDk0M30.oIB7e1ZABiRV-3cSA0orL0INHD5Qk5nprH6tZmv2N0A'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          tiktok_username: string
          coins: number
          worker_status: 'stopped' | 'running' | 'banned'
          ip_address: string
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string
          tiktok_username?: string
          coins?: number
          worker_status?: 'stopped' | 'running' | 'banned'
          ip_address?: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          tiktok_username?: string
          coins?: number
          worker_status?: 'stopped' | 'running' | 'banned'
          ip_address?: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          user_id: string
          video_url: string
          video_id: string
          title: string
          views_target: number
          views_delivered: number
          likes_target: number
          likes_delivered: number
          comments_target: number
          comments_delivered: number
          follows_target: number
          follows_delivered: number
          watch_time_min: number
          watch_time_max: number
          geo_target: string[]
          status: 'active' | 'completed' | 'cancelled'
          created_at: string
        }
      }
      tasks: {
        Row: {
          id: string
          campaign_id: string
          user_id: string
          task_type: 'view' | 'like' | 'comment' | 'follow'
          status: 'pending' | 'completed' | 'failed'
          created_at: string
        }
      }
      coin_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'earned' | 'spent'
          reference_id: string
          created_at: string
        }
      }
    }
  }
}
