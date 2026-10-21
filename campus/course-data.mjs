/**
 * Lingua Aberta — source of truth for the existing three campus courses.
 * All local files listed here already exist in campus/cursos/.
 * Shared by the browser and by dependency-free Node regression tests.
 */
export const COURSES = Object.freeze([
  {
    id: "falsos-amigos-pt-es",
    title: "Puente PT → ES: falsos amigos",
    level: "Português ↔ Español · A2–B1",
    purpose: "Reconoce palabras engañosas, explica el contexto y practica su significado real.",
    duration: "4 semanas · 12 h orientativas",
    weeks: 4,
  },
  {
    id: "catalan-a1-brasileiros",
    title: "Català A1 para brasileños",
    level: "Català · A1",
    purpose: "Saludos, ciudad, instituto y expresiones básicas para llegar a Cataluña.",
    duration: "4 semanas · 16 h orientativas",
    weeks: 4,
  },
  {
    id: "espanol-academico-eso",
    title: "Español académico en la ESO",
    level: "Español · B1",
    purpose: "Lectura crítica, argumentación y textos escolares con ejercicios graduados.",
    duration: "3 semanas · 10 h orientativas",
    weeks: 3,
  },
]);

const KNOWN = new Set(COURSES.map(course => course.id));
export const STORAGE_KEY = "lingua-aberta:campus-progress-v1";
export const STORAGE_EVENT = "lingua-aberta:campus-progress-updated";

/** Relative to /campus/, never user-controlled filesystem paths. */
export function courseFiles(id) {
  const course = COURSES.find(item => item.id === id);
  if (!course) return [];
  const root = "cursos/" + course.id + "/";
  return [
    root + "syllabus.md",
    ...Array.from({ length: course.weeks }, (_, index) =>
      root + "semana-" + String(index + 1).padStart(2, "0") + ".md"),
    root + "recursos.md",
    root + "quiz.json",
  ];
}

export function validateQuiz(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 40) {
    throw new Error("El cuestionario no contiene preguntas válidas.");
  }
  const ids = new Set();
  return value.map((candidate, index) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      throw new Error("Pregunta " + (index + 1) + " inválida.");
    }
    const { pregunta, opciones, correcta, explicacion } = candidate;
    if (typeof pregunta !== "string" || pregunta.trim().length < 8 ||
      pregunta.length > 800 || !Array.isArray(opciones) ||
      opciones.length < 2 || opciones.length > 8 ||
      opciones.some(option => typeof option !== "string" || !option.trim() || option.length > 350) ||
      !Number.isInteger(correcta) || correcta < 0 || correcta >= opciones.length ||
      typeof explicacion !== "string" || !explicacion.trim() || explicacion.length > 1000) {
      throw new Error("Pregunta " + (index + 1) + " no supera la validación.");
    }
    const id = pregunta.trim().toLocaleLowerCase("es");
    if (ids.has(id)) throw new Error("Pregunta duplicada.");
    ids.add(id);
    return { pregunta, opciones, correcta, explicacion };
  });
}

/**
 * Progress never counts mere visits as completion.
 * Only a completed quiz produces a record; best scores survive retries.
 */
export function parseProgress(raw) {
  if (!raw || raw.length > 15000) return {};
  let data;
  try { data = JSON.parse(raw); } catch { return {}; }
  if (!data || typeof data !== "object" || Array.isArray(data) ||
    data.version !== 1 || !data.courses || typeof data.courses !== "object" ||
    Array.isArray(data.courses)) return {};
  const result = Object.create(null);
  for (const [id, item] of Object.entries(data.courses)) {
    if (!KNOWN.has(id) || !item || typeof item !== "object" || Array.isArray(item)) continue;
    const { best, attempts, updatedAt } = item;
    if (!Number.isInteger(best) || best < 0 || best > 100 ||
      !Number.isInteger(attempts) || attempts < 1 || attempts > 100000 ||
      typeof updatedAt !== "string" || updatedAt.length > 35 ||
      !Number.isFinite(Date.parse(updatedAt)) ||
      new Date(updatedAt).toISOString() !== updatedAt) continue;
    result[id] = { best, attempts, updatedAt };
  }
  return result;
}

export function saveQuizResult(previous, id, score, total, at = new Date()) {
  if (!KNOWN.has(id)) throw new Error("Curso no reconocido.");
  if (!Number.isInteger(score) || !Number.isInteger(total) ||
    total < 1 || score < 0 || score > total ||
    !Number.isFinite(at.getTime())) throw new Error("Puntuación no válida.");
  const percentage = Math.round((score / total) * 100);
  return {
    ...previous,
    [id]: {
      best: Math.max(previous[id]?.best ?? 0, percentage),
      attempts: Math.min(100000, (previous[id]?.attempts ?? 0) + 1),
      updatedAt: at.toISOString(),
    },
  };
}
