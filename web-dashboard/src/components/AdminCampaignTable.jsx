import React from 'react'

export default function AdminCampaignTable({ campaigns, onRemove }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-gray-400 border-b border-gray-700">
          <th className="text-left p-3">Video</th>
          <th className="text-center p-3">User</th>
          <th className="text-center p-3">Progress</th>
          <th className="text-center p-3">Actions</th>
        </tr>
      </thead>
      <tbody>
        {campaigns.map(c => (
          <tr key={c.id} className="border-b border-gray-700">
            <td className="p-3 text-white">{c.title || c.video_id}</td>
            <td className="p-3 text-center text-gray-300">{c.user_id}</td>
            <td className="p-3 text-center text-gray-300">
              {c.views_delivered}/{c.views_target} views
            </td>
            <td className="p-3 text-center">
              <button onClick={() => onRemove(c.id)} className="text-red-400 text-xs hover:underline">
                Remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
