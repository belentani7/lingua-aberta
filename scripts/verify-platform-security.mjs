/**
 * Web security and curriculum-source gate, intentionally dependency-free.
 * Run before package installation in CI to catch unsafe deployment changes.
 * Applies to the entire site, not only the new course portal.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname, join } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = path => JSON.parse(readFileSync(join(root, path), "utf8"));
const vercel = readJson("vercel.json");
assert.ok(Array.isArray(vercel.headers), "Vercel response security headers are required");
const common = vercel.headers.find(rule => rule.source === "/(.*)");
assert.ok(common && Array.isArray(common.headers), "A site-wide Vercel header rule is required");
const header = name => common.headers.find(h => h.key.toLowerCase() === name.toLowerCase())?.value;
assert.equal(header("X-Content-Type-Options"), "nosniff");
assert.equal(header("X-Frame-Options"), "DENY");
assert.equal(header("X-XSS-Protection"), "0", "Disable deprecated browser XSS auditors");
assert.equal(header("X-Permitted-Cross-Domain-Policies"), "none");
assert.ok(["no-referrer", "strict-origin-when-cross-origin"].includes(header("Referrer-Policy")));
assert.ok(header("Permissions-Policy")?.includes("geolocation=()"));
assert.ok(/^max-age=\d{6,}/.test(header("Strict-Transport-Security") ?? ""));
const csp = header("Content-Security-Policy") || "";
for (const directive of ["object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "form-action 'self'"]) {
  assert.ok(csp.includes(directive), "CSP missing: " + directive);
}
assert.ok(!common.headers.some(h => h.key.toLowerCase() === "access-control-allow-origin" && h.value.trim() === "*"), "Do not expose a blanket CORS policy");

const candidateManifests = [
  "campus/itinerarios/curso-manifest.json",
  "public/itinerarios/curso-manifest.json",
  "client/public/itinerarios/curso-manifest.json",
];
for (const filepath of candidateManifests) {
  if (!existsSync(join(root, filepath))) continue;
  const manifest = readJson(filepath);
  assert.ok(Array.isArray(manifest.courses), "Course index must be an array");
  const ids = new Set();
  for (const c of manifest.courses) {
    assert.match(c.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Unsafe course slug");
    assert.ok(!ids.has(c.slug), "Duplicate course ID: " + c.slug);
    ids.add(c.slug);
    assert.ok(Array.isArray(c.weeks) && c.weeks.length > 0, "Course with no real units");
    const source = c.slug === "ux-profesional" ? join(root, "campus/ux-profesional") : join(root, "campus/cursos", c.slug);
    assert.ok(existsSync(source), "Missing source course: " + source);
    const available = readdirSync(source).filter(n => /^semana-\d{2}\.md$/.test(n) && statSync(join(source, n)).isFile());
    const published = new Set(c.weeks);
    assert.equal(published.size, c.weeks.length, "Duplicate published week");
    for (const n of available) {
      assert.ok(published.has(Number(n.slice(7, 9))), "Available content missing from published catalogue: " + source + "/" + n);
    }
    for (const week of published) {
      assert.ok(Number.isInteger(week) && week >= 1 && week <= 52, "Invalid week number");
      const filename = "semana-" + String(week).padStart(2, "0") + ".md";
      assert.ok(existsSync(join(source, filename)), "Missing linked lesson: " + filename);
    }
    assert.ok(existsSync(join(source, "quiz.json")), "Missing original course assessment: " + source);
    const questions = readJson(join(source, "quiz.json").slice(root.length + 1));
    assert.ok(Array.isArray(questions), "Course assessment must be a question array");
  }
}

if (existsSync(join(root, "client/src/data/curriculum.json"))) {
  const curriculum = readJson("client/src/data/curriculum.json");
  assert.ok(Array.isArray(curriculum.modules) && curriculum.modules.length > 0);
  assert.ok(Array.isArray(curriculum.tracks) && curriculum.tracks.length > 0);
  const allowedTracks = new Set(curriculum.tracks.map(track => track.id));
  const ids = new Set();
  for (const unit of curriculum.modules) {
    assert.ok(!ids.has(unit.id), "Duplicate module identifier");
    ids.add(unit.id);
    assert.ok(allowedTracks.has(unit.track_id), "Module not assigned to a valid track");
    assert.ok(Array.isArray(unit.steps) && unit.steps.length >= 1, "Course missing learning steps");
  }
}
if (existsSync(join(root, "public/modules/belentani/curriculumData__ACADEMIC_MODULES.json"))) {
  for (const source of [
    "public/modules/belentani/curriculumData__ACADEMIC_MODULES.json",
    "public/modules/manos-abiertas/educationData__EDUCATION_COURSES.json",
    "public/modules/belentani/omegaCourseraPythonHub__OMEGA_COURSE_TRACKS.json",
  ]) {
    const curriculum = readJson(source);
    assert.ok(Array.isArray(curriculum) && curriculum.length > 0, "Empty educational data: " + source);
  }
}
console.log("PASS: deployment security headers, browser policies and curricular source integrity");
