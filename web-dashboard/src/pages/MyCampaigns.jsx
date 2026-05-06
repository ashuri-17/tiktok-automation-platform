import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function MyCampaigns() {
  const { profile } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) fetchCampaigns()
  }, [profile])

  async function fetchCampaigns() {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', profile?.id)
      .order('created_at', { ascending: false })
    setCampaigns(data || [])
    setLoading(false)
  }

  const getProgress = (c) => {
    const total = c.views_target + c.likes_target + c.comments_target + c.follows_target
    const done = c.views_delivered + c.likes_delivered + c.comments_delivered + c.follows_delivered
    return total > 0 ? Math.round((done / total) * 100) : 0
  }

  return (
    <div className="flex min-h-screen bg-tiktok-darker">
      <div className="w-48 bg-tiktok-dark p-4 border-r border-gray-700">
        <div className="text-tiktok-red font-bold text-xl mb-8">TikFlow</div>
        <nav className="space-y-2">
          <Link to="/" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">📊 Dashboard</Link>
          <Link to="/campaigns/new" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">🚀 Create Campaign</Link>
          <Link to="/coins" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">💰 Coins</Link>
          <Link to="/worker" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">⚡ Worker</Link>
          <Link to="/campaigns" className="block text-white bg-tiktok-red px-3 py-2 rounded text-sm">📈 My Campaigns</Link>
        </nav>
      </div>

      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">📈 My Campaigns</h2>
          <Link to="/campaigns/new" className="bg-tiktok-red hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + New Campaign
          </Link>
        </div>

        <div className="bg-tiktok-dark rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left p-4">Video</th>
                <th className="text-center p-4">Type</th>
                <th className="text-center p-4">Progress</th>
                <th className="text-center p-4">Spent</th>
                <th className="text-center p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id} className="border-b border-gray-700">
                  <td className="p-4 text-white">
                    <span className="text-tiktok-red mr-2">▶</span>
                    {c.title || c.video_id}
                  </td>
                  <td className="p-4 text-center text-gray-300">
                    {[c.views_target > 0 && 'Views', c.likes_target > 0 && 'Likes', c.comments_target > 0 && 'Comments', c.follows_target > 0 && 'Follows'].filter(Boolean).join(', ')}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="bg-tiktok-darker rounded-full h-2 w-20">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${getProgress(c)}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-400">{getProgress(c)}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-center text-gray-300">
                    {Math.round((c.coins_budget || 0) * (getProgress(c) / 100))} / {c.coins_budget}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs text-white ${
                      c.status === 'active' ? 'bg-green-500' :
                      c.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}>
                      {c.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-gray-500 py-8">
                    No campaigns yet. <Link to="/campaigns/new" className="text-tiktok-red">Create your first campaign!</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}