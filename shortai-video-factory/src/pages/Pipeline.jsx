import { useState } from 'react'
import { Zap, Play, Loader2, Film, FileText, Image, Mic, Download, CheckCircle, XCircle, Clock, Sparkles, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateScript, generateHooks, generateCaptions, generateThumbnail, generateVoice } from '../lib/api'
import { useApiStore } from '../store/apiStore'

export default function Pipeline() {
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(5)
  const [platform, setPlatform] = useState('youtube')
  const [duration, setDuration] = useState(30)
  const [jobs, setJobs] = useState([])
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const { getActiveProvider } = useApiStore()

  const runPipeline = async () => {
    if (!topic.trim()) { toast.error('Enter a topic'); return }
    const provider = getActiveProvider()
    if (!provider) { toast.error('Configure AI provider first'); return }

    setRunning(true)
    setJobs([])
    setProgress({ current: 0, total: count })

    // Generate topic variations
    let topics = Array(count).fill(null).map((_, i) => `${topic} - Part ${i + 1}`)
    try {
      const variationPrompt = `Generate ${count} unique viral video topic variations for: "${topic}". Return JSON array of strings.`
      const { sendChatRequest } = await import('../lib/api')
      const result = await sendChatRequest(provider.id, [{ role: 'user', content: variationPrompt }], { temperature: 0.9 })
      let clean = result.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const match = clean.match(/\[[\s\S]*\]/)
      const parsed = match ? JSON.parse(match[0]) : null
      if (Array.isArray(parsed) && parsed.length > 0) topics = parsed.slice(0, count)
    } catch {}

    for (let i = 0; i < topics.length; i++) {
      setProgress({ current: i + 1, total: topics.length })
      const jobId = `job-${i}`
      setJobs(prev => [...prev, { id: jobId, topic: topics[i], status: 'running', steps: {}, result: null }])

      try {
        // Step 1: Script
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, steps: { ...j.steps, script: 'running' } } : j))
        const script = await generateScript(topics[i], { duration, platform, providerId: provider.id })
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, steps: { ...j.steps, script: 'done' } } : j))

        // Step 2: Hooks
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, steps: { ...j.steps, hooks: 'running' } } : j))
        const hooks = await generateHooks(platform, topics[i], { providerId: provider.id, count: 3 })
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, steps: { ...j.steps, hooks: 'done' } } : j))

        // Step 3: Thumbnail
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, steps: { ...j.steps, thumbnail: 'running' } } : j))
        const thumb = await generateThumbnail(script?.title || topics[i], { style: 'vibrant' }).catch(() => null)
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, steps: { ...j.steps, thumbnail: thumb ? 'done' : 'error' } } : j))

        // Step 4: Captions
        const dialogue = script?.scenes?.map(s => s.dialogue).join(' ') || ''
        if (dialogue) {
          setJobs(prev => prev.map(j => j.id === jobId ? { ...j, steps: { ...j.steps, captions: 'running' } } : j))
          const captions = await generateCaptions(dialogue, { providerId: provider.id }).catch(() => null)
          setJobs(prev => prev.map(j => j.id === jobId ? { ...j, steps: { ...j.steps, captions: captions ? 'done' : 'error' } } : j))
        }

        setJobs(prev => prev.map(j => j.id === jobId ? {
          ...j, status: 'done',
          result: { script, hooks, thumbnail: thumb?.imageUrl }
        } : j))

      } catch (err) {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'error', error: err.message } : j))
      }
    }

    setRunning(false)
    const done = jobs.filter(j => j.status === 'done').length + 1
    toast.success(`Pipeline complete! ${done}/${count} videos ready`)
  }

  const getStepIcon = (status) => {
    if (status === 'done') return <CheckCircle className="w-3 h-3 text-green-400" />
    if (status === 'running') return <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
    if (status === 'error') return <XCircle className="w-3 h-3 text-red-400" />
    return <Clock className="w-3 h-3 text-gray-500" />
  }

  const [expandedJob, setExpandedJob] = useState(null)
  const [copiedJob, setCopiedJob] = useState(null)
  const [downloadingAll, setDownloadingAll] = useState(false)

  const downloadAll = async () => {
    const completedJobs = jobs.filter(j => j.status === 'done' && j.result)
    if (completedJobs.length === 0) {
      toast.error('No completed jobs to export')
      return
    }

    setDownloadingAll(true)
    toast.loading('Building export bundle...', { id: 'zip-export' })

    try {
      // Build export data as JSON + individual files
      const exportData = {
        exportedAt: new Date().toISOString(),
        topic,
        platform,
        videos: []
      }

      // Collect all content
      for (const job of completedJobs) {
        const videoData = {
          topic: job.topic,
          script: job.result.script || null,
          hooks: job.result.hooks || null,
          thumbnailUrl: job.result.thumbnail || null
        }
        exportData.videos.push(videoData)
      }

      // Try loading JSZip from CDN for proper zip
      let zipBlob
      try {
        const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default
        const zip = new JSZip()

        // Add master JSON
        zip.file('export.json', JSON.stringify(exportData, null, 2))

        // Add individual video folders
        for (let i = 0; i < exportData.videos.length; i++) {
          const video = exportData.videos[i]
          const folder = zip.folder(`video-${i + 1}`)

          // Script as text
          if (video.script) {
            let scriptText = `TITLE: ${video.script.title || 'Untitled'}\n\n`
            if (video.script.hook) scriptText += `HOOK: ${video.script.hook}\n\n`
            if (video.script.scenes) {
              video.script.scenes.forEach((s, idx) => {
                scriptText += `--- Scene ${idx + 1}: ${s.description || ''} ---\n`
                scriptText += `${s.dialogue || ''}\n`
                if (s.visualNote) scriptText += `🎬 Visual: ${s.visualNote}\n`
                scriptText += '\n'
              })
            }
            if (video.script.callToAction) scriptText += `CTA: ${video.script.callToAction}\n`
            folder.file('script.txt', scriptText)
          }

          // Hooks as text
          if (video.hooks?.hooks) {
            const hooksText = video.hooks.hooks.map((h, idx) => `${idx + 1}. ${h.text || h}`).join('\n')
            folder.file('hooks.txt', hooksText)
          }

          // Thumbnail URL
          if (video.thumbnailUrl) {
            folder.file('thumbnail-url.txt', video.thumbnailUrl)
          }
        }

        // Add CSV summary
        let csv = 'Video,Title,Hook,Thumbnail URL\n'
        exportData.videos.forEach((v, i) => {
          csv += `${i + 1},"${(v.script?.title || v.topic).replace(/"/g, '""')}","${(v.script?.hook || '').replace(/"/g, '""')}","${v.thumbnailUrl || ''}"\n`
        })
        zip.file('summary.csv', csv)

        zipBlob = await zip.generateAsync({ type: 'blob' })
      } catch {
        // Fallback: just download the JSON
        zipBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      }

      // Trigger download
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `shortai-batch-${Date.now()}.zip`
      a.click()
      URL.revokeObjectURL(url)

      toast.success(`Exported ${completedJobs.length} videos! 📦`, { id: 'zip-export' })
    } catch (err) {
      toast.error(`Export failed: ${err.message}`, { id: 'zip-export' })
    } finally {
      setDownloadingAll(false)
    }
  }

  const copyJobContent = (job) => {
    if (!job.result) return
    const parts = []
    if (job.result.script) {
      parts.push(`TITLE: ${job.result.script.title}`)
      parts.push('')
      if (job.result.script.hook) parts.push(`HOOK: ${job.result.script.hook}`)
      parts.push('')
      if (job.result.script.scenes) {
        job.result.script.scenes.forEach((s, i) => {
          parts.push(`Scene ${i + 1}: ${s.description}`)
          parts.push(s.dialogue)
          if (s.visualNote) parts.push(`🎬 ${s.visualNote}`)
          parts.push('')
        })
      }
      if (job.result.script.callToAction) parts.push(`CTA: ${job.result.script.callToAction}`)
    }
    if (job.result.hooks?.hooks) {
      parts.push('')
      parts.push('HOOKS:')
      job.result.hooks.hooks.forEach((h, i) => parts.push(`${i + 1}. ${h.text || h}`))
    }
    navigator.clipboard.writeText(parts.join('\n'))
    setCopiedJob(job.id)
    toast.success('All content copied!')
    setTimeout(() => setCopiedJob(null), 2000)
  }

  const done = jobs.filter(j => j.status === 'done').length
  const errors = jobs.filter(j => j.status === 'error').length

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Zap className="w-8 h-8 text-yellow-400" /> Pipeline
        </h1>
        <p className="page-subtitle">Batch-generate {count} videos from one topic — fully automated</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card space-y-4 sticky top-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Topic / Niche *</label>
              <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                className="input-field" placeholder="e.g., AI tools, cooking tips, fitness" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Videos to Generate</label>
              <select value={count} onChange={(e) => setCount(parseInt(e.target.value))} className="input-field">
                <option value={3}>3 videos</option>
                <option value={5}>5 videos</option>
                <option value={10}>10 videos</option>
                <option value={20}>20 videos</option>
                <option value={33}>33 videos (daily batch)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="input-field">
                <option value="youtube">YouTube Shorts</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram Reels</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Duration</label>
              <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="input-field">
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
              </select>
            </div>

            <button onClick={runPipeline} disabled={running || !topic.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? `Generating (${progress.current}/${progress.total})` : `🚀 Generate ${count} Videos`}
            </button>

            {jobs.length > 0 && (
              <div className="text-center">
                <div className="flex justify-center gap-4 text-sm">
                  <span className="text-green-400">✅ {done}</span>
                  <span className="text-red-400">❌ {errors}</span>
                  <span className="text-gray-400">📊 {jobs.length}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all"
                    style={{ width: `${(done / jobs.length) * 100}%` }} />
                </div>
                {done > 0 && !running && (
                  <button
                    onClick={downloadAll}
                    disabled={downloadingAll}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    {downloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    📦 Download All ({done} videos)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {jobs.length === 0 ? (
            <div className="card text-center py-16">
              <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Enter a topic and run the pipeline</p>
              <p className="text-gray-500 text-sm mt-1">AI generates scripts, hooks, thumbnails & captions for each video</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job, i) => {
                const isExpanded = expandedJob === job.id
                return (
                <div key={job.id} className={`card ${
                  job.status === 'done' ? 'border-green-500/30' :
                  job.status === 'error' ? 'border-red-500/30' : 'border-blue-500/30'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">#{i + 1}</span>
                        {job.status === 'done' && <CheckCircle className="w-4 h-4 text-green-400" />}
                        {job.status === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
                        {job.status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                        {job.status === 'done' && (
                          <button
                            onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                            className="ml-auto text-xs text-gray-400 hover:text-white flex items-center gap-1"
                          >
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {isExpanded ? 'Hide' : 'Preview'}
                          </button>
                        )}
                      </div>
                      <h3 className="font-medium text-sm">{job.topic}</h3>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {['script', 'hooks', 'thumbnail', 'captions'].map(step => (
                          <span key={step} className="flex items-center gap-1 text-xs">
                            {getStepIcon(job.steps?.[step])}
                            <span className="text-gray-500">{step}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {job.status === 'done' && (
                      <div className="flex gap-1.5">
                        <button onClick={() => copyJobContent(job)} className="btn-secondary text-xs px-2 py-1 flex items-center gap-1">
                          {copiedJob === job.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          Copy All
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded preview for done jobs */}
                  {job.status === 'done' && isExpanded && job.result && (
                    <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                      {/* Thumbnail preview */}
                      {job.result.thumbnail && (
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">🖼️ Thumbnail</span>
                          <img src={job.result.thumbnail} alt="Thumbnail" className="w-full max-w-xs rounded-lg border border-gray-700" />
                          <a href={job.result.thumbnail} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary-400 hover:underline mt-1 inline-block">
                            Open full size ↗
                          </a>
                        </div>
                      )}

                      {/* Script preview */}
                      {job.result.script && (
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">📝 Script</span>
                          {job.result.script.title && <h4 className="font-medium text-sm mb-2">{job.result.script.title}</h4>}
                          {job.result.script.hook && (
                            <p className="text-xs text-primary-400 mb-2 italic">🎣 {job.result.script.hook}</p>
                          )}
                          {job.result.script.scenes?.map((s, idx) => (
                            <div key={idx} className="mb-2 pl-3 border-l-2 border-gray-700">
                              <p className="text-xs text-gray-400">{s.description}</p>
                              <p className="text-sm">{s.dialogue}</p>
                            </div>
                          ))}
                          {job.result.script.callToAction && (
                            <p className="text-xs text-green-400 mt-2">📢 {job.result.script.callToAction}</p>
                          )}
                        </div>
                      )}

                      {/* Hooks preview */}
                      {job.result.hooks?.hooks && job.result.hooks.hooks.length > 0 && (
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">🎣 Hooks</span>
                          <ul className="space-y-1">
                            {job.result.hooks.hooks.map((h, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <span className="text-xs text-gray-500 mt-0.5">{idx + 1}.</span>
                                <span>{h.text || h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {job.status === 'error' && job.error && (
                    <p className="text-xs text-red-400 mt-2">Error: {job.error}</p>
                  )}
                </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
