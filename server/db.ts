import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  learnerProfiles,
  learningProgress,
  tutorMessages,
  tutorSessions,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getLearnerProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function ensureLearnerProfile(userId: number, fallbackName?: string) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await getLearnerProfile(userId);
  if (existing) return existing;
  const name = fallbackName || "William Danilo Guimarães Santos";
  await db.insert(learnerProfiles).values({
    userId,
    displayName: name,
    age: 14,
    nativeLanguage: "pt-BR",
    region: "Cataluña",
    educationLevel: "3º ESO",
    cefrLevel: "A2",
    goals: "Integración escolar, español, catalán e inglés",
    guardianConsent: 0,
  });
  return getLearnerProfile(userId);
}

export async function getProgress(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(learningProgress).where(eq(learningProgress.userId, userId));
}

export async function upsertProgress(
  userId: number,
  input: { language: string; courseSlug: string; progressPercent: number; completedLessons: number; totalLessons: number },
) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select().from(learningProgress).where(and(eq(learningProgress.userId, userId), eq(learningProgress.courseSlug, input.courseSlug))).limit(1);
  if (existing[0]) {
    await db.update(learningProgress).set({ ...input, progressPercent: Math.max(0, Math.min(100, input.progressPercent)) }).where(eq(learningProgress.id, existing[0].id));
    return db.select().from(learningProgress).where(eq(learningProgress.id, existing[0].id)).limit(1).then(rows => rows[0]);
  }
  const inserted = await db.insert(learningProgress).values({ userId, ...input, progressPercent: Math.max(0, Math.min(100, input.progressPercent)) });
  return inserted;
}

export async function getOrCreateTutorSession(userId: number, language: string) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select().from(tutorSessions).where(and(eq(tutorSessions.userId, userId), eq(tutorSessions.language, language))).orderBy(desc(tutorSessions.lastMessageAt)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(tutorSessions).values({ userId, language, mode: "voice" });
  const created = await db.select().from(tutorSessions).where(and(eq(tutorSessions.userId, userId), eq(tutorSessions.language, language))).orderBy(desc(tutorSessions.createdAt)).limit(1);
  return created[0];
}

export async function getRecentTutorMessages(sessionId: number, limit = 12) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(tutorMessages).where(eq(tutorMessages.sessionId, sessionId)).orderBy(desc(tutorMessages.createdAt)).limit(limit);
  return rows.reverse();
}

export async function addTutorMessage(input: { sessionId: number; userId: number; role: "user" | "assistant" | "system"; content: string; detectedLanguage?: string }) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(tutorMessages).values(input);
  await db.update(tutorSessions).set({ lastMessageAt: new Date() }).where(eq(tutorSessions.id, input.sessionId));
  const rows = await db.select().from(tutorMessages).where(and(eq(tutorMessages.sessionId, input.sessionId), eq(tutorMessages.userId, input.userId))).orderBy(desc(tutorMessages.createdAt)).limit(1);
  return rows[0];
}
