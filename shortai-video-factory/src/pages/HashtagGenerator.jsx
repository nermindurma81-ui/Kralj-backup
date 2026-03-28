import { useState } from 'react'
import { Hash, Sparkles, Loader2, Copy, Check, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateHashtags } from '../lib/api'
import { useApiStore } from '../store/apiStore'

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'twitter', name: 'Twitter/X' }
]

export default function HashtagGenerator() {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('youtube')
  const [hashtags, setHashtags] = useState([])
  const [loading, setLoading] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState(null)
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
      const result = await generateHashtags(topic, {
        platform,
        providerId: provider.id
      })
      setHashtags(Array.isArray(result) ? result : [])
      toast.success(`Generated ${Array.isArray(result) ? result.length : 0} hashtags`)
    } catch (err) {
      toast.error(`Generation failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const copyHashtag = (tag, index) => {
    navigator.clipboard.writeText(tag)
    setCopiedIdx(index)
    toast.success('Copied!')
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const copyAll = () => {
    navigator.clipboard.writeText(hashtags.join(' '))
    setCopiedAll(true)
    toast.success('All hashtags copied!')
    setTimeout(() => setCopiedAll(false), 2000)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Hash className="w-8 h-8 text-indigo-400" /> Hashtag Generator
        </h1>
        <p className="page-subtitle">Generate optimal hashtags for maximum reach</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card space-y-4 sticky top-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Video Topic *</label>
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
            </div>

            <button onClick={generate} disabled={loading} className="btn-accent w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Hashtags
            </button>

            {hashtags.length > 0 && (
              <button onClick={copyAll} className="btn-secondary w-full flex items-center justify-center gap-2">
                {copiedAll ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                Copy All ({hashtags.length})
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {hashtags.length === 0 ? (
            <div className="card text-center py-16">
              <Hash className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Enter a topic to generate hashtags</p>
              <p className="text-gray-500 text-sm mt-1">AI picks optimal mix of popular and niche tags</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{hashtags.length} hashtags generated</span>
                <button onClick={generate} disabled={loading} className="btn-secondary text-sm flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </button>
              </div>

              {/* All hashtags as copyable text block */}
              <div className="card">
                <p className="text-sm text-indigo-300 break-words leading-relaxed select-all">
                  {hashtags.join(' ')}
                </p>
              </div>

              {/* Individual hashtag chips */}
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => copyHashtag(tag, index)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      copiedIdx === index
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40'
                    }`}
                  >
                    {copiedIdx === index ? '✓ Copied' : tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
