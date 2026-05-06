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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) throw new Error('Unauthorized')

    const { task_id, action_type, watch_time } = await req.json()

    const { data: task } = await supabase
      .from('tasks')
      .select('*, campaigns!inner(user_id)')
      .eq('id', task_id)
      .eq('worker_id', user.id)
      .single()

    if (!task) throw new Error('Task not found or not assigned to you')

    let coinsEarned = 0
    if (action_type === 'view') {
      coinsEarned = 1 + Math.floor((watch_time || 10) / 10)
    } else if (action_type === 'like') {
      coinsEarned = 2
    } else if (action_type === 'comment') {
      coinsEarned = 5
    } else if (action_type === 'follow') {
      coinsEarned = 10
    }

    await supabase
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        watch_time
      })
      .eq('id', task_id)

    await supabase.rpc('increment_campaign_delivered', {
      p_campaign_id: task.campaign_id,
      p_field: `${action_type}s_delivered`,
      p_amount: 1
    })

    await supabase.rpc('process_coin_transaction', {
      p_user_id: user.id,
      p_amount: coinsEarned,
      p_type: `earn_${action_type}`,
      p_task_id: task_id,
      p_campaign_id: task.campaign_id
    })

    await supabase.from('worker_logs').insert({
      worker_id: user.id,
      task_id,
      action: `completed_${action_type}`,
      success: true
    })

    return new Response(JSON.stringify({ success: true, coins_earned: coinsEarned }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
