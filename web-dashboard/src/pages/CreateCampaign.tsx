import { useState } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'

/**
 * Create Campaign Page
 * Design: Modern dark theme with form
 * Features: Create new TikTok automation campaigns
 */
export default function CreateCampaign() {
  const [, setLocation] = useLocation()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    videoUrl: '',
    viewsTarget: '100',
    likesTarget: '50',
    commentsTarget: '10',
    followsTarget: '5',
    coinsBudget: '100',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.videoUrl) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLocation('/login')
        return
      }

      // Check user coins
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', user.id)
        .single()

      const budget = parseInt(formData.coinsBudget)
      if (!profile || profile.coins < budget) {
        toast.error('Insufficient coins for this campaign')
        return
      }

      // Create campaign
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert([
          {
            user_id: user.id,
            title: formData.title,
            video_id: formData.videoUrl,
            views_target: parseInt(formData.viewsTarget),
            likes_target: parseInt(formData.likesTarget),
            comments_target: parseInt(formData.commentsTarget),
            follows_target: parseInt(formData.followsTarget),
            coins_budget: budget,
            status: 'pending',
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Deduct coins
      await supabase.rpc('process_coin_transaction', {
        amount: -budget,
        type: 'spend_campaign',
        campaign_id: campaign.id,
      })

      toast.success('Campaign created successfully!')
      setLocation('/campaigns')
    } catch (err) {
      console.error('Create campaign error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            onClick={() => setLocation('/campaigns')}
            variant="ghost"
            className="text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Create Campaign</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-slate-800/50 border-slate-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Campaign Title *
              </label>
              <Input
                type="text"
                name="title"
                placeholder="My Awesome Campaign"
                value={formData.title}
                onChange={handleChange}
                disabled={loading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                TikTok Video URL *
              </label>
              <Input
                type="text"
                name="videoUrl"
                placeholder="https://www.tiktok.com/@user/video/..."
                value={formData.videoUrl}
                onChange={handleChange}
                disabled={loading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Targets Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Views Target
                </label>
                <Input
                  type="number"
                  name="viewsTarget"
                  value={formData.viewsTarget}
                  onChange={handleChange}
                  disabled={loading}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Likes Target
                </label>
                <Input
                  type="number"
                  name="likesTarget"
                  value={formData.likesTarget}
                  onChange={handleChange}
                  disabled={loading}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Comments Target
                </label>
                <Input
                  type="number"
                  name="commentsTarget"
                  value={formData.commentsTarget}
                  onChange={handleChange}
                  disabled={loading}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Follows Target
                </label>
                <Input
                  type="number"
                  name="followsTarget"
                  value={formData.followsTarget}
                  onChange={handleChange}
                  disabled={loading}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Coins Budget
              </label>
              <Input
                type="number"
                name="coinsBudget"
                value={formData.coinsBudget}
                onChange={handleChange}
                disabled={loading}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <p className="text-slate-400 text-xs mt-1">
                Coins will be deducted from your account when campaign is created
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Campaign'
                )}
              </Button>
              <Button
                type="button"
                onClick={() => setLocation('/campaigns')}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}
