import { createClient } from '@supabase/supabase-js'

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null

// In-memory store for when Supabase is not configured
let memoryStore = []

export default async function handler(req, res) {
  const { method } = req

  try {
    switch (method) {
      case 'GET': {
        if (supabase) {
          const { data, error } = await supabase.from('api_providers').select('*').order('created_at', { ascending: false })
          if (error) throw error
          return res.status(200).json(data)
        }
        return res.status(200).json(memoryStore)
      }

      case 'POST': {
        const { provider, name, apiKey, baseUrl, model, enabled } = req.body
        if (!apiKey) return res.status(400).json({ message: 'API key is required' })

        const record = {
          id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
          provider,
          name,
          api_key: apiKey,
          base_url: baseUrl,
          model,
          enabled: enabled !== false,
          created_at: new Date().toISOString()
        }

        if (supabase) {
          const { data, error } = await supabase.from('api_providers').insert(record).select().single()
          if (error) throw error
          return res.status(201).json(data)
        }

        memoryStore.push(record)
        return res.status(201).json(record)
      }

      case 'PUT': {
        const { id, action, ...updates } = req.body

        if (action === 'test') {
          let provider = null
          if (supabase) {
            const { data } = await supabase.from('api_providers').select('*').eq('id', id).single()
            provider = data
          } else {
            provider = memoryStore.find(p => p.id === id)
          }

          if (!provider) return res.status(404).json({ message: 'Provider not found' })

          try {
            const url = `${provider.base_url}/models`
            const testRes = await fetch(url, {
              headers: { 'Authorization': `Bearer ${provider.api_key}`, 'Content-Type': 'application/json' }
            })
            if (!testRes.ok) {
              const errBody = await testRes.text().catch(() => '')
              return res.status(400).json({ message: `Connection failed (${testRes.status}): ${errBody.slice(0, 100)}`, success: false })
            }
            return res.status(200).json({ success: true, message: 'Connection successful' })
          } catch (testErr) {
            return res.status(400).json({ message: `Connection failed: ${testErr.message}`, success: false })
          }
        }

        if (supabase) {
          const { data, error } = await supabase.from('api_providers').update(updates).eq('id', id).select().single()
          if (error) throw error
          return res.status(200).json(data)
        }

        memoryStore = memoryStore.map(p => p.id === id ? { ...p, ...updates } : p)
        return res.status(200).json(memoryStore.find(p => p.id === id))
      }

      case 'DELETE': {
        const { id } = req.query
        if (!id) return res.status(400).json({ message: 'Provider ID required' })

        if (supabase) {
          await supabase.from('api_providers').delete().eq('id', id)
        } else {
          memoryStore = memoryStore.filter(p => p.id !== id)
        }
        return res.status(200).json({ message: 'Provider deleted' })
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        return res.status(405).json({ message: `Method ${method} not allowed` })
    }
  } catch (err) {
    console.error('Provider management error:', err)
    return res.status(500).json({ message: err.message || 'Internal server error' })
  }
}
