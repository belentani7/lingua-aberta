import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const course = join(root, "campus/cursos/falsos-amigos-pt-es");
const read = file => readFileSync(join(course, file), "utf8");
const syllabus = read("syllabus.md");
const quiz = JSON.parse(read("quiz.json"));

test("all four lessons contain actual worked practice, solutions and study schedule", () => {
  for (let i = 1; i <= 4; i++) {
    const name = "semana-" + String(i).padStart(2, "0") + ".md";
    const source = read(name);
    assert.ok(source.split(/\s+/).length >= 600, name + " lacks substantive course material");
    assert.ok(source.includes("# Semana " + i), name + " has no week title");
    assert.ok(source.includes("180 min") || source.includes("3 horas") || source.includes("tres horas"), name + " lacks a realistic practice plan");
    assert.ok(syllabus.includes("(" + name + ")"), name + " is absent from syllabus");
  }
  assert.match(read("semana-01.md"), /Soluciones razonadas/);
  assert.match(read("semana-02.md"), /Clave de respuestas/);
  assert.match(read("semana-03.md"), /Clave comentada/);
  assert.match(read("semana-04.md"), /Rúbrica de evaluación/);
});

test("the promised 40-case final examination is present and has valid feedback", () => {
  assert.equal(quiz.length, 40);
  assert.equal(new Set(quiz.map(item => item.pregunta.trim().toLowerCase())).size, 40);
  for (const [i, item] of quiz.entries()) {
    assert.ok(item.pregunta.trim().length > 15, "question " + i);
    assert.equal(item.opciones.length, 4, "four real choices " + i);
    assert.equal(new Set(item.opciones).size, 4, "distinct choices " + i);
    assert.ok(Number.isInteger(item.correcta) && item.correcta >= 0 && item.correcta < 4, "correct choice " + i);
    assert.ok(item.explicacion.trim().length >= 50, "substantive explanation " + i);
    assert.ok(!/[<>]/.test(item.pregunta + item.explicacion), "no injected markup " + i);
  }
  assert.deepEqual([0,1,2,3].map(p => quiz.filter(q => q.correcta === p).length), [10,10,10,10]);
  assert.match(read("semana-04.md"), /40 preguntas diferentes/);
  assert.match(syllabus, /40 casos contextualizados/);
});

test("homepage claims match real content and never invent a qualification", () => {
  const html = readFileSync(join(root,"campus/index.html"),"utf8");
  assert.match(html, /4 semanas · 12 h · examen de 40 casos/);
  assert.doesNotMatch(html, /4 semanas · 12 h · quiz 5 items/);
  assert.match(syllabus, /no representa una certificación|no representa una certificación/i);
  assert.match(read("semana-04.md"), /sin certificado|no otorga título|no otorga título ni certificación/i);
});

test("course units link locally and never promise unavailable weekly audio", () => {
  for (let i=1;i<=4;i++) {
    const text = read("semana-"+String(i).padStart(2,"0")+".md");
    assert.ok(text.includes("(syllabus.md)"), "missing accessible return to syllabus in week "+i);
  }
  assert.match(syllabus, /no promete audio específico por lección/);
  assert.ok(!syllabus.includes("Evaluacion estilo Harvard"));
});
