import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import {
  LEARNING_LANGUAGES, learningCourses, readLocalProgress, saveCompletedLesson,
  courseCompletion, PROGRESS_KEY, type LearningLanguage, type LocalProgress,
} from "@/lib/local-learning";

function normalizeAnswer(input: string) {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase();
}

function speak(text: string, language: LearningLanguage) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return false;
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 800));
  utterance.lang = language === "Español" ? "es-ES" : language === "Català" ? "ca-ES" : "en-GB";
  utterance.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

export default function Practice() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const courseEntry = LEARNING_LANGUAGES.find((key) => learningCourses[key].courseSlug === slug);
  const course = courseEntry ? learningCourses[courseEntry] : null;
  const [lessonIndex, setLessonIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [progress, setProgress] = useState<LocalProgress>(() => readLocalProgress());
  const [notice, setNotice] = useState("");
  const lesson = course?.lessons[lessonIndex];
  const score = useMemo(() => course ? courseCompletion(course.courseSlug, progress) : null, [course, progress]);
  const passed = Boolean(lesson?.exercises.length && lesson.exercises.every(
    (ex, index) => normalizeAnswer(answers[index] ?? "") === normalizeAnswer(ex.answer),
  ));

  useEffect(() => {
    setAnswers({});
    setNotice("");
    window.speechSynthesis?.cancel();
  }, [lessonIndex, slug]);

  if (!course || !courseEntry) {
    return <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-bold">Curso não encontrado</h1>
      <p className="mt-3">Este curso ainda não está disponível no currículo local.</p>
      <Link href="/" className="mt-5 inline-block underline">Voltar ao campus</Link>
    </main>;
  }
  if (!lesson) return null;

  function finishLesson() {
    if (!passed) return;
    const result = saveCompletedLesson(course!.courseSlug, lesson!.id);
    setProgress(result.progress);
    setNotice(result.saved
      ? "Lição concluída e guardada neste navegador. Você pode continuar quando quiser."
      : "Lição concluída nesta sessão, mas o navegador não permitiu guardar o progresso.");
  }

  function exportProgress() {
    const contents = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), progress }, null, 2);
    const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "lingua-aberta-progresso.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setNotice("Cópia do progresso criada neste dispositivo, sem enviar dados para um servidor.");
  }

  function deleteProgress() {
    if (!window.confirm("Apagar o progresso local desta plataforma neste navegador?")) return;
    try {
      localStorage.removeItem(PROGRESS_KEY);
      setProgress({});
      setNotice("O progresso local foi apagado.");
    } catch {
      setNotice("O navegador não permitiu apagar o progresso. Verifique as permissões de armazenamento.");
    }
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-8 text-ink sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-semibold underline underline-offset-4">← Lingua Aberta</Link>
        <div className="mt-7 rounded-3xl bg-ink p-7 text-paper sm:p-10">
          <p className="font-mono text-xs uppercase tracking-widest text-saffron">MIARA · Aprendizagem real · 100% local</p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-5xl">{course.title}</h1>
          <p className="mt-3 text-sm text-white/70">{courseEntry} · {course.cefr} · {course.lessons.length} lições publicadas</p>
          <p className="mt-5">Concluídas: {score?.completed} de {score?.total} · {score?.percent}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full bg-saffron transition-all" style={{ width: `${score?.percent ?? 0}%` }} />
          </div>
        </div>

        <nav aria-label="Selecionar lição" className="mt-7 flex flex-wrap gap-2">
          {course.lessons.map((item, index) =>
            <button key={item.id} type="button" onClick={() => setLessonIndex(index)}
              aria-current={index === lessonIndex ? "step" : undefined}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${index === lessonIndex ? "border-ink bg-ink text-white" : "border-ink/15 bg-white"}`}>
              {index + 1}. {item.title} {progress[slug]?.includes(item.id) ? "✓" : ""}
            </button>)}
        </nav>

        <article className="mt-6 rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">Lição {lessonIndex + 1}</p>
          <h2 className="mt-2 text-2xl font-extrabold">{lesson.title}</h2>
          <p className="mt-2 text-ink/65">{lesson.situation}</p>
          <h3 className="mt-8 text-lg font-bold">Ouvir e praticar</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {lesson.phrases.map((phrase, index) => <div key={index} className="rounded-2xl bg-paper p-4">
              <p className="font-semibold">{phrase.text}</p>
              <p className="mt-1 text-sm text-ink/65">{phrase.translation}</p>
              <button type="button" className="mt-3 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white"
                onClick={() => { if (!speak(phrase.text, courseEntry)) setNotice("A leitura por voz não está disponível neste navegador."); }}>
                <span aria-hidden="true">▶ </span>Ouvir frase
              </button>
            </div>)}
          </div>
          <h3 className="mt-9 text-lg font-bold">Exercícios corrigidos no navegador</h3>
          <p className="text-sm text-ink/60">Responda corretamente a todos os exercícios para concluir esta lição.</p>
          <div className="mt-4 space-y-6">
            {lesson.exercises.map((exercise, index) => {
              const correct = normalizeAnswer(answers[index] ?? "") === normalizeAnswer(exercise.answer);
              return <fieldset key={index} className="rounded-2xl border border-ink/10 p-4">
                <legend className="px-2 text-sm font-semibold">{index + 1}. {exercise.prompt}</legend>
                {exercise.type === "choice" && exercise.options?.length ? (
                  <div className="mt-3 grid gap-2">
                    {exercise.options.map(option => <label key={option} className="flex items-start gap-3 text-sm">
                      <input type="radio" name={`exercise-${lesson.id}-${index}`} className="mt-1"
                        checked={answers[index] === option} onChange={() => setAnswers(previous => ({ ...previous, [index]: option }))} />
                      <span>{option}</span>
                    </label>)}
                  </div>
                ) : <input aria-label={exercise.prompt} value={answers[index] ?? ""} maxLength={180}
                  onChange={event => setAnswers(previous => ({ ...previous, [index]: event.target.value }))}
                  className="mt-3 w-full rounded-lg border border-ink/25 px-3 py-2" />}
                {answers[index]?.trim() && <p className="mt-3 text-sm" aria-live="polite">
                  {correct ? "✓ Resposta correta." : `Dica: ${exercise.hint ?? "Revise a frase acima."}`}
                </p>}
              </fieldset>;
            })}
          </div>
          <button type="button" disabled={!passed} onClick={finishLesson}
            className="mt-8 rounded-xl bg-ink px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
            {progress[slug]?.includes(lesson.id) ? "Concluir novamente" : "Concluir lição"}
          </button>
          {notice && <p role="status" className="mt-4 rounded-lg border p-3 text-sm">{notice}</p>}
        </article>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <button type="button" className="rounded-lg border border-ink/20 bg-white px-4 py-2" onClick={exportProgress}>Exportar progresso</button>
          <button type="button" className="rounded-lg border border-ink/20 bg-white px-4 py-2" onClick={deleteProgress}>Apagar progresso</button>
        </div>
        <p className="mt-4 max-w-2xl text-xs text-ink/60">
          As lições pertencem ao corpus educativo MIARA deste repositório. Os resultados ficam no seu navegador, não há conta ou sincronização remota. A voz usa as capacidades do navegador quando disponíveis.
        </p>
      </div>
    </main>
  );
}
