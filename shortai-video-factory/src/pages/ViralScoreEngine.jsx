import { useState } from 'react'
import { TrendingUp, Sparkles, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { calculateViralScore } from '../lib/api'
import { useApiStore } from '../store/apiStore'

export default function ViralScoreEngine() {
  const [content, setContent] = useState('')
  const [platform, setPlatform] = useState('youtube')
  const [contentType, setContentType] = useState('title')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const { getActiveProvider } = useApiStore()

  const analyze = async () => {
    if (!content.trim()) {
      toast.error('Enter content to analyze')
      return
    }

    setLoading(true)
    try {
      const data = await calculateViralScore(content, platform, {
        contentType,
        providerId: getActiveProvider()?.id
      })
      setResult(data)
    } catch (err) {
      toast.error(`Analysis failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-400'
    if (score >= 6) return 'text-yellow-400'
    if (score >= 4) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreBg = (score) => {
    if (score >= 8) return 'bg-green-500'
    if (score >= 6) return 'bg-yellow-500'
    if (score >= 4) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-green-400" /> Viral Score Engine
        </h1>
        <p className="page-subtitle">Analyze your content's viral potential before publishing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card space-y-4 sticky top-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Content Type</label>
              <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="input-field">
                <option value="title">Title / Headline</option>
                <option value="hook">Opening Hook</option>
                <option value="script">Full Script</option>
                <option value="caption">Caption / Description</option>
                <option value="thumbnail">Thumbnail Concept</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="input-field">
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter/X</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Content *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-field min-h-[150px] resize-none"
                placeholder="Paste your title, hook, script, or caption..."
              />
            </div>

            <button onClick={analyze} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Analyze Viral Score
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {!result ? (
            <div className="card text-center py-16">
              <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Enter content to analyze its viral potential</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overall score */}
              <div className="card text-center py-8">
                <p className="text-sm text-gray-400 mb-2">Overall Viral Score</p>
                <div className={`text-7xl font-bold ${getScoreColor(result.overallScore)}`}>
                  {result.overallScore}
                  <span className="text-2xl text-gray-500">/10</span>
                </div>
                <div className="w-full max-w-xs mx-auto h-3 bg-gray-700 rounded-full mt-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getScoreBg(result.overallScore)} transition-all duration-1000`}
                    style={{ width: `${result.overallScore * 10}%` }}
                  />
                </div>
              </div>

              {/* Breakdown */}
              {result.breakdown && (
                <div className="card">
                  <h3 className="font-medium mb-4">Score Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(result.breakdown).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className={`text-sm font-medium ${getScoreColor(value)}`}>{value}/10</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getScoreBg(value)} transition-all`} style={{ width: `${value * 10}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {result.strengths?.length > 0 && (
                <div className="card border-green-500/20">
                  <h3 className="font-medium mb-3 flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-4 h-4" /> Strengths
                  </h3>
                  <ul className="space-y-2">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {result.improvements?.length > 0 && (
                <div className="card border-yellow-500/20">
                  <h3 className="font-medium mb-3 flex items-center gap-2 text-yellow-400">
                    <AlertCircle className="w-4 h-4" /> Suggested Improvements
                  </h3>
                  <ul className="space-y-2">
                    {result.improvements.map((s, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-yellow-400 mt-0.5">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Optimized version */}
              {result.optimized && (
                <div className="card border-primary-500/20">
                  <h3 className="font-medium mb-2 text-primary-400">✨ AI-Optimized Version</h3>
                  <p className="text-sm bg-gray-900 rounded-lg p-3">{result.optimized}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
