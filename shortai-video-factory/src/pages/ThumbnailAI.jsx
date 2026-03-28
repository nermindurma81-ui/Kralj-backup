import { useState } from 'react'
import { Image, Sparkles, Loader2, Download, RefreshCw, Palette, Trophy, Swords } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateThumbnail } from '../lib/api'
import { useApiStore } from '../store/apiStore'

export default function ThumbnailAI() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('vibrant')
  const [size, setSize] = useState('1280x720')
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generations, setGenerations] = useState([])

  // A/B test state
  const [abMode, setAbMode] = useState(false)
  const [abImages, setAbImages] = useState([null, null])
  const [abLoading, setAbLoading] = useState(false)
  const [abWinner, setAbWinner] = useState(null)

  const { getActiveProvider } = useApiStore()

  const generate = async () => {
    if (!prompt.trim()) {
      toast.error('Enter a thumbnail description')
      return
    }

    setLoading(true)
    try {
      const result = await generateThumbnail(prompt, {
        style,
        size,
        providerId: getActiveProvider()?.id
      })
      setImageUrl(result.imageUrl)
      setGenerations(prev => [{ url: result.imageUrl, prompt, timestamp: Date.now() }, ...prev])
      toast.success('Thumbnail generated!')
    } catch (err) {
      toast.error(`Generation failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const generateAB = async () => {
    if (!prompt.trim()) {
      toast.error('Enter a thumbnail description')
      return
    }

    setAbLoading(true)
    setAbMode(true)
    setAbWinner(null)
    setAbImages([null, null])

    try {
      // Generate 2 thumbnails in parallel with slightly different prompts
      const variations = [
        `${prompt} — bold, high contrast, attention-grabbing`,
        `${prompt} — clean, minimalist, professional design`
      ]

      const [resultA, resultB] = await Promise.all([
        generateThumbnail(variations[0], { style, size, providerId: getActiveProvider()?.id }),
        generateThumbnail(variations[1], { style, size, providerId: getActiveProvider()?.id })
      ])

      setAbImages([resultA.imageUrl, resultB.imageUrl])
      setGenerations(prev => [
        { url: resultA.imageUrl, prompt: variations[0], timestamp: Date.now() },
        { url: resultB.imageUrl, prompt: variations[1], timestamp: Date.now() },
        ...prev
      ])
      toast.success('A/B thumbnails generated — pick the winner!')
    } catch (err) {
      toast.error(`A/B generation failed: ${err.message}`)
    } finally {
      setAbLoading(false)
    }
  }

  const pickWinner = (index) => {
    setAbWinner(index)
    setImageUrl(abImages[index])
    toast.success(`Thumbnail ${index === 0 ? 'A' : 'B'} wins! 🏆`)
  }

  const generateFallback = () => {
    if (!prompt.trim()) {
      toast.error('Enter a description')
      return
    }
    const encoded = encodeURIComponent(prompt)
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&nologo=true`
    setImageUrl(url)
    setGenerations(prev => [{ url, prompt, timestamp: Date.now() }, ...prev])
    toast.success('Thumbnail generated (Pollinations.ai)')
  }

  const downloadImage = async (url) => {
    const targetUrl = url || imageUrl
    if (!targetUrl) return
    try {
      const response = await fetch(targetUrl)
      const blob = await response.blob()
      const dlUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = dlUrl
      a.download = 'thumbnail.png'
      a.click()
      URL.revokeObjectURL(dlUrl)
    } catch {
      window.open(targetUrl, '_blank')
    }
  }

  const styles = [
    { value: 'vibrant', label: 'Vibrant & Bold' },
    { value: 'minimal', label: 'Minimal & Clean' },
    { value: 'dramatic', label: 'Dramatic' },
    { value: 'playful', label: 'Playful' },
    { value: 'professional', label: 'Professional' },
    { value: 'dark', label: 'Dark & Moody' }
  ]

  const presets = [
    'Shocked face with big text overlay, bright background',
    'Split screen before/after transformation',
    'Countdown or list style with numbered elements',
    'Product showcase with gradient background',
    'Text-only with bold typography and gradient',
    'Person pointing at text with surprised expression'
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Image className="w-8 h-8 text-pink-400" /> Thumbnail AI
        </h1>
        <p className="page-subtitle">Generate eye-catching thumbnails with A/B testing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="card space-y-4 sticky top-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Thumbnail Description *</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="input-field min-h-[100px] resize-none"
                placeholder="Describe your thumbnail in detail..."
              />
            </div>

            {/* Presets */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(preset)}
                    className="text-xs px-2 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                  >
                    {preset.slice(0, 30)}...
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Style</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="input-field">
                {styles.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Size</label>
              <select value={size} onChange={(e) => setSize(e.target.value)} className="input-field">
                <option value="1280x720">1280x720 (YouTube)</option>
                <option value="1080x1080">1080x1080 (Instagram)</option>
                <option value="1080x1920">1080x1920 (Vertical)</option>
              </select>
            </div>

            <button onClick={generate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate (DALL-E)
            </button>

            <button onClick={generateAB} disabled={abLoading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              {abLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
              ⚔️ Generate A/B Test
            </button>

            <button onClick={generateFallback} className="btn-secondary w-full flex items-center justify-center gap-2">
              <Palette className="w-4 h-4" />
              Generate (Free - Pollinations)
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {/* A/B Test View */}
          {abMode && (abImages[0] || abImages[1]) ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2 text-purple-400">
                  <Swords className="w-5 h-5" /> A/B Thumbnail Test
                </h3>
                <button
                  onClick={() => { setAbMode(false); setAbImages([null, null]); setAbWinner(null) }}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Exit A/B Mode
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1].map(i => (
                  <div
                    key={i}
                    className={`card transition-all ${
                      abWinner === i
                        ? 'border-green-500/50 ring-2 ring-green-500/30'
                        : abWinner !== null && abWinner !== i
                          ? 'opacity-50 border-gray-700'
                          : 'hover:border-purple-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">
                        {i === 0 ? '🅰️ Variant A' : '🅱️ Variant B'}
                      </span>
                      {abWinner === i && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> Winner
                        </span>
                      )}
                    </div>

                    {abImages[i] ? (
                      <>
                        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-3">
                          <img src={abImages[i]} alt={`Variant ${i === 0 ? 'A' : 'B'}`} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => pickWinner(i)}
                            disabled={abWinner !== null}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                              abWinner === i
                                ? 'bg-green-500/20 text-green-400'
                                : abWinner !== null
                                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                  : 'bg-purple-600 hover:bg-purple-500 text-white'
                            }`}
                          >
                            {abWinner === i ? '🏆 Chosen!' : '👍 Pick This One'}
                          </button>
                          <button onClick={() => downloadImage(abImages[i])} className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {abWinner !== null && (
                <div className="card border-green-500/30 text-center">
                  <p className="text-green-400 font-medium">
                    🏆 Variant {abWinner === 0 ? 'A' : 'B'} is your winner!
                  </p>
                  <button
                    onClick={generateAB}
                    disabled={abLoading}
                    className="mt-2 btn-secondary text-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Run Another A/B Test
                  </button>
                </div>
              )}
            </div>
          ) : !imageUrl ? (
            <div className="card text-center py-16">
              <Image className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Describe your thumbnail to generate it</p>
              <p className="text-gray-500 text-sm mt-1">Try "Generate A/B Test" for side-by-side comparison</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Main preview */}
              <div className="card">
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
                  <img src={imageUrl} alt="Generated thumbnail" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => downloadImage()} className="btn-primary flex items-center gap-2">
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button onClick={generate} disabled={loading} className="btn-secondary flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Regenerate
                  </button>
                </div>
              </div>

              {/* History */}
              {generations.length > 1 && (
                <div className="card">
                  <h3 className="font-medium mb-3">Generation History</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {generations.map((gen, i) => (
                      <div
                        key={i}
                        onClick={() => setImageUrl(gen.url)}
                        className={`aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
                          imageUrl === gen.url ? 'border-primary-500' : 'border-transparent hover:border-gray-600'
                        }`}
                      >
                        <img src={gen.url} alt={`Generation ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
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
