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

/**
 * El tutor usa el portugués brasileño como lengua puente (la L1 de William),
 * además de los tres idiomas que enseña. Sin "Português" aquí, cualquier frase
 * en portugués caía en la voz española y sonaba con acento equivocado.
 */
export type ElevenLabsLanguage = "Português" | "Español" | "Català" | "English";

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

/**
 * Orden del ecosistema: PT > ES > EN > CA.
 *
 * Cada voz se puede sobrescribir por variable de entorno para no tener que
 * tocar el código al cambiarla en la cuenta de ElevenLabs.
 */
const DEFAULT_VOICE_IDS: Record<ElevenLabsLanguage, string | undefined> = {
  // Pendiente: pegar aquí el ID de una voz pt-BR de tu cuenta de ElevenLabs.
  Português: process.env.ELEVENLABS_VOICE_ID_PT,
  Español: process.env.ELEVENLABS_VOICE_ID_ES || "JBFqnCBsd6RMkjVDRZzb",
  English: process.env.ELEVENLABS_VOICE_ID_EN || "SOYVLZyOoHc8T7sWQ3qM",
  Català: process.env.ELEVENLABS_VOICE_ID_CA || "FL8stG5T8mH3VQ3j9n5l",
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
  if (!voiceId) {
    // Antes esto era `undefined` en la URL y ElevenLabs devolvía un error opaco,
    // o peor: se usaba la voz de otro idioma. Mejor fallar diciendo qué falta.
    throw new Error(
      `No hay voz configurada para "${options.language}". ` +
        `Define ELEVENLABS_VOICE_ID_${options.language === "Português" ? "PT" : options.language === "Español" ? "ES" : options.language === "English" ? "EN" : "CA"}.`
    );
  }
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
export function getElevenLabsVoiceId(language: ElevenLabsLanguage): string | undefined {
  return DEFAULT_VOICE_IDS[language];
}

/**
 * Check if ElevenLabs is configured
 */
export function isElevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}