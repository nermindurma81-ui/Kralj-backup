// Performance Metrics API
// Provides insights into AI Video Pipeline performance

import { getPerformanceMetrics, clearCache } from '../ai-video-pipeline/pipeline-optimized.js'

// In-memory metrics storage (for production, use database)
const metricsHistory = []
const MAX_HISTORY = 1000

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // GET - Retrieve metrics
  if (req.method === 'GET') {
    const { history, detailed } = req.query

    const currentMetrics = getPerformanceMetrics()

    if (history === 'true') {
      return res.status(200).json({
        success: true,
        data: {
          current: currentMetrics,
          history: metricsHistory.slice(-100) // Last 100 entries
        }
      })
    }

    if (detailed === 'true') {
      return res.status(200).json({
        success: true,
        data: {
          ...currentMetrics,
          history: metricsHistory,
          cacheSize: global.mediaCache?.size || 0
        }
      })
    }

    return res.status(200).json({
      success: true,
      data: currentMetrics
    })
  }

  // POST - Record metric or clear cache
  if (req.method === 'POST') {
    const { action, metric } = req.body

    if (action === 'clear-cache') {
      const cleared = clearCache()
      return res.status(200).json({
        success: true,
        message: `Cleared ${cleared} cached items`,
        data: { cleared }
      })
    }

    if (action === 'record') {
      metricsHistory.push({
        ...metric,
        timestamp: new Date().toISOString()
      })

      // Trim history if too large
      if (metricsHistory.length > MAX_HISTORY) {
        metricsHistory.splice(0, metricsHistory.length - MAX_HISTORY)
      }

      return res.status(200).json({
        success: true,
        message: 'Metric recorded'
      })
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid action. Use "clear-cache" or "record"'
    })
  }

  // DELETE - Reset metrics
  if (req.method === 'DELETE') {
    metricsHistory.length = 0 // Clear history

    return res.status(200).json({
      success: true,
      message: 'Metrics reset'
    })
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'OPTIONS'])
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  })
}
