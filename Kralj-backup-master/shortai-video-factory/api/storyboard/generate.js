import { createClient } from '@supabase/supabase-js';

const supabase = process.env.SUPABASE_URL
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

const API_BASE_URL = process.env.API_BASE_URL || process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

const STYLE_CONFIGS = {
  cinematic: {
    promptPrefix: 'Cinematic film still, dramatic lighting, shallow depth of field, 4K quality',
    transitions: ['fade', 'dissolve', 'crossfade', 'wipe']
  },
  modern: {
    promptPrefix: 'Modern minimal design, clean lines, bold colors, contemporary aesthetic',
    transitions: ['cut', 'slide', 'zoom', 'morph']
  },
  educational: {
    promptPrefix: 'Clear educational illustration, bright and clean, informative graphic',
    transitions: ['cut', 'fade', 'zoom']
  },
  vlog: {
    promptPrefix: 'Vlog style, natural lighting, handheld perspective, authentic feel',
    transitions: ['cut', 'jump', 'whip']
  },
  animated: {
    promptPrefix: 'Vibrant 2D animation style, colorful, dynamic composition',
    transitions: ['morph', 'spin', 'bounce', 'dissolve']
  }
};

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { script, style = 'modern' } = req.body;

    if (!script) {
      return res.status(400).json({ error: 'script is required' });
    }

    const userId = req.headers['x-user-id'] || 'default';
    const styleConfig = STYLE_CONFIGS[style] || STYLE_CONFIGS.modern;

    // Parse script to extract sections
    let scriptText = typeof script === 'string' ? script : JSON.stringify(script);

    const systemPrompt = `You are a storyboard director. Break the following video script into individual scenes.

For each scene, provide:
- description: Brief scene description
- visualPrompt: Detailed prompt for image generation (prefix with "${styleConfig.promptPrefix}")
- duration: Duration in seconds
- transition: One of [${styleConfig.transitions.join(', ')}]

Script to break down:
${scriptText}

Output valid JSON:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Scene title",
      "description": "What happens in this scene",
      "visualPrompt": "Detailed image generation prompt",
      "duration": 5,
      "transition": "cut",
      "textOverlay": "Optional text overlay for the scene",
      "audioNotes": "Optional audio/music notes"
    }
  ],
  "totalDuration": 60
}

Create 4-8 scenes. Each scene should be 3-15 seconds. Total duration should be roughly 30-90 seconds.`;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'No AI provider configured' });
    }

    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: systemPrompt }],
        max_tokens: 3072
      })
    });

    const aiData = await aiResponse.json();
    if (!aiResponse.ok) {
      throw new Error(aiData.error?.message || 'AI generation failed');
    }

    const rawText = aiData.choices?.[0]?.message?.content || '{}';
    let storyboard;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      storyboard = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      storyboard = { scenes: [], totalDuration: 0 };
    }

    // Enhance scenes with Pexels stock image suggestions
    const pexelsApiKey = process.env.PEXELS_API_KEY;
    if (pexelsApiKey && storyboard.scenes) {
      for (const scene of storyboard.scenes) {
        try {
          const searchQuery = scene.description.split(' ').slice(0, 5).join(' ');
          const pexelsRes = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=3&orientation=landscape`,
            { headers: { Authorization: pexelsApiKey } }
          );

          if (pexelsRes.ok) {
            const pexelsData = await pexelsRes.json();
            scene.stockImages = (pexelsData.photos || []).map(p => ({
              id: p.id,
              url: p.src?.large || p.src?.original,
              photographer: p.photographer,
              alt: p.alt || searchQuery
            }));
          }
        } catch (pexelsErr) {
          console.error('Pexels lookup failed for scene:', scene.sceneNumber, pexelsErr.message);
          scene.stockImages = [];
        }
      }
    }

    // Store in Supabase (optional)
    if (supabase) {
      await supabase
        .from('storyboards')
        .insert({
          user_id: userId,
          style,
          scenes_data: storyboard,
          total_duration: storyboard.totalDuration || 0
        }).catch(() => {})
    }

    return res.status(200).json({
      scenes: storyboard.scenes || [],
      totalDuration: storyboard.totalDuration || 0
    });
  } catch (error) {
    console.error('Storyboard generation error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
