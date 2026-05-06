import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'

/**
 * Profile Page
 * Design: Modern dark theme with user settings
 * Features: View and update user profile
 */
interface UserProfile {
  id: string
  username: string
  tiktok_username: string
  coins: number
  worker_status: string
  is_admin: boolean
}

export default function Profile() {
  const [, setLocation] = useLocation()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    username: '',
    tiktok_username: '',
  })

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLocation('/login')
          return
        }
        setUser(user)

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setProfile(data)
        setFormData({
          username: data.username || '',
          tiktok_username: data.tiktok_username || '',
        })
      } catch (err) {
        console.error('Load profile error:', err)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [setLocation])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          tiktok_username: formData.tiktok_username,
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('Profile updated successfully')
    } catch (err) {
      console.error('Update error:', err)
      toast.error('Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            onClick={() => setLocation('/')}
            variant="ghost"
            className="text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* User Info Card */}
        <Card className="bg-slate-800/50 border-slate-700 p-8 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <p className="text-white">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Account Status</label>
              <p className="text-white capitalize">{user?.user_metadata?.email_verified ? 'Verified' : 'Unverified'}</p>
            </div>
          </div>
        </Card>

        {/* Profile Form */}
        <Card className="bg-slate-800/50 border-slate-700 p-8 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Profile Details</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <Input
                type="text"
                name="username"
                placeholder="your_username"
                value={formData.username}
                onChange={handleChange}
                disabled={updating}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                TikTok Username
              </label>
              <Input
                type="text"
                name="tiktok_username"
                placeholder="@your_tiktok_handle"
                value={formData.tiktok_username}
                onChange={handleChange}
                disabled={updating}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <Button
              type="submit"
              disabled={updating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </Button>
          </form>
        </Card>

        {/* Stats Card */}
        <Card className="bg-slate-800/50 border-slate-700 p-8">
          <h2 className="text-xl font-bold text-white mb-4">Account Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Available Coins</label>
              <p className="text-2xl font-bold text-yellow-500">{profile?.coins || 0}</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Worker Status</label>
              <p className="text-white capitalize">{profile?.worker_status || 'inactive'}</p>
            </div>
            {profile?.is_admin && (
              <div className="col-span-2">
                <label className="block text-sm text-slate-400 mb-1">Role</label>
                <p className="text-white font-semibold">Administrator</p>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
