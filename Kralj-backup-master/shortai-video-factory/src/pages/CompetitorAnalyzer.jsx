import { useState } from 'react'
import {
  Search, Users, TrendingUp, Eye, ThumbsUp, MessageCircle, BarChart3,
  Loader2, AlertCircle, Target, Lightbulb, Calendar, Video, Clock,
  Star, ChevronDown, ChevronUp, ChevronRight, ExternalLink, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import { sendChatRequest } from '../lib/api'
import { useApiStore } from '../store/apiStore'

const ANALYSIS_SECTIONS = [
  {
    id: 'strategy',
    label: 'Content Strategy',
    icon: Target,
    color: 'purple',
    description: 'Overall content approach and positioning'
  },
  {
    id: 'frequency',
    label: 'Posting Frequency',
    icon: Calendar,
    color: 'blue',
    description: 'Upload schedule and consistency analysis'
  },
  {
    id: 'topVideos',
    label: 'Top Performing Videos',
    icon: TrendingUp,
    color: 'green',
    description: 'Highest engagement content pieces'
  },
  {
    id: 'engagement',
    label: 'Engagement Rates',
    icon: ThumbsUp,
    color: 'yellow',
    description: 'Likes, comments, shares analysis'
  },
  {
    id: 'gaps',
    label: 'Content Gaps',
    icon: Lightbulb,
    color: 'red',
    description: 'Untapped opportunities identified'
  },
  {
    id: 'recommendations',
    label: 'Recommendations',
    icon: Star,
    color: 'emerald',
    description: 'Actionable improvement suggestions'
  }
]

function ScoreBadge({ score, label }) {
  const getColor = (s) => {
    if (s >= 80) return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' }
    if (s >= 60) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' }
    if (s >= 40) return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' }
    return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
  }

  const colors = getColor(score)

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colors.bg} ${colors.border}`}>
      <span className={`text-lg font-bold ${colors.text}`}>{score}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}

function AnalysisCard({ section, data, expanded, onToggle }) {
  const colors = {
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/20 text-green-400 border-green-500/20',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
    red: 'bg-red-500/20 text-red-400 border-red-500/20',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
  }

  const Icon = section.icon

  const renderContent = () => {
    if (!data) return <p className="text-gray-500 text-sm">No data available</p>

    if (typeof data === 'string') {
      return <p className="text-gray-300 text-sm leading-relaxed">{data}</p>
    }

    if (Array.isArray(data)) {
      return (
        <ul className="space-y-2">
          {data.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <ChevronRight className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
              {typeof item === 'string' ? (
                <span className="text-gray-300">{item}</span>
              ) : (
                <div className="flex-1">
                  {item.title && <span className="font-medium text-white">{item.title}</span>}
                  {item.views && <span className="text-gray-400 ml-2">• {item.views} views</span>}
                  {item.engagement && <span className="text-gray-400 ml-2">• {item.engagement} engagement</span>}
                  {item.description && <p className="text-gray-400 text-xs mt-1">{item.description}</p>}
                  {item.suggestion && <p className="text-gray-300">{item.suggestion}</p>}
                  {item.reason && <p className="text-gray-400 text-xs mt-1">{item.reason}</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )
    }

    if (typeof data === 'object') {
      return (
        <div className="space-y-3">
          {Object.entries(data).map(([key, value]) => (
            <div key={key}>
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
              </span>
              {typeof value === 'string' ? (
                <p className="text-gray-300 text-sm mt-1">{value}</p>
              ) : Array.isArray(value) ? (
                <ul className="mt-1 space-y-1">
                  {value.map((v, i) => (
                    <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-gray-500">•</span> {typeof v === 'string' ? v : JSON.stringify(v)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300 text-sm mt-1">{JSON.stringify(value)}</p>
              )}
            </div>
          ))}
        </div>
      )
    }

    return <p className="text-gray-300 text-sm">{String(data)}</p>
  }

  return (
    <div className={`rounded-xl border transition-all ${colors[section.color]} bg-gray-800/50`}>
      <div
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[section.color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{section.label}</h3>
            <p className="text-xs text-gray-500">{section.description}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-700/50 pt-3">
          {renderContent()}
        </div>
      )}
    </div>
  )
}

export default function CompetitorAnalyzer() {
  const [channelInput, setChannelInput] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState(
    Object.fromEntries(ANALYSIS_SECTIONS.map(s => [s.id, true]))
  )
  const { getActiveProvider } = useApiStore()

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const extractChannelName = (input) => {
    const trimmed = input.trim()
    const urlPatterns = [
      /youtube\.com\/@([^\/\s?]+)/,
      /youtube\.com\/channel\/([^\/\s?]+)/,
      /youtube\.com\/c\/([^\/\s?]+)/,
      /youtube\.com\/user\/([^\/\s?]+)/,
      /@([a-zA-Z0-9_.-]+)/
    ]
    for (const pattern of urlPatterns) {
      const match = trimmed.match(pattern)
      if (match) return match[1]
    }
    return trimmed
  }

  const runAnalysis = async () => {
    if (!channelInput.trim()) {
      toast.error('Enter a YouTube channel URL or name')
      return
    }

    const provider = getActiveProvider()
    if (!provider) {
      toast.error('Configure an AI provider first')
      return
    }

    const channelName = extractChannelName(channelInput)

    setLoading(true)
    setAnalysis(null)

    try {
      const response = await sendChatRequest(provider.id, [
        {
          role: 'user',
          content: `You are an expert YouTube analytics consultant. Perform a detailed competitor analysis for the YouTube channel "${channelName}".

Analyze and return a JSON object with these sections:

1. "channelOverview": { name, estimatedSubscribers, totalVideos, niche, description }

2. "contentStrategy": A string paragraph describing their overall content approach, themes, and positioning.

3. "frequency": { uploadsPerWeek, consistency (low/medium/high), bestPostingDays (array), analysis (string) }

4. "topVideos": Array of 5 objects with: { title, estimatedViews, engagement, description (why it performed well) }

5. "engagement": { likeToViewRatio, commentSentiment (positive/mixed/negative), averageComments, shareability (low/medium/high), analysis (string) }

6. "gaps": Array of 5 strings describing content opportunities this channel is missing.

7. "recommendations": Array of 5 objects with: { suggestion, reason, priority (high/medium/low) }

8. "overallScore": A number from 0-100 rating this channel's content strategy.
9. "competitiveness": A number from 0-100 how hard it would be to compete.
10. "opportunityScore": A number from 0-100 rating the opportunity in this niche.

Be realistic and analytical. Base your analysis on typical patterns for channels in this niche and subscriber range. Return ONLY valid JSON, no markdown code blocks.`
        }
      ])

      let parsed
      try {
        let clean = typeof response.content === 'string'
          ? response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          : JSON.stringify(response.content)
        const jsonMatch = clean.match(/\{[\s\S]*\}/)
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean)
      } catch (parseErr) {
        throw new Error('Failed to parse analysis response. The AI returned an unexpected format.')
      }

      setAnalysis(parsed)
      toast.success('Competitor analysis complete!')
    } catch (err) {
      toast.error(`Analysis failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      runAnalysis()
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Users className="w-8 h-8 text-cyan-400" /> Competitor Analyzer
        </h1>
        <p className="page-subtitle">AI-powered competitor analysis for YouTube channels</p>
      </div>

      {/* Input Section */}
      <div className="card mt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter YouTube channel URL or @handle (e.g., @MrBeast or youtube.com/@channel)"
              className="input-field pl-10 w-full"
              disabled={loading}
            />
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading || !channelInput.trim()}
            className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Analyze Channel
              </>
            )}
          </button>
        </div>

        {loading && (
          <div className="mt-4 flex items-center gap-3 text-sm text-gray-400">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>AI is analyzing channel data, content strategy, and engagement metrics...</span>
          </div>
        )}
      </div>

      {/* Results */}
      {analysis && (
        <div className="space-y-6 mt-6">
          {/* Channel Overview */}
          {analysis.channelOverview && (
            <div className="card">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-cyan-400" />
                    {analysis.channelOverview.name || extractChannelName(channelInput)}
                  </h2>
                  {analysis.channelOverview.description && (
                    <p className="text-sm text-gray-400 mt-1 max-w-2xl">{analysis.channelOverview.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {analysis.channelOverview.estimatedSubscribers && (
                    <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <div>
                        <span className="text-sm font-semibold text-white">{analysis.channelOverview.estimatedSubscribers}</span>
                        <span className="text-xs text-gray-400 block">Subscribers</span>
                      </div>
                    </div>
                  )}
                  {analysis.channelOverview.totalVideos && (
                    <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2">
                      <Video className="w-4 h-4 text-green-400" />
                      <div>
                        <span className="text-sm font-semibold text-white">{analysis.channelOverview.totalVideos}</span>
                        <span className="text-xs text-gray-400 block">Videos</span>
                      </div>
                    </div>
                  )}
                  {analysis.channelOverview.niche && (
                    <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2">
                      <Target className="w-4 h-4 text-purple-400" />
                      <div>
                        <span className="text-sm font-semibold text-white">{analysis.channelOverview.niche}</span>
                        <span className="text-xs text-gray-400 block">Niche</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Score Badges */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-700/50">
                {analysis.overallScore != null && (
                  <ScoreBadge score={analysis.overallScore} label="Overall" />
                )}
                {analysis.competitiveness != null && (
                  <ScoreBadge score={analysis.competitiveness} label="Competitiveness" />
                )}
                {analysis.opportunityScore != null && (
                  <ScoreBadge score={analysis.opportunityScore} label="Opportunity" />
                )}
              </div>
            </div>
          )}

          {/* Analysis Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {ANALYSIS_SECTIONS.map(section => (
              <AnalysisCard
                key={section.id}
                section={section}
                data={analysis[section.id]}
                expanded={expandedSections[section.id]}
                onToggle={() => toggleSection(section.id)}
              />
            ))}
          </div>

          {/* Quick Insights */}
          {analysis.gaps && Array.isArray(analysis.gaps) && analysis.gaps.length > 0 && (
            <div className="card border-yellow-500/20 bg-yellow-900/10">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Top Opportunity
              </h3>
              <p className="text-gray-300 text-sm">
                {typeof analysis.gaps[0] === 'string' ? analysis.gaps[0] : JSON.stringify(analysis.gaps[0])}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!analysis && !loading && (
        <div className="card text-center py-16 mt-6">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">Analyze Your Competitors</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Enter a YouTube channel URL or @handle above to get a detailed AI-powered analysis of their
            content strategy, engagement rates, top videos, and actionable recommendations.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['Content Strategy', 'Posting Frequency', 'Top Videos', 'Engagement Rates', 'Content Gaps', 'Recommendations'].map(label => (
              <span key={label} className="px-3 py-1 rounded-full bg-gray-700/50 text-xs text-gray-400 border border-gray-600/50">
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
