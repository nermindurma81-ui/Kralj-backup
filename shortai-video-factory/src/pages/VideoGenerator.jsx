/**
 * Video Generator - Integracija sa AI Video Pipeline
 * Koristi /api/video/generate endpoint
 */

import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Video, Play, Pause, Download, Share2, 
  CheckCircle2, Clock, AlertCircle, Sparkles,
  Film, Mic, FileText, Palette, Settings,
  ArrowLeft, Loader2
} from 'lucide-react'

export default function VideoGenerator() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get idea from location state (from Idea Lab)
  const selectedIdea = location.state?.idea
  
  const [formData, setFormData] = useState({
    topic: selectedIdea?.title || '',
    platform: 'youtube',
    duration: 30,
    tone: 'conversational',
    style: 'educational'
  })
  
  const [status, setStatus] = useState('idle') // idle, generating, completed, error
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const platforms = [
    { id: 'youtube', name: 'YouTube Shorts', icon: '📺', maxDuration: 60 },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', maxDuration: 60 },
    { id: 'instagram', name: 'Instagram Reels', icon: '📸', maxDuration: 90 }
  ]

  const tones = ['conversational', 'educational', 'entertaining', 'inspirational', 'dramatic']
  const styles = ['educational', 'entertaining', 'storytelling', 'tutorial', 'listicle']

  const handleGenerate = async () => {
    setStatus('generating')
    setProgress(0)
    setError('')

    try {
      // Simulate progress (real implementation would poll the API)
      const steps = [
        'Generating script...',
        'Creating voiceover...',
        'Fetching media...',
        'Assembling video...',
        'Adding captions...',
        'Finalizing...'
      ]

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i])
        setProgress(((i + 1) / steps.length) * 100)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Call actual API
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: formData.topic,
          platform: formData.platform,
          duration: formData.duration,
          tone: formData.tone,
          count: 1
        })
      })

      const data = await response.json()

      if (data.success) {
        setStatus('completed')
        setResult(data.data)
      } else {
        throw new Error(data.message || 'Generation failed')
      }
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  if (status === 'completed' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => { setStatus('idle'); setResult(null) }}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Generator
          </button>

          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Video Ready! 🎉</h1>
              <p className="text-white/60">Your video has been generated successfully</p>
            </div>

            {/* Video Preview */}
            <div className="bg-black/50 rounded-2xl overflow-hidden mb-8 aspect-[9/16] max-w-md mx-auto flex items-center justify-center">
              <div className="text-center">
                <Film className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">Video Preview</p>
                <p className="text-white/40 text-sm mt-2">
                  {result.jobId || 'Video generated'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/50 transition-all">
                <Download className="w-5 h-5" />
                Download
              </button>
              <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-all">
                <Share2 className="w-5 h-5" />
                Share
              </button>
              <button 
                onClick={() => { setStatus('idle'); setResult(null) }}
                className="col-span-2 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Create Another Video
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/idea-lab')}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Idea Lab
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Generate Video</h1>
          <p className="text-white/60">Transform your idea into a viral video</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Video Settings
            </h2>

            {/* Topic */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm font-medium mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Topic / Title
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="What's your video about?"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Platform */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm font-medium mb-2">
                <Video className="w-4 h-4 inline mr-1" />
                Platform
              </label>
              <div className="grid grid-cols-3 gap-3">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setFormData({ 
                      ...formData, 
                      platform: platform.id,
                      duration: Math.min(formData.duration, platform.maxDuration)
                    })}
                    className={`p-4 rounded-xl border transition-all ${
                      formData.platform === platform.id
                        ? 'border-purple-400 bg-purple-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{platform.icon}</span>
                    <span className="text-white text-sm font-medium">{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm font-medium mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Duration: {formData.duration}s
              </label>
              <input
                type="range"
                min="15"
                max={platforms.find(p => p.id === formData.platform)?.maxDuration || 60}
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-white/40 text-xs mt-2">
                <span>15s</span>
                <span>{platforms.find(p => p.id === formData.platform)?.maxDuration || 60}s</span>
              </div>
            </div>

            {/* Tone */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm font-medium mb-2">
                <Mic className="w-4 h-4 inline mr-1" />
                Tone
              </label>
              <div className="flex flex-wrap gap-2">
                {tones.map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setFormData({ ...formData, tone })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.tone === tone
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm font-medium mb-2">
                <Palette className="w-4 h-4 inline mr-1" />
                Style
              </label>
              <div className="flex flex-wrap gap-2">
                {styles.map((style) => (
                  <button
                    key={style}
                    onClick={() => setFormData({ ...formData, style })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.style === style
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={status === 'generating' || !formData.topic}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'generating' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Generate Video
                </>
              )}
            </button>
          </div>

          {/* Preview / Progress */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">
              {status === 'idle' ? 'Preview' : status === 'generating' ? 'Progress' : 'Result'}
            </h2>

            {status === 'idle' && (
              <div className="text-center py-12">
                <Film className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">Your video preview will appear here</p>
              </div>
            )}

            {status === 'generating' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  </div>
                  <p className="text-white font-medium">{currentStep}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Progress</span>
                    <span className="text-white font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {['Script', 'Voiceover', 'Media', 'Assembly', 'Captions'].map((step, i) => (
                    <div key={step} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        progress > (i / 5) * 100 
                          ? 'bg-green-500' 
                          : 'bg-white/10'
                      }`}>
                        {progress > (i / 5) * 100 ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <span className="text-white/40 text-xs">{i + 1}</span>
                        )}
                      </div>
                      <span className={`text-sm ${
                        progress > (i / 5) * 100 ? 'text-white' : 'text-white/40'
                      }`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <p className="text-white font-medium mb-2">Generation Failed</p>
                <p className="text-white/60 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
