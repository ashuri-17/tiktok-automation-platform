import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Play, Square, Zap, TrendingUp } from 'lucide-react'

/**
 * Worker Launcher Page
 * Design: Modern dark theme with gradient background
 * Features: Start/stop worker automation, view earnings, track tasks
 */
export default function WorkerLauncher() {
  const { profile } = useAuth()
  const [isRunning, setIsRunning] = useState(false)
  const [tasksCompleted, setTasksCompleted] = useState(0)
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile) {
      setIsRunning(profile.worker_status === 'running')
    }
  }, [profile])

  const handleToggleWorker = async () => {
    if (!profile) return

    setLoading(true)
    try {
      const newStatus = isRunning ? 'stopped' : 'running'

      const { error } = await supabase
        .from('profiles')
        .update({ worker_status: newStatus })
        .eq('id', profile.id)

      if (error) throw error

      setIsRunning(newStatus === 'running')
      toast.success(newStatus === 'running' ? 'Worker started!' : 'Worker stopped!')

      // Simulate earning coins when worker is running
      if (newStatus === 'running') {
        simulateEarnings()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle worker')
    } finally {
      setLoading(false)
    }
  }

  const simulateEarnings = () => {
    // Simulate worker completing tasks and earning coins
    let completed = 0
    let earned = 0

    const interval = setInterval(() => {
      if (!isRunning) {
        clearInterval(interval)
        return
      }

      completed++
      earned += Math.floor(Math.random() * 5) + 1 // Earn 1-5 coins per task

      setTasksCompleted(completed)
      setCoinsEarned(earned)

      // Update profile coins in database
      if (profile && completed % 5 === 0) {
        supabase
          .from('profiles')
          .update({ coins: profile.coins + earned })
          .eq('id', profile.id)
          .then(() => {
            // Log transaction
            supabase.from('coin_transactions').insert({
              user_id: profile.id,
              amount: earned,
              type: 'earn_view',
              task_id: null,
              campaign_id: null,
            })
          })

        setCoinsEarned(0)
      }
    }, 3000) // Complete a task every 3 seconds
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Worker Launcher</h1>
          <p className="text-slate-400">Start the automation worker to earn coins</p>
        </div>

        {/* Main Worker Card */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Automation Worker</h2>
              <p className="text-slate-400">
                Status: <span className={isRunning ? 'text-green-400' : 'text-red-400'}>
                  {isRunning ? 'Running' : 'Stopped'}
                </span>
              </p>
            </div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isRunning ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              <Zap className={`w-8 h-8 ${isRunning ? 'text-green-400' : 'text-red-400'}`} />
            </div>
          </div>

          <Button
            onClick={handleToggleWorker}
            disabled={loading}
            className={`w-full py-6 text-lg font-semibold rounded-lg transition-colors ${
              isRunning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="mr-2 h-5 w-5" />
                Stop Worker
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Start Worker
              </>
            )}
          </Button>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Tasks Completed</p>
                <p className="text-3xl font-bold text-white">{tasksCompleted}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Coins Earned</p>
                <p className="text-3xl font-bold text-yellow-400">{coinsEarned}</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-400" />
            </div>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="bg-slate-800/50 border-slate-700 p-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">How it works</h3>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start">
              <span className="text-blue-400 mr-3 mt-1">•</span>
              <span>Start the worker to begin earning coins automatically</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-3 mt-1">•</span>
              <span>The worker performs human-like automation tasks on TikTok</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-3 mt-1">•</span>
              <span>Earn coins for each completed task (1-5 coins per task)</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-3 mt-1">•</span>
              <span>Spend coins to create campaigns and boost your videos</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
