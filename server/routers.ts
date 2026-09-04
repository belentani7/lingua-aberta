import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { transcribeAudio } from "./_core/voiceTranscription";
import { synthesizeWithElevenLabs, isElevenLabsConfigured } from "./_core/elevenlabs";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storageGetSignedUrl, storagePut } from "./storage";
import {
  addTutorMessage,
  ensureLearnerProfile,
  getLearnerProfile,
  getOrCreateTutorSession,
  getProgress,
  getRecentTutorMessages,
  upsertProgress,
} from "./db";
import { generateTutorReply, getTutorProviderStatus, TutorLanguage } from "./tutor";

const languageSchema = z.enum(["Español", "Català", "English"]);

const fallbackProgress = [
  { language: "Español", courseSlug: "espanol-de-la-calle", progressPercent: 68, completedLessons: 4, totalLessons: 6 },
  { language: "Català", courseSlug: "barcelona-por-dentro", progressPercent: 42, completedLessons: 3, totalLessons: 8 },
  { language: "English", courseSlug: "english-next-move", progressPercent: 24, completedLessons: 2, totalLessons: 8 },
];

const fallbackProfile = {
  displayName: "William Danilo Guimarães Santos",
  age: 14,
  nativeLanguage: "pt-BR",
  region: "Cataluña",
  educationLevel: "3º ESO",
  cefrLevel: "A2",
  goals: "Integración escolar, español, catalán e inglés",
  guardianConsent: 0,
};

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  platform: router({
    status: publicProcedure.query(() => getTutorProviderStatus()),
  }),

  learner: router({
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      const profile = await ensureLearnerProfile(ctx.user.id, ctx.user.name || undefined);
      const progress = await getProgress(ctx.user.id);
      return {
        profile: profile || fallbackProfile,
        progress: progress.length > 0 ? progress : fallbackProgress,
        streak: 7,
        practiceMinutes: 222,
        weeklyGoal: 68,
        personalized: true,
      };
    }),
    updateProgress: protectedProcedure.input(z.object({
      language: languageSchema,
      courseSlug: z.string().min(1).max(100),
      progressPercent: z.number().int().min(0).max(100),
      completedLessons: z.number().int().min(0).max(100),
      totalLessons: z.number().int().min(1).max(100),
    })).mutation(async ({ ctx, input }) => {
      const result = await upsertProgress(ctx.user.id, input);
      return result || input;
    }),
  }),

  tutor: router({
    history: protectedProcedure.input(z.object({ language: languageSchema })).query(async ({ ctx, input }) => {
      const session = await getOrCreateTutorSession(ctx.user.id, input.language);
      if (!session) return { sessionId: null, messages: [] };
      return { sessionId: session.id, messages: await getRecentTutorMessages(session.id) };
    }),
    message: protectedProcedure.input(z.object({ language: languageSchema, message: z.string().trim().min(1).max(2000) })).mutation(async ({ ctx, input }) => {
      const profile = await getLearnerProfile(ctx.user.id);
      const session = await getOrCreateTutorSession(ctx.user.id, input.language);
      const previous = session ? await getRecentTutorMessages(session.id, 12) : [];
      const history = previous
        .filter(item => item.role === "user" || item.role === "assistant")
        .map(item => ({ role: item.role as "user" | "assistant", content: item.content }));
      const reply = await generateTutorReply({
        language: input.language as TutorLanguage,
        profileName: profile?.displayName || "William",
        history,
        message: input.message,
      });
      if (session) {
        await addTutorMessage({ sessionId: session.id, userId: ctx.user.id, role: "user", content: input.message, detectedLanguage: "pt-BR" });
        await addTutorMessage({ sessionId: session.id, userId: ctx.user.id, role: "assistant", content: reply.text });
      }
      return { ...reply, sessionId: session?.id || null };
    }),
  }),

  voice: router({
    transcribe: protectedProcedure.input(z.object({
      audioBase64: z.string().min(100),
      mimeType: z.enum(["audio/webm", "audio/mp4", "audio/wav", "audio/ogg"]),
      language: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      if (input.audioBase64.length > 24_000_000) throw new Error("El audio supera el límite de 16 MB");
      const audio = Buffer.from(input.audioBase64, "base64");
      const stored = await storagePut(`voice/${ctx.user.id}/${Date.now()}.webm`, audio, input.mimeType);
      const signedUrl = await storageGetSignedUrl(stored.key);
      const localBaseUrl = process.env.WHISPER_BASE_URL?.replace(/\/$/, "");
      if (localBaseUrl) {
        const response = await fetch(`${localBaseUrl}/transcribe`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ audioUrl: signedUrl, language: input.language, prompt: "William es un estudiante brasileño de 14 años en Cataluña." }) });
        if (!response.ok) throw new Error(`Whisper local respondió ${response.status}`);
        return { storageKey: stored.key, ...(await response.json() as { text: string; language?: string }) };
      }
      const result = await transcribeAudio({ audioUrl: signedUrl, language: input.language, prompt: "William es un estudiante brasileño de 14 años en Cataluña." });
      if ("error" in result) throw new Error(result.error);
      return { storageKey: stored.key, text: result.text, language: result.language };
    }),
    synthesize: protectedProcedure.input(z.object({ text: z.string().min(1).max(2000), language: languageSchema })).mutation(async ({ input }) => {
          // Priority 1: ElevenLabs Flash v2.5 (best quality, MOS 4.8/5.0)
          if (isElevenLabsConfigured()) {
            try {
              const result = await synthesizeWithElevenLabs({
                text: input.text,
                language: input.language as "Español" | "Català" | "English",
              });
              return {
                available: true,
                provider: "elevenlabs-flash-v2.5" as const,
                model: result.model,
                voiceId: result.voiceId,
                audioUrl: `data:audio/mpeg;base64,${result.audioBuffer.toString("base64")}`,
                characterCount: result.characterCount,
              };
            } catch (error) {
              console.warn("[TTS] ElevenLabs failed, falling back to Piper/XTTS:", error instanceof Error ? error.message : error);
            }
          }

          // Priority 2: Piper or XTTS (local TTS service)
          const baseUrl = process.env.TTS_BASE_URL?.replace(/\/$/, "");
          if (baseUrl) {
            const response = await fetch(`${baseUrl}/synthesize`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ text: input.text, language: input.language }),
            });
            if (!response.ok) throw new Error(`El proveedor TTS respondió ${response.status}`);
            const payload = await response.json() as { audioUrl?: string };
            return { available: Boolean(payload.audioUrl), provider: "piper-or-xtts" as const, audioUrl: payload.audioUrl };
          }

          // Priority 3: Browser Web Speech API fallback
          return { available: false, provider: "browser-fallback" as const };
        }),
  }),
});

export type AppRouter = typeof appRouter;
