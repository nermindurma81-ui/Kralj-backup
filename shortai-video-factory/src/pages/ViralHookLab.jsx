import { useState } from 'react'
import { Sparkles, Loader2, Copy, Check, RefreshCw, ThumbsUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateHooks } from '../lib/api'
import { useApiStore } from '../store/apiStore'

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube Shorts', maxLen: 100 },
  { id: 'tiktok', name: 'TikTok', maxLen: 150 },
  { id: 'instagram', name: 'Instagram Reels', maxLen: 125 },
  { id: 'twitter', name: 'Twitter/X', maxLen: 280 }
]

export default function ViralHookLab() {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('youtube')
  const [hookType, setHookType] = useState('question')
  const [hooks, setHooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(null)
  const [votes, setVotes] = useState({})
  const { getActiveProvider } = useApiStore()

  const generate = async () => {
    if (!topic.trim()) {
      toast.error('Enter a topic')
      return
    }

    const provider = getActiveProvider()
    if (!provider) {
      toast.error('Configure an AI provider first')
      return
    }

    setLoading(true)
    try {
      const result = await generateHooks(platform, topic, {
        hookType,
        count: 5,
        providerId: provider.id
      })
      const newHooks = (result.hooks || []).slice(0, 5)
      setHooks(newHooks)
      setVotes({})
      toast.success(`Generated ${newHooks.length} hooks — vote for the best!`)
    } catch (err) {
      toast.error(`Generation failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const copyHook = (hook, index) => {
    navigator.clipboard.writeText(hook.text)
    setCopied(index)
    toast.success('Hook copied')
    setTimeout(() => setCopied(null), 2000)
  }

  const voteHook = (index) => {
    setVotes(prev => ({
      ...prev,
      [index]: (prev[index] || 0) + 1
    }))
    toast.success(`Voted for Hook #${index + 1}! 👍`)
  }

  const hookTypes = [
    { value: 'question', label: 'Question Hook' },
    { value: 'shocking', label: 'Shocking Statement' },
    { value: 'story', label: 'Story Teaser' },
    { value: 'challenge', label: 'Challenge' },
    { value: 'list', label: 'List Teaser' },
    { value: 'controversy', label: 'Controversial Take' }
  ]

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-accent-400" /> Viral Hook Lab — A/B Test
        </h1>
        <p className="page-subtitle">Generate 5 hooks side-by-side, vote for the best one</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card space-y-4 sticky top-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Topic / Video Content *</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="input-field min-h-[100px] resize-none"
                placeholder="What is your video about?"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="input-field">
                {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Max {PLATFORMS.find(p => p.id === platform)?.maxLen} characters
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Hook Type</label>
              <select value={hookType} onChange={(e) => setHookType(e.target.value)} className="input-field">
                {hookTypes.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>

            <button onClick={generate} disabled={loading} className="btn-accent w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate 5 Hooks
            </button>

            {totalVotes > 0 && (
              <div className="text-center text-sm text-gray-400">
                Total votes: {totalVotes} |{' '}
                {Object.entries(votes).sort((a, b) => b[1] - a[1])[0] && (
                  <span className="text-green-400">
                    Leading: Hook #{parseInt(Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0]) + 1}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {hooks.length === 0 ? (
            <div className="card text-center py-16">
              <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Enter a topic to A/B test hooks</p>
              <p className="text-gray-500 text-sm mt-1">5 hooks generated side-by-side — vote for the winner</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{hooks.length} hooks — pick the best!</span>
                <button onClick={generate} className="btn-secondary text-sm flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </button>
              </div>

              {/* Side-by-side grid: 2 per row on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {hooks.map((hook, index) => {
                  const voteCount = votes[index] || 0
                  const isLeading = totalVotes > 0 && voteCount === Math.max(...Object.values(votes))
                  return (
                    <div
                      key={index}
                      className={`card transition-all ${
                        isLeading && totalVotes > 0
                          ? 'border-green-500/50 ring-1 ring-green-500/20'
                          : 'hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-400 font-bold">
                          Hook #{index + 1}
                        </span>
                        {hook.score && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            hook.score >= 8 ? 'bg-green-500/20 text-green-400' :
                            hook.score >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {hook.score}/10
                          </span>
                        )}
                        {isLeading && totalVotes > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                            👑 Leading
                          </span>
                        )}
                      </div>

                      <p className="font-medium text-sm mb-2">{hook.text}</p>
                      {hook.why && <p className="text-xs text-gray-500 mb-3">{hook.why}</p>}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => voteHook(index)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            voteCount > 0
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          Vote {voteCount > 0 && `(${voteCount})`}
                        </button>
                        <button
                          onClick={() => copyHook(hook, index)}
                          className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        >
                          {copied === index ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Summary bar */}
              {totalVotes > 0 && (
                <div className="card mt-4">
                  <h4 className="text-sm font-medium mb-2 text-gray-300">Vote Distribution</h4>
                  <div className="space-y-2">
                    {hooks.map((hook, index) => {
                      const voteCount = votes[index] || 0
                      const pct = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-16">Hook #{index + 1}</span>
                          <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-12 text-right">{voteCount} ({Math.round(pct)}%)</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
