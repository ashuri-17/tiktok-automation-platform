import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://glavmoosywxyekcomwtn.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsYXZtb29zeXd4eWVrY29td3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTg5NDMsImV4cCI6MjA5MzYzNDk0M30.oIB7e1ZABiRV-3cSA0orL0INHD5Qk5nprH6tZmv2N0A'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
