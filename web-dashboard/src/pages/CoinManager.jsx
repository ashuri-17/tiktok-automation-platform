import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function CoinManager() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) fetchTransactions()
  }, [profile])

  async function fetchTransactions() {
    const { data } = await supabase
      .from('coin_transactions')
      .select('*')
      .eq('user_id', profile?.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setTransactions(data || [])
    setLoading(false)
  }

  const typeLabels = {
    earn_view: { label: 'Earn: View', color: 'text-blue-400' },
    earn_like: { label: 'Earn: Like', color: 'text-green-400' },
    earn_comment: { label: 'Earn: Comment', color: 'text-purple-400' },
    earn_follow: { label: 'Earn: Follow', color: 'text-yellow-400' },
    spend_campaign: { label: 'Spend: Campaign', color: 'text-red-400' },
    bonus_signup: { label: 'Bonus: Signup', color: 'text-pink-400' }
  }

  return (
    <div className="flex min-h-screen bg-tiktok-darker">
      <div className="w-48 bg-tiktok-dark p-4 border-r border-gray-700">
        <div className="text-tiktok-red font-bold text-xl mb-8">TikFlow</div>
        <nav className="space-y-2">
          <Link to="/" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">📊 Dashboard</Link>
          <Link to="/campaigns/new" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">🚀 Create Campaign</Link>
          <Link to="/coins" className="block text-white bg-tiktok-red px-3 py-2 rounded text-sm">💰 Coin Manager</Link>
          <Link to="/worker" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">⚡ Worker</Link>
          <Link to="/campaigns" className="block text-gray-400 hover:text-white px-3 py-2 rounded text-sm">📈 Campaigns</Link>
        </nav>
      </div>

      <div className="flex-1 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">💰 Coin Manager</h2>

        <div className="bg-tiktok-dark p-6 rounded-lg mb-6">
          <div className="text-gray-400 text-sm">Current Balance</div>
          <div className="text-4xl font-bold text-green-400">{profile?.coins || 0} coins</div>
          <p className="text-gray-500 text-sm mt-2">🎁 You received 50 free coins on signup!</p>
        </div>

        <div className="bg-tiktok-dark rounded-lg overflow-hidden">
          <h3 className="text-white font-bold p-4 border-b border-gray-700">Transaction History</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left p-4">Type</th>
                <th className="text-center p-4">Amount</th>
                <th className="text-center p-4">Balance After</th>
                <th className="text-center p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-b border-gray-700">
                  <td className="p-4">
                    <span className={typeLabels[t.type]?.color || 'text-gray-300'}>
                      {typeLabels[t.type]?.label || t.type}
                    </span>
                  </td>
                  <td className={`p-4 text-center font-bold ${t.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {t.amount > 0 ? '+' : ''}{t.amount}
                  </td>
                  <td className="p-4 text-center text-gray-300">{t.balance_after}</td>
                  <td className="p-4 text-center text-gray-400 text-xs">
                    {new Date(t.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center text-gray-500 py-8">No transactions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}