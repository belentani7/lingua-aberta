import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

for (const provider of ['vercel', 'cloudflare', 'netlify']) {
  test(`${provider} no anuncia éxito sin intentar el despliegue`, () => {
    const path = fileURLToPath(new URL(`../.github/workflows/deploy-${provider}.yml`, import.meta.url));
    const workflow = readFileSync(path, 'utf8');
    assert.match(workflow, /^on:\s*\n\s+workflow_dispatch:/m);
    assert.doesNotMatch(workflow, /^\s+push:/m);
    assert.match(workflow, /::error::Missing/);
    assert.match(workflow, /exit 1/);
    assert.match(workflow, /refs\/heads\/main/);
    assert.match(workflow, /persist-credentials: false/);
    assert.match(workflow, /pnpm install --frozen-lockfile/);
    assert.match(workflow, /pnpm run check/);
    assert.match(workflow, /pnpm run build/);
    assert.match(workflow, /test -s dist\/public\/index\.html/);
    assert.doesNotMatch(workflow, /steps\.creds\.outputs\.ready/);
    assert.doesNotMatch(workflow, /--no-frozen-lockfile/);
  });
}
