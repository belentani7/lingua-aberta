/**
 * Speech-to-text transcription. Prefers a self-hosted Whisper service when
 * WHISPER_BASE_URL is configured, otherwise falls back to the managed service.
 * Returns { text, language } on success or { error } on failure.
 */

type TranscribeResult =
  | { text: string; language?: string; error?: never }
  | { error: string; text?: never; language?: never };

export async function transcribeAudio(input: {
  audioUrl: string;
  language?: string;
  prompt?: string;
}): Promise<TranscribeResult> {
  const baseUrl = process.env.WHISPER_BASE_URL?.replace(/\/$/, "");
  try {
    if (baseUrl) {
      const response = await fetch(`${baseUrl}/transcribe`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          audioUrl: input.audioUrl,
          language: input.language,
          prompt: input.prompt,
        }),
      });
      if (!response.ok) throw new Error(`Whisper local respondió ${response.status}`);
      const payload = (await response.json()) as { text?: string; language?: string };
      if (!payload.text) throw new Error("Whisper local devolvió texto vacío");
      return { text: payload.text, language: payload.language };
    }

    const managedUrl = process.env.WHISPER_SERVICE_URL;
    if (managedUrl) {
      const response = await fetch(`${managedUrl}/transcribe`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ audioUrl: input.audioUrl, language: input.language, prompt: input.prompt }),
      });
      if (!response.ok) throw new Error(`Servicio Whisper respondió ${response.status}`);
      const payload = (await response.json()) as { text?: string; language?: string };
      if (!payload.text) throw new Error("Servicio Whisper devolvió texto vacío");
      return { text: payload.text, language: payload.language };
    }

    return { error: "No speech-to-text provider configured" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transcription failed";
    return { error: message };
  }
}
