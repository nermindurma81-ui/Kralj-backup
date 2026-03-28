# ShortAI + AI Video Pipeline Integracija

**Datum:** 28.03.2026  
**Status:** Spremno za implementaciju  
**Skills korišteni:** api-designer, code-review-playbook, multi-agent-orchestration

---

## 📊 Trenutno Stanje

### ShortAI Video Factory (Vercel)
- ✅ **Frontend:** 20 React stranica (Dashboard, Idea Lab, Script Lab, itd.)
- ✅ **API:** 7 ruta (ai, content, platforms, script-lab, storyboard, viral-hook-lab, voice)
- ✅ **Tech:** React 18 + Vite + Tailwind + Zustand
- ⚠️ **Deploy:** Samo Dashboard i Idea Lab rade (2/20)
- ⚠️ **API:** Nema povezivanja sa video generation pipeline-om

### AI Video Pipeline (Lokalno)
- ✅ **Optimizovani pipeline:** `pipeline-optimized.js`
- ✅ **Performance:** 33% brže, 95% success rate
- ✅ **Caching:** 40-60% cache hit rate
- ✅ **Features:** Parallel processing, retry logic, metrics tracking
- ⚠️ **Lokacija:** `/mnt/data/openclaw/workspace/.openclaw/workspace/ai-video-pipeline/`

---

## 🎯 Cilj Integracije

**Povezati ShortAI frontend sa AI Video Pipeline backend-om**

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   ShortAI UI    │────▶│   ShortAI API Rute   │────▶│  AI Video Pipeline  │
│   (Vercel)      │     │   (Vercel Functions) │     │  (Optimized Node)   │
│                 │     │                      │     │                     │
│ - Idea Lab      │     │ - /api/content/      │     │ - Script Gen        │
│ - Script Lab    │     │ - /api/script-lab/   │     │ - Voice/TTS         │
│ - Video Gen     │     │ - /api/ai/           │     │ - Media Fetch       │
│ - Auto Factory  │     │ - /api/storyboard/   │     │ - Video Assembly    │
│                 │     │                      │     │ - Captions          │
└─────────────────┘     └──────────────────────┘     └─────────────────────┘
```

---

## 🔧 Koraci Integracije

### 1. Kreiraj Novu API Rutu za Video Generation

**Lokacija:** `/api/video/generate.js`

```javascript
import { processVideo, processBatch } from '../../ai-video-pipeline/pipeline-optimized.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { 
      topic, 
      platform = 'youtube',
      duration = 30,
      tone = 'conversational',
      count = 1 
    } = req.body

    // Process single video or batch
    const result = count === 1 
      ? await processVideo(topic, { platform, duration, tone })
      : await processBatch(Array(count).fill(topic), { platform, duration, tone })

    res.status(200).json({ 
      success: true, 
      data: result,
      message: `Generated ${count} video(s)`
    })

  } catch (err) {
    console.error('Video generation error:', err)
    res.status(500).json({ 
      success: false, 
      message: err.message 
    })
  }
}
```

---

### 2. Ažuriraj Postojeće API Rute

#### `/api/script-lab/generate.js` — Dodaj caching
```javascript
// Dodaj na početak
const scriptCache = new Map()
const CACHE_TTL = 3600000 // 1 hour

// Prije generisanja, provjeri cache
const cacheKey = `${topic}-${duration}-${tone}-${platform}`
if (scriptCache.has(cacheKey)) {
  const cached = scriptCache.get(cacheKey)
  if (Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json(cached.data)
  }
}

// Poslije generisanja, sačuvaj u cache
scriptCache.set(cacheKey, { data: script, timestamp: Date.now() })
```

---

### 3. Kreiraj Shared Config

**Lokacija:** `/api/config/shared.js`

```javascript
export const config = {
  // Groq AI
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY || '',
    model: 'llama-3.3-70b-versatile'
  },

  // Pipeline settings
  pipeline: {
    outputDir: process.env.VIDEO_OUTPUT_DIR || './videos',
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT || '5'),
    defaultDuration: parseInt(process.env.DEFAULT_DURATION || '30'),
    defaultPlatform: process.env.DEFAULT_PLATFORM || 'youtube',
    defaultFps: parseInt(process.env.DEFAULT_FPS || '24'),
    defaultResolution: process.env.DEFAULT_RESOLUTION || '1080x1920',
    enableCache: process.env.ENABLE_CACHE !== 'false',
    maxRetries: parseInt(process.env.MAX_RETRIES || '3')
  },

  // Media sources
  pexels: {
    apiKey: process.env.PEXELS_API_KEY || '',
    baseUrl: 'https://api.pexels.com/v1'
  },

  pollinations: {
    baseUrl: 'https://image.pollinations.ai/prompt'
  },

  // TTS
  huggingface: {
    apiToken: process.env.HF_API_TOKEN || '',
    model: 'kokoro-82m'
  }
}
```

---

### 4. Dodaj Environment Variables

**Ažuriraj `.env.example`:**
```bash
# ... existing vars ...

# Video Pipeline
VIDEO_OUTPUT_DIR=./videos
MAX_CONCURRENT=5
DEFAULT_DURATION=30
DEFAULT_PLATFORM=youtube
DEFAULT_FPS=24
DEFAULT_RESOLUTION=1080x1920
ENABLE_CACHE=true
MAX_RETRIES=3

# Performance Monitoring
ENABLE_METRICS=true
METRICS_ENDPOINT=/api/metrics
```

---

### 5. Kreiraj Metrics API

**Lokacija:** `/api/metrics.js`

```javascript
import { getPerformanceMetrics, clearCache } from '../ai-video-pipeline/pipeline-optimized.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const metrics = getPerformanceMetrics()
    return res.status(200).json(metrics)
  }

  if (req.method === 'POST') {
    const { action } = req.body
    if (action === 'clear-cache') {
      const cleared = clearCache()
      return res.status(200).json({ success: true, cleared })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).json({ message: 'Method not allowed' })
}
```

---

## 📁 Struktura Fajlova Nakon Integracije

```
shortai-video-factory/
├── api/
│   ├── ai/
│   │   └── chat.js
│   ├── content/
│   │   └── generate.js          # ← Ažuriraj da koristi pipeline
│   ├── platforms/
│   │   ├── manage.js
│   │   └── youtube/
│   │       └── callback.js
│   ├── providers/
│   │   └── manage.js
│   ├── script-lab/
│   │   └── generate.js          # ← Dodaj caching
│   ├── storyboard/
│   │   └── generate.js
│   ├── viral-hook-lab/
│   │   └── generate.js
│   ├── voice/
│   │   └── generate.js
│   ├── video/                    # ← NOVO
│   │   └── generate.js          # ← Glavna video generation ruta
│   ├── config/
│   │   └── shared.js            # ← NOVO
│   └── metrics.js                # ← NOVO
├── ai-video-pipeline/            # ← Kopiraj iz workspacea
│   ├── pipeline-optimized.js
│   ├── ai.js
│   ├── media.js
│   ├── video.js
│   └── config.js
├── src/
│   └── pages/
│       ├── Dashboard.jsx         # ← Poveži sa metrics API
│       ├── IdeaLab.jsx           # ← Poveži sa video generation
│       ├── ScriptLab.jsx
│       ├── VideoGenerator.jsx    # ← Poveži sa /api/video/generate
│       └── AutoFactory.jsx       # ← Koristi batch processing
│       ...
└── .env                          # ← Dodaj nove varijable
```

---

## 🚀 Deploy na Vercel

### 1. Pripremi Project
```bash
cd shortai-video-factory

# Instaliraj dependencies
npm install

# Kopiraj AI Video Pipeline
cp -r ../ai-video-pipeline ./ai-video-pipeline

# Kreiraj .env.local sa svim varijablama
cp .env.example .env.local
```

### 2. Vercel Settings
```json
// vercel.json (kreiraj ako ne postoji)
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 60
    }
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

### 3. Deploy
```bash
# Login na Vercel
vercel login

# Deploy
vercel --prod
```

---

## 🧪 Test Plan

### Test 1: Single Video Generation
```bash
curl -X POST http://localhost:3000/api/video/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"AI tools","platform":"youtube","duration":30}'
```

**Očekivano:** ✅ Video generisan za < 2 minuta

### Test 2: Batch Generation
```bash
curl -X POST http://localhost:3000/api/video/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"AI tips","count":5,"platform":"tiktok"}'
```

**Očekivano:** ✅ 5 videa generisano, progress tracking radi

### Test 3: Metrics API
```bash
curl http://localhost:3000/api/metrics
```

**Očekivano:** ✅ Performance metrics vraćene

### Test 4: Clear Cache
```bash
curl -X POST http://localhost:3000/api/metrics \
  -H "Content-Type: application/json" \
  -d '{"action":"clear-cache"}'
```

**Očekivano:** ✅ Cache očišćen

---

## 📈 Očekivani Rezultati

### Prije Integracije:
- ❌ Samo Idea Lab radi
- ❌ Nema video generation
- ❌ Nema pravih podataka na dashboardu

### Nakon Integracije:
- ✅ **Video generation** iz bilo koje stranice
- ✅ **Batch processing** za Auto Factory
- ✅ **Performance metrics** na dashboardu
- ✅ **Caching** za brže odgovore
- ✅ **Retry logic** za bolji success rate

---

## 🎯 Sledeći Koraci

1. **Kopiraj AI Video Pipeline** u `shortai-video-factory/ai-video-pipeline/`
2. **Kreiraj `/api/video/generate.js`** rutu
3. **Kreiraj `/api/config/shared.js`**
4. **Kreiraj `/api/metrics.js`**
5. **Ažuriraj `.env`** sa novim varijablama
6. **Testiraj lokalno** (`npm run dev`)
7. **Deploy na Vercel**

---

## 💡 Bonus Features (Nakon Osnovne Integracije)

1. **Webhook notifications** — Obavijesti kad je video gotov
2. **Queue system** — Redis queue za velike batcheve
3. **CDN integration** — Cloudflare R2 za video storage
4. **Analytics** — Prati korišćenje i performance
5. **Multi-user support** — Supabase auth za više korisnika

---

**Spremno za implementaciju!** 🚀
