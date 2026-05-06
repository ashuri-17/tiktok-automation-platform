import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'
import StatsCard from '../components/StatsCard'
import CampaignProgress from '../components/CampaignProgress'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ views: 0, likes: 0, coins: 0, activeCampaigns: 0 })
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) {
      fetchStats()
      fetchCampaigns()
    }
  }, [profile])

  async function fetchStats() {
    const { data: campaignsData } = await supabase
      .from('campaigns')
      .select('views_delivered, likes_delivered')
      .eq('user_id', profile?.id)

    setStats({
      views: campaignsData?.reduce((sum, c) => sum + (c.views_delivered || 0), 0) || 0,
      likes: campaignsData?.reduce((sum, c) => sum + (c.likes_delivered || 0), 0) || 0,
      coins: profile?.coins || 0,
      activeCampaigns: campaignsData?.filter(c => c.status === 'active').length || 0
    })
    setLoading(false)
  }

  async function fetchCampaigns() {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', profile?.id)
      .order('created_at', { ascending: false })
      .limit(5)

    setCampaigns(data || [])
  }

  if (loading) return <div className="text-white p-8">Loading...</div>

  return (
    <div className="flex min-h-screen bg-tiktok-darker">
      <div className="w-48 bg-tiktok-dark p-4 border-r border-gray-700">
        <div className="text-tiktok-red font-bold text-xl mb-8">TikFlow</div>
        <nav className="space-y-2">
          <Link to="/" className="block text-white bg-tiktok-red px-3 py-2 rounded text-sm">📊 Dashboard</Link>
          <Link to="/campaigns/new" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">🚀 Create Campaign</Link>
          <Link to="/coins" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">
            💰 Coins <span className="bg-green-500 text-xs px-2 py-0.5 rounded ml-2">{profile?.coins || 0}</span>
          </Link>
          <Link to="/worker" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">⚡ Launch Worker</Link>
          <Link to="/campaigns" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">📈 My Campaigns</Link>
          <Link to="/profile" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">👤 Profile</Link>
        </nav>
      </div>

      <div className="flex-1 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatsCard title="TOTAL VIEWS" value={stats.views.toLocaleString()} change="↑ 12% vs last week" color="#FE2C55" />
          <StatsCard title="TOTAL LIKES" value={stats.likes.toLocaleString()} change="↑ 8% vs last week" color="#3B82F6" />
          <StatsCard title="COIN BALANCE" value={stats.coins} change="↓ 5 today" color="#10B981" />
          <StatsCard title="ACTIVE CAMPAIGNS" value={stats.activeCampaigns} color="#F59E0B" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link to="/campaigns/new" className="bg-gradient-to-r from-tiktok-red to-red-400 p-4 rounded-lg hover:opacity-90">
            <div className="text-white font-bold text-lg">🚀 Create New Campaign</div>
            <div className="text-white/80 text-sm mt-1">Spend coins to get views, likes, follows</div>
          </Link>
          <Link to="/worker" className="bg-gradient-to-r from-purple-600 to-purple-400 p-4 rounded-lg hover:opacity-90">
            <div className="text-white font-bold text-lg">⚡ Launch Worker</div>
            <div className="text-white/80 text-sm mt-1">Earn coins by watching others' videos</div>
          </Link>
        </div>

        <div className="bg-tiktok-dark p-6 rounded-lg">
          <h3 className="text-white text-lg font-bold mb-4">📋 Active Campaigns</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left p-2">Video</th>
                <th className="text-center p-2">Type</th>
                <th className="text-center p-2">Progress</th>
                <th className="text-center p-2">Spent</th>
                <th className="text-center p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <CampaignProgress
                  key={c.id}
                  title={c.title || c.video_id}
                  type={[
                    c.views_target > 0 && 'Views',
                    c.likes_target > 0 && 'Likes',
                    c.comments_target > 0 && 'Comments',
                    c.follows_target > 0 && 'Follows'
                  ].filter(Boolean).join(' + ')}
                  progress={c.views_target > 0 ? Math.round((c.views_delivered / c.views_target) * 100) : 0}
                  spent={Math.round((c.coins_budget || 0) * ((c.views_delivered + c.likes_delivered + c.comments_delivered + c.follows_delivered) / (c.views_target + c.likes_target + c.comments_target + c.follows_target || 1))}
                  status={c.status}
                />
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-gray-500 py-4">No campaigns yet. <Link to="/campaigns/new" className="text-tiktok-red">Create one!</Link></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}