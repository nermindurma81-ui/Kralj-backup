import { config } from './config.js'

export async function callAI(prompt, options = {}) {
  const { temperature = 0.7, maxTokens = 2000, retries = 3 } = options

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(`${config.groq.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.groq.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.groq.model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens
        })
      })

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '5')
        console.log(`Rate limited, waiting ${retryAfter}s...`)
        await sleep(retryAfter * 1000)
        continue
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error?.message || `AI error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (err) {
      if (attempt === retries - 1) throw err
      console.log(`AI attempt ${attempt + 1} failed: ${err.message}, retrying...`)
      await sleep(2000)
    }
  }
}

export function parseJSON(text) {
  try {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const match = clean.match(/\{[\s\S]*\}/) || clean.match(/\[[\s\S]*\]/)
    return JSON.parse(match ? match[0] : clean)
  } catch {
    return null
  }
}

export async function generateScript(topic, options = {}) {
  const { duration = 30, tone = 'conversational', platform = 'youtube' } = options
  const wordCount = Math.round(duration * 2.5)

  const prompt = `Create a ${duration}-second ${platform} short video script about: "${topic}"

Tone: ${tone}
Target: ~${wordCount} words

Return JSON:
{
  "title": "Video title (max 10 words)",
  "hook": "Opening hook (first 3 seconds)",
  "scenes": [
    {
      "sceneNumber": 1,
      "description": "What we see on screen",
      "dialogue": "Exact words spoken",
      "visualPrompt": "Detailed image generation prompt",
      "duration": 5,
      "timestamp": "0:00-0:05"
    }
  ],
  "callToAction": "End CTA"
}

Make it engaging and optimized for ${platform}. Return ONLY valid JSON.`

  const result = await callAI(prompt, { temperature: 0.8 })
  return parseJSON(result)
}

export async function generateCaptions(text, options = {}) {
  const { maxCharsPerLine = 42, style = 'modern' } = options

  const prompt = `Generate timed captions in ${style} style (max ${maxCharsPerLine} chars/line) for:

"${text}"

Return JSON:
{
  "segments": [{"index":1,"start":"00:00:00,000","end":"00:00:02,500","text":"..."}],
  "srt": "Full SRT format",
  "vtt": "Full WebVTT format",
  "totalWords": 100,
  "estimatedDuration": "0:30"
}

Speech rate: ~150 words/min. Return ONLY valid JSON.`

  const result = await callAI(prompt, { temperature: 0.3 })
  return parseJSON(result) || { segments: [], srt: '', vtt: '' }
}

export async function generateMetadata(script, platform = 'youtube') {
  const prompt = `Generate SEO metadata for this ${platform} video:

Title: ${script.title}
Description: ${script.hook}

Return JSON:
{
  "title": "SEO optimized title (max 100 chars)",
  "description": "Engaging description with hashtags (max 500 chars)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "hashtags": ["#tag1", "#tag2", "#tag3"]
}

Return ONLY valid JSON.`

  const result = await callAI(prompt, { temperature: 0.5 })
  return parseJSON(result) || { title: script.title, description: script.hook, tags: [], hashtags: [] }
}

export async function generateHooks(topic, platform = 'youtube', count = 5) {
  const prompt = `Generate ${count} viral hooks for a ${platform} video about: "${topic}"

Return JSON array:
[
  {"text": "Hook text", "score": 8, "type": "question|shocking|story"}
]

Return ONLY valid JSON array.`

  const result = await callAI(prompt, { temperature: 0.9 })
  return parseJSON(result) || []
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
