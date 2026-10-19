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


test('a real MIARA JSON backup can be restored only with known courses and lessons', async () => {
  const ts = await import('typescript');
  const { runInNewContext } = await import('node:vm');
  const source = readFileSync(resolve(root, 'client/src/lib/local-learning.ts'), 'utf8');
  const compiled = ts.default.transpileModule(source, {
    compilerOptions: { module: ts.default.ModuleKind.CommonJS, target: ts.default.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require: (name) => {
      if (!name.endsWith('miara_content.json')) throw new Error('Unexpected import ' + name);
      return data;
    },
  }, { filename: 'local-learning.transpiled.js', timeout: 2_000 });
  const { validateProgressBackup } = exports;

  const first = data.languages['Español'];
  const knownId = first.lessons[0].id;
  const good = validateProgressBackup(JSON.stringify({
    version: 1,
    progress: { [first.courseSlug]: [knownId, knownId] },
  }));
  assert.equal(good.ok, true);
  assert.equal(good.progress[first.courseSlug].length, 1);
  assert.equal(good.progress[first.courseSlug][0], knownId);

  for (const invalid of [
    'not-json',
    JSON.stringify({ version: 2, progress: {} }),
    JSON.stringify({ version: 1, progress: { unknown: [knownId] } }),
    JSON.stringify({ version: 1, progress: { [first.courseSlug]: ['unknown-id'] } }),
    JSON.stringify({ version: 1, progress: { [first.courseSlug]: 'not-an-array' } }),
    JSON.stringify({ version: 1, progress: { [first.courseSlug]: [knownId, null] } }),
    JSON.stringify({ version: 1, progress: { ['__proto__']: [knownId] }, unexpected: true }),
    ' '.repeat(16_385),
  ]) {
    const result = validateProgressBackup(invalid);
    assert.equal(result.ok, false, 'unexpected acceptance: ' + invalid.slice(0, 70));
  }
});

test('restoring progress stays local and requires user confirmation', () => {
  assert.match(practice, /validateProgressBackup\(await file\.text\(\)\)/);
  assert.match(practice, /window\.confirm\("Restaurar esta cópia\?/);
  assert.match(practice, /window\.localStorage\.setItem\(PROGRESS_KEY/);
  assert.match(practice, /file\.size > 16_384/);
  assert.doesNotMatch(practice, /fetch\(.+restore/i);
});
