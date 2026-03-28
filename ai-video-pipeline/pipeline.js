import { mkdir, writeFile, readFile } from 'fs/promises'
import { join } from 'path'
import { config } from './config.js'
import { generateScript, generateCaptions, generateMetadata, generateHooks } from './ai.js'
import { getSceneMedia, generateTTS, downloadMedia } from './media.js'
import { assembleVideo } from './video.js'

// Process a single video through the full pipeline
export async function processVideo(topic, options = {}) {
  const {
    platform = config.pipeline.defaultPlatform,
    duration = config.pipeline.defaultDuration,
    tone = 'conversational',
    outputDir = config.pipeline.outputDir,
    index = 0
  } = options

  const jobId = `video-${Date.now()}-${index}`
  const jobDir = join(outputDir, jobId)
  await mkdir(jobDir, { recursive: true })

  const log = (msg) => console.log(`[${jobId}] ${msg}`)
  const result = { jobId, topic, status: 'pending', steps: {} }

  try {
    // Step 1: Generate Script
    log('Generating script...')
    const script = await generateScript(topic, { duration, tone, platform })
    if (!script) throw new Error('Script generation failed')
    result.steps.script = { status: 'done', data: script }
    log(`Script: "${script.title}"`)

    // Step 2: Generate Hooks
    log('Generating hooks...')
    const hooks = await generateHooks(topic, platform, 5)
    result.steps.hooks = { status: 'done', data: hooks }

    // Step 3: Generate Metadata
    log('Generating metadata...')
    const metadata = await generateMetadata(script, platform)
    result.steps.metadata = { status: 'done', data: metadata }

    // Step 4: Get Media for each scene
    log('Fetching scene media...')
    const scenes = script.scenes || []
    const mediaFiles = []
    for (let i = 0; i < scenes.length; i++) {
      log(`  Scene ${i + 1}/${scenes.length}...`)
      const media = await getSceneMedia(scenes[i], jobDir, i)
      mediaFiles.push(media)
    }
    result.steps.media = { status: 'done', count: mediaFiles.filter(m => m?.localPath).length }

    // Step 5: Generate Voiceover
    log('Generating voiceover...')
    const audioFiles = []
    for (let i = 0; i < scenes.length; i++) {
      const dialogue = scenes[i].dialogue || ''
      if (!dialogue) {
        audioFiles.push(null)
        continue
      }
      try {
        const audioBuffer = await generateTTS(dialogue)
        if (audioBuffer) {
          const audioPath = join(jobDir, `audio-${i}.wav`)
          await writeFile(audioPath, audioBuffer)
          audioFiles.push(audioPath)
          log(`  Audio ${i + 1} done`)
        } else {
          audioFiles.push(null)
        }
      } catch {
        audioFiles.push(null)
      }
    }
    result.steps.voiceover = { status: 'done', count: audioFiles.filter(a => a).length }

    // Step 6: Generate Captions
    log('Generating captions...')
    const allDialogue = scenes.map(s => s.dialogue).join(' ')
    const captions = await generateCaptions(allDialogue)
    result.steps.captions = { status: 'done', data: captions }

    // Step 7: Assemble Video
    log('Assembling video...')
    const [width, height] = config.pipeline.defaultResolution.split('x').map(Number)
    const videoPath = await assembleVideo(scenes, mediaFiles, audioFiles, {
      outputDir: jobDir,
      filename: 'final',
      width,
      height,
      fps: config.pipeline.defaultFps,
      srtContent: captions.srt
    })
    result.steps.video = { status: 'done', path: videoPath }
    log(`Video: ${videoPath}`)

    // Save job manifest
    result.status = 'done'
    result.completedAt = new Date().toISOString()
    await writeFile(join(jobDir, 'manifest.json'), JSON.stringify(result, null, 2))

    log('DONE!')
    return result

  } catch (err) {
    result.status = 'error'
    result.error = err.message
    log(`ERROR: ${err.message}`)
    await writeFile(join(jobDir, 'manifest.json'), JSON.stringify(result, null, 2))
    return result
  }
}

// Process batch of videos
export async function processBatch(topics, options = {}) {
  const { maxConcurrent = config.pipeline.maxConcurrent } = options
  const results = []
  const queue = [...topics]
  let running = 0
  let completed = 0

  return new Promise((resolve) => {
    const next = async () => {
      if (queue.length === 0 && running === 0) {
        resolve(results)
        return
      }

      while (running < maxConcurrent && queue.length > 0) {
        const topic = queue.shift()
        const index = completed + running
        running++

        processVideo(topic, { ...options, index })
          .then(result => {
            results.push(result)
            completed++
            running--
            next()
          })
          .catch(err => {
            results.push({ topic, status: 'error', error: err.message })
            completed++
            running--
            next()
          })
      }
    }

    next()
  })
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2)
  const getArg = (name) => {
    const idx = args.indexOf(`--${name}`)
    return idx >= 0 ? args[idx + 1] : null
  }

  const topic = getArg('topic') || 'AI technology tips'
  const count = parseInt(getArg('count') || '1')
  const platform = getArg('platform') || 'youtube'
  const duration = parseInt(getArg('duration') || '30')

  console.log(`\n🎬 AI Video Pipeline`)
  console.log(`   Topic: ${topic}`)
  console.log(`   Count: ${count}`)
  console.log(`   Platform: ${platform}`)
  console.log(`   Duration: ${duration}s\n`)

  // Generate multiple topics from one
  let topics = [topic]
  if (count > 1) {
    console.log('Generating topic variations...')
    const { callAI, parseJSON } = await import('./ai.js')
    const result = await callAI(
      `Generate ${count} unique video topic variations for: "${topic}". Return JSON array of strings.`
    )
    const parsed = parseJSON(result)
    if (Array.isArray(parsed) && parsed.length > 0) {
      topics = parsed
    } else {
      topics = Array(count).fill(topic).map((t, i) => `${t} - Part ${i + 1}`)
    }
  }

  const results = await processBatch(topics, { platform, duration })

  console.log('\n📊 Results:')
  const done = results.filter(r => r.status === 'done').length
  const errors = results.filter(r => r.status === 'error').length
  console.log(`   ✅ Done: ${done}`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log(`\n📁 Output: ${config.pipeline.outputDir}`)
}

main().catch(console.error)
