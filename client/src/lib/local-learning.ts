import curriculum from "../../../server/miara_content.json";

export const LEARNING_LANGUAGES = ["Español", "Català", "English"] as const;
export type LearningLanguage = (typeof LEARNING_LANGUAGES)[number];

export interface LearningExercise {
  type: "choice" | "fill";
  prompt: string;
  options?: string[];
  answer: string;
  hint?: string;
}
export interface LearningLesson {
  id: string;
  title: string;
  situation: string;
  xpReward: number;
  phrases: Array<{ text: string; translation: string }>;
  exercises: LearningExercise[];
}
export interface LearningCourse {
  courseSlug: string;
  title: string;
  cefr: string;
  lessons: LearningLesson[];
}

const languageRecords = curriculum.languages as unknown as Record<LearningLanguage, LearningCourse>;
export const learningCourses = Object.fromEntries(
  LEARNING_LANGUAGES.map((language) => [language, languageRecords[language]]),
) as Record<LearningLanguage, LearningCourse>;

export type LocalProgress = Record<string, string[]>;
export const PROGRESS_KEY = "lingua-aberta:local-learning:v1";
const validCourses = new Map(Object.values(learningCourses).map((course) => [
  course.courseSlug,
  new Set(course.lessons.map((lesson) => lesson.id)),
]));

export function parseLocalProgress(raw: string | null): LocalProgress {
  if (!raw || raw.length > 16_384) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const result: LocalProgress = {};
    for (const [slug, entries] of Object.entries(parsed)) {
      const validIds = validCourses.get(slug);
      if (!validIds || !Array.isArray(entries) || entries.length > 100) continue;
      result[slug] = [...new Set(entries.filter((id): id is string =>
        typeof id === "string" && validIds.has(id),
      ))];
    }
    return result;
  } catch {
    return {};
  }
}

export function readLocalProgress(): LocalProgress {
  if (typeof window === "undefined") return {};
  try {
    return parseLocalProgress(window.localStorage.getItem(PROGRESS_KEY));
  } catch {
    return {};
  }
}

export function saveCompletedLesson(slug: string, lessonId: string) {
  const validIds = validCourses.get(slug);
  if (!validIds?.has(lessonId)) return { saved: false, progress: readLocalProgress() };
  const progress = readLocalProgress();
  progress[slug] = [...new Set([...(progress[slug] ?? []), lessonId])];
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return { saved: true, progress };
  } catch {
    return { saved: false, progress };
  }
}

export function courseCompletion(slug: string, progress: LocalProgress): { completed: number; total: number; percent: number } {
  const total = validCourses.get(slug)?.size ?? 0;
  const completed = (progress[slug] ?? []).filter((id) => validCourses.get(slug)?.has(id)).length;
  return { completed, total, percent: total ? Math.min(100, Math.round(100 * completed / total)) : 0 };
}
