import 'dotenv/config'

export const config = {
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile'
  },
  pexels: {
    apiKey: process.env.PEXELS_API_KEY
  },
  huggingface: {
    token: process.env.HF_API_TOKEN
  },
  pipeline: {
    outputDir: process.env.OUTPUT_DIR || './output',
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT || '5'),
    retryAttempts: 3,
    retryDelay: 2000,
    defaultDuration: 30,
    defaultPlatform: 'youtube',
    defaultResolution: '1080x1920',
    defaultFps: 30
  }
}

// Validate required config
if (!config.groq.apiKey) {
  console.error('ERROR: GROQ_API_KEY is required')
  process.exit(1)
}
