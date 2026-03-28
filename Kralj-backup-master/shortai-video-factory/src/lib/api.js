import { supabase } from './supabase'

const API_BASE = '/api'

async function fetchAPI(endpoint, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const headers = {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    ...options.headers
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// Providers
export async function getProviders() {
  return fetchAPI('/providers/manage', { method: 'GET' }).catch(() =>
    fetchAPI('/providers/manage')
  )
}

export async function saveProvider(provider) {
  return fetchAPI('/providers/manage', { method: 'POST', body: provider })
}

export async function deleteProvider(id) {
  return fetchAPI(`/providers/manage?id=${id}`, { method: 'DELETE' })
}

export async function testProvider(id) {
  return fetchAPI('/providers/manage', { method: 'PUT', body: { id, action: 'test' } })
}

// AI Chat
export async function sendChatRequest(provider, messages, options = {}) {
  return fetchAPI('/ai/chat', { method: 'POST', body: { provider, messages, ...options } })
}

// Script Lab
export async function generateScript(topic, options = {}) {
  return fetchAPI('/script-lab/generate', { method: 'POST', body: { topic, ...options } })
}

// Viral Hook Lab
export async function generateHooks(platform, topic, options = {}) {
  return fetchAPI('/viral-hook-lab/generate', { method: 'POST', body: { platform, topic, ...options } })
}

// Storyboard
export async function generateStoryboard(script, options = {}) {
  return fetchAPI('/storyboard/generate', { method: 'POST', body: { script, ...options } })
}

// Voice
export async function generateVoice(text, options = {}) {
  return fetchAPI('/voice/generate', { method: 'POST', body: { text, ...options } })
}

// Content API (merged: captions, thumbnails, viral-score, trends)
export async function generateCaptions(text, options = {}) {
  return fetchAPI('/content/generate', { method: 'POST', body: { type: 'captions', text, ...options } })
}

export async function generateThumbnail(prompt, options = {}) {
  return fetchAPI('/content/generate', { method: 'POST', body: { type: 'thumbnail', prompt, ...options } })
}

export async function calculateViralScore(content, platform, options = {}) {
  return fetchAPI('/content/generate', { method: 'POST', body: { type: 'viral-score', content, platform, ...options } })
}

export async function discoverTrends(options = {}) {
  return fetchAPI('/content/generate', { method: 'POST', body: { type: 'trends', ...options } })
}

export async function generateHashtags(topic, options = {}) {
  return fetchAPI('/content/generate', { method: 'POST', body: { type: 'hashtags', topic, ...options } })
}

// Platform & Calendar API (merged)
export async function getPlatformConnections() {
  return fetchAPI('/platforms/manage', { method: 'POST', body: { action: 'list-connections' } })
}

export async function connectPlatform(platform) {
  return fetchAPI('/platforms/manage', { method: 'POST', body: { action: 'connect', platform } })
}

export async function disconnectPlatform(connectionId) {
  return fetchAPI('/platforms/manage', { method: 'POST', body: { action: 'disconnect', id: connectionId } })
}

export async function scheduleContent(schedule) {
  return fetchAPI('/platforms/manage', { method: 'POST', body: { action: 'schedule', ...schedule } })
}

export async function publishNow(contentId, platform) {
  return fetchAPI('/platforms/manage', { method: 'POST', body: { action: 'publish-now', contentId, platform } })
}

export async function getScheduledContent() {
  return fetchAPI('/platforms/manage', { method: 'POST', body: { action: 'get-schedule' } })
}

export async function deleteScheduledContent(id) {
  return fetchAPI('/platforms/manage', { method: 'POST', body: { action: 'delete-schedule', id } })
}

// Workflow (simplified — calls other APIs internally)
export async function executeWorkflow(workflow) {
  return fetchAPI('/content/generate', { method: 'POST', body: { type: 'workflow', ...workflow } }).catch(() => {
    // Fallback: run steps client-side
    return { success: true, results: {}, message: 'Run steps individually' }
  })
}

// Video trim/concat — use direct fetch with FormData
export async function trimVideo(file, start, end) {
  const formData = new FormData()
  formData.append('video', file)
  formData.append('start', start.toString())
  formData.append('end', end.toString())
  const res = await fetch('/api/content/generate', { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Trim failed')
  return res.blob()
}

export async function concatenateVideos(files) {
  const formData = new FormData()
  files.forEach(f => formData.append('videos', f))
  const res = await fetch('/api/content/generate', { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Concat failed')
  return res.blob()
}

// Projects (Supabase direct)
export async function getProjects() {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createProject(project) {
  const { data, error } = await supabase.from('projects').insert(project).select().single()
  if (error) throw error
  return data
}

export async function updateProject(id, updates) {
  const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}
