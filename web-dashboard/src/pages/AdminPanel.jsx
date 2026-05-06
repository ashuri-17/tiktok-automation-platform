import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'
import AdminUserTable from '../components/AdminUserTable'
import AdminCampaignTable from '../components/AdminCampaignTable'

export default function AdminPanel() {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [activeTab, setActiveTab] = useState('users')
  const [loading, setLoading] = useState(true)

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-tiktok-darker flex items-center justify-center">
        <div className="text-red-400">Access denied. Admin only.</div>
      </div>
    )
  }

  useEffect(() => {
    fetchUsers()
    fetchCampaigns()
  }, [])

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  async function fetchCampaigns() {
    const { data } = await supabase
      .from('campaigns')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })
    setCampaigns(data || [])
  }

  async function handleBan(userId) {
    if (!confirm('Are you sure you want to ban this user?')) return
    await supabase
      .from('profiles')
      .update({ worker_status: 'banned' })
      .eq('id', userId)
    fetchUsers()
  }

  async function handleRemoveCampaign(campaignId) {
    if (!confirm('Remove this campaign?')) return
    await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId)
    fetchCampaigns()
  }

  return (
    <div className="flex min-h-screen bg-tiktok-darker">
      <div className="w-48 bg-tiktok-dark p-4 border-r border-gray-700">
        <div className="text-tiktok-red font-bold text-xl mb-8">TikFlow Admin</div>
        <nav className="space-y-2">
          <Link to="/" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">← Back to Dashboard</Link>
          <button onClick={() => setActiveTab('users')} className={`block w-full text-left px-3 py-2 rounded text-sm ${activeTab === 'users' ? 'bg-tiktok-red text-white' : 'text-gray-400 hover:text-white'}`}>
            User Management
          </button>
          <button onClick={() => setActiveTab('campaigns')} className={`block w-full text-left px-3 py-2 rounded text-sm ${activeTab === 'campaigns' ? 'bg-tiktok-red text-white' : 'text-gray-400 hover:text-white'}`}>
            Campaign Monitor
          </button>
        </nav>
      </div>

      <div className="flex-1 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Admin Panel</h2>

        {activeTab === 'users' && (
          <div className="bg-tiktok-dark p-6 rounded-lg">
            <h3 className="text-white font-bold mb-4">User Management</h3>
            <AdminUserTable users={users} onBan={handleBan} />
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="bg-tiktok-dark p-6 rounded-lg">
            <h3 className="text-white font-bold mb-4">Campaign Monitoring</h3>
            <AdminCampaignTable campaigns={campaigns} onRemove={handleRemoveCampaign} />
          </div>
        )}
      </div>
    </div>
  )
}
