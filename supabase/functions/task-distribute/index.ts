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

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { ip_address, geo } = await req.json()

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id, campaign_id, action_type,
        campaigns!inner(video_url, video_id, watch_time_min, watch_time_max)
      `)
      .eq('status', 'pending')
      .limit(10)

    if (error || !tasks || tasks.length === 0) {
      return new Response(JSON.stringify({ task: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const selectedTask = tasks[0]

    await supabase
      .from('tasks')
      .update({
        worker_id: user.id,
        status: 'assigned',
        assigned_at: new Date().toISOString()
      })
      .eq('id', selectedTask.id)

    return new Response(JSON.stringify({ task: selectedTask }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
