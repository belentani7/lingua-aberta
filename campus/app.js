// lingua-aberta campus: offline-compatible course reader, quiz and real progress.
// Browser-only module; all dynamic text is inserted with textContent (never innerHTML).
import {
  COURSES, STORAGE_KEY, STORAGE_EVENT, courseFiles,
  validateQuiz, parseProgress, saveQuizResult,
} from "./course-data.mjs";

const $ = (selector, root = document) => root.querySelector(selector);
const create = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
const known = new Map(COURSES.map(course => [course.id, course]));
let selectedId = COURSES[0].id;
let quizItems = [];
let index = 0;
let score = 0;
let answered = false;
let quizLoad = 0;

function readProgress() {
  try { return parseProgress(localStorage.getItem(STORAGE_KEY)); }
  catch { return {}; }
}
function writeProgress(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, courses: records }));
    window.dispatchEvent(new Event(STORAGE_EVENT));
    return true;
  } catch {
    setStatus("El navegador no permite guardar. Puedes realizar el quiz sin registro de progreso.");
    return false;
  }
}
function setStatus(message) { $("#campus-status").textContent = message; }

function updateProgress() {
  const records = readProgress();
  const done = COURSES.filter(c => (records[c.id]?.best ?? 0) >= 70).length;
  $("#progress-figure").textContent = done + " / " + COURSES.length;
  $("#progress-description").textContent = done === 0
    ? "Los cursos se marcan superados con al menos 70% en un quiz completo."
    : "Cursos superados con al menos 70% en el cuestionario: " + done + ".";
  for (const el of document.querySelectorAll("[data-course-state]")) {
    const record = records[el.dataset.courseState];
    el.textContent = record
      ? "Mejor resultado: " + record.best + "% · " + record.attempts + " intento(s)"
      : "Sin evaluación completada";
  }
}

function selectCourse(id) {
  const course = known.get(id);
  if (!course) return;
  selectedId = id;
  $("#selected-course-title").textContent = course.title;
  $("#selected-course-purpose").textContent = course.purpose;
  $("#quiz-course-title").textContent = course.title;
  $("#selected-course-meta").textContent = course.level + " · " + course.duration;
  const reading = $("#material-choice");
  reading.replaceChildren();
  for (const [i, file] of courseFiles(id).entries()) {
    if (file.endsWith(".json")) continue;
    const label = file.endsWith("syllabus.md")
      ? "Presentación y objetivos"
      : file.endsWith("recursos.md") ? "Recursos y fuentes"
      : "Unidad " + String(i).padStart(2, "0");
    const option = create("option", label);
    option.value = file;
    reading.append(option);
  }
  for (const button of document.querySelectorAll("[data-course]")) {
    button.setAttribute("aria-pressed", String(button.dataset.course === id));
  }
  $("#quiz-feedback").textContent = "";
  loadLesson();
  void loadQuiz();
}

async function getText(source) {
  const response = await fetch(source, { credentials: "same-origin" });
  if (!response.ok) throw new Error("HTTP " + response.status);
  return response.text();
}

function renderMarkdown(raw) {
  const root = $("#lesson-document");
  root.replaceChildren();
  // Render content safely as readable structure rather than interpreting user HTML.
  for (const chunk of raw.replace(/\r/g, "").split(/\n{2,}/)) {
    const text = chunk.trim();
    if (!text) continue;
    const match = text.match(/^(#{1,4})\s+(.+)$/);
    const tag = match ? "h" + Math.min(4, match[1].length + 1) : "p";
    root.append(create(tag, match ? match[2] : text));
  }
  if (!root.children.length) root.append(create("p", "El documento no contiene texto."));
}

let lessonLoad = 0;
async function loadLesson() {
  const file = $("#material-choice").value;
  // Only files defined by the static, versioned catalogue may be fetched.
  if (!courseFiles(selectedId).includes(file) || !file.endsWith(".md")) return;
  const current = ++lessonLoad;
  $("#lesson-document").replaceChildren(create("p", "Abriendo material…"));
  try {
    const text = await getText(file);
    if (current === lessonLoad) renderMarkdown(text);
  } catch {
    if (current === lessonLoad) $("#lesson-document").replaceChildren(
      create("p", "No se pudo abrir el material. Comprueba la conexión y prepara el campus sin conexión."));
  }
}

function renderQuestion() {
  const quiz = $(".quiz-box");
  const question = quizItems[index];
  $(".quiz-titulo", quiz).textContent = (index + 1) + "/" + quizItems.length + " · " + question.pregunta;
  const options = $(".opciones", quiz);
  options.replaceChildren();
  $(".feedback", quiz).textContent = "";
  $(".marcador", quiz).textContent = "Aciertos: " + score + " / " + quizItems.length;
  $(".quiz-siguiente", quiz).hidden = true;
  answered = false;

  question.opciones.forEach((answer, choice) => {
    const button = create("button", answer, "opcion");
    button.type = "button";
    button.addEventListener("click", () => {
      if (answered) return;
      answered = true;
      const correct = choice === question.correcta;
      if (correct) score++;
      for (const [i, optionButton] of [...options.children].entries()) {
        optionButton.disabled = true;
        optionButton.classList.toggle("correcta", i === question.correcta);
        optionButton.classList.toggle("fallo", i === choice && !correct);
      }
      $(".feedback", quiz).textContent =
        (correct ? "Correcto. " : "Respuesta a revisar. ") + question.explicacion;
      $(".marcador", quiz).textContent = "Aciertos: " + score + " / " + quizItems.length;
      $(".quiz-siguiente", quiz).hidden = false;
      $(".quiz-siguiente", quiz).textContent =
        index < quizItems.length - 1 ? "Siguiente pregunta →" : "Ver resultado";
    });
    options.append(button);
  });
}

function finishQuiz() {
  const quiz = $(".quiz-box");
  const percent = Math.round(score / quizItems.length * 100);
  $(".quiz-titulo", quiz).textContent =
    "Resultado · " + score + "/" + quizItems.length + " (" + percent + "%)";
  $(".opciones", quiz).replaceChildren();
  $(".feedback", quiz).textContent = percent >= 70
    ? "Has superado la autoevaluación. Revisa los materiales antes de avanzar."
    : "Aún no has alcanzado el 70%. Consulta las unidades y vuelve a intentarlo.";
  $(".marcador", quiz).textContent = "Evaluación formativa, sin certificado.";
  $(".quiz-siguiente", quiz).hidden = false;
  $(".quiz-siguiente", quiz).textContent = "Repetir evaluación";
  const updated = saveQuizResult(readProgress(), selectedId, score, quizItems.length);
  writeProgress(updated);
}

async function loadQuiz() {
  const current = ++quizLoad;
  quizItems = [];
  index = 0;
  score = 0;
  const quiz = $(".quiz-box");
  $(".quiz-titulo", quiz).textContent = "Cargando preguntas…";
  $(".opciones", quiz).replaceChildren();
  $(".feedback", quiz).textContent = "";
  $(".marcador", quiz).textContent = "";
  $(".quiz-siguiente", quiz).hidden = true;
  try {
    const response = await fetch("cursos/" + selectedId + "/quiz.json", { credentials: "same-origin" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const result = validateQuiz(await response.json());
    if (current !== quizLoad) return;
    quizItems = result;
    renderQuestion();
  } catch {
    if (current === quizLoad) $(".quiz-titulo", quiz).textContent =
      "No se pudieron cargar las preguntas. Abre el campus con conexión una vez para instalar el material.";
  }
}

$(".quiz-siguiente").addEventListener("click", () => {
  if (!quizItems.length) return;
  if (index === quizItems.length) { index = 0; score = 0; renderQuestion(); return; }
  if (!answered) return;
  if (index === quizItems.length - 1) {
    finishQuiz();
    index = quizItems.length;
    return;
  }
  index++;
  renderQuestion();
});

$("#material-choice").addEventListener("change", () => void loadLesson());

for (const button of document.querySelectorAll("[data-course]")) {
  button.addEventListener("click", () => selectCourse(button.dataset.course));
}

$("#reset-progress").addEventListener("click", () => {
  if (!confirm("¿Borrar solo tus resultados de los tres cuestionarios en este dispositivo?")) return;
  if (writeProgress({})) setStatus("Progreso local borrado.");
});

$("#export-progress").addEventListener("click", () => {
  const data = {
    version: 1, exportedAt: new Date().toISOString(),
    description: "lingua-aberta / progreso local de cuestionarios",
    courses: readProgress(),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = create("a");
  link.href = url;
  link.download = "lingua-aberta-progreso.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

$("#idioma").addEventListener("change", event => {
  const language = event.target.value;
  if (!["pt", "es", "en", "ca"].includes(language)) return;
  const audio = $("#audio");
  $("#audio-src").src = "voces/bienvenida-" + language + ".mp3";
  audio.load();
});

window.addEventListener("storage", updateProgress);
window.addEventListener(STORAGE_EVENT, updateProgress);

// Subtle, optional entrance animation; respects reduced motion.
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  for (const [i, card] of [...document.querySelectorAll(".card")].entries()) {
    card.style.animation = "rise var(--dur-slow) var(--ease-out) both";
    card.style.animationDelay = Math.min(i * 60, 300) + "ms";
  }
}

// Convenient non-invasive accessibility scan for local QA.
window.uiAudit = () => {
  const issues = [];
  document.querySelectorAll("img:not([alt])").forEach(() => issues.push("Imagen sin alt"));
  document.querySelectorAll("a, button, select").forEach(el => {
    const bounds = el.getBoundingClientRect();
    if ((bounds.width < 44 || bounds.height < 44) && !el.disabled && bounds.width > 0)
      issues.push("Objetivo táctil pequeño: " + el.tagName);
  });
  return issues;
};

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => setStatus(
      "El material sigue disponible en línea. Este navegador no pudo activar el acceso sin conexión."));
  });
}

selectCourse(selectedId);
updateProgress();
