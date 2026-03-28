// ShortAI Video Generation API
// Integrates AI Video Pipeline with ShortAI frontend

import { processVideo, processBatch, getPerformanceMetrics } from '../../ai-video-pipeline/pipeline-optimized.js'
import { getConfig, validateConfig, getPlatformSettings } from '../config/shared.js'

// In-memory job queue (for production, use Redis/Database)
const jobQueue = new Map()
const jobResults = new Map()

export default async function handler(req, res) {
  // Validate configuration
  const validation = validateConfig()
  if (!validation.valid) {
    return res.status(500).json({
      success: false,
      message: 'Configuration error',
      errors: validation.errors
    })
  }

  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // GET - Get job status or metrics
  if (req.method === 'GET') {
    const { jobId, metrics } = req.query

    if (metrics === 'true') {
      const perfMetrics = getPerformanceMetrics()
      return res.status(200).json({
        success: true,
        data: perfMetrics
      })
    }

    if (jobId) {
      const job = jobQueue.get(jobId)
      const result = jobResults.get(jobId)

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        })
      }

      return res.status(200).json({
        success: true,
        data: {
          status: result ? 'completed' : job.status,
          progress: job.progress || 0,
          result: result || null
        }
      })
    }

    return res.status(400).json({
      success: false,
      message: 'Missing jobId or metrics parameter'
    })
  }

  // POST - Generate video(s)
  if (req.method === 'POST') {
    try {
      const {
        topic,
        platform = 'youtube',
        duration = 30,
        tone = 'conversational',
        count = 1,
        enableCache = true,
        webhookUrl = null
      } = req.body

      // Validate input
      if (!topic) {
        return res.status(400).json({
          success: false,
          message: 'Topic is required'
        })
      }

      // Get platform-specific settings
      const platformSettings = getPlatformSettings(platform)

      // Validate duration
      if (duration > platformSettings.maxDuration) {
        return res.status(400).json({
          success: false,
          message: `Duration exceeds maximum (${platformSettings.maxDuration}s) for ${platform}`
        })
      }

      // Generate job ID
      const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Initialize job in queue
      jobQueue.set(jobId, {
        id: jobId,
        topic,
        platform,
        duration,
        tone,
        count,
        status: 'queued',
        progress: 0,
        createdAt: new Date().toISOString()
      })

      // Start processing (async)
      processVideoGeneration(jobId, {
        topic,
        platform,
        duration,
        tone,
        count,
        enableCache
      }, webhookUrl)

      // Return immediately with job ID
      return res.status(202).json({
        success: true,
        message: `Video generation started for "${topic}"`,
        data: {
          jobId,
          status: 'queued',
          estimatedTime: count * 2 // ~2 minutes per video
        }
      })

    } catch (err) {
      console.error('Video generation error:', err)
      return res.status(500).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      })
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST', 'OPTIONS'])
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  })
}

// Background video processing
async function processVideoGeneration(jobId, options, webhookUrl) {
  const { topic, platform, duration, tone, count, enableCache } = options

  try {
    // Update job status
    jobQueue.set(jobId, {
      ...jobQueue.get(jobId),
      status: 'processing',
      progress: 10
    })

    let result

    if (count === 1) {
      // Single video
      result = await processVideo(topic, {
        platform,
        duration,
        tone,
        enableCache,
        onProgress: (progress) => {
          jobQueue.set(jobId, {
            ...jobQueue.get(jobId),
            progress: 10 + (progress * 80) // 10-90%
          })
        }
      })
    } else {
      // Batch processing
      const topics = Array(count).fill(topic).map((t, i) => `${t} - Part ${i + 1}`)
      
      result = await processBatch(topics, {
        platform,
        duration,
        tone,
        enableCache,
        enableProgress: true,
        onBatchProgress: (completed, total) => {
          const progress = 10 + ((completed / total) * 80)
          jobQueue.set(jobId, {
            ...jobQueue.get(jobId),
            progress,
            completed,
            total
          })
        }
      })
    }

    // Update job as completed
    jobQueue.set(jobId, {
      ...jobQueue.get(jobId),
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString()
    })

    // Store result
    jobResults.set(jobId, result)

    // Send webhook if configured
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            status: 'completed',
            data: result
          })
        })
      } catch (webhookErr) {
        console.error('Webhook failed:', webhookErr)
      }
    }

  } catch (err) {
    console.error(`Job ${jobId} failed:`, err)

    // Update job as failed
    jobQueue.set(jobId, {
      ...jobQueue.get(jobId),
      status: 'failed',
      error: err.message,
      failedAt: new Date().toISOString()
    })

    // Send error webhook if configured
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            status: 'failed',
            error: err.message
          })
        })
      } catch (webhookErr) {
        console.error('Error webhook failed:', webhookErr)
      }
    }
  }
}
