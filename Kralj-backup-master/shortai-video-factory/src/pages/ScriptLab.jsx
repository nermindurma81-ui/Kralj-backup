import { useState, useEffect } from 'react'
import { FileText, Sparkles, Loader2, Copy, Check, Download, Send, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateScript } from '../lib/api'
import { useApiStore } from '../store/apiStore'
import { useNavigate } from 'react-router-dom'
import WorkflowConnector from '../components/WorkflowConnector'

export default function ScriptLab() {
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState(60)
  const [tone, setTone] = useState('conversational')
  const [platform, setPlatform] = useState('youtube')
  const [language, setLanguage] = useState('English')
  const [script, setScript] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [queuedIdeas, setQueuedIdeas] = useState([])
  const { getActiveProvider } = useApiStore()
  const navigate = useNavigate()

  // Pick up ideas from IdeaLab
  useEffect(() => {
    const stored = sessionStorage.getItem('pipeline-ideas')
    if (stored) {
      try {
        const ideas = JSON.parse(stored)
        setQueuedIdeas(ideas)
        if (ideas.length > 0) {
          setTopic(ideas[0].title || ideas[0].hook || '')
          toast.success(`${ideas.length} ideas received from Idea Lab!`)
        }
      } catch {}
      sessionStorage.removeItem('pipeline-ideas')
    }
  }, [])

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
      const result = await generateScript(topic, {
        duration,
        tone,
        platform,
        language,
        providerId: provider.id
      })
      setScript(result)
      toast.success('Script generated!')
    } catch (err) {
      toast.error(`Generation failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const copyScript = () => {
    if (!script) return
    const fullScript = `${script.title}\n\n${script.scenes.map((s, i) => `Scene ${i + 1}: ${s.description}\n${s.dialogue}`).join('\n\n')}`
    navigator.clipboard.writeText(fullScript)
    setCopied(true)
    toast.success('Script copied')
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadScript = () => {
    if (!script) return
    const fullScript = `${script.title}\n\n${script.scenes.map((s, i) => `Scene ${i + 1}: ${s.description}\n${s.dialogue}`).join('\n\n')}`
    const blob = new Blob([fullScript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${script.title.replace(/\s+/g, '-').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const tones = [
    { value: 'conversational', label: 'Conversational' },
    { value: 'professional', label: 'Professional' },
    { value: 'humorous', label: 'Humorous' },
    { value: 'dramatic', label: 'Dramatic' },
    { value: 'inspirational', label: 'Inspirational' }
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <FileText className="w-8 h-8 text-blue-400" /> Script Lab
        </h1>
        <p className="page-subtitle">AI-powered video script generation</p>
      </div>

      <WorkflowConnector currentStep="script" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1">
          <div className="card space-y-4 sticky top-6">
            {queuedIdeas.length > 0 && (
              <div className="border border-primary-500/30 rounded-lg p-3 bg-primary-900/10">
                <p className="text-xs text-primary-400 mb-2 flex items-center gap-1">
                  <Send className="w-3 h-3" /> Ideas from Idea Lab
                </p>
                <div className="space-y-1">
                  {queuedIdeas.map((idea, i) => (
                    <button
                      key={i}
                      onClick={() => setTopic(idea.title || idea.hook || '')}
                      className={`w-full text-left text-xs px-2 py-1.5 rounded hover:bg-primary-500/20 transition-colors ${
                        topic === (idea.title || idea.hook) ? 'bg-primary-500/20 text-primary-300' : 'text-gray-400'
                      }`}
                    >
                      <ChevronRight className="w-3 h-3 inline mr-1" />
                      {idea.title || idea.hook}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">Topic / Video Idea *</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="input-field min-h-[100px] resize-none"
                placeholder="Describe your video topic in detail..."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Duration (seconds)</label>
              <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="input-field">
                <option value={15}>15 seconds (Short)</option>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
                <option value={90}>90 seconds</option>
                <option value={180}>3 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Tone</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)} className="input-field">
                {tones.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="input-field">
                <option value="youtube">YouTube Shorts</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram Reels</option>
                <option value="twitter">Twitter/X</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-field">
                <option value="English">English</option>
                <option value="Bosanski">Bosanski (Bosnian)</option>
                <option value="Srpski">Srpski (Serbian)</option>
                <option value="Hrvatski">Hrvatski (Croatian)</option>
                <option value="Deutsch">Deutsch (German)</option>
                <option value="Español">Español (Spanish)</option>
              </select>
            </div>

            <button onClick={generate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Script
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {!script ? (
            <div className="card text-center py-16">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Describe your video to generate a script</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{script.title}</h2>
                <div className="flex gap-2">
                  <button onClick={copyScript} className="btn-secondary text-sm flex items-center gap-1.5">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    Copy
                  </button>
                  <button onClick={downloadScript} className="btn-secondary text-sm flex items-center gap-1.5">
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>

              {script.hook && (
                <div className="card border-primary-500/30 bg-primary-900/10">
                  <span className="text-xs text-primary-400 uppercase tracking-wide mb-1 block">🎣 Opening Hook</span>
                  <p className="font-medium">{script.hook}</p>
                </div>
              )}

              {script.scenes && script.scenes.map((scene, index) => (
                <div key={index} className="card">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                      Scene {index + 1}
                    </span>
                    {scene.timestamp && (
                      <span className="text-xs text-gray-500">{scene.timestamp}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{scene.description}</p>
                  <p className="font-medium">{scene.dialogue}</p>
                  {scene.visualNote && (
                    <p className="text-xs text-gray-500 mt-2 italic">🎬 {scene.visualNote}</p>
                  )}
                </div>
              ))}

              {script.callToAction && (
                <div className="card border-green-500/30 bg-green-900/10">
                  <span className="text-xs text-green-400 uppercase tracking-wide mb-1 block">📢 Call to Action</span>
                  <p className="font-medium">{script.callToAction}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
