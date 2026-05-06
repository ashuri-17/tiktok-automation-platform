import React from 'react'

export default function CampaignProgress({ title, type, progress, spent, status }) {
  const statusColors = {
    active: 'bg-green-500',
    running: 'bg-blue-500',
    paused: 'bg-yellow-500',
    completed: 'bg-gray-500'
  }

  return (
    <tr className="border-b border-gray-700">
      <td className="py-3 text-white">
        <span className="text-tiktok-red mr-2">▶</span>
        {title}
      </td>
      <td className="py-3 text-center text-gray-300">{type}</td>
      <td className="py-3 text-center">
        <div className="flex items-center gap-2">
          <div className="bg-tiktok-darker rounded-full h-2 w-20">
            <div
              className={`h-full rounded-full ${status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-400">{progress}%</span>
        </div>
      </td>
      <td className="py-3 text-center text-gray-300">{spent}</td>
      <td className="py-3 text-center">
        <span className={`${statusColors[status]} text-white text-xs px-2 py-1 rounded`}>
          {status.toUpperCase()}
        </span>
      </td>
    </tr>
  )
}