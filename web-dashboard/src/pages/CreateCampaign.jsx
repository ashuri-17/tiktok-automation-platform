import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function CreateCampaign() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    video_url: '',
    title: '',
    views_target: 0,
    likes_target: 0,
    comments_target: 0,
    follows_target: 0,
    watch_time_min: 5,
    watch_time_max: 30,
    coins_budget: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const extractVideoId = (url) => {
    const match = url.match(/video\/(\d+)/) || url.match(/v=(\d+)/)
    return match ? match[1] : url
  }

  const calculateBudget = () => {
    const views = form.views_target * 1
    const likes = form.likes_target * 2
    const comments = form.comments_target * 5
    const follows = form.follows_target * 10
    return views + likes + comments + follows
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const budget = calculateBudget()
    if (budget > (profile?.coins || 0)) {
      setError('Insufficient coins')
      setLoading(false)
      return
    }

    const { error } = await supabase.functions.invoke('campaign-create', {
      body: {
        video_url: form.video_url,
        video_id: extractVideoId(form.video_url),
        title: form.title,
        views_target: form.views_target,
        likes_target: form.likes_target,
        comments_target: form.comments_target,
        follows_target: form.follows_target,
        watch_time_min: form.watch_time_min,
        watch_time_max: form.watch_time_max,
        coins_budget: budget
      }
    })

    if (error) {
      setError(error.message)
    } else {
      navigate('/campaigns')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-tiktok-darker">
      <div className="w-48 bg-tiktok-dark p-4 border-r border-gray-700">
        <div className="text-tiktok-red font-bold text-xl mb-8">TikFlow</div>
        <nav className="space-y-2">
          <Link to="/" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">📊 Dashboard</Link>
          <Link to="/campaigns/new" className="block text-white bg-tiktok-red px-3 py-2 rounded text-sm">🚀 Create Campaign</Link>
          <Link to="/coins" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">💰 Coins</Link>
          <Link to="/worker" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">⚡ Worker</Link>
          <Link to="/campaigns" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">📈 Campaigns</Link>
        </nav>
      </div>

      <div className="flex-1 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">🚀 Create Campaign</h2>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="bg-tiktok-dark p-6 rounded-lg max-w-2xl">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">TikTok Video URL *</label>
              <input
                type="text"
                value={form.video_url}
                onChange={(e) => setForm({...form, video_url: e.target.value})}
                placeholder="https://www.tiktok.com/@user/video/1234567890"
                className="w-full bg-tiktok-darker border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-tiktok-red"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Campaign Title (optional)</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                placeholder="My Awesome Campaign"
                className="w-full bg-tiktok-darker border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-tiktok-red"
              />
            </div>

            <div className="mb-6">
              <h3 className="text-white font-bold mb-3">Actions & Targets</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Views Target</label>
                  <input type="number" value={form.views_target} onChange={(e) => setForm({...form, views_target: parseInt(e.target.value) || 0})} className="w-full bg-tiktok-darker border border-gray-600 rounded-lg px-4 py-2 text-white" min="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Likes Target</label>
                  <input type="number" value={form.likes_target} onChange={(e) => setForm({...form, likes_target: parseInt(e.target.value) || 0})} className="w-full bg-tiktok-darker border border-gray-600 rounded-lg px-4 py-2 text-white" min="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Comments Target</label>
                  <input type="number" value={form.comments_target} onChange={(e) => setForm({...form, comments_target: parseInt(e.target.value) || 0})} className="w-full bg-tiktok-darker border border-gray-600 rounded-lg px-4 py-2 text-white" min="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Follows Target</label>
                  <input type="number" value={form.follows_target} onChange={(e) => setForm({...form, follows_target: parseInt(e.target.value) || 0})} className="w-full bg-tiktok-darker border border-gray-600 rounded-lg px-4 py-2 text-white" min="0" />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-white font-bold mb-3">Watch Time (seconds)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Min</label>
                  <input type="number" value={form.watch_time_min} onChange={(e) => setForm({...form, watch_time_min: parseInt(e.target.value) || 5})} className="w-full bg-tiktok-darker border border-gray-600 rounded-lg px-4 py-2 text-white" min="5" max="30" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Max</label>
                  <input type="number" value={form.watch_time_max} onChange={(e) => setForm({...form, watch_time_max: parseInt(e.target.value) || 30})} className="w-full bg-tiktok-darker border border-gray-600 rounded-lg px-4 py-2 text-white" min="5" max="60" />
                </div>
              </div>
            </div>

            <div className="bg-tiktok-darker p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-gray-400 text-sm">Total Budget</div>
                  <div className="text-2xl font-bold text-white">{calculateBudget()} coins</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-400 text-sm">Your Balance</div>
                  <div className={`text-xl font-bold ${profile?.coins >= calculateBudget() ? 'text-green-400' : 'text-red-400'}`}>
                    {profile?.coins || 0} coins
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || calculateBudget() === 0 || calculateBudget() > (profile?.coins || 0)}
              className="w-full bg-tiktok-red hover:bg-red-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Creating Campaign...' : `Create Campaign (${calculateBudget()} coins)`}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}