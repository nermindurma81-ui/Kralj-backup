import { createClient } from '@supabase/supabase-js'

const supabase = process.env.SUPABASE_URL
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null

// In-memory store for connections
let connections = []

const OAUTH = {
  youtube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube',
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    redirectUri: process.env.YOUTUBE_REDIRECT_URI || `${process.env.APP_URL}/api/platforms/youtube/callback`
  },
  tiktok: {
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    scope: 'video.upload,video.publish',
    clientId: process.env.TIKTOK_CLIENT_KEY,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    redirectUri: process.env.TIKTOK_REDIRECT_URI || `${process.env.APP_URL}/api/platforms/tiktok/callback`
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', ['POST']); return res.status(405).json({ message: 'Method not allowed' }) }

  const { action, ...params } = req.body

  try {
    switch (action) {
      case 'list-connections': {
        if (supabase) {
          const { data, error } = await supabase.from('platform_connections').select('*').order('created_at', { ascending: false })
          if (error) throw error
          return res.status(200).json(data || [])
        }
        return res.status(200).json(connections)
      }

      case 'connect': {
        const { platform } = params
        const config = OAUTH[platform]
        if (!config?.clientId) {
          return res.status(400).json({
            message: `${platform} not configured. Add ${platform.toUpperCase()}_CLIENT_ID to environment variables.`
          })
        }
        const state = crypto.randomUUID()
        const p = new URLSearchParams({
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          response_type: 'code',
          scope: config.scope,
          state,
          access_type: 'offline'
        })
        return res.status(200).json({ authUrl: `${config.authUrl}?${p.toString()}` })
      }

      case 'callback': {
        const { platform, code } = params
        const config = OAUTH[platform]
        if (!config) return res.status(400).json({ message: 'Unknown platform' })

        try {
          // Exchange code for tokens
          const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              code,
              client_id: config.clientId,
              client_secret: config.clientSecret,
              redirect_uri: config.redirectUri,
              grant_type: 'authorization_code'
            })
          })

          if (!tokenRes.ok) {
            const err = await tokenRes.json().catch(() => ({}))
            throw new Error(err.error_description || 'Token exchange failed')
          }

          const tokens = await tokenRes.json()
          const connection = {
            id: crypto.randomUUID(),
            platform,
            connected: true,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: tokens.expires_in
              ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
              : null,
            connected_at: new Date().toISOString()
          }

          if (supabase) {
            const { data, error } = await supabase
              .from('platform_connections')
              .upsert({ user_id: 'default', ...connection })
              .select().single()
            if (error) throw error
            return res.status(200).json({ connection: data, message: `Connected to ${platform}` })
          }

          // In-memory
          connections = connections.filter(c => c.platform !== platform)
          connections.push(connection)
          return res.status(200).json({ connection, message: `Connected to ${platform}` })

        } catch (err) {
          return res.status(500).json({ message: `OAuth failed: ${err.message}` })
        }
      }

      case 'disconnect': {
        const { id } = params
        if (supabase) {
          await supabase.from('platform_connections').delete().eq('id', id)
        } else {
          connections = connections.filter(c => c.id !== id)
        }
        return res.status(200).json({ message: 'Disconnected' })
      }

      case 'schedule': {
        const { title, platform, scheduledAt, content, status = 'scheduled' } = params
        if (!title || !scheduledAt) return res.status(400).json({ message: 'Title and date required' })

        if (supabase) {
          const { data, error } = await supabase.from('scheduled_content').insert({
            user_id: 'default', title, platform, scheduled_at: scheduledAt,
            content: typeof content === 'string' ? content : JSON.stringify(content), status, created_at: new Date().toISOString()
          }).select().single()
          if (error) throw error
          return res.status(201).json(data)
        }

        // In-memory (temporary)
        const scheduled = { id: crypto.randomUUID(), title, platform, scheduled_at: scheduledAt, content, status }
        return res.status(201).json(scheduled)
      }

      case 'get-schedule': {
        if (supabase) {
          const { data, error } = await supabase.from('scheduled_content').select('*').order('scheduled_at', { ascending: true })
          if (error) throw error
          return res.status(200).json(data || [])
        }
        return res.status(200).json([])
      }

      case 'publish-now': {
        const { contentId, platform } = params

        if (supabase) {
          await supabase.from('scheduled_content').update({
            status: 'published', published_at: new Date().toISOString()
          }).eq('id', contentId)
        }

        return res.status(200).json({
          success: true,
          message: `Content marked as published for ${platform || 'unknown'}`,
          note: 'Actual publishing requires connected platform account'
        })
      }

      default:
        return res.status(400).json({ message: 'Unknown action. Use: list-connections, connect, callback, disconnect, schedule, get-schedule, publish-now' })
    }
  } catch (err) {
    console.error('Platform API error:', err)
    return res.status(500).json({ message: err.message })
  }
}
