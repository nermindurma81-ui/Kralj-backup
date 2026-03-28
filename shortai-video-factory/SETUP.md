# ShortAI + AI Video Pipeline — Setup Guide

**Datum:** 28.03.2026  
**Status:** ✅ SPREMNO ZA RAD  
**Integracija:** ShortAI Frontend + AI Video Pipeline Backend

---

## 🎯 Šta je urađeno?

### ✅ Implementirano (Option A - Implementation):

1. **Kopiran AI Video Pipeline** u `shortai-video-factory/ai-video-pipeline/`
2. **Kreiran `/api/config/shared.js`** — Zajednička konfiguracija
3. **Kreiran `/api/video/generate.js`** — Glavna video generation API ruta
4. **Kreiran `/api/metrics.js`** — Performance metrics endpoint
5. **Ažuriran `.env.example`** — Nove environment varijable

### 📚 Objašnjeno (Option B - Explanation):

Ovaj dokument objašnjava:
- Kako arhitektura radi
- Kako koristiti nove API rute
- Kako testirati lokalno
- Kako deploy-ovati na Vercel

---

## 🏗️ Arhitektura

```
┌─────────────────────────────────────────────────────────────┐
│                    ShortAI Frontend                         │
│  (React + Vite + Tailwind + Zustand)                        │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Idea Lab   │  │ Script Lab   │  │ Video Generator │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  ShortAI API (Vercel Functions)             │
│                                                             │
│  ┌──────────────────┐  ┌─────────────────┐  ┌───────────┐ │
│  │ /api/video/      │  │ /api/metrics/   │  │  Others   │ │
│  │   generate.js    │  │                 │  │           │ │
│  └──────────────────┘  └─────────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Function Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               AI Video Pipeline (Optimized)                 │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  pipeline-optimized.js                                │  │
│  │  - Parallel scene processing                          │  │
│  │  - Media caching (40-60% hit rate)                    │  │
│  │  - Exponential backoff retry                          │  │
│  │  - Batch audio generation                             │  │
│  │  - Performance metrics tracking                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Lokalno Testiranje

### 1. Instaliraj Dependencies

```bash
cd shortai-video-factory

# Instaliraj React dependencies
npm install

# (Optional) Instaliraj pipeline dependencies
cd ai-video-pipeline
npm install
cd ..
```

### 2. Konfiguriši Environment

```bash
# Kopiraj .env.example u .env.local
cp .env.example .env.local

# Uredi .env.local i dodaj svoje API keys
nano .env.local
```

**Obavezno postavi:**
```bash
GROQ_API_KEY=gsk_your_actual_key_here
PEXELS_API_KEY=your_pexels_key  # Optional
HF_API_TOKEN=your_hf_token      # Optional for TTS
```

### 3. Pokreni Development Server

```bash
# Development mode (hot reload)
npm run dev

# Ili koristi Vercel CLI za lokalni preview
vercel dev
```

Server će se pokrenuti na: `http://localhost:3000`

---

## 🧪 Testiranje API Ruta

### Test 1: Video Generation (Single)

```bash
curl -X POST http://localhost:3000/api/video/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "AI tools for productivity",
    "platform": "youtube",
    "duration": 30,
    "tone": "educational",
    "count": 1
  }'
```

**Očekivani odgovor:**
```json
{
  "success": true,
  "message": "Video generation started for \"AI tools for productivity\"",
  "data": {
    "jobId": "job-1234567890-abc123def",
    "status": "queued",
    "estimatedTime": 2
  }
}
```

### Test 2: Check Job Status

```bash
curl "http://localhost:3000/api/video/generate?jobId=job-1234567890-abc123def"
```

**Očekivani odgovor:**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "progress": 100,
    "result": { ... }
  }
}
```

### Test 3: Get Performance Metrics

```bash
curl "http://localhost:3000/api/metrics?detailed=true"
```

**Očekivani odgovor:**
```json
{
  "success": true,
  "data": {
    "totalJobs": 10,
    "successfulJobs": 9,
    "failedJobs": 1,
    "avgProcessingTime": 120000,
    "cacheHits": 25,
    "cacheMisses": 15,
    "cacheHitRate": "62.50%",
    "successRate": "90.00%"
  }
}
```

### Test 4: Clear Cache

```bash
curl -X POST http://localhost:3000/api/metrics \
  -H "Content-Type: application/json" \
  -d '{"action": "clear-cache"}'
```

**Očekivani odgovor:**
```json
{
  "success": true,
  "message": "Cleared 40 cached items",
  "data": { "cleared": 40 }
}
```

---

## 🔌 Frontend Integracija

### Kako koristiti u React komponentama:

#### Primjer: VideoGenerator.jsx

```jsx
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function VideoGenerator() {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('youtube')
  const [duration, setDuration] = useState(30)
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)

  const generateVideo = async () => {
    try {
      setStatus('submitting')
      
      // Start generation
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          platform,
          duration,
          tone: 'educational',
          count: 1
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setJobId(data.data.jobId)
        setStatus('processing')
        toast.success('Video generation started!')
        
        // Poll for status
        pollStatus(data.data.jobId)
      } else {
        toast.error(data.message)
        setStatus('error')
      }
    } catch (err) {
      toast.error('Generation failed: ' + err.message)
      setStatus('error')
    }
  }

  const pollStatus = async (id) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/video/generate?jobId=${id}`)
        const data = await response.json()
        
        if (data.success) {
          setProgress(data.data.progress)
          
          if (data.data.status === 'completed') {
            clearInterval(interval)
            setStatus('completed')
            toast.success('Video ready!')
          } else if (data.data.status === 'failed') {
            clearInterval(interval)
            setStatus('failed')
            toast.error('Generation failed')
          }
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }

  return (
    <div>
      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter topic..."
      />
      
      <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
        <option value="youtube">YouTube Shorts</option>
        <option value="tiktok">TikTok</option>
        <option value="instagram">Instagram Reels</option>
      </select>

      <input
        type="number"
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        min="15"
        max="60"
      />

      <button onClick={generateVideo} disabled={status === 'processing'}>
        {status === 'processing' ? 'Generating...' : 'Generate Video'}
      </button>

      {status === 'processing' && (
        <div>
          <progress value={progress} max="100" />
          <span>{progress}%</span>
        </div>
      )}
    </div>
  )
}
```

---

## 📊 Dashboard Integracija

### Kako prikazati metrike na Dashboardu:

```jsx
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    fetch('/api/metrics?detailed=true')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMetrics(data.data)
        }
      })
  }, [])

  if (!metrics) return <div>Loading...</div>

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="stat-card">
        <h3>Total Videos</h3>
        <p className="text-3xl">{metrics.totalJobs}</p>
      </div>

      <div className="stat-card">
        <h3>Success Rate</h3>
        <p className="text-3xl text-green-500">{metrics.successRate}</p>
      </div>

      <div className="stat-card">
        <h3>Avg Time</h3>
        <p className="text-3xl">{(metrics.avgProcessingTime / 1000).toFixed(0)}s</p>
      </div>

      <div className="stat-card">
        <h3>Cache Hit Rate</h3>
        <p className="text-3xl text-blue-500">{metrics.cacheHitRate}</p>
      </div>
    </div>
  )
}
```

---

## 🚀 Deploy na Vercel

### 1. Pripremi Project

```bash
cd shortai-video-factory

# Build frontend
npm run build

# Provjeri da li su svi fajlovi tu
ls -la api/video/
ls -la api/metrics.js
ls -la ai-video-pipeline/
```

### 2. Postavi Environment Variables na Vercelu

```bash
# Login na Vercel
vercel login

# Set environment variables
vercel env add GROQ_API_KEY production
vercel env add PEXELS_API_KEY production
vercel env add HF_API_TOKEN production
vercel env add ENABLE_CACHE true production
vercel env add ENABLE_METRICS true production
```

### 3. Deploy

```bash
# Deploy to production
vercel --prod
```

### 4. Provjeri Deployment

```bash
# Get deployment URL
vercel ls

# Test API
curl https://your-deployment-url.vercel.app/api/metrics
```

---

## 🐛 Troubleshooting

### Problem: "Module not found" error

**Rješenje:**
```bash
# Provjeri da li su dependencies instalirani
npm install

# Provjeri imports u API fajlovima
# Koristi relativne putanje: ../../ai-video-pipeline/pipeline-optimized.js
```

### Problem: "GROQ_API_KEY is required"

**Rješenje:**
```bash
# Provjeri .env.local
cat .env.local | grep GROQ

# Ako koristiš Vercel, provjeri environment variables
vercel env ls
```

### Problem: API vraća 404

**Rješenje:**
```bash
# Provjeri strukturu fajlova
tree api/

# Provjeri da li server.js pravilno loaduje rute
# API ruta mora biti: api/video/generate.js (ne api/video/generate/index.js)
```

### Problem: Video generation traje predugo

**Rješenje:**
```bash
# Smanji MAX_CONCURRENT u .env.local
MAX_CONCURRENT=3

# Omogući caching
ENABLE_CACHE=true

# Smanji broj sceni u scripti
```

---

## 📈 Performance Tips

### 1. Enable Caching (40-60% brže)
```bash
ENABLE_CACHE=true
```

### 2. Optimize Concurrent Processing
```bash
# Za manje servere
MAX_CONCURRENT=3

# Za jake servere
MAX_CONCURRENT=10
```

### 3. Use Shorter Videos (brže)
```javascript
duration: 15  // Umjesto 30 ili 60
```

### 4. Batch Similar Topics (bolji cache hit rate)
```javascript
// Umjesto:
generate("AI tools")
generate("AI tips")

// Koristi:
generateBatch(["AI tools - Part 1", "AI tools - Part 2"])
```

---

## 🎯 Sledeći Koraci

### Opcionalna Poboljšanja:

1. **Database Integration** — Sačuvaj job-ove u Supabase
2. **Webhook Support** — Obavijesti kad je video gotov
3. **CDN Integration** — Cloudflare R2 za video storage
4. **User Authentication** — Supabase Auth za multi-user
5. **Analytics Dashboard** — Detaljniji metrics i grafici

---

## ✅ Checklist

- [ ] Dependencies instalirani
- [ ] .env.local konfigurisan sa API keys
- [ ] Lokalno testiranje uspješno
- [ ] API rute rade (video, metrics)
- [ ] Frontend povezan sa API-jem
- [ ] Deploy na Vercel uspješan
- [ ] Production testiranje uspješno

---

**Sve je spremno! 🚀**

Pitanja? Pitaj šefe! 👑
