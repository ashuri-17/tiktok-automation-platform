import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { LogOut, Plus, TrendingUp, Coins, Zap } from 'lucide-react'

/**
 * Dashboard Page
 * Design: Modern dark theme with card-based layout
 * Features: User stats, campaign overview, quick actions
 */
interface DashboardStats {
  coins: number
  active_campaigns: number
  tasks_completed: number
  worker_status: string
}

export default function Dashboard() {
  const [, setLocation] = useLocation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLocation('/login')
          return
        }
        setUser(user)

        // Fetch user stats from profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('coins, worker_status')
          .eq('id', user.id)
          .single()

        if (error) throw error

        // Fetch campaign count
        const { count: campaignCount } = await supabase
          .from('campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Fetch completed tasks count
        const { count: tasksCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('worker_id', user.id)
          .eq('status', 'completed')

        setStats({
          coins: profile?.coins || 0,
          active_campaigns: campaignCount || 0,
          tasks_completed: tasksCount || 0,
          worker_status: profile?.worker_status || 'inactive',
        })
      } catch (err) {
        console.error('Dashboard load error:', err)
        toast.error('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [setLocation])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Logged out successfully')
      setLocation('/login')
    } catch (err) {
      console.error('Logout error:', err)
      toast.error('Logout failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">TikFlow Dashboard</h1>
            <p className="text-slate-400 text-sm">Welcome, {user?.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Coins Card */}
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Available Coins</p>
                <p className="text-3xl font-bold text-white">{stats?.coins || 0}</p>
              </div>
              <Coins className="h-12 w-12 text-yellow-500 opacity-20" />
            </div>
          </Card>

          {/* Campaigns Card */}
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Active Campaigns</p>
                <p className="text-3xl font-bold text-white">{stats?.active_campaigns || 0}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </Card>

          {/* Tasks Card */}
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Tasks Completed</p>
                <p className="text-3xl font-bold text-white">{stats?.tasks_completed || 0}</p>
              </div>
              <Zap className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-slate-800/50 border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => setLocation('/campaigns/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
            <Button
              onClick={() => setLocation('/campaigns')}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 font-semibold py-2 rounded-lg"
            >
              View Campaigns
            </Button>
            <Button
              onClick={() => setLocation('/worker')}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 font-semibold py-2 rounded-lg"
            >
              Worker Status
            </Button>
          </div>
        </Card>

        {/* Info Section */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Getting Started</h2>
          <div className="space-y-3 text-slate-300">
            <p>• Create campaigns to automate TikTok engagement</p>
            <p>• Earn coins by completing tasks as a worker</p>
            <p>• Manage your profile and worker settings</p>
            <p>• Track campaign performance and statistics</p>
          </div>
        </Card>
      </main>
    </div>
  )
}
