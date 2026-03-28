import { createClient } from '@supabase/supabase-js'

const supabase = process.env.SUPABASE_URL
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null

async function callGroq(apiKey, model, messages, options) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model || 'llama-3.3-70b-versatile', messages, temperature: options.temperature || 0.7, max_tokens: options.maxTokens || 2048 })
  })
  if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.error?.message || `Groq error: ${response.status}`) }
  const data = await response.json()
  return { content: data.choices[0].message.content, model: data.model, usage: data.usage }
}

async function callOpenAI(apiKey, model, messages, options) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model || 'gpt-4o-mini', messages, temperature: options.temperature || 0.7, max_tokens: options.maxTokens || 2048 })
  })
  if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.error?.message || `OpenAI error: ${response.status}`) }
  const data = await response.json()
  return { content: data.choices[0].message.content, model: data.model, usage: data.usage }
}

async function callAnthropic(apiKey, model, messages, options) {
  const systemMsg = messages.find(m => m.role === 'system')
  const chatMessages = messages.filter(m => m.role !== 'system')
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model || 'claude-sonnet-4-20250514', max_tokens: options.maxTokens || 2048, temperature: options.temperature || 0.7, system: systemMsg?.content, messages: chatMessages })
  })
  if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.error?.message || `Anthropic error: ${response.status}`) }
  const data = await response.json()
  return { content: data.content[0].text, model: data.model, usage: { prompt_tokens: data.usage.input_tokens, completion_tokens: data.usage.output_tokens } }
}

const PROVIDER_CALLS = { groq: callGroq, openai: callOpenAI, anthropic: callAnthropic }

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', ['POST']); return res.status(405).json({ message: 'Method not allowed' }) }

  try {
    const { provider: providerId, messages, temperature, maxTokens } = req.body
    if (!providerId || !messages?.length) return res.status(400).json({ message: 'Provider ID and messages required' })

    let apiKey, model, providerType, baseUrl

    // Try Supabase first
    if (supabase && providerId !== 'auto-groq') {
      const { data: provider } = await supabase.from('api_providers').select('*').eq('id', providerId).single()
      if (provider) {
        apiKey = provider.api_key
        model = provider.model
        providerType = provider.provider
        baseUrl = provider.base_url
      }
    }

    // Fallback to env vars
    if (!apiKey) {
      if (providerId === 'auto-groq' || process.env.GROQ_API_KEY) {
        apiKey = process.env.GROQ_API_KEY
        model = 'llama-3.3-70b-versatile'
        providerType = 'groq'
      } else if (process.env.OPENAI_API_KEY) {
        apiKey = process.env.OPENAI_API_KEY
        model = 'gpt-4o-mini'
        providerType = 'openai'
      }
    }

    if (!apiKey) return res.status(400).json({ message: 'No API key configured' })

    const caller = PROVIDER_CALLS[providerType]
    if (!caller && baseUrl) {
      // Custom OpenAI-compatible endpoint
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, temperature: temperature || 0.7, max_tokens: maxTokens || 2048 })
      })
      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = await response.json()
      return res.status(200).json({ content: data.choices[0].message.content, model: data.model, usage: data.usage })
    }

    if (!caller) return res.status(400).json({ message: `Unsupported provider: ${providerType}` })

    const result = await caller(apiKey, model, messages, { temperature, maxTokens })
    return res.status(200).json(result)
  } catch (err) {
    console.error('AI chat error:', err)
    return res.status(500).json({ message: err.message || 'AI request failed' })
  }
}
