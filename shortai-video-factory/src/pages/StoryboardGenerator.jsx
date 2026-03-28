import { useState } from 'react'
import { Film, Sparkles, Loader2, Image, Clock, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateStoryboard } from '../lib/api'
import { useApiStore } from '../store/apiStore'

export default function StoryboardGenerator() {
  const [script, setScript] = useState('')
  const [style, setStyle] = useState('cinematic')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [storyboard, setStoryboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const { getActiveProvider } = useApiStore()

  // FIX: Renamed from generateStoryboard to handleGenerate to avoid conflict with imported function
  const handleGenerate = async () => {
    if (!script.trim()) {
      toast.error('Enter a script or description')
      return
    }

    const provider = getActiveProvider()
    if (!provider) {
      toast.error('Configure an AI provider first')
      return
    }

    setLoading(true)
    try {
      const result = await generateStoryboard(script, {
        style,
        aspectRatio,
        providerId: provider.id
      })
      setStoryboard(result)
      toast.success('Storyboard generated!')
    } catch (err) {
      toast.error(`Generation failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const downloadStoryboard = () => {
    if (!storyboard) return
    const content = storyboard.scenes.map((s, i) =>
      `Scene ${i + 1}: ${s.title}\nVisual: ${s.visualDescription}\nDuration: ${s.duration}s\nCamera: ${s.cameraAngle || 'N/A'}\n`
    ).join('\n---\n\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'storyboard.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const styles = [
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'cartoon', label: 'Cartoon' },
    { value: 'realistic', label: 'Realistic' },
    { value: 'anime', label: 'Anime' },
    { value: 'watercolor', label: 'Watercolor' }
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Film className="w-8 h-8 text-purple-400" /> Storyboard Generator
        </h1>
        <p className="page-subtitle">Turn your script into a visual storyboard with AI-generated scenes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card space-y-4 sticky top-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Script / Scene Description *</label>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="input-field min-h-[150px] resize-none"
                placeholder="Paste your script or describe the scenes you want..."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Visual Style</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="input-field">
                {styles.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Aspect Ratio</label>
              <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="input-field">
                <option value="9:16">9:16 (Vertical / Shorts)</option>
                <option value="16:9">16:9 (Landscape)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="4:5">4:5 (Instagram)</option>
              </select>
            </div>

            <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Storyboard
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {!storyboard ? (
            <div className="card text-center py-16">
              <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Enter a script to generate a storyboard</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{storyboard.title || 'Storyboard'}</h2>
                <button onClick={downloadStoryboard} className="btn-secondary text-sm flex items-center gap-1.5">
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {storyboard.scenes && storyboard.scenes.map((scene, index) => (
                  <div key={index} className="card overflow-hidden">
                    {/* Scene visual */}
                    <div className="aspect-video bg-gray-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {scene.imageUrl ? (
                        <img src={scene.imageUrl} alt={scene.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-4">
                          <Image className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">{scene.visualDescription}</p>
                        </div>
                      )}
                    </div>

                    {/* Scene info */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                        Scene {index + 1}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {scene.duration || 5}s
                      </span>
                    </div>
                    <h3 className="font-medium mb-1">{scene.title}</h3>
                    <p className="text-sm text-gray-400">{scene.visualDescription}</p>
                    {scene.dialogue && (
                      <p className="text-sm text-primary-400 mt-2 italic">"{scene.dialogue}"</p>
                    )}
                    {scene.cameraAngle && (
                      <p className="text-xs text-gray-500 mt-1">📷 {scene.cameraAngle}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
