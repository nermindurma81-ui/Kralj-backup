import { useState } from 'react'
import { Layers, Sparkles, Loader2, Play, Pause, Trash2, Download, Plus, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateScript, generateHooks, generateStoryboard, generateVoice, generateCaptions } from '../lib/api'
import { useApiStore } from '../store/apiStore'

export default function BulkGenerator() {
  const [topics, setTopics] = useState([''])
  const [settings, setSettings] = useState({
    platform: 'youtube',
    duration: 60,
    tone: 'conversational',
    generateVoice: false,
    generateCaptions: true
  })
  const [jobs, setJobs] = useState([])
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const { getActiveProvider } = useApiStore()

  const addTopic = () => setTopics(prev => [...prev, ''])
  const removeTopic = (index) => setTopics(prev => prev.filter((_, i) => i !== index))
  const updateTopic = (index, value) => setTopics(prev => prev.map((t, i) => i === index ? value : t))

  const runBulk = async () => {
    const validTopics = topics.filter(t => t.trim())
    if (validTopics.length === 0) {
      toast.error('Add at least one topic')
      return
    }

    const provider = getActiveProvider()
    if (!provider) {
      toast.error('Configure an AI provider first')
      return
    }

    setRunning(true)
    setProgress({ current: 0, total: validTopics.length })
    setJobs([])

    for (let i = 0; i < validTopics.length; i++) {
      const topic = validTopics[i]
      const jobId = crypto.randomUUID()
      setJobs(prev => [...prev, { id: jobId, topic, status: 'running', steps: [], result: null }])
      setProgress({ current: i + 1, total: validTopics.length })

      try {
        // Step 1: Generate script
        const script = await generateScript(topic, {
          duration: settings.duration,
          tone: settings.tone,
          platform: settings.platform,
          providerId: provider.id
        })
        updateJobStep(jobId, 'script', 'done')

        // Step 2: Generate hooks
        const hooks = await generateHooks(settings.platform, topic, {
          providerId: provider.id,
          count: 3
        })
        updateJobStep(jobId, 'hooks', 'done')

        // Step 3: Generate storyboard
        const storyboard = await generateStoryboard(script.scenes?.map(s => s.dialogue).join('\n') || topic, {
          providerId: provider.id
        })
        updateJobStep(jobId, 'storyboard', 'done')

        // Step 4: Voice (optional)
        let voiceResult = null
        if (settings.generateVoice) {
          voiceResult = await generateVoice(script.scenes?.[0]?.dialogue || topic, {
            providerId: provider.id
          })
          updateJobStep(jobId, 'voice', 'done')
        }

        // Step 5: Captions (optional)
        let captionsResult = null
        if (settings.generateCaptions) {
          captionsResult = await generateCaptions(script.scenes?.map(s => s.dialogue).join('\n') || topic, {
            providerId: provider.id
          })
          updateJobStep(jobId, 'captions', 'done')
        }

        updateJobStatus(jobId, 'done', { script, hooks, storyboard, voice: voiceResult, captions: captionsResult })
      } catch (err) {
        updateJobStatus(jobId, 'error', null, err.message)
      }
    }

    setRunning(false)
    toast.success('Bulk generation complete!')
  }

  const updateJobStep = (jobId, step, status) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, steps: [...j.steps.filter(s => s.name !== step), { name: step, status }] } : j))
  }

  const updateJobStatus = (jobId, status, result, error) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status, result, error } : j))
  }

  const clearAll = () => {
    setJobs([])
    setTopics([''])
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Layers className="w-8 h-8 text-violet-400" /> Bulk Generator
        </h1>
        <p className="page-subtitle">Generate multiple videos at once with full pipeline automation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card space-y-4 sticky top-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Topics</label>
              {topics.map((topic, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => updateTopic(i, e.target.value)}
                    className="input-field flex-1"
                    placeholder={`Topic ${i + 1}...`}
                  />
                  {topics.length > 1 && (
                    <button onClick={() => removeTopic(i)} className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addTopic} className="btn-secondary text-sm w-full flex items-center justify-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Topic
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Platform</label>
              <select value={settings.platform} onChange={(e) => setSettings(s => ({ ...s, platform: e.target.value }))} className="input-field">
                <option value="youtube">YouTube Shorts</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram Reels</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Duration</label>
              <select value={settings.duration} onChange={(e) => setSettings(s => ({ ...s, duration: parseInt(e.target.value) }))} className="input-field">
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
                <option value={90}>90s</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input type="checkbox" checked={settings.generateVoice} onChange={(e) => setSettings(s => ({ ...s, generateVoice: e.target.checked }))} className="rounded" />
                Generate Voice
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input type="checkbox" checked={settings.generateCaptions} onChange={(e) => setSettings(s => ({ ...s, generateCaptions: e.target.checked }))} className="rounded" />
                Generate Captions
              </label>
            </div>

            <button onClick={runBulk} disabled={running} className="btn-primary w-full flex items-center justify-center gap-2">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? `Running (${progress.current}/${progress.total})` : 'Start Bulk Generation'}
            </button>

            {jobs.length > 0 && (
              <button onClick={clearAll} className="btn-secondary w-full text-sm">Clear All</button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {jobs.length === 0 ? (
            <div className="card text-center py-16">
              <Layers className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Add topics and start bulk generation</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className={`card ${job.status === 'error' ? 'border-red-500/30' : job.status === 'done' ? 'border-green-500/30' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {job.status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-primary-400" />}
                      {job.status === 'done' && <CheckCircle className="w-4 h-4 text-green-400" />}
                      {job.status === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
                      <span className="font-medium">{job.topic}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      job.status === 'done' ? 'bg-green-500/20 text-green-400' :
                      job.status === 'error' ? 'bg-red-500/20 text-red-400' :
                      'bg-primary-500/20 text-primary-400'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['script', 'hooks', 'storyboard', 'voice', 'captions'].map((step) => {
                      const stepData = job.steps.find(s => s.name === step)
                      const isActive = settings[`generate${step.charAt(0).toUpperCase() + step.slice(1)}`] !== false || step !== 'voice'
                      if (step === 'voice' && !settings.generateVoice) return null
                      if (step === 'captions' && !settings.generateCaptions) return null
                      return (
                        <span key={step} className={`text-xs px-2 py-1 rounded-full ${
                          stepData?.status === 'done' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {stepData?.status === 'done' ? '✓' : '○'} {step}
                        </span>
                      )
                    })}
                  </div>
                  {job.error && <p className="text-xs text-red-400 mt-2">{job.error}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
