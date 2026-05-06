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

    const {
      video_url, video_id, title,
      views_target, likes_target, comments_target, follows_target,
      watch_time_min, watch_time_max, coins_budget
    } = await req.json()

    const { data: profile } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', user.id)
      .single()

    if (!profile || profile.coins < coins_budget) {
      throw new Error('Insufficient coins')
    }

    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        user_id: user.id,
        video_url,
        video_id,
        title,
        views_target: views_target || 0,
        likes_target: likes_target || 0,
        comments_target: comments_target || 0,
        follows_target: follows_target || 0,
        watch_time_min: watch_time_min || 5,
        watch_time_max: watch_time_max || 30,
        coins_budget
      })
      .select()
      .single()

    if (campaignError) throw campaignError

    const tasks = []
    for (let i = 0; i < views_target; i++) {
      tasks.push({ campaign_id: campaign.id, action_type: 'view', status: 'pending' })
    }
    for (let i = 0; i < likes_target; i++) {
      tasks.push({ campaign_id: campaign.id, action_type: 'like', status: 'pending' })
    }
    for (let i = 0; i < comments_target; i++) {
      tasks.push({ campaign_id: campaign.id, action_type: 'comment', status: 'pending' })
    }
    for (let i = 0; i < follows_target; i++) {
      tasks.push({ campaign_id: campaign.id, action_type: 'follow', status: 'pending' })
    }

    if (tasks.length > 0) {
      await supabase.from('tasks').insert(tasks)
    }

    await supabase.rpc('process_coin_transaction', {
      p_user_id: user.id,
      p_amount: -coins_budget,
      p_type: 'spend_campaign',
      p_campaign_id: campaign.id
    })

    return new Response(JSON.stringify({ success: true, campaign }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
