import { serve } from "https://deno.land/x/supabase@0.1.0/mod.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
      .from('profiles')
      .select('coins, worker_status')
      .eq('id', user.id)
      .single()

    const { data: completedTasks } = await supabase
      .from('tasks')
      .select('action_type', { count: 'exact' })
      .eq('worker_id', user.id)
      .eq('status', 'completed')

    const { data: activeCampaigns } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'active')

    return new Response(JSON.stringify({
      coins: profile?.coins || 0,
      worker_status: profile?.worker_status || 'stopped',
      tasks_completed: completedTasks?.length || 0,
      active_campaigns: activeCampaigns?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
