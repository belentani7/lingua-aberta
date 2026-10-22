# Lingua Aberta — Integrated Campus Release Candidate (2026-10-22)

**Status: DRAFT — not deployed, not merged, not officially accredited.**

This candidate unifies three *existing* branches in the existing `lingua-aberta`
repository. It does not create a new product, change repo visibility or reuse
other brands. It preserves the reader and the original lesson package, including
the course data, other lesson files, privacy boundaries and the offline worker.

## Exact source commits merged without rewriting history

- Reader, quiz UI, local browser progress and scoped offline service worker:
  PR **#57**, `758f8d1d46abe7b4a635eafa47654f390c2249bc`.
- PT-BR ↔ ES: four teaching units, syllabus and 40-question contextual exam:
  PR **#59**, `d81af4b4cb289a406bc37b7c6829b6655ef131f4`.
- Català A1 and Español académico ESO: seven teaching units, two syllabi,
  24 + 18 question banks: PR **#61**,
  `caf1f9af5ece4c7adb59a5f8ccb8ba3129dcba26`.

A three-parent Git commit contains the combined tree. The merger touched
exactly 21 curriculum/test/workflow paths and reconciled two additional shared
assets: the course cards in `campus/index.html` and the offline cache version
in `campus/sw.js`. No user lesson content, database migration, credentials,
unrelated branding, Git history or deployment configuration was deleted.

## Concrete student-facing deliverables

| Course | Reading units | Question bank | Study plan |
| --- | ---: | ---: | ---: |
| PT-BR ↔ ES — Falsos amigos | 4 | 40 | 4 weeks, 12 h |
| Català A1 inicial | 4 | 24 | 4 weeks, 16 h |
| Español académico ESO | 3 | 18 | 3 weeks, 10 h |
| **Campus total** | **11** | **82** | **38 h** |

Every question has explanatory feedback and four distinct choices. Activities
include worked exercises, original lessons, answer keys, essays, dialogues,
time plans, rubrics and student privacy guidance. Levels are indicative:
**no official CEFR, ESO, academy or university credential is issued.**

The campus offers a local-progress model and an offline pack via a same-origin
service worker. It does **not** need a user account to use the reading material.
The quiz can be taken again; saving best results is device-local and can be
cleared. No backend database is promised for campus quizzes.

## Offline cache update

The SW cache namespace is **v3**, rather than **v2** from the reader branch.
This matters because the course JSON and Markdown files keep the same names
but now carry substantially more real content. A new SW install must fetch the
new pack rather than indefinitely serving its earlier cached versions.

## Executable acceptance contracts

```bash
node --check campus/app.js
node --check campus/course-data.mjs
node --check campus/sw.js
node --test tests/campus-product.test.mjs \
  tests/pt-es-course-content.test.mjs \
  tests/catalan-eso-curriculum.test.mjs \
  tests/full-campus-integration.test.mjs
```

The workflow `.github/workflows/full-campus-acceptance.yml` also runs these
checks on eligible pull requests. Separately validate the React monorepo only
against its real original dependency/lockfile graph. Do not replace the
root package with a generic Vite scaffold just to make a workflow green.

## Release gate still required

1. **GitHub Actions**: runner starts and the real Node and framework CI pass.
   Previous workflows repeatedly concluded failure without step execution.
2. **Browser E2E**: desktop, mobile, keyboard and screen-reader basics; choose
   each of the three courses, open all 11 units and finish each quiz.
3. **Offline**: install SW on localhost/HTTPS while online, close network,
   reload lessons and quizzes, check no stale v2 content is returned.
4. **Privacy**: inspect localStorage export/erase, escape/sanitization,
   personal data and child-facing copy; no raw PII, tokens or tracking calls.
5. **Visual/design**: confirm that the original cold, accessible brand survives,
   navigation has no dead links, and all three curricula are discoverable.
6. **Deployment**: deploy a preview from the **exact integration commit** to
   the correct canonical Vercel project, verify HTTP, headers and course assets;
   promote only after reviewer sign-off with a rollback plan.

Do **not** mark any course or the whole portfolio as publicly released until
these results exist. A successful Markdown/JSON check proves content structure,
not full teaching efficacy, accessible runtime or production operation.
