import { useState } from 'react'
import { Subtitles, Sparkles, Loader2, Download, Copy, Check, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateCaptions } from '../lib/api'
import { useApiStore } from '../store/apiStore'

export default function CaptionLab() {
  const [transcript, setTranscript] = useState('')
  const [style, setStyle] = useState('modern')
  const [maxChars, setMaxChars] = useState(42)
  const [captions, setCaptions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { getActiveProvider } = useApiStore()

  const generate = async () => {
    if (!transcript.trim()) {
      toast.error('Enter a transcript or text')
      return
    }

    setLoading(true)
    try {
      const result = await generateCaptions(transcript, {
        style,
        maxCharsPerLine: maxChars,
        providerId: getActiveProvider()?.id
      })
      setCaptions(result)
      toast.success('Captions generated!')
    } catch (err) {
      toast.error(`Generation failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const downloadSRT = () => {
    if (!captions?.srt) return
    const blob = new Blob([captions.srt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'captions.srt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('SRT downloaded')
  }

  const downloadVTT = () => {
    if (!captions?.vtt) return
    const blob = new Blob([captions.vtt], { type: 'text/vtt' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'captions.vtt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('VTT downloaded')
  }

  const copySRT = () => {
    if (!captions?.srt) return
    navigator.clipboard.writeText(captions.srt)
    setCopied(true)
    toast.success('SRT copied')
    setTimeout(() => setCopied(false), 2000)
  }

  const styles = [
    { value: 'modern', label: 'Modern (word-by-word)' },
    { value: 'classic', label: 'Classic (full sentences)' },
    { value: 'karaoke', label: 'Karaoke (highlighted)' },
    { value: 'minimal', label: 'Minimal (simple)' }
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Subtitles className="w-8 h-8 text-cyan-400" /> Caption Lab
        </h1>
        <p className="page-subtitle">Generate accurate captions and subtitles with AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card space-y-4 sticky top-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Transcript / Text *</label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="input-field min-h-[200px] resize-none"
                placeholder="Paste your video transcript or script..."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Caption Style</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="input-field">
                {styles.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Characters Per Line</label>
              <input
                type="number"
                min="20"
                max="80"
                value={maxChars}
                onChange={(e) => setMaxChars(parseInt(e.target.value) || 42)}
                className="input-field"
              />
            </div>

            <button onClick={generate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Captions
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {!captions ? (
            <div className="card text-center py-16">
              <Subtitles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Enter a transcript to generate captions</p>
              <p className="text-gray-500 text-sm mt-1">Supports SRT and VTT export</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={downloadSRT} className="btn-primary flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download SRT
                </button>
                <button onClick={downloadVTT} className="btn-secondary flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download VTT
                </button>
                <button onClick={copySRT} className="btn-secondary flex items-center gap-2">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  Copy SRT
                </button>
              </div>

              {/* Caption preview */}
              <div className="card">
                <h3 className="font-medium mb-3">Caption Preview</h3>
                <div className="bg-gray-900 rounded-lg p-4 min-h-[200px]">
                  {captions.segments && captions.segments.map((seg, index) => (
                    <div key={index} className="flex items-start gap-3 py-2 border-b border-gray-800 last:border-0">
                      <div className="flex items-center gap-1 text-xs text-gray-500 w-24 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {seg.start} → {seg.end}
                      </div>
                      <p className="text-sm">{seg.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card text-center">
                  <p className="text-2xl font-bold gradient-text">{captions.segments?.length || 0}</p>
                  <p className="text-xs text-gray-500">Segments</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl font-bold gradient-text">{captions.totalWords || 0}</p>
                  <p className="text-xs text-gray-500">Words</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl font-bold gradient-text">{captions.estimatedDuration || '0:00'}</p>
                  <p className="text-xs text-gray-500">Duration</p>
                </div>
              </div>

              {/* SRT preview */}
              <div className="card">
                <h3 className="font-medium mb-2">SRT Output</h3>
                <pre className="text-xs text-gray-400 bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-[300px] overflow-y-auto">
                  {captions.srt}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
