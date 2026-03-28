import { useState, useRef, useCallback } from 'react'
import { Video, Upload, Play, Pause, Trash2, Scissors, Loader2, Download } from 'lucide-react'
import toast from 'react-hot-toast'

export default function VideoGenerator() {
  const [clips, setClips] = useState([])
  const [processing, setProcessing] = useState(false)
  const [outputUrl, setOutputUrl] = useState(null)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [selectedClip, setSelectedClip] = useState(null)
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)

  const handleFileUpload = useCallback((e) => {
    const files = Array.from(e.target.files)
    const newClips = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      url: URL.createObjectURL(file),
      duration: 0,
      size: file.size
    }))
    setClips(prev => [...prev, ...newClips])
    toast.success(`${files.length} clip(s) added`)
  }, [])

  const removeClip = (id) => {
    setClips(prev => {
      const clip = prev.find(c => c.id === id)
      if (clip) URL.revokeObjectURL(clip.url)
      return prev.filter(c => c.id !== id)
    })
  }

  const handleMetadata = (id, e) => {
    const duration = e.target.duration
    setClips(prev => prev.map(c => c.id === id ? { ...c, duration } : c))
  }

  const trimClip = async () => {
    if (!selectedClip) {
      toast.error('Select a clip to trim')
      return
    }

    setProcessing(true)
    try {
      const clip = clips.find(c => c.id === selectedClip)
      if (!clip) return

      const formData = new FormData()
      formData.append('video', clip.file)
      formData.append('start', trimStart.toString())
      formData.append('end', trimEnd.toString())

      const response = await fetch('/api/video/trim', { method: 'POST', body: formData })
      if (!response.ok) throw new Error('Trim failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setOutputUrl(url)
      toast.success('Clip trimmed!')
    } catch (err) {
      toast.error(`Trim failed: ${err.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const concatenateClips = async () => {
    if (clips.length < 2) {
      toast.error('Add at least 2 clips to concatenate')
      return
    }

    setProcessing(true)
    try {
      const formData = new FormData()
      clips.forEach(clip => formData.append('videos', clip.file))

      const response = await fetch('/api/video/concatenate', { method: 'POST', body: formData })
      if (!response.ok) throw new Error('Concatenation failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setOutputUrl(url)
      toast.success('Clips merged!')
    } catch (err) {
      toast.error(`Merge failed: ${err.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const downloadOutput = () => {
    if (!outputUrl) return
    const a = document.createElement('a')
    a.href = outputUrl
    a.download = 'output.mp4'
    a.click()
  }

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Video className="w-8 h-8 text-purple-400" /> Video Generator
        </h1>
        <p className="page-subtitle">Upload, trim, and combine video clips</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload & Clip List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-primary-500 transition-colors"
            >
              <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">Drop video clips or click to upload</p>
              <p className="text-xs text-gray-500 mt-1">MP4, WebM, MOV supported</p>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Clip list */}
          <div className="space-y-2">
            {clips.map((clip, index) => (
              <div
                key={clip.id}
                onClick={() => {
                  setSelectedClip(clip.id)
                  setTrimEnd(clip.duration)
                }}
                className={`card cursor-pointer transition-colors ${selectedClip === clip.id ? 'border-primary-500' : 'hover:border-gray-600'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 h-10 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                    <video
                      src={clip.url}
                      className="w-full h-full object-cover"
                      onLoadedMetadata={(e) => handleMetadata(clip.id, e)}
                      muted
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{clip.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatDuration(clip.duration)}</span>
                      <span>{formatSize(clip.size)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeClip(clip.id) }}
                    className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          {clips.length >= 2 && (
            <button
              onClick={concatenateClips}
              disabled={processing}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
              Merge All Clips
            </button>
          )}
        </div>

        {/* Preview & Trim */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video preview */}
          <div className="card">
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              {(outputUrl || (selectedClip && clips.find(c => c.id === selectedClip)?.url)) ? (
                <video
                  ref={videoRef}
                  src={outputUrl || clips.find(c => c.id === selectedClip)?.url}
                  controls
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Play className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">Select a clip to preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trim controls */}
          {selectedClip && (
            <div className="card">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-primary-400" /> Trim Clip
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Start (seconds)</label>
                  <input
                    type="number"
                    min="0"
                    max={trimEnd}
                    step="0.1"
                    value={trimStart}
                    onChange={(e) => setTrimStart(parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">End (seconds)</label>
                  <input
                    type="number"
                    min={trimStart}
                    step="0.1"
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                </div>
              </div>
              <button onClick={trimClip} disabled={processing} className="btn-primary w-full flex items-center justify-center gap-2">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                Trim Clip
              </button>
            </div>
          )}

          {/* Output */}
          {outputUrl && (
            <div className="card border-green-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-green-400">Output Ready</h3>
                  <p className="text-sm text-gray-400">Your processed video is ready for download</p>
                </div>
                <button onClick={downloadOutput} className="btn-primary flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
