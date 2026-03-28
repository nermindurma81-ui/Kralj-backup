import { createClient } from '@supabase/supabase-js'

const supabase = process.env.SUPABASE_URL
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null

// Captions generation
async function generateCaptions({ text, style = 'modern', maxCharsPerLine = 42 }, apiKey, baseUrl, model) {
  const prompt = `Generate timed captions in ${style} style (max ${maxCharsPerLine} chars/line) for this transcript:

${text}

Return JSON: { "segments": [{"index":1,"start":"00:00:00,000","end":"00:00:02,500","text":"..."}], "srt":"...", "vtt":"...", "totalWords":100, "estimatedDuration":"1:00" }
Estimate timing at ~150 words/min. Return ONLY valid JSON.`

  const result = await callAI(prompt, apiKey, baseUrl, model)
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    return JSON.parse(jsonMatch ? jsonMatch[0] : result)
  } catch {
    const words = text.split(/\s+/)
    const segs = []
    for (let i = 0; i < words.length; i += 6) {
      segs.push({ index: segs.length + 1, start: fmtTime(segs.length * 3), end: fmtTime(segs.length * 3 + 3), text: words.slice(i, i + 6).join(' ') })
    }
    return { segments: segs, srt: segs.map(s => `${s.index}\n${s.start} --> ${s.end}\n${s.text}\n`).join('\n'), totalWords: words.length, estimatedDuration: fmtTime(segs.length * 3) }
  }
}

// Thumbnail generation
async function generateThumbnail({ prompt, style = 'vibrant', size = '1280x720' }) {
  const [w, h] = size.split('x').map(Number)
  const prefixes = { vibrant: 'Vibrant bold colors', minimal: 'Clean minimal design', dramatic: 'Dramatic lighting', playful: 'Fun colorful', professional: 'Professional polished', dark: 'Dark moody' }
  const full = `${prefixes[style] || prefixes.vibrant}. ${prompt}. YouTube thumbnail, high quality, professional, 4K, ultra detailed`

  if (process.env.OPENAI_API_KEY) {
    try {
      // Use highest resolution available for DALL-E 3
      let imageSize = '1024x1024'
      if (w >= 1080 && h >= 1920) imageSize = '1024x1792'
      else if (w >= 1920 && h >= 1080) imageSize = '1792x1024'
      else if (w >= 1080 && h >= 1080) imageSize = '1024x1024'

      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'dall-e-3', prompt: full, n: 1, size: imageSize, quality: 'hd' })
      })
      if (res.ok) { const d = await res.json(); return { imageUrl: d.data[0].url, provider: 'dall-e' } }
    } catch {}
  }
  return { imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=${w || 1280}&height=${h || 720}&nologo=true&seed=${Date.now()}`, provider: 'pollinations' }
}

// Viral score
async function viralScore({ content, platform = 'youtube', contentType = 'title' }, apiKey, baseUrl, model) {
  const prompt = `Analyze this ${contentType} for ${platform} viral potential: "${content}"
Return JSON: { "overallScore":7.5, "breakdown":{"hookStrength":8,"emotionalImpact":7,"curiosityGap":9,"clarity":8,"shareability":6,"platformFit":7,"trendAlignment":5}, "strengths":["..."], "improvements":["..."], "optimized":"...", "verdict":"..." }
Return ONLY valid JSON.`
  const result = await callAI(prompt, apiKey, baseUrl, model)
  try { const m = result.match(/\{[\s\S]*\}/); return JSON.parse(m ? m[0] : result) }
  catch { return { overallScore: 5, breakdown: {}, strengths: [], improvements: [], optimized: content, verdict: 'Parse error' } }
}

// Trend discovery
async function discoverTrends({ niche, source = 'all' }, apiKey, baseUrl, model) {
  let redditTrends = []
  try {
    const r = await fetch(`https://www.reddit.com/r/all/search.json?q=${encodeURIComponent(niche)}&sort=hot&limit=8&t=week`, { headers: { 'User-Agent': 'ShortAI/1.0' } })
    if (r.ok) { const d = await r.json(); redditTrends = (d.data?.children || []).map(p => ({ title: p.data.title, source: 'reddit', url: `https://reddit.com${p.data.permalink}`, engagement: `${p.data.score} upvotes`, heat: Math.min(10, Math.round(Math.log10(p.data.score + 1) * 2.5)) })) }
  } catch {}

  if (apiKey) {
    try {
      const prompt = `Analyze trends for "${niche}" on ${source}. Return JSON: { "analysis":{ "summary":"...", "opportunities":["..."], "emergingTopics":["..."] }, "trends":[{ "title":"...", "description":"...", "source":"...", "heat":8, "engagement":"...", "growth":"..." }] }`
      const result = await callAI(prompt, apiKey, baseUrl, model)
      const m = result.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(m ? m[0] : result)
      if (parsed.trends) redditTrends = [...redditTrends, ...parsed.trends]
      return { trends: redditTrends, analysis: parsed.analysis, source, niche }
    } catch {}
  }
  return { trends: redditTrends, analysis: null, source, niche }
}

async function callAI(prompt, apiKey, baseUrl, model) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model || 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 2000 })
  })
  if (!res.ok) throw new Error('AI call failed')
  const data = await res.json()
  return data.choices[0].message.content
}

function fmtTime(sec) { const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = Math.floor(sec%60), ms = Math.floor((sec%1)*1000); return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}` }

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', ['POST']); return res.status(405).json({ message: 'Method not allowed' }) }

  const { type, ...params } = req.body

  try {
    let apiKey = process.env.GROQ_API_KEY
    let baseUrl = 'https://api.groq.com/openai/v1'
    let model = 'llama-3.3-70b-versatile'

    if (params.providerId && supabase) {
      const { data: p } = await supabase.from('api_providers').select('*').eq('id', params.providerId).single()
      if (p) { apiKey = p.api_key; baseUrl = p.base_url; model = p.model }
    }

    let result
    switch (type) {
      case 'hashtags': {
        // Generate optimal hashtags for a video topic
        const prompt = `Generate 15-20 optimal hashtags for a ${params.platform || 'youtube'} video about: "${params.topic}"
Return JSON array of strings like ["#hashtag1", "#hashtag2"]
Mix popular and niche hashtags. Return ONLY valid JSON array.`
        const hashResult = await callAI(prompt, apiKey, baseUrl, model)
        const hashMatch = hashResult.match(/\[[\s\S]*\]/)
        result = hashMatch ? JSON.parse(hashMatch[0]) : []
        break
      }
      case 'captions': result = await generateCaptions(params, apiKey, baseUrl, model); break
      case 'thumbnail': result = await generateThumbnail(params); break
      case 'viral-score': result = await viralScore(params, apiKey, baseUrl, model); break
      case 'trends': result = await discoverTrends(params, apiKey, baseUrl, model); break
      default: return res.status(400).json({ message: 'Unknown type. Use: captions, thumbnail, viral-score, trends, hashtags' })
    }
    return res.status(200).json(result)
  } catch (err) {
    console.error('Content API error:', err)
    return res.status(500).json({ message: err.message })
  }
}
