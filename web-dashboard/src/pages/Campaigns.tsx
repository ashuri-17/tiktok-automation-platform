import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

/**
 * Campaigns Page
 * Design: Modern dark theme with campaign list
 * Features: View, create, and delete campaigns
 */
interface Campaign {
  id: string
  title: string
  video_id: string
  views_target: number
  views_delivered: number
  likes_target: number
  likes_delivered: number
  status: string
  created_at: string
}

export default function Campaigns() {
  const [, setLocation] = useLocation()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLocation('/login')
          return
        }
        setUser(user)

        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setCampaigns(data || [])
      } catch (err) {
        console.error('Load campaigns error:', err)
        toast.error('Failed to load campaigns')
      } finally {
        setLoading(false)
      }
    }

    loadCampaigns()
  }, [setLocation])

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)

      if (error) throw error
      setCampaigns(campaigns.filter(c => c.id !== campaignId))
      toast.success('Campaign deleted')
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Failed to delete campaign')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading campaigns...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation('/')}
              variant="ghost"
              className="text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">My Campaigns</h1>
              <p className="text-slate-400 text-sm">{campaigns.length} campaigns</p>
            </div>
          </div>
          <Button
            onClick={() => setLocation('/campaigns/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {campaigns.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
            <p className="text-slate-400 mb-4">No campaigns yet</p>
            <Button
              onClick={() => setLocation('/campaigns/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Campaign
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="bg-slate-800/50 border-slate-700 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white truncate">{campaign.title}</h3>
                  <p className="text-slate-400 text-sm">Video: {campaign.video_id}</p>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Views</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              (campaign.views_delivered / campaign.views_target) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-white text-sm">
                        {campaign.views_delivered}/{campaign.views_target}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-slate-400 text-xs mb-1">Likes</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              (campaign.likes_delivered / campaign.likes_target) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-white text-sm">
                        {campaign.likes_delivered}/{campaign.likes_target}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <span className="text-slate-400 text-sm capitalize">{campaign.status}</span>
                  <Button
                    onClick={() => handleDelete(campaign.id)}
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
