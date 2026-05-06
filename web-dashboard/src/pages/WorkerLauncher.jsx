import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function WorkerLauncher() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ tasks_completed: 0, coins: 0 })
  const [workerStatus, setWorkerStatus] = useState('stopped')

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    const { data } = await supabase.functions.invoke('worker-stats')
    if (data) {
      setStats(data)
      setWorkerStatus(data.worker_status || 'stopped')
    }
  }

  return (
    <div className="flex min-h-screen bg-tiktok-darker">
      <div className="w-48 bg-tiktok-dark p-4 border-r border-gray-700">
        <div className="text-tiktok-red font-bold text-xl mb-8">TikFlow</div>
        <nav className="space-y-2">
          <Link to="/" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">📊 Dashboard</Link>
          <Link to="/campaigns/new" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">🚀 Create Campaign</Link>
          <Link to="/coins" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">💰 Coins</Link>
          <Link to="/worker" className="block text-white bg-tiktok-red px-3 py-2 rounded text-sm">⚡ Launch Worker</Link>
          <Link to="/campaigns" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">📈 Campaigns</Link>
        </nav>
      </div>

      <div className="flex-1 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">⚡ Launch Worker</h2>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-tiktok-dark p-6 rounded-lg">
            <h3 className="text-white font-bold mb-4">Worker Status</h3>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${workerStatus === 'running' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="text-white">{workerStatus.toUpperCase()}</span>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <div>Tasks Done: {stats.tasks_completed}</div>
              <div>Coins Earned: {stats.coins}</div>
            </div>
          </div>

          <div className="bg-tiktok-dark p-6 rounded-lg">
            <h3 className="text-white font-bold mb-4">Install Extension</h3>
            <p className="text-gray-400 text-sm mb-4">
              Download and install the TikFlow Worker Chrome Extension to start earning coins.
            </p>
            <a
              href="/extension/tiktok-worker-extension.zip"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Download Extension
            </a>
          </div>
        </div>

        <div className="bg-tiktok-dark p-6 rounded-lg">
          <h3 className="text-white font-bold mb-4">How It Works</h3>
          <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
            <li>Install the TikFlow Worker Chrome Extension</li>
            <li>Open the extension popup and click "Login to TikTok"</li>
            <li>Log into your TikTok account (QR code or in-extension login)</li>
            <li>Click "Start Worker" in the extension popup</li>
            <li>The extension will automatically watch videos, like, comment, and follow to earn coins</li>
            <li>Use your earned coins to create campaigns for your own videos!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}