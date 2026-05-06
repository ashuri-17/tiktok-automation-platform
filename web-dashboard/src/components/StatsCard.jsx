import React from 'react'

export default function StatsCard({ title, value, change, color }) {
  return (
    <div className="bg-tiktok-dark p-4 rounded-lg border-l-4" style={{ borderLeftColor: color }}>
      <div className="text-gray-400 text-xs uppercase">{title}</div>
      <div className="text-white text-2xl font-bold mt-1">{value}</div>
      {change && (
        <div className={`text-xs mt-1 ${change.startsWith('↑') ? 'text-green-400' : 'text-yellow-400'}`}>
          {change}
        </div>
      )}
    </div>
  )
}