import { useState, useRef } from 'react'
import { Mic, Play, Pause, Loader2, Download, Volume2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateVoice } from '../lib/api'
import { useApiStore } from '../store/apiStore'

export default function VoiceGenerator() {
  const [text, setText] = useState('')
  const [voice, setVoice] = useState('af_bella')
  const [speed, setSpeed] = useState(1.0)
  const [audioUrl, setAudioUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const { getActiveProvider } = useApiStore()
  const audioRef = useRef(null)

  const generate = async () => {
    if (!text.trim()) {
      toast.error('Enter text to convert to speech')
      return
    }

    setLoading(true)
    try {
      const result = await generateVoice(text, {
        voice,
        speed,
        providerId: getActiveProvider()?.id
      })
      setAudioUrl(result.audioUrl)
      toast.success('Voice generated!')
    } catch (err) {
      toast.error(`Generation failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const togglePlay = () => {
    const audio = document.getElementById('voice-audio')
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
    setPlaying(!playing)
  }

  const downloadAudio = () => {
    if (!audioUrl) return
    const a = document.createElement('a')
    a.href = audioUrl
    a.download = 'voiceover.mp3'
    a.click()
  }

  const voices = [
    { id: 'af_bella', name: 'Bella', gender: 'Female', style: 'Warm' },
    { id: 'af_sarah', name: 'Sarah', gender: 'Female', style: 'Professional' },
    { id: 'af_nicole', name: 'Nicole', gender: 'Female', style: 'Energetic' },
    { id: 'am_adam', name: 'Adam', gender: 'Male', style: 'Deep' },
    { id: 'am_michael', name: 'Michael', gender: 'Male', style: 'Friendly' },
    { id: 'bf_emma', name: 'Emma', gender: 'Female', style: 'British' },
    { id: 'bm_lewis', name: 'Lewis', gender: 'Male', style: 'British' }
  ]

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Mic className="w-8 h-8 text-red-400" /> Voice Generator
        </h1>
        <p className="page-subtitle">Generate natural voiceovers with Kokoro TTS</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card space-y-4 sticky top-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Text *</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="input-field min-h-[150px] resize-none"
                placeholder="Enter the text you want to convert to speech..."
              />
              <p className="text-xs text-gray-500 mt-1">{text.length} characters</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Voice</label>
              <select value={voice} onChange={(e) => setVoice(e.target.value)} className="input-field">
                {voices.map(v => (
                  <option key={v.id} value={v.id}>{v.name} - {v.gender} ({v.style})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Speed: {speed.toFixed(1)}x</label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0.5x (Slow)</span>
                <span>2.0x (Fast)</span>
              </div>
            </div>

            <button onClick={generate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
              Generate Voice
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {!audioUrl ? (
            <div className="card text-center py-16">
              <Mic className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Enter text to generate a voiceover</p>
              <p className="text-gray-500 text-sm mt-1">Powered by Kokoro TTS</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Audio player */}
              <div className="card">
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-primary-500/20 flex items-center justify-center hover:bg-primary-500/30 transition-colors"
                  >
                    {playing ? <Pause className="w-6 h-6 text-primary-400" /> : <Play className="w-6 h-6 text-primary-400 ml-1" />}
                  </button>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full w-0 transition-all" id="voice-progress" />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0:00</span>
                      <span>{formatDuration(duration)}</span>
                    </div>
                  </div>
                  <button onClick={downloadAudio} className="btn-secondary flex items-center gap-2">
                    <Download className="w-4 h-4" /> Save
                  </button>
                </div>
                <audio
                  id="voice-audio"
                  src={audioUrl}
                  onEnded={() => setPlaying(false)}
                  onLoadedMetadata={(e) => setDuration(e.target.duration)}
                  className="hidden"
                />
              </div>

              {/* Waveform visualization placeholder */}
              <div className="card">
                <h3 className="font-medium mb-3">Audio Details</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold gradient-text">{formatDuration(duration)}</p>
                    <p className="text-xs text-gray-500">Duration</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold gradient-text">{voices.find(v => v.id === voice)?.name}</p>
                    <p className="text-xs text-gray-500">Voice</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold gradient-text">{speed.toFixed(1)}x</p>
                    <p className="text-xs text-gray-500">Speed</p>
                  </div>
                </div>
              </div>

              {/* Transcript */}
              <div className="card">
                <h3 className="font-medium mb-2">Transcript</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{text}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
