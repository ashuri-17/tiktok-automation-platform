import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const [username, setUsername] = useState(profile?.username || '')
  const [tiktokUsername, setTiktokUsername] = useState(profile?.tiktok_username || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        tiktok_username: tiktokUsername,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile?.id)

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Profile updated successfully!')
    }
    setSaving(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
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
          <Link to="/campaigns" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">📈 Campaigns</Link>
          <Link to="/profile" className="block text-white bg-tiktok-red px-3 py-2 rounded text-sm">👤 Profile</Link>
        </nav>
      </div>

      <div className="flex-1 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">👤 Profile</h2>

        {message && (
          <div className={`p-3 rounded mb-4 text-sm ${message.includes('Error') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
            {message}
          </div>
        )}

        <div className="bg-tiktok-dark p-6 rounded-lg max-w-2xl">
          <form onSubmit={handleSave}>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-tiktok-darker border border-gray-600 rounded-lg px-4 py-2 text-gray-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-tiktok-darker border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-tiktok-red"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm text-gray-300 mb-2">TikTok Username</label>
              <input
                type="text"
                value={tiktokUsername}
                onChange={(e) => setTiktokUsername(e.target.value)}
                placeholder="@yourtiktok"
                className="w-full bg-tiktok-darker border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-tiktok-red"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-tiktok-red hover:bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}