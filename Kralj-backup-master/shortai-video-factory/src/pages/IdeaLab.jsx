import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lightbulb, Sparkles, Loader2, Copy, Check, RefreshCw, Send, CheckSquare, Square } from 'lucide-react'
import toast from 'react-hot-toast'
import { sendChatRequest } from '../lib/api'
import { useApiStore } from '../store/apiStore'

export default function IdeaLab() {
  const [niche, setNiche] = useState('')
  const [audience, setAudience] = useState('')
  const [style, setStyle] = useState('educational')
  const [count, setCount] = useState(5)
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const { getActiveProvider } = useApiStore()
  const navigate = useNavigate()

  const generateIdeas = async () => {
    if (!niche.trim()) {
      toast.error('Enter a niche or topic')
      return
    }

    const provider = getActiveProvider()
    if (!provider) {
      toast.error('Configure an AI provider first')
      return
    }

    setLoading(true)
    setSelected(new Set())
    try {
      const prompt = `Generate ${count} viral short-form video ideas for the niche: "${niche}".
${audience ? `Target audience: ${audience}` : ''}
Style: ${style}

For each idea, provide:
1. A compelling title (max 10 words)
2. A hook (first 3 seconds concept)
3. Brief description (2-3 sentences)
4. Estimated viral potential (1-10)

Format as JSON array with keys: title, hook, description, viralPotential`

      const result = await sendChatRequest(provider.id, [
        { role: 'user', content: prompt }
      ], { temperature: 0.9, maxTokens: 2000 })

      let parsed
      try {
        let clean = result.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const jsonMatch = clean.match(/\[[\s\S]*\]/) || clean.match(/\{[\s\S]*\}/)
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean)
      } catch {
        parsed = [{ title: niche, hook: result.content.split('\n')[0], description: result.content, viralPotential: 5 }]
      }
      setIdeas(Array.isArray(parsed) ? parsed : [parsed])
      toast.success(`Generated ${parsed.length || count} ideas`)
    } catch (err) {
      toast.error(`Generation failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const copyIdea = (idea, index) => {
    const text = `Title: ${idea.title}\nHook: ${idea.hook}\nDescription: ${idea.description}\nViral Potential: ${idea.viralPotential}/10`
    navigator.clipboard.writeText(text)
    setCopied(index)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(null), 2000)
  }

  const toggleSelect = (index) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === ideas.length) setSelected(new Set())
    else setSelected(new Set(ideas.map((_, i) => i)))
  }

  const sendToScriptLab = () => {
    if (selected.size === 0) {
      toast.error('Select at least one idea')
      return
    }
    const selectedIdeas = ideas.filter((_, i) => selected.has(i))
    // Store in sessionStorage for Script Lab to pick up
    sessionStorage.setItem('pipeline-ideas', JSON.stringify(selectedIdeas))
    toast.success(`${selected.size} ideas sent to Script Lab!`)
    navigate('/script-lab')
  }

  const sendToPipeline = () => {
    if (selected.size === 0) {
      toast.error('Select at least one idea')
      return
    }
    const selectedIdeas = ideas.filter((_, i) => selected.has(i))
    sessionStorage.setItem('pipeline-topics', JSON.stringify(selectedIdeas.map(i => i.title)))
    toast.success(`${selected.size} ideas sent to Pipeline!`)
    navigate('/pipeline')
  }

  const styles = [
    { value: 'educational', label: 'Educational' },
    { value: 'entertaining', label: 'Entertaining' },
    { value: 'storytelling', label: 'Storytelling' },
    { value: 'controversial', label: 'Controversial' },
    { value: 'tutorial', label: 'Tutorial' },
    { value: 'listicle', label: 'Listicle' }
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Lightbulb className="w-8 h-8 text-yellow-400" /> Idea Lab
        </h1>
        <p className="page-subtitle">Generate viral video ideas with AI — select & send to production</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input panel */}
        <div className="lg:col-span-1">
          <div className="card space-y-4 sticky top-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Niche / Topic *</label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="input-field"
                placeholder="e.g., Personal finance, Cooking hacks"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Target Audience</label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="input-field"
                placeholder="e.g., Gen Z, millennials"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Content Style</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="input-field">
                {styles.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Number of Ideas</label>
              <input
                type="number"
                min="1"
                max="20"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 5)}
                className="input-field"
              />
            </div>

            <button
              onClick={generateIdeas}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Ideas
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {ideas.length === 0 ? (
            <div className="card text-center py-16">
              <Lightbulb className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Enter a niche and generate ideas</p>
              <p className="text-gray-500 text-sm mt-1">AI will create viral video concepts for you</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <button onClick={selectAll} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                    {selected.size === ideas.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    {selected.size}/{ideas.length} selected
                  </button>
                  <button onClick={generateIdeas} className="btn-secondary text-sm flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                  </button>
                </div>

                {selected.size > 0 && (
                  <div className="flex items-center gap-2">
                    <button onClick={sendToScriptLab} className="btn-primary text-sm flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" /> Script Lab
                    </button>
                    <button onClick={sendToPipeline} className="btn-secondary text-sm flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" /> Pipeline
                    </button>
                  </div>
                )}
              </div>

              {ideas.map((idea, index) => (
                <div
                  key={index}
                  className={`card hover:border-gray-600 transition-colors cursor-pointer ${
                    selected.has(index) ? 'border-primary-500 bg-primary-900/10' : ''
                  }`}
                  onClick={() => toggleSelect(index)}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-1" onClick={(e) => { e.stopPropagation(); toggleSelect(index) }}>
                      {selected.has(index)
                        ? <CheckSquare className="w-5 h-5 text-primary-400" />
                        : <Square className="w-5 h-5 text-gray-500" />
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400">
                          #{index + 1}
                        </span>
                        {idea.viralPotential && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            idea.viralPotential >= 7 ? 'bg-green-500/20 text-green-400' :
                            idea.viralPotential >= 4 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            🔥 {idea.viralPotential}/10
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{idea.title}</h3>
                      <p className="text-sm text-primary-400 mb-2">🎣 {idea.hook}</p>
                      <p className="text-sm text-gray-400">{idea.description}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyIdea(idea, index) }}
                      className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white"
                    >
                      {copied === index ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
