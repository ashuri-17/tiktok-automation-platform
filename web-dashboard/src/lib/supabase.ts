import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nkbgbuskribdukhszbqk.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rYmdidXNrcmliZHVraHN6YnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzYxOTAsImV4cCI6MjA5NDQ1MjE5MH0._8pr-vbNZypMGRy4tzUcKOuK4V01NQ3lnLXgTldf9xc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
