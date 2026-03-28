import { createClient } from '@supabase/supabase-js'

const supabase = process.env.SUPABASE_URL
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { topic, duration = 60, tone = 'conversational', platform = 'youtube', language = 'English', providerId } = req.body

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' })
    }

    let apiKey = process.env.GROQ_API_KEY
    let baseUrl = 'https://api.groq.com/openai/v1'
    let model = 'llama-3.3-70b-versatile'

    if (providerId && supabase) {
      const { data: provider } = await supabase.from('api_providers').select('*').eq('id', providerId).single()
      if (provider) {
        apiKey = provider.api_key
        baseUrl = provider.base_url
        model = provider.model
      }
    }

    if (!apiKey) {
      return res.status(400).json({ message: 'No AI provider configured. Add GROQ_API_KEY to environment.' })
    }

    const wordCount = Math.round(duration * 2.5)
    const platformContext = {
      youtube: 'YouTube Shorts vertical video, 9:16 aspect ratio',
      tiktok: 'TikTok vertical video with trending sounds',
      instagram: 'Instagram Reels with engaging visuals',
      twitter: 'Twitter/X short video clip'
    }

    const prompt = `Create a ${duration}-second ${platformContext[platform] || 'short-form video'} script about: "${topic}"

Tone: ${tone}
Target word count: ~${wordCount} words${language !== 'English' ? `\nWrite the script in ${language}. All dialogue and text must be in ${language}.` : ''}

Return a JSON object with:
{
  "title": "Video title (max 10 words)",
  "hook": "Opening hook that grabs attention in first 3 seconds",
  "scenes": [
    {
      "description": "What we see on screen",
      "dialogue": "Exact words spoken",
      "visualNote": "Camera/visual direction",
      "timestamp": "0:00-0:05"
    }
  ],
  "callToAction": "End with this CTA"
}

Make it engaging, conversational, and optimized for ${platform}. Return ONLY valid JSON.`

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || 'AI generation failed')
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    let parsed
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch {
      parsed = {
        title: topic.slice(0, 50),
        hook: content.split('\n')[0],
        scenes: [{ description: 'Main content', dialogue: content, visualNote: 'Standard framing', timestamp: `0:00-${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}` }],
        callToAction: 'Follow for more!'
      }
    }

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('Script generation error:', err)
    return res.status(500).json({ message: err.message || 'Script generation failed' })
  }
}
