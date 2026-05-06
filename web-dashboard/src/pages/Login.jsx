import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-tiktok-darker flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-tiktok-dark p-8 rounded-lg border border-gray-700">
        <h1 className="text-3xl font-bold text-tiktok-red mb-2">TikFlow</h1>
        <p className="text-gray-400 mb-6">Sign in to your account</p>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-tiktok-darker border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-tiktok-red"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-tiktok-darker border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-tiktok-red"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-tiktok-red hover:bg-red-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-4 text-center">
          Don't have an account? <Link to="/signup" className="text-tiktok-red hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
