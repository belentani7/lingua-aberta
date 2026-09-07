import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const learnerProfiles = mysqlTable("learner_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  age: int("age").notNull(),
  nativeLanguage: varchar("nativeLanguage", { length: 16 }).default("pt-BR").notNull(),
  region: varchar("region", { length: 80 }).default("Cataluña").notNull(),
  educationLevel: varchar("educationLevel", { length: 80 }).default("3º ESO").notNull(),
  cefrLevel: varchar("cefrLevel", { length: 8 }).default("A2").notNull(),
  goals: text("goals"),
  guardianConsent: int("guardianConsent").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const learningProgress = mysqlTable("learning_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  language: varchar("language", { length: 32 }).notNull(),
  courseSlug: varchar("courseSlug", { length: 100 }).notNull(),
  progressPercent: int("progressPercent").default(0).notNull(),
  completedLessons: int("completedLessons").default(0).notNull(),
  totalLessons: int("totalLessons").default(8).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const tutorSessions = mysqlTable("tutor_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  language: varchar("language", { length: 32 }).notNull(),
  mode: varchar("mode", { length: 32 }).default("voice").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
});

export const tutorMessages = mysqlTable("tutor_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  detectedLanguage: varchar("detectedLanguage", { length: 16 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const gameSessions = mysqlTable("game_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  gameId: varchar("gameId", { length: 32 }).notNull(),
  language: varchar("language", { length: 32 }).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  score: int("score").default(0).notNull(),
  xpEarned: int("xpEarned").default(0).notNull(),
});

export const gameProgress = mysqlTable(
  "game_progress",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    gameId: varchar("gameId", { length: 32 }).notNull(),
    language: varchar("language", { length: 32 }).notNull(),
    courseSlug: varchar("courseSlug", { length: 100 }),
    totalGames: int("totalGames").default(0).notNull(),
    totalScore: int("totalScore").default(0).notNull(),
    totalXp: int("totalXp").default(0).notNull(),
    bestStreak: int("bestStreak").default(0).notNull(),
    bestScore: int("bestScore").default(0).notNull(),
    completed: int("completed").default(0).notNull(),
    lastPlayed: timestamp("lastPlayed").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("game_progress_user_game_lang_unique").on(table.userId, table.gameId, table.language)],
);

export const gameWords = mysqlTable("game_words", {
  id: int("id").autoincrement().primaryKey(),
  wordId: int("wordId").notNull(),
  topic: varchar("topic", { length: 64 }).notNull(),
  pt: varchar("pt", { length: 128 }).notNull(),
  es: varchar("es", { length: 128 }).notNull(),
  ca: varchar("ca", { length: 128 }).notNull(),
  en: varchar("en", { length: 128 }).notNull(),
  phrase: text("phrase").notNull(),
  hint: text("hint").notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LearnerProfile = typeof learnerProfiles.$inferSelect;
export type LearningProgress = typeof learningProgress.$inferSelect;
export type TutorSession = typeof tutorSessions.$inferSelect;
export type TutorMessage = typeof tutorMessages.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = typeof gameSessions.$inferInsert;
export type GameProgress = typeof gameProgress.$inferSelect;
export type InsertGameProgress = typeof gameProgress.$inferInsert;
export type GameWord = typeof gameWords.$inferSelect;
