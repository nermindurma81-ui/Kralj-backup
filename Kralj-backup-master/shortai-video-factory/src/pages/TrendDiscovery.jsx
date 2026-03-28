import { useState } from 'react'
import { Compass, Sparkles, Loader2, ExternalLink, TrendingUp, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { discoverTrends } from '../lib/api'
import { useApiStore } from '../store/apiStore'

export default function TrendDiscovery() {
  const [niche, setNiche] = useState('')
  const [source, setSource] = useState('all')
  const [trends, setTrends] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const { getActiveProvider } = useApiStore()

  const discover = async () => {
    if (!niche.trim()) {
      toast.error('Enter a niche or topic')
      return
    }

    setLoading(true)
    try {
      const result = await discoverTrends({
        niche,
        source,
        providerId: getActiveProvider()?.id
      })
      setTrends(result.trends || [])
      setAnalysis(result.analysis || null)
      toast.success(`Found ${result.trends?.length || 0} trends`)
    } catch (err) {
      toast.error(`Discovery failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getHeatColor = (heat) => {
    if (heat >= 8) return 'bg-red-500/20 text-red-400 border-red-500/30'
    if (heat >= 6) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    if (heat >= 4) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Compass className="w-8 h-8 text-emerald-400" /> Trend Discovery
        </h1>
        <p className="page-subtitle">Discover trending topics from Reddit, YouTube, and AI analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card space-y-4 sticky top-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Niche / Topic *</label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="input-field"
                placeholder="e.g., AI tools, fitness, personal finance"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className="input-field">
                <option value="all">All Sources</option>
                <option value="reddit">Reddit</option>
                <option value="youtube">YouTube</option>
                <option value="twitter">Twitter/X</option>
              </select>
            </div>

            <button onClick={discover} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Discover Trends
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {trends.length === 0 && !analysis ? (
            <div className="card text-center py-16">
              <Compass className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Enter a niche to discover trending topics</p>
              <p className="text-gray-500 text-sm mt-1">Powered by Reddit, YouTube, and AI analysis</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* AI Analysis */}
              {analysis && (
                <div className="card border-emerald-500/20 bg-emerald-900/5">
                  <h3 className="font-medium mb-2 flex items-center gap-2 text-emerald-400">
                    <Sparkles className="w-4 h-4" /> AI Trend Analysis
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{analysis.summary}</p>
                  {analysis.opportunities && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Top Opportunities</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.opportunities.map((opp, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                            {opp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Trends */}
              <div className="space-y-3">
                {trends.map((trend, index) => (
                  <div key={index} className="card hover:border-gray-600 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${getHeatColor(trend.heat || 5)}`}>
                            🔥 {trend.heat || 5}/10
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                            {trend.source || 'Unknown'}
                          </span>
                        </div>
                        <h3 className="font-medium">{trend.title}</h3>
                        {trend.description && (
                          <p className="text-sm text-gray-400 mt-1">{trend.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {trend.engagement && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> {trend.engagement}
                            </span>
                          )}
                          {trend.growth && (
                            <span className="text-green-400">{trend.growth}</span>
                          )}
                        </div>
                      </div>
                      {trend.url && (
                        <a href={trend.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={discover} disabled={loading} className="btn-secondary w-full flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh Trends
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
