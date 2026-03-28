import { config } from './config.js'

// Generate video from image using Stable Video Diffusion via HuggingFace
export async function generateVideoFromImage(imageUrl, options = {}) {
  const token = config.huggingface.token
  if (!token) {
    console.log('No HF token — using image as static video frame')
    return null
  }

  const { duration = 4, motionBucketId = 127, fps = 24 } = options

  try {
    // First, fetch the image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) throw new Error('Failed to fetch image')
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

    // Call SVD via HuggingFace
    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/stabilityai/stable-video-diffusion-img2vid-xt',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: imageBuffer.toString('base64'),
          parameters: {
            motion_bucket_id: motionBucketId,
            fps: fps,
            num_frames: duration * fps,
            decode_chunk_size: 5
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`SVD API error (${response.status}): ${errorText}`)
    }

    // Response is video data
    const videoBuffer = Buffer.from(await response.arrayBuffer())
    return videoBuffer

  } catch (err) {
    console.error('SVD video generation failed:', err.message)
    return null
  }
}

// Generate text-to-video using Zeroscope via HuggingFace
export async function generateVideoFromText(prompt, options = {}) {
  const token = config.huggingface.token
  if (!token) return null

  const { duration = 4 } = options

  try {
    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/cerspense/zeroscope_v2_576w',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_frames: duration * 8,
            fps: 8
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Zeroscope error: ${response.status}`)
    }

    const videoBuffer = Buffer.from(await response.arrayBuffer())
    return videoBuffer

  } catch (err) {
    console.error('Text-to-video failed:', err.message)
    return null
  }
}

// Generate animated sequence from multiple images (Ken Burns style)
export async function animateImages(imagePaths, outputDir, options = {}) {
  const { fps = 24, duration = 3, zoomSpeed = 0.5 } = options
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execAsync = promisify(exec)
  const { writeFile, mkdir } = await import('fs/promises')
  const { join } = await import('path')

  await mkdir(outputDir, { recursive: true })
  const videoPaths = []

  for (let i = 0; i < imagePaths.length; i++) {
    const inputPath = imagePaths[i]
    const outputPath = join(outputDir, `animated-${i}.mp4`)

    // Ken Burns effect: slow zoom in
    try {
      await execAsync([
        'ffmpeg', '-y',
        '-loop', '1', '-i', inputPath,
        '-vf', `zoompan=z='min(zoom+0.0015,1.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${duration * fps}:s=1080x1920:fps=${fps}`,
        '-c:v', 'libx264', '-t', String(duration),
        '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '18',
        outputPath
      ].join(' '))

      videoPaths.push(outputPath)
    } catch (err) {
      console.error(`Ken Burns failed for image ${i}:`, err.message)
    }
  }

  return videoPaths
}
