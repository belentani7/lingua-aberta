import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(".");
const read = path => readFileSync(resolve(root,path),"utf8");
const data = JSON.parse(read("server/miara_content.json"));

test("public site is validly organized and accessible without a forced portal link wall", () => {
  const html = read("client/index.html");
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /<main|id="root"/);
  assert.match(html, /href="#root"/);
  assert.match(html, /<meta name="description"/);
  assert.ok(html.indexOf("</body>") > html.indexOf('id="root"'));
  assert.equal((html.match(/<body>/g)||[]).length,1);
  assert.equal((html.match(/<\/body>/g)||[]).length,1);
  assert.doesNotMatch(html, /<p[^>]*>[\s\S]*<\/body>[\s\S]*<\/html>/i);
});

test("real education is integrated with complete front routes", () => {
  const app = read("client/src/App.tsx");
  const home = read("client/src/pages/Home.tsx");
  const practice = read("client/src/pages/Practice.tsx");
  assert.match(app,/path="\/study\/:slug"/);
  assert.match(app,/GameArena/);
  assert.match(home,/learningCourses/);
  assert.match(practice,/saveCompletedLesson/);
  assert.match(practice,/validateProgressBackup/);
});

test("every published MIARA lesson has exercises, correct answer and instructional content", () => {
  assert.deepEqual(Object.keys(data.languages), ["Español","Català","English"]);
  const all = new Set();
  for (const [language, course] of Object.entries(data.languages)) {
    assert.match(course.courseSlug,/^[a-z0-9-]+$/);
    assert.ok(Array.isArray(course.lessons)&&course.lessons.length>0,language);
    for (const lesson of course.lessons) {
      assert.ok(!all.has(lesson.id),lesson.id);all.add(lesson.id);
      assert.ok(lesson.title && lesson.situation);
      assert.ok(lesson.phrases?.length>0);
      assert.ok(lesson.exercises?.length>0);
      for(const exercise of lesson.exercises){
        assert.ok(typeof exercise.answer==="string"&&exercise.answer.trim());
        if(exercise.type==="choice")assert.ok(exercise.options?.includes(exercise.answer));
      }
    }
  }
});

test("original alternate campus and resources are retained",()=>{
  for(const file of ["campus/index.html","campus/app.js","campus/tokens.css","campus/cursos/falsos-amigos-pt-es/syllabus.md","client/public/open-data/index.html","client/src/components/games/GameArena.tsx"]){
    assert.ok(existsSync(resolve(root,file)),file);
  }
});
