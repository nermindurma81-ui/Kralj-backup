import { createClient } from '@supabase/supabase-js';

const supabase = process.env.SUPABASE_URL
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

const VOICE_MAP = {
  'af_alloy': 'af_alloy',
  'af_aoede': 'af_aoede',
  'af_bella': 'af_bella',
  'af_heart': 'af_heart',
  'af_jessica': 'af_jessica',
  'af_kore': 'af_kore',
  'af_nicole': 'af_nicole',
  'af_nova': 'af_nova',
  'af_river': 'af_river',
  'af_sarah': 'af_sarah',
  'af_sky': 'af_sky',
  'am_adam': 'am_adam',
  'am_echo': 'am_echo',
  'am_eric': 'am_eric',
  'am_fenrir': 'am_fenrir',
  'am_liam': 'am_liam',
  'am_michael': 'am_michael',
  'am_onyx': 'am_onyx',
  'am_puck': 'am_puck',
  'am_santa': 'am_santa'
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
    const { text, voice = 'af_heart', speed = 0.95 } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const userId = req.headers['x-user-id'] || 'default';
    const hfToken = process.env.HF_API_TOKEN || process.env.HUGGINGFACE_API_TOKEN;

    if (!hfToken) {
      // Return browser speech synthesis config as fallback
      const browserVoices = [
        { name: 'Samantha', lang: 'en-US', gender: 'female' },
        { name: 'Daniel', lang: 'en-GB', gender: 'male' },
        { name: 'Karen', lang: 'en-AU', gender: 'female' },
        { name: 'Moira', lang: 'en-IE', gender: 'female' },
        { name: 'Alex', lang: 'en-US', gender: 'male' }
      ];

      const estimatedWords = text.split(/\s+/).length;
      const wordsPerMinute = 150 * speed;
      const estimatedDuration = Math.round((estimatedWords / wordsPerMinute) * 60);

      return res.status(200).json({
        useBrowserSynthesis: true,
        voiceConfig: {
          text,
          rate: speed,
          pitch: 1.0,
          volume: 1.0,
          availableVoices: browserVoices
        },
        estimatedDuration,
        message: 'No HuggingFace token configured. Using browser speech synthesis fallback.'
      });
    }

    const selectedVoice = VOICE_MAP[voice] || voice || 'af_heart';

    // Add natural emphasis by ensuring proper punctuation (creates clearer pauses/stresses)
    const emphasizedText = text
      .replace(/\.\.\./g, '... ')  // Ensure ellipses have space
      .replace(/([!?.])(\s*)([A-Z])/g, '$1 $3')  // Ensure pauses after sentences
      .replace(/,\s*/g, ', ')  // Normalize comma spacing
      .trim();

    // Call Kokoro TTS via HuggingFace Inference API
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/hexgrad/Kokoro-82M`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: emphasizedText,
          parameters: {
            voice: selectedVoice,
            speed: speed
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kokoro TTS API error (${response.status}): ${errorText}`);
    }

    // The response is audio data (typically WAV or FLAC)
    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const estimatedWords = text.split(/\s+/).length;
    const wordsPerMinute = 150 * speed;
    const estimatedDuration = Math.round((estimatedWords / wordsPerMinute) * 60);

    // If no Supabase, return base64 audio directly
    if (!supabase) {
      return res.status(200).json({
        audioBase64: audioBuffer.toString('base64'),
        mimeType: 'audio/wav',
        duration: estimatedDuration,
        voice: selectedVoice
      })
    }

    // Upload to Supabase Storage
    const fileName = `voice/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.wav`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/wav',
        upsert: false
      });

    if (uploadError) {
      // If storage upload fails, return base64 audio
      const base64Audio = audioBuffer.toString('base64');

      await supabase?.from('voice_generations')?.insert({
        user_id: userId,
        text_length: text.length,
        voice: selectedVoice,
        speed,
        duration: estimatedDuration
      }).catch(() => {})

      return res.status(200).json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
        duration: estimatedDuration,
        voice: selectedVoice,
        note: 'Audio returned as base64 (storage upload failed)'
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio')
      .getPublicUrl(fileName);

    const audioUrl = urlData?.publicUrl;

    // Store metadata (optional)
    await supabase?.from('voice_generations')?.insert({
      user_id: userId,
      audio_url: audioUrl,
      text_length: text.length,
      voice: selectedVoice,
      speed,
      duration: estimatedDuration
    }).catch(() => {})

    return res.status(200).json({
      audioUrl,
      duration: estimatedDuration,
      voice: selectedVoice
    });
  } catch (error) {
    console.error('Voice generation error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
