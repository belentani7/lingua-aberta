import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (name) => readFileSync(join(root, name), 'utf8');
const fixtures = ['knowledge_base.json', 'server/miara_content.json'];
const src = [
  'client/src/components/games/GameArena.tsx',
  'client/src/components/games/minigames.ts',
  'client/src/pages/Home.tsx',
  'campus/juegos/juego_falsos_amigos.py',
  'OPEN_TONGUE.md',
];

test('demonstration data is synthetic and preserves content structure', () => {
  const knowledge = JSON.parse(read(fixtures[0]));
  const miara = JSON.parse(read(fixtures[1]));
  assert.match(knowledge.target_student.id, /^DEMO-LEARNER-/);
  assert.match(knowledge.target_student.name, /ficticio/i);
  assert.match(miara.student.name, /ficticio/i);
  assert.match(miara.description, /ficticios/i);
  assert.equal(knowledge.games.length, 10);
  assert.deepEqual(Object.keys(miara.languages).sort(), ['Català', 'English', 'Español'].sort());
  assert.ok(!('email' in knowledge.target_student));
});

test('game and learner copy do not identify the original demo student', () => {
  const deprecatedName = ['Will', 'iam'].join('');
  const files = [...src, ...fixtures, 'drizzle/0000_amused_queen_noir.sql'];
  for (const name of files) {
    assert.equal(read(name).includes(deprecatedName), false, name);
  }
  assert.match(read('OPEN_TONGUE.md'), /data\/course-test-student\.json/);
  assert.match(read('drizzle/0000_amused_queen_noir.sql'), /DEFAULT 'nivel de prueba'/);
});
