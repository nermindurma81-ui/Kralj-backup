import { useState, useRef, useCallback, useEffect } from 'react'
import { Film, Sparkles, Loader2, Upload, Play, Download, Image, Mic, Plus, Trash2, Wand2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateScript, generateVoice, generateThumbnail } from '../lib/api'
import { useApiStore } from '../store/apiStore'

const STYLES = [
  { id: 'modern', label: 'Modern', bg: '#1a1a2e', textColor: '#ffffff', accent: '#e94560' },
  { id: 'minimal', label: 'Minimal', bg: '#ffffff', textColor: '#333333', accent: '#0066ff' },
  { id: 'dark', label: 'Dark Pro', bg: '#0d0d0d', textColor: '#f0f0f0', accent: '#00ff88' },
  { id: 'warm', label: 'Warm', bg: '#2d1b00', textColor: '#ffeaa7', accent: '#fdcb6e' }
]

const TEMPLATES = [
  {
    id: 'motivational',
    label: '🔥 Motivational Quote',
    style: 'dark',
    bg: '#000000',
    gradient: 'linear-gradient(180deg, #000000 0%, #1a0a2e 50%, #0d0d2b 100%)',
    textColor: '#ffffff',
    accent: '#ff6b00',
    font: 'bold',
    resolution: '1080x1920',
    kenBurns: true,
    autoVoice: true,
    captionStyle: 'large-center',
    label: 'MOTIVATION'
  },
  {
    id: 'educational',
    label: '📚 Educational',
    style: 'minimal',
    bg: '#f8f9fa',
    textColor: '#1a1a2e',
    accent: '#2563eb',
    font: 'clean',
    resolution: '1920x1080',
    kenBurns: false,
    autoVoice: true
  },
  {
    id: 'funny',
    label: '😂 Funny',
    style: 'playful',
    bg: '#1e1b4b',
    textColor: '#fef08a',
    accent: '#facc15',
    font: 'playful',
    resolution: '1080x1920',
    kenBurns: true,
    autoVoice: true
  },
  {
    id: 'tech',
    label: '💻 Tech',
    style: 'dark',
    bg: '#030712',
    textColor: '#e0f2fe',
    accent: '#06b6d4',
    font: 'mono',
    resolution: '1920x1080',
    kenBurns: true,
    autoVoice: false
  },
  {
    id: 'luxury',
    label: '💎 Luxury',
    style: 'dark',
    bg: '#000000',
    textColor: '#fef3c7',
    accent: '#d4a017',
    font: 'elegant',
    resolution: '1080x1920',
    kenBurns: true,
    autoVoice: true
  }
]

export default function VideoAssembler() {
  const [slides, setSlides] = useState([])
  const [settings, setSettings] = useState({
    style: 'modern',
    resolution: '1080x1920',
    autoVoice: true,
    quality: '1080p',
    kenBurns: true
  })
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [videoUrl, setVideoUrl] = useState(null)
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false)
  const ffmpegRef = useRef(null)
  const { getActiveProvider } = useApiStore()

  // Load FFmpeg
  useEffect(() => {
    let cancelled = false
    async function loadFFmpeg() {
      try {
        const { FFmpeg } = await import('@ffmpeg/ffmpeg')
        const { toBlobURL } = await import('@ffmpeg/util')
        const ffmpeg = new FFmpeg()
        ffmpegRef.current = ffmpeg

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
        })

        if (!cancelled) {
          setFfmpegLoaded(true)
          toast.success('Video engine loaded!')
        }
      } catch (err) {
        console.error('FFmpeg load error:', err)
        if (!cancelled) toast.error('Video engine failed to load — use HTML export instead')
      }
    }
    loadFFmpeg()
    return () => { cancelled = true }
  }, [])

  const addSlide = () => {
    setSlides(prev => [...prev, {
      id: crypto.randomUUID(),
      imageUrl: null,
      imagePrompt: '',
      caption: '',
      duration: 3
    }])
  }

  const removeSlide = (id) => setSlides(prev => prev.filter(s => s.id !== id))
  const updateSlide = (id, updates) => setSlides(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))

  const handleImageUpload = (slideId, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    updateSlide(slideId, { imageUrl: url, source: 'upload', imageFile: file })
  }

  const generateFromScript = async () => {
    const provider = getActiveProvider()
    if (!provider) { toast.error('Configure AI provider first'); return }

    setGenerating(true)
    setProgress('Generating script...')

    try {
      const script = await generateScript('Create engaging short video content', {
        duration: 30, tone: 'conversational', platform: 'youtube', providerId: provider.id
      })
      const scenes = script.scenes || [{ description: script.title, dialogue: script.hook || 'Welcome!' }]

      const newSlides = scenes.map((scene) => ({
        id: crypto.randomUUID(),
        imageUrl: null,
        imagePrompt: scene.visualNote || scene.description || 'Scene',
        caption: scene.dialogue || '',
        duration: 3
      }))
      setSlides(newSlides)

      for (let i = 0; i < newSlides.length; i++) {
        setProgress(`Image ${i + 1}/${newSlides.length}...`)
        try {
          const result = await generateThumbnail(newSlides[i].imagePrompt, { style: settings.style, size: settings.resolution })
          setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, imageUrl: result.imageUrl } : s))
        } catch {}
      }
      toast.success('Slides generated!')
    } catch (err) {
      toast.error(`Failed: ${err.message}`)
    } finally {
      setGenerating(false)
      setProgress('')
    }
  }

  // Render actual video with FFmpeg
  const renderVideo = async () => {
    if (!ffmpegRef.current || !ffmpegLoaded) {
      toast.error('Video engine not loaded yet')
      return
    }
    if (slides.length === 0 || !slides.some(s => s.imageUrl)) {
      toast.error('Add slides with images first')
      return
    }

    setGenerating(true)
    setProgress('Preparing...')
    const ffmpeg = ffmpegRef.current
    const { fetchFile } = await import('@ffmpeg/util')

    try {
      const [baseWidth, baseHeight] = settings.resolution.split('x').map(Number)

      // Apply quality scaling
      let width, height
      switch (settings.quality) {
        case '720p':
          // Scale to 720p equivalent
          const scale720 = 720 / Math.min(baseWidth, baseHeight)
          width = Math.round(baseWidth * scale720)
          height = Math.round(baseHeight * scale720)
          break
        case '4k':
          // Scale to 4K equivalent
          const scale4k = 2160 / Math.max(baseWidth, baseHeight)
          width = Math.round(baseWidth * scale4k)
          height = Math.round(baseHeight * scale4k)
          break
        default: // 1080p
          width = baseWidth
          height = baseHeight
      }

      // Ensure even dimensions (required by libx264)
      width = width % 2 === 0 ? width : width + 1
      height = height % 2 === 0 ? height : height + 1

      const styleConfig = STYLES.find(s => s.id === settings.style) || STYLES[0]

      // Write each image to FFmpeg filesystem
      for (let i = 0; i < slides.length; i++) {
        if (!slides[i].imageUrl) continue
        setProgress(`Loading image ${i + 1}/${slides.length}...`)
        const imgData = await fetchFile(slides[i].imageUrl)
        const ext = slides[i].imageUrl.includes('.png') ? 'png' : 'jpg'
        await ffmpeg.writeFile(`img${i}.${ext}`, imgData)
      }

      // Ken Burns effect — animate each image with zoom
      if (settings.kenBurns) {
        for (let i = 0; i < slides.length; i++) {
          if (!slides[i].imageUrl) continue
          setProgress(`Animating ${i + 1}/${slides.length}...`)
          const ext = slides[i].imageUrl.includes('.png') ? 'png' : 'jpg'
          const dur = slides[i].duration || 3
          const animFrames = dur * 24
          try {
            await ffmpeg.exec([
              '-y', '-loop', '1', '-i', `img${i}.${ext}`,
              '-vf', `zoompan=z='min(zoom+0.001,1.4)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${animFrames}:s=${width}x${height}:fps=24`,
              '-c:v', 'libx264', '-t', String(dur),
              '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-crf', '20',
              `animated-${i}.mp4`
            ].join(' '))
          } catch (animErr) {
            console.error(`Animation failed for slide ${i}:`, animErr)
          }
        }
      }

      // Generate voice audio for captions if enabled
      let hasAudio = false
      if (settings.autoVoice) {
        for (let i = 0; i < slides.length; i++) {
          if (!slides[i].caption) continue
          setProgress(`Voice ${i + 1}/${slides.length}...`)
          try {
            const voiceResult = await generateVoice(slides[i].caption)
            // Handle base64 audio
            if (voiceResult.audioBase64) {
              const audioData = Uint8Array.from(atob(voiceResult.audioBase64), c => c.charCodeAt(0))
              await ffmpeg.writeFile(`audio${i}.wav`, audioData)
              hasAudio = true
            } else if (voiceResult.audioUrl) {
              const audioData = await fetchFile(voiceResult.audioUrl)
              await ffmpeg.writeFile(`audio${i}.wav`, audioData)
              hasAudio = true
            }
          } catch (err) {
            console.error(`Voice failed for slide ${i}:`, err)
          }
        }
      }

      // Create concat file — use animated clips if Ken Burns, otherwise static images
      let concatContent = ''
      for (let i = 0; i < slides.length; i++) {
        if (!slides[i].imageUrl) continue
        const ext = slides[i].imageUrl.includes('.png') ? 'png' : 'jpg'
        const duration = slides[i].duration || 3

        if (settings.kenBurns) {
          concatContent += `file 'animated-${i}.mp4'\n`
        } else {
          concatContent += `file 'img${i}.${ext}'\n`
          concatContent += `duration ${duration}\n`
        }
      }
      if (settings.kenBurns) {
        concatContent += `file 'animated-${slides.length - 1}.mp4'\n`
      } else {
        const lastExt = slides[slides.length - 1].imageUrl?.includes('.png') ? 'png' : 'jpg'
        concatContent += `file 'img${slides.length - 1}.${lastExt}'\n`
      }
      await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatContent))

      setProgress('Rendering video...')

      // Build video args
      const videoArgs = [
        '-f', 'concat', '-safe', '0', '-i', 'concat.txt',
        '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${styleConfig.bg}`,
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '24', '-preset', 'medium', '-crf', '18', '-profile:v', 'high', '-level', '4.1'
      ]

      if (hasAudio) {
        // Create audio concat file
        let audioConcat = ''
        for (let i = 0; i < slides.length; i++) {
          if (slides[i].caption) {
            audioConcat += `file 'audio${i}.wav'\n`
          }
        }
        await ffmpeg.writeFile('audio-concat.txt', new TextEncoder().encode(audioConcat))

        // First render video without audio
        await ffmpeg.exec([...videoArgs, '-an', 'video-only.mp4'])

        // Concat audio files
        await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'audio-concat.txt', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', 'audio-all.aac'])

        // Merge video + audio
        await ffmpeg.exec([
          '-i', 'video-only.mp4', '-i', 'audio-all.aac',
          '-c:v', 'copy', '-c:a', 'aac', '-shortest',
          'output.mp4'
        ])
      } else {
        await ffmpeg.exec([...videoArgs, '-an', 'output.mp4'])
      }

      setProgress('Exporting...')

      // Read output
      const data = await ffmpeg.readFile('output.mp4')
      const blob = new Blob([data.buffer], { type: 'video/mp4' })
      const url = URL.createObjectURL(blob)
      setVideoUrl(url)

      toast.success('Video rendered! 🎬')
    } catch (err) {
      console.error('Render error:', err)
      toast.error(`Render failed: ${err.message}`)
    } finally {
      setGenerating(false)
      setProgress('')
    }
  }

  const downloadVideo = () => {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = 'shortai-video.mp4'
    a.click()
  }

  const applyTemplate = (templateId) => {
    const tpl = TEMPLATES.find(t => t.id === templateId)
    if (!tpl) return
    setSettings(s => ({
      ...s,
      style: tpl.style,
      resolution: tpl.resolution,
      kenBurns: tpl.kenBurns,
      autoVoice: tpl.autoVoice
    }))
    toast.success(`Template "${tpl.label}" applied!`)
  }

  const styleConfig = STYLES.find(s => s.id === settings.style) || STYLES[0]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Film className="w-8 h-8 text-orange-400" /> Video Assembler
        </h1>
        <p className="page-subtitle">Create real MP4 videos from AI images and captions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card space-y-4 sticky top-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">🎬 Template</label>
              <select onChange={(e) => applyTemplate(e.target.value)} className="input-field" defaultValue="">
                <option value="" disabled>Choose a template...</option>
                {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">Auto-fills style, resolution & settings</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Style</label>
              <select value={settings.style} onChange={(e) => setSettings(s => ({ ...s, style: e.target.value }))} className="input-field">
                {STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Resolution</label>
              <select value={settings.resolution} onChange={(e) => setSettings(s => ({ ...s, resolution: e.target.value }))} className="input-field">
                <option value="1080x1920">1080x1920 (Vertical)</option>
                <option value="1920x1080">1920x1080 (Landscape)</option>
                <option value="1080x1080">1080x1080 (Square)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Quality</label>
              <select value={settings.quality} onChange={(e) => setSettings(s => ({ ...s, quality: e.target.value }))} className="input-field">
                <option value="720p">Low (720p)</option>
                <option value="1080p">Medium (1080p)</option>
                <option value="4k">High (4K)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input type="checkbox" checked={settings.autoVoice}
                onChange={(e) => setSettings(s => ({ ...s, autoVoice: e.target.checked }))}
                className="rounded accent-primary-500" />
              <Mic className="w-4 h-4" /> AI Voiceover (zvuk)
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input type="checkbox" checked={settings.kenBurns}
                onChange={(e) => setSettings(s => ({ ...s, kenBurns: e.target.checked }))}
                className="rounded accent-primary-500" />
              🎥 Ken Burns animacija (zoom/pan)
            </label>

            <hr className="border-gray-700" />

            <button onClick={generateFromScript} disabled={generating} className="btn-primary w-full flex items-center justify-center gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI Generate Slides
            </button>

            <button onClick={addSlide} className="btn-secondary w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Slide
            </button>

            {slides.length > 0 && (
              <button onClick={renderVideo} disabled={generating || !ffmpegLoaded} className="btn-primary w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {progress || (ffmpegLoaded ? '🎬 Render Video' : 'Loading engine...')}
              </button>
            )}

            {videoUrl && (
              <button onClick={downloadVideo} className="btn-secondary w-full flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download MP4
              </button>
            )}

            {!ffmpegLoaded && <p className="text-xs text-center text-gray-500">⏳ Loading video engine...</p>}
          </div>
        </div>

        {/* Slides & Preview */}
        <div className="lg:col-span-2 space-y-4">
          {slides.length === 0 ? (
            <div className="card text-center py-16">
              <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No slides yet</p>
              <p className="text-gray-500 text-sm mt-1">Click "AI Generate Slides" or "Add Slide"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {slides.map((slide, index) => (
                <div key={slide.id} className="card">
                  <div className="flex items-start gap-4">
                    <span className="text-xs text-gray-500 font-mono pt-2">#{index + 1}</span>
                    <div className="w-20 h-32 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {slide.imageUrl ? (
                        <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : <Image className="w-6 h-6 text-gray-600" />}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="number" min="1" max="15" value={slide.duration}
                          onChange={(e) => updateSlide(slide.id, { duration: parseInt(e.target.value) || 3 })}
                          className="input-field w-16 text-xs text-center" />
                        <span className="text-xs text-gray-500">sec</span>
                        <button onClick={() => removeSlide(slide.id)} className="ml-auto p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input value={slide.imagePrompt}
                        onChange={(e) => updateSlide(slide.id, { imagePrompt: e.target.value })}
                        className="input-field text-sm" placeholder="Image description..." />
                      <textarea value={slide.caption}
                        onChange={(e) => updateSlide(slide.id, { caption: e.target.value })}
                        className="input-field text-sm min-h-[50px] resize-none" placeholder="Caption text..." />
                      <label className="btn-secondary text-xs px-3 py-1 cursor-pointer inline-flex">
                        <Upload className="w-3 h-3 mr-1" /> Upload
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(slide.id, e)} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Video Preview */}
          {videoUrl && (
            <div className="card border-green-500/30">
              <h3 className="font-medium mb-3 flex items-center gap-2 text-green-400">
                <Play className="w-4 h-4" /> Video Ready!
              </h3>
              <video src={videoUrl} controls className="w-full rounded-lg" style={{ maxHeight: '500px' }} />
              <button onClick={downloadVideo} className="btn-primary mt-3 flex items-center gap-2">
                <Download className="w-4 h-4" /> Download MP4
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
