import { useState, useEffect, useCallback } from 'react'
import {
  Factory, Play, Pause, Square, ChevronRight, Loader2, Check, X, AlertCircle,
  Lightbulb, FileText, Video, Mic, Subtitles, Image, Calendar, Zap, RotateCcw,
  Settings, ChevronDown, ChevronUp, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useApiStore } from '../store/apiStore'
import { useProjectStore } from '../store/projectStore'
import { usePlatformStore } from '../store/platformStore'
import {
  sendChatRequest,
  generateScript,
  generateStoryboard,
  generateVoice,
  generateCaptions,
  generateThumbnail,
  scheduleContent,
  getPlatformConnections
} from '../lib/api'
import WorkflowConnector from '../components/WorkflowConnector'

const PIPELINE_STEPS = [
  {
    id: 'niche',
    label: 'Pick Niche',
    icon: Settings,
    description: 'Select your content niche and target audience',
    color: 'purple'
  },
  {
    id: 'ideas',
    label: 'Generate Ideas',
    icon: Lightbulb,
    description: 'AI generates trending video ideas for your niche',
    color: 'yellow'
  },
  {
    id: 'scripts',
    label: 'Generate Scripts',
    icon: FileText,
    description: 'Create engaging scripts for each video idea',
    color: 'blue'
  },
  {
    id: 'storyboard',
    label: 'Build Storyboard',
    icon: Video,
    description: 'Visual storyboard with scene breakdowns',
    color: 'green'
  },
  {
    id: 'voice',
    label: 'Generate Voice',
    icon: Mic,
    description: 'AI voiceover generation for your scripts',
    color: 'red'
  },
  {
    id: 'captions',
    label: 'Generate Captions',
    icon: Subtitles,
    description: 'Auto-generated captions and subtitles',
    color: 'cyan'
  },
  {
    id: 'thumbnail',
    label: 'Generate Thumbnail',
    icon: Image,
    description: 'AI-generated eye-catching thumbnails',
    color: 'orange'
  },
  {
    id: 'publish',
    label: 'Schedule / Publish',
    icon: Calendar,
    description: 'Schedule or publish to connected platforms',
    color: 'emerald'
  }
]

const STATUS_CONFIG = {
  pending: { color: 'text-gray-400', bg: 'bg-gray-700', label: 'Pending', icon: Clock },
  running: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Running', icon: Loader2 },
  done: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Completed', icon: Check },
  error: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Error', icon: AlertCircle },
  paused: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Paused', icon: Pause }
}

const NICHES = [
  { id: 'tech', label: 'Tech & Gadgets', icon: '💻' },
  { id: 'fitness', label: 'Fitness & Health', icon: '💪' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'finance', label: 'Finance & Money', icon: '💰' },
  { id: 'cooking', label: 'Cooking & Food', icon: '🍳' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'fashion', label: 'Fashion & Beauty', icon: '👗' },
  { id: 'diy', label: 'DIY & Crafts', icon: '🔨' },
  { id: 'comedy', label: 'Comedy & Entertainment', icon: '😂' }
]

const PLATFORMS = ['youtube', 'tiktok', 'instagram']

export default function AutoFactory() {
  const [selectedNiche, setSelectedNiche] = useState('')
  const [customNiche, setCustomNiche] = useState('')
  const [targetPlatform, setTargetPlatform] = useState('youtube')
  const [videoCount, setVideoCount] = useState(3)
  const [stepStatuses, setStepStatuses] = useState({})
  const [stepResults, setStepResults] = useState({})
  const [pipelineState, setPipelineState] = useState('idle')
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [expandedStep, setExpandedStep] = useState(null)
  const [logs, setLogs] = useState([])
  const { getActiveProvider } = useApiStore()
  const { addProject } = useProjectStore()

  const addLog = useCallback((stepId, message, type = 'info') => {
    setLogs(prev => [...prev, {
      id: Date.now(),
      stepId,
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }])
  }, [])

  const resetPipeline = () => {
    setStepStatuses({})
    setStepResults({})
    setPipelineState('idle')
    setCurrentStepIndex(-1)
    setExpandedStep(null)
    setLogs([])
    toast.success('Pipeline reset')
  }

  const executeStep = async (stepIndex, prevResults) => {
    const step = PIPELINE_STEPS[stepIndex]
    const provider = getActiveProvider()

    if (!provider && step.id !== 'publish') {
      throw new Error('No AI provider configured. Please add a provider in Settings.')
    }

    setStepStatuses(prev => ({ ...prev, [step.id]: 'running' }))
    setCurrentStepIndex(stepIndex)
    addLog(step.id, `Starting: ${step.label}...`)

    try {
      let result = null
      const nicheLabel = selectedNiche === 'custom' ? customNiche : NICHES.find(n => n.id === selectedNiche)?.label || selectedNiche

      switch (step.id) {
        case 'niche': {
          const response = await sendChatRequest(provider.id, [
            {
              role: 'user',
              content: `You are a YouTube content strategist. Analyze the niche "${nicheLabel}" for short-form video content on ${targetPlatform}. Return a JSON object with: audience (target demographics), competition (low/medium/high), trendingTopics (array of 5 trending subtopics), bestPostingTimes (array of 2-3 times), contentGaps (array of 3 opportunities). Return ONLY valid JSON, no markdown.`
            }
          ])
          try {
            let clean = typeof response.content === 'string'
              ? response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
              : JSON.stringify(response.content)
            const jsonMatch = clean.match(/\{[\s\S]*\}/)
            const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean)
            result = parsed
          } catch {
            result = { raw: response.content, audience: 'General', competition: 'medium', trendingTopics: [], bestPostingTimes: [], contentGaps: [] }
          }
          break
        }

        case 'ideas': {
          const nicheContext = prevResults.niche?.trendingTopics?.join(', ') || nicheLabel
          const response = await sendChatRequest(provider.id, [
            {
              role: 'user',
              content: `Generate ${videoCount} viral short-form video ideas for the "${nicheLabel}" niche on ${targetPlatform}. Consider these trending topics: ${nicheContext}. Return a JSON array of objects with: title, hook (opening 3 seconds), description, estimatedViews (range like "10K-50K"), difficulty (easy/medium/hard). Return ONLY valid JSON array, no markdown.`
            }
          ])
          try {
            let clean = typeof response.content === 'string'
              ? response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
              : JSON.stringify(response.content)
            const jsonMatch = clean.match(/\[[\s\S]*\]/) || clean.match(/\{[\s\S]*\}/)
            const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean)
            result = Array.isArray(parsed) ? parsed : [parsed]
          } catch {
            result = [{ title: `${nicheLabel} Tips`, hook: 'Check this out!', description: response.content, estimatedViews: 'Unknown', difficulty: 'medium' }]
          }
          break
        }

        case 'scripts': {
          const ideas = prevResults.ideas || []
          const scripts = []
          for (const idea of ideas.slice(0, videoCount)) {
            try {
              const scriptResult = await generateScript(idea.title || idea.hook || nicheLabel, {
                duration: 60,
                tone: 'conversational',
                platform: targetPlatform,
                providerId: provider.id
              })
              scripts.push({ idea: idea.title, script: scriptResult })
              addLog(step.id, `Generated script for: ${idea.title || 'idea'}`)
            } catch (err) {
              scripts.push({ idea: idea.title, error: err.message })
              addLog(step.id, `Script failed for: ${idea.title}`, 'error')
            }
          }
          result = scripts
          break
        }

        case 'storyboard': {
          const scripts = prevResults.scripts || []
          const storyboards = []
          for (const item of scripts) {
            if (item.error) {
              storyboards.push({ idea: item.idea, error: item.error })
              continue
            }
            try {
              const sb = await generateStoryboard(item.script, { providerId: provider.id })
              storyboards.push({ idea: item.idea, storyboard: sb })
              addLog(step.id, `Storyboard created for: ${item.idea}`)
            } catch (err) {
              storyboards.push({ idea: item.idea, error: err.message })
              addLog(step.id, `Storyboard failed for: ${item.idea}`, 'error')
            }
          }
          result = storyboards
          break
        }

        case 'voice': {
          const scripts = prevResults.scripts || []
          const voices = []
          for (const item of scripts) {
            if (item.error || !item.script) continue
            try {
              const dialogue = item.script.scenes
                ? item.script.scenes.map(s => s.dialogue).join(' ')
                : item.script.title || ''
              if (!dialogue.trim()) continue
              const voiceResult = await generateVoice(dialogue, { providerId: provider.id })
              voices.push({ idea: item.idea, voice: voiceResult })
              addLog(step.id, `Voice generated for: ${item.idea}`)
            } catch (err) {
              voices.push({ idea: item.idea, error: err.message })
              addLog(step.id, `Voice failed for: ${item.idea}`, 'error')
            }
          }
          result = voices
          break
        }

        case 'captions': {
          const scripts = prevResults.scripts || []
          const captions = []
          for (const item of scripts) {
            if (item.error || !item.script) continue
            try {
              const dialogue = item.script.scenes
                ? item.script.scenes.map(s => s.dialogue).join(' ')
                : item.script.title || ''
              if (!dialogue.trim()) continue
              const captionResult = await generateCaptions(dialogue, { providerId: provider.id })
              captions.push({ idea: item.idea, captions: captionResult })
              addLog(step.id, `Captions generated for: ${item.idea}`)
            } catch (err) {
              captions.push({ idea: item.idea, error: err.message })
              addLog(step.id, `Captions failed for: ${item.idea}`, 'error')
            }
          }
          result = captions
          break
        }

        case 'thumbnail': {
          const ideas = prevResults.ideas || []
          const thumbnails = []
          for (const idea of ideas.slice(0, videoCount)) {
            try {
              const thumbResult = await generateThumbnail(
                `Thumbnail for short video: ${idea.title || idea.hook}. ${idea.description || ''}`,
                { style: 'vibrant', platform: targetPlatform, providerId: provider.id }
              )
              thumbnails.push({ idea: idea.title, thumbnail: thumbResult })
              addLog(step.id, `Thumbnail created for: ${idea.title}`)
            } catch (err) {
              thumbnails.push({ idea: idea.title, error: err.message })
              addLog(step.id, `Thumbnail failed for: ${idea.title}`, 'error')
            }
          }
          result = thumbnails
          break
        }

        case 'publish': {
          const ideas = prevResults.ideas || []
          if (ideas.length > 0) {
            try {
              const scheduleResult = await scheduleContent({
                title: ideas[0]?.title || `${nicheLabel} Video`,
                platform: targetPlatform,
                content: prevResults,
                scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
              })
              result = scheduleResult
              addLog(step.id, `Content scheduled for ${targetPlatform}`)
            } catch (err) {
              result = { scheduled: false, error: err.message }
              addLog(step.id, `Schedule failed: ${err.message}`, 'error')
            }
          } else {
            result = { scheduled: false, message: 'No content to schedule' }
          }
          break
        }
      }

      setStepStatuses(prev => ({ ...prev, [step.id]: 'done' }))
      setStepResults(prev => ({ ...prev, [step.id]: result }))
      addLog(step.id, `Completed: ${step.label}`, 'success')
      return result

    } catch (err) {
      setStepStatuses(prev => ({ ...prev, [step.id]: 'error' }))
      addLog(step.id, `Error: ${err.message}`, 'error')
      throw err
    }
  }

  const runPipeline = async () => {
    const niche = selectedNiche === 'custom' ? customNiche : selectedNiche
    if (!niche) {
      toast.error('Please select or enter a niche')
      return
    }

    const provider = getActiveProvider()
    if (!provider) {
      toast.error('Configure an AI provider first')
      return
    }

    setPipelineState('running')
    setStepStatuses({})
    setStepResults({})
    setLogs([])
    addLog('pipeline', 'Pipeline started', 'success')

    const results = {}

    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      if (pipelineState === 'stopped') break

      while (pipelineState === 'paused') {
        await new Promise(r => setTimeout(r, 500))
      }

      try {
        const result = await executeStep(i, results)
        results[PIPELINE_STEPS[i].id] = result
      } catch (err) {
        toast.error(`Pipeline failed at: ${PIPELINE_STEPS[i].label}`)
        setPipelineState('error')
        addLog('pipeline', `Pipeline stopped due to error at ${PIPELINE_STEPS[i].label}`, 'error')
        return
      }
    }

    setPipelineState('done')
    setCurrentStepIndex(-1)
    addLog('pipeline', 'Pipeline completed successfully!', 'success')
    toast.success('Pipeline completed!')

    addProject({
      title: `${niche} - Auto Factory Run`,
      type: 'auto-factory',
      platform: targetPlatform,
      niche,
      results,
      status: 'completed',
      created_at: new Date().toISOString()
    })
  }

  const pausePipeline = () => {
    if (currentStepIndex >= 0) {
      const step = PIPELINE_STEPS[currentStepIndex]
      setStepStatuses(prev => ({ ...prev, [step.id]: 'paused' }))
    }
    setPipelineState('paused')
    toast('Pipeline paused', { icon: '⏸️' })
  }

  const resumePipeline = () => {
    setPipelineState('running')
    toast('Pipeline resumed', { icon: '▶️' })
  }

  const stopPipeline = () => {
    setPipelineState('stopped')
    if (currentStepIndex >= 0) {
      const step = PIPELINE_STEPS[currentStepIndex]
      setStepStatuses(prev => ({ ...prev, [step.id]: 'error' }))
    }
    toast.success('Pipeline stopped')
    addLog('pipeline', 'Pipeline stopped by user', 'warning')
  }

  const getStepStatus = (stepId) => stepStatuses[stepId] || 'pending'

  const completedCount = Object.values(stepStatuses).filter(s => s === 'done').length
  const progressPercent = PIPELINE_STEPS.length > 0 ? (completedCount / PIPELINE_STEPS.length) * 100 : 0

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Factory className="w-8 h-8 text-purple-400" /> Auto Factory
        </h1>
        <p className="page-subtitle">Full automation pipeline — from niche to published content</p>
      </div>

      <WorkflowConnector />

      {/* Configuration Panel */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-400" />
          Pipeline Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Niche Selection */}
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-400 mb-2">Content Niche *</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
              {NICHES.map(niche => (
                <button
                  key={niche.id}
                  onClick={() => setSelectedNiche(niche.id)}
                  disabled={pipelineState === 'running'}
                  className={`
                    p-2 rounded-lg text-sm text-left transition-all border
                    ${selectedNiche === niche.id
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-gray-700/50 border-gray-600/50 text-gray-300 hover:border-gray-500'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <span className="text-lg">{niche.icon}</span>
                  <span className="block text-xs mt-1 truncate">{niche.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customNiche}
                onChange={(e) => {
                  setCustomNiche(e.target.value)
                  if (e.target.value) setSelectedNiche('custom')
                }}
                disabled={pipelineState === 'running'}
                placeholder="Or type a custom niche..."
                className="input-field flex-1"
              />
            </div>
          </div>

          {/* Platform & Count */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Target Platform</label>
              <select
                value={targetPlatform}
                onChange={(e) => setTargetPlatform(e.target.value)}
                disabled={pipelineState === 'running'}
                className="input-field"
              >
                {PLATFORMS.map(p => (
                  <option key={p} value={p}>
                    {p === 'youtube' ? 'YouTube Shorts' : p === 'tiktok' ? 'TikTok' : 'Instagram Reels'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Videos to Generate</label>
              <select
                value={videoCount}
                onChange={(e) => setVideoCount(parseInt(e.target.value))}
                disabled={pipelineState === 'running'}
                className="input-field"
              >
                <option value={1}>1 video</option>
                <option value={3}>3 videos</option>
                <option value={5}>5 videos</option>
                <option value={10}>10 videos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pipeline Controls */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-700/50">
          {pipelineState === 'idle' || pipelineState === 'done' || pipelineState === 'error' || pipelineState === 'stopped' ? (
            <button
              onClick={runPipeline}
              disabled={!selectedNiche && !customNiche}
              className="btn-primary flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Pipeline
            </button>
          ) : pipelineState === 'paused' ? (
            <>
              <button onClick={resumePipeline} className="btn-primary flex items-center gap-2">
                <Play className="w-4 h-4" />
                Resume
              </button>
              <button onClick={stopPipeline} className="btn-danger flex items-center gap-2">
                <Square className="w-4 h-4" />
                Stop
              </button>
            </>
          ) : (
            <>
              <button onClick={pausePipeline} className="btn-secondary flex items-center gap-2">
                <Pause className="w-4 h-4" />
                Pause
              </button>
              <button onClick={stopPipeline} className="btn-danger flex items-center gap-2">
                <Square className="w-4 h-4" />
                Stop
              </button>
            </>
          )}

          {Object.keys(stepStatuses).length > 0 && pipelineState !== 'running' && pipelineState !== 'paused' && (
            <button onClick={resetPipeline} className="btn-secondary flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}

          {/* Progress Bar */}
          {pipelineState !== 'idle' && (
            <div className="flex-1 ml-4">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>{completedCount} / {PIPELINE_STEPS.length} steps</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    pipelineState === 'error' || pipelineState === 'stopped'
                      ? 'bg-red-500'
                      : pipelineState === 'done'
                        ? 'bg-green-500'
                        : 'bg-purple-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Timeline */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Pipeline Timeline
        </h2>

        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-700" />

          <div className="space-y-4">
            {PIPELINE_STEPS.map((step, index) => {
              const status = getStepStatus(step.id)
              const statusConf = STATUS_CONFIG[status]
              const StatusIcon = statusConf.icon
              const StepIcon = step.icon
              const isActive = currentStepIndex === index
              const isExpanded = expandedStep === step.id
              const result = stepResults[step.id]

              return (
                <div key={step.id} className="relative pl-14">
                  {/* Step circle on timeline */}
                  <div className={`
                    absolute left-3 w-6 h-6 rounded-full flex items-center justify-center z-10
                    ${statusConf.bg} border-2
                    ${status === 'done' ? 'border-green-500' :
                      status === 'running' ? 'border-blue-500' :
                      status === 'error' ? 'border-red-500' :
                      status === 'paused' ? 'border-yellow-500' :
                      'border-gray-600'}
                  `}>
                    {status === 'running' ? (
                      <Loader2 className={`w-3 h-3 ${statusConf.color} animate-spin`} />
                    ) : (
                      <StatusIcon className={`w-3 h-3 ${statusConf.color}`} />
                    )}
                  </div>

                  {/* Step card */}
                  <div
                    className={`
                      rounded-xl border transition-all cursor-pointer
                      ${isActive
                        ? 'bg-blue-900/20 border-blue-500/30 shadow-lg shadow-blue-500/5'
                        : status === 'done'
                          ? 'bg-green-900/10 border-green-500/20'
                          : status === 'error'
                            ? 'bg-red-900/10 border-red-500/20'
                            : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
                      }
                    `}
                    onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          step.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                          step.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                          step.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                          step.color === 'green' ? 'bg-green-500/20 text-green-400' :
                          step.color === 'red' ? 'bg-red-500/20 text-red-400' :
                          step.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                          step.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          <StepIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Step {index + 1}: {step.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusConf.bg} ${statusConf.color}`}>
                              {statusConf.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <div className="flex items-center gap-1 text-xs text-blue-400">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            In Progress
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && result && (
                      <div className="px-4 pb-4 border-t border-gray-700/50 pt-3">
                        <div className="bg-gray-900/50 rounded-lg p-3">
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-60">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Logs Panel */}
      {logs.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Pipeline Logs
          </h2>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs space-y-1 max-h-60 overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className={`
                ${log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'warning' ? 'text-yellow-400' :
                  'text-gray-400'}
              `}>
                <span className="text-gray-600">[{log.timestamp}]</span>
                <span className="text-gray-500 ml-2">[{log.stepId}]</span>
                <span className="ml-2">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
