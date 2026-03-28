import { createClient } from '@supabase/supabase-js'

const supabase = process.env.SUPABASE_URL
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null

export default async function handler(req, res) {
  const { code, state, error } = req.query

  if (error) {
    return res.status(400).send(`<html><body><h2>Auth Error</h2><p>${error}</p><a href="/">Go back</a></body></html>`)
  }

  if (!code) {
    return res.status(400).send('<html><body><h2>No code provided</h2><a href="/">Go back</a></body></html>')
  }

  try {
    const clientId = process.env.YOUTUBE_CLIENT_ID
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
    const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'https://shortai-video-factory.vercel.app/api/platforms/youtube/callback'

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}))
      throw new Error(err.error_description || `Token exchange failed: ${tokenRes.status}`)
    }

    const tokens = await tokenRes.json()

    // Get channel info
    let channelName = 'YouTube Account'
    try {
      const channelRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      })
      if (channelRes.ok) {
        const channelData = await channelRes.json()
        channelName = channelData.items?.[0]?.snippet?.title || channelName
      }
    } catch {}

    const connection = {
      id: crypto.randomUUID(),
      platform: 'youtube',
      connected: true,
      accountName: channelName,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      connected_at: new Date().toISOString()
    }

    // Store connection
    if (supabase) {
      await supabase.from('platform_connections').upsert({
        user_id: 'default', ...connection
      }).catch(console.error)
    }

    // Redirect back to app with success
    const appUrl = process.env.APP_URL || 'https://shortai-video-factory.vercel.app'
    return res.send(`
      <html>
        <head>
          <title>YouTube Connected!</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui; background: #1a1a2e; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #16213e; border-radius: 16px; padding: 40px; text-align: center; max-width: 400px; }
            .icon { font-size: 60px; margin-bottom: 20px; }
            h2 { color: #00ff88; margin-bottom: 10px; }
            p { color: #aaa; margin-bottom: 20px; }
            a { background: #e94560; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
            a:hover { background: #c73650; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✅</div>
            <h2>YouTube Connected!</h2>
            <p>Channel: ${channelName}</p>
            <a href="${appUrl}">Open ShortAI →</a>
          </div>
          <script>setTimeout(() => window.location.href = "${appUrl}?youtube_connected=true&channel=${encodeURIComponent(channelName)}", 2000)</script>
        </body>
      </html>
    `)

  } catch (err) {
    console.error('YouTube callback error:', err)
    return res.status(500).send(`<html><body><h2>Error</h2><p>${err.message}</p><a href="/">Go back</a></body></html>`)
  }
}
