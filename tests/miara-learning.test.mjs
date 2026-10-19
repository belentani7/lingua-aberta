import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve('.');
const data = JSON.parse(readFileSync(resolve(root, 'server/miara_content.json'), 'utf8'));
const home = readFileSync(resolve(root, 'client/src/pages/Home.tsx'), 'utf8');
const practice = readFileSync(resolve(root, 'client/src/pages/Practice.tsx'), 'utf8');
const local = readFileSync(resolve(root, 'client/src/lib/local-learning.ts'), 'utf8');
const app = readFileSync(resolve(root, 'client/src/App.tsx'), 'utf8');

test('curriculum uses real, named lessons and assessable answers in all three courses', () => {
  const languages = ['Español', 'Català', 'English'];
  assert.deepEqual(Object.keys(data.languages), languages);
  const slugs = new Set();
  const ids = new Set();
  for (const language of languages) {
    const course = data.languages[language];
    assert.match(course.courseSlug, /^[a-z0-9-]+$/);
    assert.ok(!slugs.has(course.courseSlug)); slugs.add(course.courseSlug);
    assert.ok(course.lessons.length >= 1);
    for (const lesson of course.lessons) {
      assert.ok(!ids.has(lesson.id)); ids.add(lesson.id);
      assert.ok(lesson.title && lesson.situation && lesson.phrases?.length);
      assert.ok(lesson.exercises?.length > 0, lesson.id);
      for (const exercise of lesson.exercises) {
        assert.ok(['choice','fill'].includes(exercise.type));
        assert.equal(typeof exercise.answer, 'string');
        assert.ok(exercise.answer.trim());
        if (exercise.type === 'choice') assert.ok(exercise.options.includes(exercise.answer));
      }
    }
  }
});

test('real local learning is reachable without a remote login or API', () => {
  assert.match(app, /path="\/study\/:slug"/);
  assert.match(home, /navigate\(`\/study\/\$\{selectedCourse.courseSlug\}`\)/);
  assert.match(practice, /lesson\.exercises\.every/);
  assert.match(practice, /saveCompletedLesson\(/);
  assert.match(practice, /exportProgress\(/);
  assert.match(practice, /deleteProgress\(/);
  assert.match(local, /window\.localStorage\.setItem/);
  assert.match(local, /validCourses\.get/);
});

test('home must not invent progress, streaks, authenticated users or AI connectivity', () => {
  assert.doesNotMatch(home, /trpc\.|isAuthenticated|startLogin/);
  assert.doesNotMatch(home, /7 dias de sequência|82% da comunidade|03<span|Quarta-feira, 18 de setembro/);
  assert.match(home, /Tutor guiado local · sem IA remota/);
  assert.match(home, /courseCompletion\(/);
  assert.match(home, /Sem conta/);
});
