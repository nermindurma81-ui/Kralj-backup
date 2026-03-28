import { generateScript, generateCaptions, generateMetadata } from './ai.js'

async function test() {
  console.log('🧪 Testing pipeline components...\n')

  // Test 1: Script generation
  console.log('1. Testing script generation...')
  try {
    const script = await generateScript('How to make coffee', { duration: 15 })
    console.log(`   ✅ Script: "${script?.title}"`)
    console.log(`   Scenes: ${script?.scenes?.length || 0}`)
  } catch (err) {
    console.log(`   ❌ Failed: ${err.message}`)
  }

  // Test 2: Caption generation
  console.log('\n2. Testing caption generation...')
  try {
    const captions = await generateCaptions('Hello world. This is a test. Welcome to my channel.')
    console.log(`   ✅ Captions: ${captions?.segments?.length || 0} segments`)
  } catch (err) {
    console.log(`   ❌ Failed: ${err.message}`)
  }

  // Test 3: Metadata generation
  console.log('\n3. Testing metadata generation...')
  try {
    const meta = await generateMetadata({ title: 'Coffee Tutorial', hook: 'Learn to make perfect coffee' })
    console.log(`   ✅ Title: "${meta?.title}"`)
    console.log(`   Tags: ${meta?.tags?.length || 0}`)
  } catch (err) {
    console.log(`   ❌ Failed: ${err.message}`)
  }

  console.log('\n✅ All tests complete!')
}

test().catch(console.error)
