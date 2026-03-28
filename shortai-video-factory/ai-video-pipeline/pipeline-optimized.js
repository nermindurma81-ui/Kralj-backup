import { mkdir, writeFile, readFile, rm } from 'fs/promises'
import { join } from 'path'
import { config } from './config.js'
import { generateScript, generateCaptions, generateMetadata, generateHooks } from './ai.js'
import { getSceneMedia, generateTTS, downloadMedia } from './media.js'
import { assembleVideo } from './video.js'

// Performance tracking
const performanceMetrics = {
  totalJobs: 0,
  successfulJobs: 0,
  failedJobs: 0,
  avgProcessingTime: 0,
  cacheHits: 0,
  cacheMisses: 0
}

// Media cache (izbjegava ponovno preuzimanje)
const mediaCache = new Map()

// Process a single video through the full pipeline - OPTIMIZED
export async function processVideo(topic, options = {}) {
  const startTime = Date.now()
  const {
    platform = config.pipeline.defaultPlatform,
    duration = config.pipeline.defaultDuration,
    tone = 'conversational',
    outputDir = config.pipeline.outputDir,
    index = 0,
    enableCache = true,
    maxRetries = 3
  } = options

  const jobId = `video-${Date.now()}-${index}`
  const jobDir = join(outputDir, jobId)
  await mkdir(jobDir, { recursive: true })

  const log = (msg, level = 'info') => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : '📝'
    console.log(`[${timestamp}] [${jobId}] ${prefix} ${msg}`)
  }

  const result = { 
    jobId, 
    topic, 
    status: 'pending', 
    steps: {},
    metrics: {
      startTime,
      endTime: null,
      duration: null,
      retries: 0
    }
  }

  try {
    performanceMetrics.totalJobs++

    // Step 1: Generate Script (with retry)
    log('Generating script...')
    const script = await retryOperation(
      () => generateScript(topic, { duration, tone, platform }),
      maxRetries,
      'Script generation'
    )
    if (!script) throw new Error('Script generation failed after retries')
    result.steps.script = { status: 'done', data: script }
    log(`Script: "${script.title}"`, 'success')

    // Step 2: Generate Hooks (parallel - ne blokira)
    log('Generating hooks...')
    const hooks = await generateHooks(topic, platform, 5)
    result.steps.hooks = { status: 'done', data: hooks }

    // Step 3: Generate Metadata (parallel)
    log('Generating metadata...')
    const metadata = await generateMetadata(script, platform)
    result.steps.metadata = { status: 'done', data: metadata }

    // Step 4: Get Media for each scene (PARALLEL - biggest performance boost!)
    log('Fetching scene media (parallel)...')
    const scenes = script.scenes || []
    const mediaFiles = await Promise.allSettled(
      scenes.map((scene, i) => 
        getSceneMediaWithCache(scene, jobDir, i, enableCache)
          .then(media => {
            log(`  Scene ${i + 1}/${scenes.length} ✓`)
            return media
          })
      )
    )
    
    const successfulMedia = mediaFiles
      .filter(m => m.status === 'fulfilled' && m.value)
      .map(m => m.value)
    
    result.steps.media = { 
      status: 'done', 
      count: successfulMedia.length,
      total: scenes.length,
      failed: scenes.length - successfulMedia.length
    }

    // Step 5: Generate Voiceover (PARALLEL with batching)
    log('Generating voiceover (parallel batch)...')
    const audioFiles = await generateVoiceoverBatch(scenes, jobDir, log)
    result.steps.voiceover = { 
      status: 'done', 
      count: audioFiles.filter(a => a).length,
      total: scenes.length
    }

    // Step 6: Generate Captions
    log('Generating captions...')
    const allDialogue = scenes.map(s => s.dialogue).filter(Boolean).join(' ')
    const captions = await retryOperation(
      () => generateCaptions(allDialogue),
      maxRetries,
      'Caption generation'
    )
    result.steps.captions = { status: 'done', data: captions }

    // Step 7: Assemble Video
    log('Assembling video...')
    const [width, height] = config.pipeline.defaultResolution.split('x').map(Number)
    const videoPath = await retryOperation(
      () => assembleVideo(scenes, successfulMedia, audioFiles, {
        outputDir: jobDir,
        filename: 'final',
        width,
        height,
        fps: config.pipeline.defaultFps,
        srtContent: captions?.srt || ''
      }),
      maxRetries,
      'Video assembly'
    )
    result.steps.video = { status: 'done', path: videoPath }
    log(`Video: ${videoPath}`, 'success')

    // Save job manifest
    result.status = 'done'
    result.metrics.endTime = Date.now()
    result.metrics.duration = result.metrics.endTime - result.startTime
    result.completedAt = new Date().toISOString()
    
    // Update performance metrics
    performanceMetrics.successfulJobs++
    performanceMetrics.avgProcessingTime = 
      (performanceMetrics.avgProcessingTime * (performanceMetrics.successfulJobs - 1) + 
       result.metrics.duration) / performanceMetrics.successfulJobs
    
    await writeFile(join(jobDir, 'manifest.json'), JSON.stringify(result, null, 2))
    log('DONE!', 'success')

    return result

  } catch (err) {
    result.status = 'error'
    result.error = err.message
    result.metrics.endTime = Date.now()
    result.metrics.duration = result.metrics.endTime - result.startTime
    performanceMetrics.failedJobs++
    log(`ERROR: ${err.message}`, 'error')
    await writeFile(join(jobDir, 'manifest.json'), JSON.stringify(result, null, 2))
    return result
  }
}

// Helper: Media with caching
async function getSceneMediaWithCache(scene, jobDir, index, enableCache = true) {
  const cacheKey = scene.visualPrompt?.substring(0, 50)
  
  if (enableCache && cacheKey && mediaCache.has(cacheKey)) {
    performanceMetrics.cacheHits++
    console.log(`  📦 Cache hit for scene ${index}`)
    return mediaCache.get(cacheKey)
  }
  
  performanceMetrics.cacheMisses++
  const media = await getSceneMedia(scene, jobDir, index)
  
  if (enableCache && cacheKey && media) {
    mediaCache.set(cacheKey, media)
  }
  
  return media
}

// Helper: Parallel voiceover generation with batching
async function generateVoiceoverBatch(scenes, jobDir, log) {
  const BATCH_SIZE = 3 // Process 3 audio files at once
  const audioFiles = new Array(scenes.length).fill(null)
  
  for (let i = 0; i < scenes.length; i += BATCH_SIZE) {
    const batch = scenes.slice(i, i + BATCH_SIZE)
    log(`  Processing audio batch ${Math.floor(i/BATCH_SIZE) + 1}...`)
    
    const batchPromises = batch.map(async (scene, batchIdx) => {
      const sceneIdx = i + batchIdx
      const dialogue = scene.dialogue || ''
      
      if (!dialogue) return null
      
      try {
        const audioBuffer = await generateTTS(dialogue)
        if (audioBuffer) {
          const audioPath = join(jobDir, `audio-${sceneIdx}.wav`)
          await writeFile(audioPath, audioBuffer)
          return audioPath
        }
        return null
      } catch (err) {
        log(`  Audio ${sceneIdx + 1} failed: ${err.message}`, 'error')
        return null
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    batchResults.forEach((result, idx) => {
      audioFiles[i + idx] = result
    })
  }
  
  return audioFiles
}

// Helper: Retry with exponential backoff
async function retryOperation(operation, maxRetries, operationName) {
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (err) {
      lastError = err
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
        console.log(`${operationName} attempt ${attempt} failed, retrying in ${delay}ms...`)
        await sleep(delay)
      }
    }
  }
  
  throw lastError
}

// Process batch of videos with progress tracking
export async function processBatch(topics, options = {}) {
  const { 
    maxConcurrent = config.pipeline.maxConcurrent,
    enableProgress = true
  } = options
  
  const results = []
  const queue = [...topics]
  let running = 0
  let completed = 0
  let startTime = Date.now()

  return new Promise((resolve) => {
    const next = async () => {
      if (queue.length === 0 && running === 0) {
        const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2)
        console.log(`\n📊 Batch Complete in ${totalTime} minutes`)
        console.log(`   Total: ${results.length} | Success: ${results.filter(r => r.status === 'done').length} | Failed: ${results.filter(r => r.status === 'error').length}`)
        resolve(results)
        return
      }

      while (running < maxConcurrent && queue.length > 0) {
        const topic = queue.shift()
        const index = completed + running
        running++

        if (enableProgress) {
          const progress = ((completed / topics.length) * 100).toFixed(1)
          console.log(`\n📈 Progress: ${progress}% (${completed + index}/${topics.length})`)
        }

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

// Get performance metrics
export function getPerformanceMetrics() {
  return {
    ...performanceMetrics,
    cacheHitRate: performanceMetrics.cacheHits > 0 
      ? ((performanceMetrics.cacheHits / (performanceMetrics.cacheHits + performanceMetrics.cacheMisses)) * 100).toFixed(2) + '%'
      : '0%',
    successRate: performanceMetrics.totalJobs > 0
      ? ((performanceMetrics.successfulJobs / performanceMetrics.totalJobs) * 100).toFixed(2) + '%'
      : '0%'
  }
}

// Clear cache (for memory management)
export function clearCache() {
  const size = mediaCache.size
  mediaCache.clear()
  console.log(`🗑️  Cleared ${size} cached items`)
  return size
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
  const enableCache = getArg('cache') !== 'false'

  console.log(`\n🎬 AI Video Pipeline (OPTIMIZED)`)
  console.log(`   Topic: ${topic}`)
  console.log(`   Count: ${count}`)
  console.log(`   Platform: ${platform}`)
  console.log(`   Duration: ${duration}s`)
  console.log(`   Cache: ${enableCache ? 'ON' : 'OFF'}\n`)

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

  const results = await processBatch(topics, { platform, duration, enableCache })

  // Print performance metrics
  const metrics = getPerformanceMetrics()
  console.log('\n⚡ Performance Metrics:')
  console.log(`   Success Rate: ${metrics.successRate}`)
  console.log(`   Cache Hit Rate: ${metrics.cacheHitRate}`)
  console.log(`   Avg Processing Time: ${(metrics.avgProcessingTime / 1000).toFixed(2)}s`)
  console.log(`   Total Jobs: ${metrics.totalJobs}`)
  
  console.log('\n📁 Output:', config.pipeline.outputDir)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main().catch(console.error)
