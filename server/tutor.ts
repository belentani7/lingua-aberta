import { invokeLLM, Message } from "./_core/llm";

export type TutorLanguage = "Español" | "Català" | "English";

export const TUTOR_SYSTEM_PROMPT = `# SYSTEM PROMPT: TUTOR SOMBRA — INSTITUTO UNIVERSAL GRATUITO
Eres el tutor digital, mentor y guía de William Danilo Guimarães Santos, un estudiante brasileño de 14 años que vive en Cataluña y cursa 3º de la ESO. Enseñas Español de España, Català e English usando el portugués brasileño como puente cognitivo.

IDENTIDAD Y CUIDADO:
- Sé cercano, paciente, respetuoso y juvenil sin infantilizar.
- Habla primero en portugués brasileño para romper el hielo y pregunta cómo fue su día.
- Protege la privacidad. No pidas datos sensibles, bancarios ni información que no sea necesaria para aprender.
- Eres una IA de acompañamiento educativo; no sustituyes a docentes, familia ni atención psicológica.
- Si aparece bullying, discriminación, riesgo o una crisis, escucha sin juzgar, propone un paso pequeño y deriva a una persona adulta de confianza o recursos locales.

PEDAGOGÍA:
- Máximo 3-4 oraciones en respuestas por voz; termina con una pregunta clara u opción simple.
- Ante un error: valida la intención, muestra la forma correcta, explica la lógica comparándola con el portugués y pide repetir.
- Prioriza situaciones reales: instituto, horarios, trabajos en grupo, barrio, trámites, ocio y primer empleo.
- Español: corrige suavemente portuñol y falsos amigos como embarazada/embaraçada, todavía/todavia, muy/mucho; usa léxico de España como chaval, guay, molar, curro.
- Català: prioriza integración escolar y comunitaria; practica x /ʃ/, ç /s/ y frases de aula.
- English: usa contextos europeos, académicos y técnicos.
- Si William se frustra, baja la dificultad y ofrece una pausa breve antes de seguir.

FORMATO DE RESPUESTA:
Responde en el idioma objetivo seleccionado, usando portugués solo como apoyo. Sé concreto. No inventes diagnósticos ni promesas. Haz una sola pregunta final.`;

const languageInstructions: Record<TutorLanguage, string> = {
  Español: "Módulo activo: español de España para eliminar portuñol e integrarse en el instituto.",
  Català: "Mòdul actiu: català de supervivència i integració escolar a Barcelona.",
  English: "Active module: European academic and practical English.",
};

export function buildTutorSystemPrompt(language: TutorLanguage, profileName = "William") {
  return `${TUTOR_SYSTEM_PROMPT}\n\n${languageInstructions[language]}\nEl estudiante se llama ${profileName}. Saluda de manera proactiva si es el inicio de la sesión.`;
}

function extractText(content: string | readonly unknown[]) {
  if (typeof content === "string") return content;
  return content.filter((part): part is { type: "text"; text: string } => typeof part === "object" && part !== null && "type" in part && part.type === "text" && "text" in part).map(part => part.text).join(" ");
}

async function generateWithOllama(messages: Message[], model: string) {
  const baseUrl = process.env.OLLAMA_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) return null;
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model, messages: messages.map(message => ({ role: message.role, content: typeof message.content === "string" ? message.content : JSON.stringify(message.content) })), stream: false, options: { temperature: 0.45 } }),
  });
  if (!response.ok) throw new Error(`Ollama request failed: ${response.status}`);
  const payload = await response.json() as { message?: { content?: string } };
  if (!payload.message?.content) throw new Error("Ollama returned an empty response");
  return { text: payload.message.content, provider: "ollama" as const, model };
}

export async function generateTutorReply(input: { language: TutorLanguage; profileName: string; history: Array<{ role: "user" | "assistant"; content: string }>; message: string }) {
  const messages: Message[] = [
    { role: "system", content: buildTutorSystemPrompt(input.language, input.profileName) },
    ...input.history.map(item => ({ role: item.role, content: item.content })),
    { role: "user", content: input.message },
  ];
  const model = process.env.OLLAMA_MODEL || "gemma2:9b";
  const localReply = await generateWithOllama(messages, model).catch(error => {
    console.warn("[Tutor] Ollama unavailable, using managed model:", error instanceof Error ? error.message : error);
    return null;
  });
  if (localReply) return localReply;

  const response = await invokeLLM({
    model: process.env.TUTOR_MANAGED_MODEL || undefined,
    messages,
    maxTokens: 260,
  });
  const content = response.choices[0]?.message?.content;
  const text = content ? extractText(content) : "Vamos passo a passo. Quer tentar a frase de novo?";
  return { text, provider: "managed" as const, model: response.model };
}

export function getTutorProviderStatus() {
  return {
    text: process.env.OLLAMA_BASE_URL ? "ollama" : "managed-fallback",
    speechToText: process.env.WHISPER_BASE_URL ? "whisper-local" : "whisper-service",
    textToSpeech: process.env.TTS_BASE_URL ? "piper-or-xtts" : "browser-fallback",
    localConfigured: Boolean(process.env.OLLAMA_BASE_URL),
  } as const;
}
