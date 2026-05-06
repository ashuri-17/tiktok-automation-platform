import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import CreateCampaign from './pages/CreateCampaign'
import MyCampaigns from './pages/MyCampaigns'
import WorkerLauncher from './pages/WorkerLauncher'
import CoinManager from './pages/CoinManager'
import Profile from './pages/Profile'
import AdminPanel from './pages/AdminPanel'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-tiktok-darker flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
        <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/campaigns/new" element={user ? <CreateCampaign /> : <Navigate to="/login" />} />
        <Route path="/campaigns" element={user ? <MyCampaigns /> : <Navigate to="/login" />} />
        <Route path="/worker" element={user ? <WorkerLauncher /> : <Navigate to="/login" />} />
        <Route path="/coins" element={user ? <CoinManager /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/admin" element={user ? <AdminPanel /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
