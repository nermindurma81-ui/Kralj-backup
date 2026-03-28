import { useState } from 'react'
import { Search, Sparkles, Loader2, TrendingUp, Users, DollarSign, Target, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { sendChatRequest } from '../lib/api'
import { useApiStore } from '../store/apiStore'

export default function NicheFinder() {
  const [interest, setInterest] = useState('')
  const [audience, setAudience] = useState('')
  const [monetization, setMonetization] = useState('any')
  const [niches, setNiches] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedNiche, setSelectedNiche] = useState(null)
  const { getActiveProvider } = useApiStore()

  const findNiches = async () => {
    if (!interest.trim()) {
      toast.error('Enter your interest or expertise')
      return
    }

    const provider = getActiveProvider()
    if (!provider) {
      toast.error('Configure an AI provider first')
      return
    }

    setLoading(true)
    try {
      const prompt = `Based on the interest "${interest}"${audience ? ` targeting ${audience}` : ''}, suggest 8 profitable short-form video niches.

For each niche provide JSON with:
- name: niche name
- description: brief description (1-2 sentences)
- competition: "low", "medium", or "high"
- demand: number 1-10
- monetization: number 1-10
- growth: "rising", "stable", or "declining"
- contentIdeas: array of 3 specific video ideas
- targetAudience: who watches this content
- revenueStreams: array of ways to monetize

Return as JSON array. Focus on ${monetization === 'any' ? 'all monetization potential' : monetization + ' monetization potential'}.`

      const result = await sendChatRequest(provider.id, [
        { role: 'user', content: prompt }
      ], { temperature: 0.8, maxTokens: 3000 })

      let parsed
      try {
        let clean = result.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const jsonMatch = clean.match(/\[[\s\S]*\]/) || clean.match(/\{[\s\S]*\}/)
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean)
      } catch {
        parsed = [{ name: interest, description: result.content, competition: 'medium', demand: 5, monetization: 5, growth: 'stable', contentIdeas: [], targetAudience: audience || 'General', revenueStreams: [] }]
      }
      setNiches(Array.isArray(parsed) ? parsed : [parsed])
      toast.success(`Found ${parsed.length || 8} niches`)
    } catch (err) {
      toast.error(`Search failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getCompetitionColor = (level) => {
    switch (level) {
      case 'low': return 'bg-green-500/20 text-green-400'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400'
      case 'high': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getGrowthIcon = (growth) => {
    switch (growth) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'declining': return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
      default: return <TrendingUp className="w-4 h-4 text-yellow-400 rotate-90" />
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Search className="w-8 h-8 text-teal-400" /> Niche Finder
        </h1>
        <p className="page-subtitle">Discover profitable video niches with real AI analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card space-y-4 sticky top-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Your Interest / Expertise *</label>
              <input
                type="text"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className="input-field"
                placeholder="e.g., personal finance, cooking, tech"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Target Audience</label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="input-field"
                placeholder="e.g., Gen Z, millennials, entrepreneurs"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Monetization Priority</label>
              <select value={monetization} onChange={(e) => setMonetization(e.target.value)} className="input-field">
                <option value="any">Any</option>
                <option value="high">High Revenue Potential</option>
                <option value="affiliate">Affiliate Marketing</option>
                <option value="sponsor">Sponsorships</option>
                <option value="product">Product Sales</option>
              </select>
            </div>

            <button onClick={findNiches} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Find Niches
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {niches.length === 0 ? (
            <div className="card text-center py-16">
              <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Enter your interest to discover profitable niches</p>
              <p className="text-gray-500 text-sm mt-1">AI will analyze market demand and competition</p>
            </div>
          ) : (
            <div className="space-y-4">
              {niches.map((niche, index) => (
                <div
                  key={index}
                  className={`card cursor-pointer transition-all hover:border-gray-500 ${selectedNiche === index ? 'border-primary-500' : ''}`}
                  onClick={() => setSelectedNiche(selectedNiche === index ? null : index)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400">#{index + 1}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getCompetitionColor(niche.competition)}`}>
                          {niche.competition} competition
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          {getGrowthIcon(niche.growth)} {niche.growth}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold">{niche.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium">{niche.demand}/10</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-3">{niche.description}</p>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-gray-900 rounded-lg p-2 text-center">
                      <TrendingUp className="w-4 h-4 text-primary-400 mx-auto mb-1" />
                      <p className="text-sm font-medium">{niche.demand}/10</p>
                      <p className="text-[10px] text-gray-500">Demand</p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-2 text-center">
                      <DollarSign className="w-4 h-4 text-green-400 mx-auto mb-1" />
                      <p className="text-sm font-medium">{niche.monetization}/10</p>
                      <p className="text-[10px] text-gray-500">Monetization</p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-2 text-center">
                      <Users className="w-4 h-4 text-accent-400 mx-auto mb-1" />
                      <p className="text-sm font-medium capitalize">{niche.competition}</p>
                      <p className="text-[10px] text-gray-500">Competition</p>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {selectedNiche === index && (
                    <div className="mt-4 pt-4 border-t border-gray-700 space-y-3 animate-fade-in">
                      {niche.targetAudience && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Target Audience</p>
                          <p className="text-sm text-gray-300">{niche.targetAudience}</p>
                        </div>
                      )}

                      {niche.contentIdeas?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Content Ideas</p>
                          <div className="space-y-1">
                            {niche.contentIdeas.map((idea, i) => (
                              <p key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-primary-400">•</span> {idea}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {niche.revenueStreams?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Revenue Streams</p>
                          <div className="flex flex-wrap gap-2">
                            {niche.revenueStreams.map((stream, i) => (
                              <span key={i} className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                                {stream}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
