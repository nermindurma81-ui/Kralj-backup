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
    const { platform, topic, hookType = 'question', count = 10, providerId } = req.body

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

    const platformLimits = { youtube: 100, tiktok: 150, instagram: 125, twitter: 280 }
    const maxLen = platformLimits[platform] || 100

    const hookTypePrompts = {
      question: 'Start with a provocative question that makes viewers stop scrolling',
      shocking: 'Lead with a shocking or surprising statement/statistic',
      story: 'Begin with a compelling story teaser ("I was... until...")',
      challenge: 'Issue a challenge to the viewer ("I bet you can\'t...")',
      list: 'Use a list format teaser ("3 things nobody tells you about...")',
      controversy: 'Make a controversial or unpopular opinion statement'
    }

    const prompt = `Generate ${count} viral hooks for a ${platform} video about: "${topic}"

Hook style: ${hookTypePrompts[hookType] || hookTypePrompts.question}
Maximum ${maxLen} characters per hook.

Return a JSON object:
{
  "hooks": [
    {
      "text": "The hook text",
      "score": 8,
      "why": "Why this hook works"
    }
  ]
}

Make each hook unique, punchy, and scroll-stopping. Return ONLY valid JSON.`

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || 'Hook generation failed')
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    let parsed
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch {
      parsed = { hooks: [{ text: content.slice(0, maxLen), score: 5, why: 'AI generated' }] }
    }

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('Hook generation error:', err)
    return res.status(500).json({ message: err.message || 'Hook generation failed' })
  }
}
