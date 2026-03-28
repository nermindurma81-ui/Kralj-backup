import cron from 'node-cron'
import { processBatch } from './pipeline.js'
import { callAI, parseJSON } from './ai.js'
import { config } from './config.js'
import { mkdir, writeFile, readFile } from 'fs/promises'
import { join } from 'path'

const STATE_FILE = join(config.pipeline.outputDir, 'scheduler-state.json')

// Load scheduler state
async function loadState() {
  try {
    const data = await readFile(STATE_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return { totalProduced: 0, lastRun: null, errors: [] }
  }
}

// Save scheduler state
async function saveState(state) {
  await mkdir(config.pipeline.outputDir, { recursive: true })
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2))
}

// Generate daily batch of topics
async function generateDailyTopics(count = 33) {
  console.log(`📝 Generating ${count} topics for today...`)

  const niches = [
    'AI and technology tips',
    'personal finance and money',
    'fitness and health hacks',
    'cooking quick recipes',
    'productivity tips',
    'psychology facts',
    'history mysteries',
    'science experiments',
    'life hacks',
    'motivation and success'
  ]

  const niche = niches[Math.floor(Math.random() * niches.length)]

  const prompt = `Generate ${count} unique, engaging short video topic ideas for the niche: "${niche}"

Requirements:
- Each topic should be suitable for a 30-60 second video
- Topics should be diverse within the niche
- Include a mix of educational, entertaining, and surprising angles
- Make them viral-worthy and scroll-stopping

Return as JSON array of strings. Example: ["Topic 1", "Topic 2", ...]
Return ONLY valid JSON array.`

  const result = await callAI(prompt, { temperature: 0.9, maxTokens: 3000 })
  const topics = parseJSON(result)

  if (Array.isArray(topics) && topics.length > 0) {
    return topics.slice(0, count)
  }

  // Fallback
  return Array(count).fill(null).map((_, i) => `${niche} - Tip #${i + 1}`)
}

// Daily batch job
async function runDailyBatch() {
  console.log(`\n${'='.repeat(50)}`)
  console.log(`🕐 Daily batch started: ${new Date().toISOString()}`)
  console.log(`${'='.repeat(50)}\n`)

  const state = await loadState()
  const targetDaily = Math.ceil((1000 - state.totalProduced) / 30) || 33

  try {
    const topics = await generateDailyTopics(targetDaily)
    const results = await processBatch(topics, {
      platform: 'youtube',
      duration: 30
    })

    const done = results.filter(r => r.status === 'done').length
    const errors = results.filter(r => r.status === 'error').length

    state.totalProduced += done
    state.lastRun = new Date().toISOString()
    if (errors > 0) {
      state.errors.push({
        date: state.lastRun,
        count: errors,
        details: results.filter(r => r.status === 'error').map(r => r.error)
      })
    }

    await saveState(state)

    console.log(`\n📊 Daily batch complete:`)
    console.log(`   ✅ Produced: ${done}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log(`   📈 Total produced: ${state.totalProduced}/1000`)
    console.log(`   🎯 Remaining: ${1000 - state.totalProduced}`)

  } catch (err) {
    console.error('❌ Daily batch failed:', err.message)
  }
}

// Schedule daily runs
// Run at 6:00 AM UTC every day
cron.schedule('0 6 * * *', () => {
  runDailyBatch().catch(console.error)
})

console.log('📅 Scheduler started!')
console.log('   Daily run: 6:00 AM UTC')
console.log('   Target: 1000 videos/month')
console.log('\nPress Ctrl+C to stop.')

// Also run immediately for testing
if (process.argv.includes('--run-now')) {
  runDailyBatch().catch(console.error)
}
