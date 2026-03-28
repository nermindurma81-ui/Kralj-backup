import { config } from './config.js'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

// Fetch stock video/image from Pexels
export async function fetchStockMedia(query, type = 'video') {
  if (!config.pexels.apiKey) return null

  try {
    const endpoint = type === 'video'
      ? `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=3&orientation=portrait`
      : `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=portrait`

    const response = await fetch(endpoint, {
      headers: { Authorization: config.pexels.apiKey }
    })

    if (!response.ok) return null
    const data = await response.json()

    if (type === 'video') {
      const video = data.videos?.[0]
      if (!video) return null
      const file = video.video_files?.find(f => f.quality === 'hd' && f.width < f.height)
        || video.video_files?.[0]
      return { url: file?.link, type: 'video', photographer: video.user?.name }
    } else {
      const photo = data.photos?.[0]
      if (!photo) return null
      return { url: photo.src?.large || photo.src?.original, type: 'image', photographer: photo.photographer }
    }
  } catch (err) {
    console.error('Pexels fetch failed:', err.message)
    return null
  }
}

// Generate image with Pollinations.ai (free, no API key)
export async function generateImage(prompt, width = 1080, height = 1920) {
  const encoded = encodeURIComponent(prompt)
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${Date.now()}`
  return { url, type: 'generated', provider: 'pollinations' }
}

// Download media to local file
export async function downloadMedia(url, outputDir, filename) {
  await mkdir(outputDir, { recursive: true })

  const ext = url.includes('.png') ? '.png' : url.includes('.mp4') ? '.mp4' : '.jpg'
  const filepath = join(outputDir, `${filename}${ext}`)

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Download failed: ${response.status}`)

    const buffer = Buffer.from(await response.arrayBuffer())
    await writeFile(filepath, buffer)
    return filepath
  } catch (err) {
    console.error('Download failed:', err.message)
    return null
  }
}

// Generate TTS audio using HuggingFace Kokoro
export async function generateTTS(text, voice = 'af_heart') {
  if (!config.huggingface.token) return null

  try {
    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/hexgrad/Kokoro-82M',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.huggingface.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: text,
          parameters: { voice, speed: 1.0 }
        })
      }
    )

    if (!response.ok) return null
    return Buffer.from(await response.arrayBuffer())
  } catch (err) {
    console.error('TTS failed:', err.message)
    return null
  }
}

// Get media for a scene (stock or generated)
export async function getSceneMedia(scene, workDir, index) {
  const prompt = scene.visualPrompt || scene.description || 'abstract background'

  // Try Pexels first
  let media = null
  if (config.pexels.apiKey) {
    media = await fetchStockMedia(prompt, 'image')
  }

  // Fallback to Pollinations
  if (!media) {
    media = await generateImage(prompt)
  }

  // Download
  if (media?.url) {
    const filepath = await downloadMedia(media.url, workDir, `scene-${index}`)
    return { ...media, localPath: filepath }
  }

  return null
}
