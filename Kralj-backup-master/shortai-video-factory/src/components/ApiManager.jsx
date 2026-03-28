import { useState } from 'react'
import { X, Plus, Trash2, Check, Eye, EyeOff, Loader2, Key, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApiStore } from '../store/apiStore'

const PROVIDER_CONFIGS = {
  groq: { name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen/qwen3-32b'], free: true },
  openai: { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  anthropic: { name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', models: ['claude-sonnet-4-20250514', 'claude-3-haiku-20240307'] },
  cohere: { name: 'Cohere', baseUrl: 'https://api.cohere.ai/v1', models: ['command-r-plus', 'command-r'] },
  custom: { name: 'Custom OpenAI-compatible', baseUrl: '', models: [] }
}

export default function ApiManager({ isOpen, onClose }) {
  const { providers, addProvider, removeProvider, setActiveProvider } = useApiStore()
  const [showForm, setShowForm] = useState(false)
  const [showKey, setShowKey] = useState({})
  const [testing, setTesting] = useState({})
  const [form, setForm] = useState({
    provider: 'groq',
    apiKey: '',
    baseUrl: PROVIDER_CONFIGS.groq.baseUrl,
    model: PROVIDER_CONFIGS.groq.models[0],
    enabled: true
  })

  const handleAdd = async () => {
    if (!form.apiKey.trim()) {
      toast.error('Unesi API key')
      return
    }

    const config = PROVIDER_CONFIGS[form.provider]
    const providerData = {
      id: crypto.randomUUID(),
      provider: form.provider,
      name: config.name,
      apiKey: form.apiKey,
      baseUrl: form.baseUrl || config.baseUrl,
      model: form.model || config.models[0] || '',
      enabled: form.enabled,
      createdAt: new Date().toISOString()
    }

    // Add to local store immediately
    addProvider(providerData)
    if (form.enabled) setActiveProvider(providerData)

    // Try to save to backend (non-blocking)
    try {
      const { saveProvider } = await import('../lib/api')
      await saveProvider(providerData)
    } catch {}

    toast.success(`${config.name} dodan!`)
    setForm({ provider: 'groq', apiKey: '', baseUrl: PROVIDER_CONFIGS.groq.baseUrl, model: PROVIDER_CONFIGS.groq.models[0], enabled: true })
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    removeProvider(id)
    try {
      const { deleteProvider } = await import('../lib/api')
      await deleteProvider(id)
    } catch {}
    toast.success('Uklonjen')
  }

  const handleTest = async (provider) => {
    setTesting(prev => ({ ...prev, [provider.id]: true }))
    try {
      const res = await fetch(`${provider.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${provider.apiKey}` }
      })
      if (res.ok) {
        toast.success('Veza uspješna!')
      } else {
        toast.error(`Greška: ${res.status}`)
      }
    } catch (err) {
      toast.error(`Veza neuspješna: ${err.message}`)
    } finally {
      setTesting(prev => ({ ...prev, [provider.id]: false }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[85vh] overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Key className="w-5 h-5 text-yellow-400" /> API Ključevi
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-700 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[65vh]">
          {/* Existing providers */}
          <div className="space-y-3 mb-6">
            {providers.length === 0 && (
              <div className="text-center py-8">
                <Key className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Nema konfigurisanih providera</p>
                <p className="text-gray-500 text-sm">Dodaj API key ispod</p>
              </div>
            )}
            {providers.map((p) => (
              <div key={p.id} className="card flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{p.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}`}>
                      {p.enabled ? 'Aktivan' : 'Isključen'}
                    </span>
                    <span className="text-xs text-gray-500">{p.model}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-400 font-mono">
                      {showKey[p.id] ? p.apiKey : '••••••••' + (p.apiKey?.slice(-4) || '')}
                    </span>
                    <button onClick={() => setShowKey(prev => ({ ...prev, [p.id]: !prev[p.id] }))} className="text-gray-500 hover:text-gray-300">
                      {showKey[p.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleTest(p)} disabled={testing[p.id]} className="btn-secondary text-sm px-3 py-1.5">
                    {testing[p.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick setup */}
          {!showForm && (
            <div className="space-y-3">
              <button onClick={() => setShowForm(true)} className="btn-primary w-full flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Dodaj API Key
              </button>
              <div className="grid grid-cols-2 gap-2">
                <a href="https://console.groq.com" target="_blank" rel="noopener" className="btn-secondary text-sm text-center flex items-center justify-center gap-2">
                  <Zap className="w-3 h-3" /> Groq (Besplatno)
                </a>
                <a href="https://platform.openai.com" target="_blank" rel="noopener" className="btn-secondary text-sm text-center">
                  OpenAI
                </a>
                <a href="https://console.anthropic.com" target="_blank" rel="noopener" className="btn-secondary text-sm text-center">
                  Anthropic
                </a>
                <a href="https://dashboard.cohere.com" target="_blank" rel="noopener" className="btn-secondary text-sm text-center">
                  Cohere
                </a>
              </div>
            </div>
          )}

          {/* Add form */}
          {showForm && (
            <div className="card space-y-4">
              <h3 className="font-semibold">Dodaj Provider</h3>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Provider</label>
                <select
                  value={form.provider}
                  onChange={(e) => {
                    const config = PROVIDER_CONFIGS[e.target.value]
                    setForm(f => ({ ...f, provider: e.target.value, baseUrl: config.baseUrl, model: config.models[0] || '' }))
                  }}
                  className="input-field"
                >
                  {Object.entries(PROVIDER_CONFIGS).map(([key, config]) => (
                    <option key={key} value={key}>{config.name} {config.free ? '(Besplatno)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">API Key</label>
                <input
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => setForm(f => ({ ...f, apiKey: e.target.value }))}
                  className="input-field"
                  placeholder={form.provider === 'groq' ? 'gsk_...' : form.provider === 'openai' ? 'sk-...' : 'API key...'}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Base URL</label>
                <input
                  type="text"
                  value={form.baseUrl}
                  onChange={(e) => setForm(f => ({ ...f, baseUrl: e.target.value }))}
                  className="input-field"
                />
              </div>

              {PROVIDER_CONFIGS[form.provider].models.length > 0 && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Model</label>
                  <select
                    value={form.model}
                    onChange={(e) => setForm(f => ({ ...f, model: e.target.value }))}
                    className="input-field"
                  >
                    {PROVIDER_CONFIGS[form.provider].models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={handleAdd} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Dodaj
                </button>
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Otkaži</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
