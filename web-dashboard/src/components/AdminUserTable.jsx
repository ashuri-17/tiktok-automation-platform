import React from 'react'
import { supabase } from '../supabaseClient'

export default function AdminUserTable({ users, onBan, onAdjustCoins }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-gray-400 border-b border-gray-700">
          <th className="text-left p-3">User</th>
          <th className="text-center p-3">Coins</th>
          <th className="text-center p-3">Worker Status</th>
          <th className="text-center p-3">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.id} className="border-b border-gray-700">
            <td className="p-3 text-white">{u.username || u.id}</td>
            <td className="p-3 text-center text-gray-300">{u.coins}</td>
            <td className="p-3 text-center">
              <span className={`px-2 py-1 rounded text-xs ${u.worker_status === 'banned' ? 'bg-red-500' : 'bg-gray-600'} text-white`}>
                {u.worker_status}
              </span>
            </td>
            <td className="p-3 text-center space-x-2">
              {u.worker_status !== 'banned' && (
                <button onClick={() => onBan(u.id)} className="text-red-400 text-xs hover:underline">
                  Ban
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
