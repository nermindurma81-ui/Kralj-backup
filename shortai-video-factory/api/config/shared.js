// Shared configuration for ShortAI + AI Video Pipeline integration
// Vercel-compatible - runtime only (no build-time env access)

// Lazy getter for config (only called at runtime in API routes)
export function getConfig() {
  return {
    groq: {
      baseUrl: process.env.GROQ_API_URL ?? 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY ?? '',
      model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
      maxRetries: 3,
      retryDelay: 2000
    },
    pipeline: {
      outputDir: process.env.VIDEO_OUTPUT_DIR ?? './videos',
      maxConcurrent: parseInt(process.env.MAX_CONCURRENT ?? '5'),
      defaultDuration: parseInt(process.env.DEFAULT_DURATION ?? '30'),
      defaultPlatform: process.env.DEFAULT_PLATFORM ?? 'youtube',
      defaultFps: parseInt(process.env.DEFAULT_FPS ?? '24'),
      defaultResolution: process.env.DEFAULT_RESOLUTION ?? '1080x1920',
      enableCache: (process.env.ENABLE_CACHE ?? 'true') !== 'false',
      maxRetries: parseInt(process.env.MAX_RETRIES ?? '3')
    },
    pexels: {
      apiKey: process.env.PEXELS_API_KEY ?? '',
      baseUrl: 'https://api.pexels.com/v1'
    },
    pollinations: {
      baseUrl: 'https://image.pollinations.ai/prompt',
      width: 1080,
      height: 1920,
      model: 'flux'
    },
    huggingface: {
      apiToken: process.env.HF_API_TOKEN ?? '',
      baseUrl: 'https://api-inference.huggingface.co/models',
      model: 'onnx-community/Kokoro-82M-v1.0-ONNX'
    },
    platforms: {
      youtube: { aspectRatio: '9:16', resolution: '1080x1920', maxDuration: 60, idealDuration: 30 },
      tiktok: { aspectRatio: '9:16', resolution: '1080x1920', maxDuration: 60, idealDuration: 15 },
      instagram: { aspectRatio: '9:16', resolution: '1080x1920', maxDuration: 90, idealDuration: 30 },
      twitter: { aspectRatio: '16:9', resolution: '1920x1080', maxDuration: 140, idealDuration: 30 }
    },
    metrics: {
      enabled: (process.env.ENABLE_METRICS ?? 'true') !== 'false',
      endpoint: '/api/metrics'
    }
  };
}

export function getPlatformSettings(platform) {
  const config = getConfig();
  return config.platforms[platform] || config.platforms.youtube;
}

export function validateConfig() {
  const config = getConfig();
  const errors = [];
  if (!config.groq.apiKey) {
    errors.push('GROQ_API_KEY is required');
  }
  return { valid: errors.length === 0, errors };
}

export default getConfig;
