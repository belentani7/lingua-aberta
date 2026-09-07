import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { GAME_CATALOG } from "@shared/games";
import { getSessionCookieOptions } from "./_core/cookies";
import { transcribeAudio } from "./_core/voiceTranscription";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storageGetSignedUrl, storagePut } from "./storage";
import {
  addTutorMessage,
  ensureLearnerProfile,
  getGameLeaderboard,
  getGameProgress,
  getLearnerProfile,
  getOrCreateTutorSession,
  getProgress,
  getRecentTutorMessages,
  saveGameProgress,
  startGameSession,
  upsertProgress,
  type SaveGameProgressInput,
} from "./db";
import { generateTutorReply, getTutorProviderStatus, TutorLanguage } from "./tutor";
import miaraContent from "./miara_content.json";

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
      const baseUrl = process.env.TTS_BASE_URL?.replace(/\/$/, "");
      if (!baseUrl) return { available: false, provider: "browser-fallback" as const, audioUrl: undefined };
      const response = await fetch(`${baseUrl}/synthesize`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: input.text, language: input.language }) });
      if (!response.ok) throw new Error(`El proveedor TTS respondió ${response.status}`);
      const payload = await response.json() as { audioUrl?: string };
      return { available: Boolean(payload.audioUrl), provider: "piper-or-xtts" as const, audioUrl: payload.audioUrl };
    }),
  }),

  miara: router({
    content: publicProcedure.query(() => miaraContent),
    lessons: publicProcedure
      .input(z.object({ language: languageSchema }).optional())
      .query(async ({ input }) => {
        if (input?.language) {
          return {
            languages: {
              [input.language]: miaraContent.languages[input.language],
            },
          };
        }
        return { languages: miaraContent.languages };
      }),
  }),

  games: router({
    list: publicProcedure.query(async () => ({ games: GAME_CATALOG })),
    leaderboard: publicProcedure
      .input(z.object({
        language: z.string().min(1).max(32),
        courseSlug: z.string().min(1).max(100).optional(),
        limit: z.number().int().min(1).max(50).optional().default(10),
      }))
      .query(async ({ input }) => {
        const entries = await getGameLeaderboard(input.language, input.courseSlug, input.limit);
        return { entries };
      }),
    progress: protectedProcedure
      .input(z.object({
        gameId: z.string().min(1).max(32).optional(),
        language: z.string().min(1).max(32).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const rows = await getGameProgress(ctx.user.id, input.gameId, input.language);
        const latest = rows[0];
        return {
          games: rows,
          bestScore: latest?.bestScore ?? 0,
          totalScore: latest?.totalScore ?? 0,
          totalXp: latest?.totalXp ?? 0,
          totalGames: latest?.totalGames ?? 0,
          bestStreak: latest?.bestStreak ?? 0,
          completed: latest?.completed ?? 0,
          lastPlayed: latest?.lastPlayed ?? null,
        };
      }),
    startSession: protectedProcedure
      .input(z.object({ gameId: z.string().min(1).max(32), language: z.string().min(1).max(32) }))
      .mutation(async ({ ctx, input }) => {
        const session = await startGameSession(ctx.user.id, input.gameId, input.language);
        return { sessionId: session?.id || null };
      }),
    saveProgress: protectedProcedure
      .input(z.object({
        gameId: z.string().min(1).max(32),
        language: z.string().min(1).max(32),
        courseSlug: z.string().min(1).max(100).optional(),
        score: z.number().int().min(0).optional(),
        xpEarned: z.number().int().min(0).optional(),
        correct: z.boolean().optional(),
        streak: z.number().int().min(0).optional(),
        completed: z.boolean().optional(),
        wordId: z.number().int().min(0).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const payload: SaveGameProgressInput = { ...input };
        const result = await saveGameProgress(ctx.user.id, payload);
        if (!result) return null;
        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
