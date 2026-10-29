import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { COURSES, courseFiles, validateQuiz, saveQuizResult, parseProgress } from "../campus/course-data.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "campus");
const source = file => readFileSync(join(root, file), "utf8");
const EXPECTED = Object.freeze({
  "falsos-amigos-pt-es": { weeks:4, quiz:40, duration:"4 semanas" },
  "catalan-a1-brasileiros": { weeks:4, quiz:24, duration:"4 semanas" },
  "espanol-academico-eso": { weeks:3, quiz:18, duration:"3 semanas" },
});

test("integrated curriculum has three identities, eleven lessons and 82 useful questions", () => {
  assert.deepEqual(COURSES.map(c => c.id).sort(), Object.keys(EXPECTED).sort());
  let weeks=0, questions=0;
  for(const course of COURSES) {
    const contract = EXPECTED[course.id];
    assert.equal(course.weeks, contract.weeks);
    assert.match(course.duration, new RegExp(contract.duration));
    const paths=courseFiles(course.id);
    assert.equal(paths.length,contract.weeks+3);
    for(const path of paths) {
      assert.ok(existsSync(join(root,path)),path+" not present in actual integrated checkout");
    }
    const quiz=validateQuiz(JSON.parse(source(paths.at(-1))));
    assert.equal(quiz.length,contract.quiz);
    assert.ok(quiz.every(q=>q.explicacion.trim().length>=50),course.id+" requires explanatory answers");
    questions+=quiz.length;
    for (let week=1;week<=course.weeks;week++){
      const file="cursos/"+course.id+"/semana-"+String(week).padStart(2,"0")+".md";
      assert.ok(source(file).trim().split(/\s+/).length>=600,file+" incomplete");
      weeks++;
    }
    const plan=source("cursos/"+course.id+"/syllabus.md");
    assert.match(plan,/no certificación|no constituye un examen oficial|no acredita|no representa una certificación/i);
  }
  assert.equal(weeks,11);
  assert.equal(questions,82);
});

test("public homepage includes the correct exam size for all three independent courses", () => {
  const html=source("index.html");
  assert.match(html,/type="module" src="app\.js"/);
  for(const course of COURSES) assert.ok(html.includes('data-course="'+course.id+'"'));
  assert.match(html,/examen de 40 casos/);
  assert.match(html,/evaluación de 24 preguntas/);
  assert.match(html,/evaluación de 18 preguntas/);
  assert.doesNotMatch(html,/quiz 5 items|quiz 3 items/);
  assert.doesNotMatch(html,/certificación garantizada|graduación automática/i);
});

test("offline installation must fetch the actual current curriculum instead of stale v2", () => {
  const sw=source("sw.js");
  assert.match(sw,/const CACHE = "lingua-aberta-campus-v4"/);
  assert.match(sw,/const PREFIX = "lingua-aberta-campus-"/);
  assert.match(sw,/const ROOT = self\.registration\.scope/);
  for(const course of COURSES){
    for(const path of courseFiles(course.id)){
      assert.ok(sw.includes('"./'+path+'"'),"Missing offline pre-cache "+path);
    }
  }
  assert.match(sw,/request\.method !== "GET"/);
  assert.match(sw,/url\.origin !== scope\.origin/);
  assert.match(sw,/key\.startsWith\(PREFIX\)/);
});

test("scoring counts completed attempts only and private progress stays local", () => {
  const student=COURSES[1].id, stamp=new Date("2026-10-22T01:00:00.000Z");
  const first=saveQuizResult({}, student, 17, 24, stamp);
  assert.equal(first[student].best,71);
  assert.equal(first[student].attempts,1);
  const next=saveQuizResult(first,student,9,24,stamp);
  assert.equal(next[student].best,71);
  assert.equal(next[student].attempts,2);
  const record=parseProgress(JSON.stringify({version:1,courses:next}));
  assert.equal(record[student].best,71);
  const app=source("app.js");
  assert.match(app,/localStorage\.setItem\(STORAGE_KEY/);
  assert.doesNotMatch(app,/fetch\(["']https:\/\//);
  assert.doesNotMatch(app,/sendBeacon|XMLHttpRequest/);
});

test("reviewable integration: all three independent curriculum acceptance suites exist", () => {
  const fs = [
    join(root,"../tests/pt-es-course-content.test.mjs"),
    join(root,"../tests/catalan-eso-curriculum.test.mjs"),
    join(root,"../tests/campus-product.test.mjs"),
  ];
  for(const file of fs) assert.ok(existsSync(file),"Expected dedicated acceptance suite "+file);
});
