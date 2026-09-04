/**
 * ElevenLabs TTS client — multilingual Flash v2.5
 * 
 * Replaces the Piper/XTTS + browser Web Speech API fallback stack.
 * Model: eleven_multilingual_v2 (32 idiomas, MOS 4.8/5.0, ~75ms latency)
 * 
 * Voice mapping:
 *   Español:  JBFqnCBsd6RMkjVDRZzb  (Antoni — natural Spanish male)
 *   Català:   FL8stG5T8mH3VQ3j9n5l  (Bella — warm Catalan female)
 *   English:  SOYVLZyOoHc8T7sWQ3qM  (Harry — clear British male)
 * 
 * Free tier: ~10,000 chars/month
 * 
 * Example usage:
 * ```ts
 * import { synthesizeWithElevenLabs } from "./elevenlabs";
 * 
 * const result = await synthesizeWithElevenLabs({
 *   text: "Hola, ¿cómo estás?",
 *   language: "Español",
 * });
 * // result.audioBuffer → Buffer with MP3 data
 * ```
 */

export type ElevenLabsLanguage = "Español" | "Català" | "English";

export interface ElevenLabsSynthesizeOptions {
  text: string;
  language: ElevenLabsLanguage;
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface ElevenLabsSynthesizeResult {
  audioBuffer: Buffer;
  provider: "elevenlabs-flash-v2.5";
  model: string;
  voiceId: string;
  characterCount: number;
}

const DEFAULT_VOICE_IDS: Record<ElevenLabsLanguage, string> = {
  Español: "JBFqnCBsd6RMkjVDRZzb",   // Antoni — natural Spanish male
  Català: "FL8stG5T8mH3VQ3j9n5l",   // Bella — warm Catalan female
  English: "SOYVLZyOoHc8T7sWQ3qM",  // Harry — clear British male
};

const DEFAULT_MODEL = "eleven_multilingual_v2";

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

/**
 * Synthesize speech using ElevenLabs Flash v2.5
 */
export async function synthesizeWithElevenLabs(
  options: ElevenLabsSynthesizeOptions
): Promise<ElevenLabsSynthesizeResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  const voiceId = options.voiceId || DEFAULT_VOICE_IDS[options.language];
  const modelId = options.modelId || DEFAULT_MODEL;

  const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text: options.text,
      model_id: modelId,
      voice_settings: {
        stability: options.stability ?? 0.5,
        similarity_boost: options.similarityBoost ?? 0.75,
        style: options.style ?? 0,
        use_speaker_boost: options.useSpeakerBoost ?? true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`ElevenLabs TTS failed: ${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());

  return {
    audioBuffer,
    provider: "elevenlabs-flash-v2.5",
    model: modelId,
    voiceId,
    characterCount: options.text.length,
  };
}

/**
 * Get the ElevenLabs voice ID for a given language
 */
export function getElevenLabsVoiceId(language: ElevenLabsLanguage): string {
  return DEFAULT_VOICE_IDS[language];
}

/**
 * Check if ElevenLabs is configured
 */
export function isElevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}