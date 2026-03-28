# AI Video Production Pipeline

Automated pipeline for generating 1000+ short video clips monthly using free tools.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Ingestion  │────▶│ Script Gen   │────▶│  Voiceover   │
│  RSS/Text/  │     │  (Groq AI)   │     │  (Coqui/HF)  │
│  URLs       │     └──────────────┘     └──────────────┘
└─────────────┘              │                    │
                             ▼                    ▼
                    ┌──────────────┐     ┌──────────────┐
                    │   Visuals    │     │   Captions   │
                    │ Pexels/      │     │   (Groq AI)  │
                    │ Pollinations │     └──────────────┘
                    └──────────────┘              │
                             │                    │
                             ▼                    ▼
                    ┌──────────────────────────────────┐
                    │        Video Assembly            │
                    │     (FFmpeg - server-side)       │
                    └──────────────────────────────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────────┐
                    │   Metadata + Publishing          │
                    │   (AI + Platform APIs)           │
                    └──────────────────────────────────┘
```

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run pipeline
node pipeline.js --topic "AI tools" --count 5

# Run scheduler (daily batch)
node scheduler.js
```

## Free Tools Used

| Component | Tool | Cost |
|-----------|------|------|
| Script Generation | Groq (llama-3.3-70b) | Free (30 req/min) |
| Voiceover | HuggingFace Kokoro TTS | Free |
| Stock Media | Pexels API | Free (200/hr) |
| Image Generation | Pollinations.ai | Free |
| Video Editing | FFmpeg | Free (open source) |
| Captions | Groq AI | Free |
| Metadata | Groq AI | Free |
| Scheduler | node-cron | Free |

## Daily Capacity

- ~33 clips/day for 1000/month
- Each clip: ~2-5 min processing time
- Parallel batches: 5 concurrent
- Estimated daily runtime: ~3 hours

## Environment Variables

```
GROQ_API_KEY=your-groq-key
PEXELS_API_KEY=your-pexels-key (optional)
HF_API_TOKEN=your-huggingface-token (optional)
YOUTUBE_API_KEY=your-youtube-key (optional)
```
