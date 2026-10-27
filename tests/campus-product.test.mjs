import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import {
  COURSES, courseFiles, validateQuiz, parseProgress, saveQuizResult, importProgressBackup, STORAGE_KEY,
} from "../campus/course-data.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = join(root, "campus");
const read = path => readFileSync(join(base, path), "utf8");

test("three real courses have full independent reading and quiz packs", () => {
  assert.equal(COURSES.length, 3);
  assert.equal(new Set(COURSES.map(c => c.id)).size, 3);
  let totalWeeks = 0;
  for (const course of COURSES) {
    const files = courseFiles(course.id);
    assert.equal(files.length, course.weeks + 3);
    assert.ok(course.title.length >= 18);
    assert.ok(course.purpose.length > 25);
    assert.ok(course.duration);
    for (const item of files) {
      assert.match(item, /^cursos\/[a-z0-9-]+\/[a-z0-9.-]+$/);
      assert.ok(existsSync(join(base, item)), "Course asset missing: " + item);
      assert.ok(read(item).length > 100, "Course asset empty: " + item);
    }
    const quiz = validateQuiz(JSON.parse(read(files.at(-1))));
    assert.ok(quiz.length >= 3);
    totalWeeks += course.weeks;
  }
  assert.equal(totalWeeks, 11);
});

test("assessment tracks completed quiz results, never visits", () => {
  const id = COURSES[0].id;
  const d = new Date("2026-10-21T10:00:00.000Z");
  const first = saveQuizResult({}, id, 2, 5, d);
  assert.equal(first[id].best, 40);
  assert.equal(first[id].attempts, 1);
  const second = saveQuizResult(first, id, 5, 5, d);
  assert.equal(second[id].best, 100);
  assert.equal(second[id].attempts, 2);
  const third = saveQuizResult(second, id, 1, 5, d);
  assert.equal(third[id].best, 100);
  assert.equal(third[id].attempts, 3);
  assert.throws(() => saveQuizResult({}, "../bad", 4, 5), /Curso/);
  assert.throws(() => saveQuizResult({}, id, 6, 5), /Puntuación/);
  assert.throws(() => saveQuizResult({}, id, 0, 0), /Puntuación/);
});

test("browser progress loader rejects invalid, foreign or oversized state", () => {
  const id = COURSES[0].id;
  const record = { best: 80, attempts: 2, updatedAt: "2026-10-21T10:00:00.000Z" };
  const parsed = parseProgress(JSON.stringify({ version: 1, courses: {
    [id]: record, foreign: record, [COURSES[1].id]: { ...record, best: 170 },
  }}));
  assert.deepEqual(Object.keys(parsed), [id]);
  assert.deepEqual({ ...parsed[id] }, record);
  assert.deepEqual(Object.keys(parseProgress("broken")), []);
  assert.deepEqual(Object.keys(parseProgress('{"version":2,"courses":{}}')), []);
  assert.deepEqual(Object.keys(parseProgress("x".repeat(15001))), []);
  assert.match(STORAGE_KEY, /^lingua-aberta:/);
});

test("malformed quizzes fail closed without executable markup", () => {
  assert.throws(() => validateQuiz([]), /cuestionario/i);
  assert.throws(() => validateQuiz([{ pregunta: "Pregunta inválida", opciones: ["a", "b"], correcta: 5, explicacion: "error" }]), /validación/i);
  const question = {
    pregunta: "¿Qué significan los falsos amigos?", opciones: ["a", "b"],
    correcta: 1, explicacion: "Son expresiones de diferente significado.",
  };
  assert.throws(() => validateQuiz([question, { ...question }]), /duplicada/i);
});

test("quiz validation rejects indistinguishable choices and repeated questions", () => {
  const question = {
    pregunta: "¿Qué significan los falsos amigos?",
    opciones: ["Correcta", "Incorrecta"],
    correcta: 0,
    explicacion: "Las opciones deben ser inequívocas para evaluar.",
  };
  assert.throws(() => validateQuiz([{ ...question, opciones: ["Sí", " sí  "] }]), /opciones duplicadas/);
  assert.throws(() => validateQuiz([{ ...question, opciones: ["café", "cafe\u0301"] }]), /opciones duplicadas/);
  assert.throws(() => validateQuiz([question, { ...question, pregunta: "¿Qué   significan los falsos amigos? " }]), /Pregunta duplicada/);
  assert.equal(validateQuiz([question])[0].correcta, 0);
});

test("all resources required by offline worker exist; it touches no other app caches", () => {
  const sw = read("sw.js");
  const assets = [...sw.matchAll(/"(\.\/[^"]+)"/g)].map(m => m[1]).filter(path => !path.includes("?"));
  for (const asset of assets) {
    assert.ok(existsSync(join(base, asset)), "SW precache missing file: " + asset);
  }
  for (const course of COURSES) {
    for (const asset of courseFiles(course.id)) {
      assert.ok(sw.includes('"./' + asset + '"'), "SW does not precache " + asset);
    }
  }
  assert.ok(sw.includes('key.startsWith(PREFIX)'));
  assert.ok(sw.includes('url.origin !== scope.origin'));
  assert.ok(sw.includes('request.method !== "GET"'));
});

test("homepage binds all course selectors and full academic controls", () => {
  const html = read("index.html");
  const app = read("app.js");
  assert.match(html, /type="module" src="app\.js"/);
  for (const course of COURSES) {
    assert.ok(html.includes('data-course="' + course.id + '"'));
    assert.ok(html.includes('data-course-state="' + course.id + '"'));
  }
  for (const id of ["material-choice", "lesson-document", "quiz", "progress-figure", "campus-status", "idioma"]) {
    assert.ok(html.includes('id="' + id + '"'), "Missing campus element " + id);
  }
  assert.match(app, /validateQuiz/);
  assert.match(app, /textContent/);
  assert.doesNotMatch(app, /\.innerHTML\s*=/);
  assert.match(read("manifest.webmanifest"), /icon\.svg/);
});

test("imported backups merge best scores without double-counting attempts", () => {
  const first = COURSES[0].id;
  const second = COURSES[1].id;
  const existing = {
    [first]: { best: 85, attempts: 2, updatedAt: "2026-10-21T10:00:00.000Z" },
  };
  const exported = JSON.stringify({
    version: 1,
    description: "lingua-aberta / progreso local de cuestionarios",
    courses: {
      [first]: { best: 70, attempts: 4, updatedAt: "2026-10-20T10:00:00.000Z" },
      [second]: { best: 90, attempts: 1, updatedAt: "2026-10-22T10:00:00.000Z" },
    },
  });
  const merged = importProgressBackup(exported, existing);
  assert.equal(merged[first].best, 85);
  assert.equal(merged[first].attempts, 4);
  assert.equal(merged[first].updatedAt, "2026-10-21T10:00:00.000Z");
  assert.equal(merged[second].best, 90);
  assert.deepEqual(importProgressBackup(exported, merged), merged);
  assert.deepEqual(existing[first], { best: 85, attempts: 2, updatedAt: "2026-10-21T10:00:00.000Z" });
});

test("progress import rejects foreign, invalid and oversized backups", () => {
  const valid = {
    version: 1,
    description: "lingua-aberta / progreso local de cuestionarios",
    courses: {},
  };
  assert.deepEqual(importProgressBackup(JSON.stringify(valid)), {});
  assert.throws(() => importProgressBackup("x".repeat(15001)), /grande/);
  assert.throws(() => importProgressBackup("not-json"), /JSON/);
  assert.throws(() => importProgressBackup(JSON.stringify({ ...valid, description: "other" })), /lingua-aberta/);
  assert.throws(() => importProgressBackup(JSON.stringify({ ...valid, courses: { foreign: {} } })), /reconocidos/);
  assert.throws(() => importProgressBackup(JSON.stringify({
    ...valid, courses: { [COURSES[0].id]: { best: 120, attempts: 1, updatedAt: "2026-10-20T10:00:00.000Z" } },
  })), /inválidos/);
});

test("campus offers a real import control bound to the local-only flow", () => {
  const html = read("index.html");
  const app = read("app.js");
  assert.match(html, /id="import-trigger"/);
  assert.match(html, /id="import-progress" type="file"/);
  assert.match(app, /importProgressBackup\(await file\.text\(\), readProgress\(\)\)/);
  assert.doesNotMatch(app, /fetch\(.*import-progress/);
});
