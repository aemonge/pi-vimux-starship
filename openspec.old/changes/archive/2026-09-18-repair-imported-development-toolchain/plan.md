# Plan: Establish clean standalone verification

- **Idea:** `share-pi-vimux-starship`
- **Method source:** predefined
- **Method name:** Fix
- **Method contract:** Characterize the inherited standalone-tooling failures, repair only their diagnosed causes, and prove the repair with discriminating clean-install, format, lint, typecheck, test, integrity, and planning-validation checks.
- **Execution source:** direct
- **Execution name:** Sequential root-toolchain repair
- **Execution reason:** One root lockfile, shared configuration, imported package manifests, and source-integrity metadata form one tightly coupled dependency boundary; sequential direct work keeps each repair and check attributable.
- **Execution outline:** Centralize and pin the workspace toolchain, repair bounded type/test/config defects without changing visible runtime behavior, then establish schema-aware planning validation and document the standalone boundary.
- **Estimate basis:** The Human-installed graph resolves 319 package entries; status passes 108 tests, Vim passes 13 tests plus strict typecheck, Header has one missing-fixture failure, Footer has three TypeBox-diagnostic failures and two strict typing failures, and the imported formatter style is recovered exactly at 88 columns.
- **Estimated implementation:** 45–75 minutes; Human wait excluded.
- **Estimate confidence:** Low because inherited Biome/ESLint behavior and clean `npm ci` have not yet been proven together.
- **Human-wait estimate:** Separate and unbounded after deterministic checks.
- **Refinement trigger:** Stop and split if a repair changes visible runtime behavior, requires another network operation, expands outside the named paths, or approaches 90 minutes.
- **Implementation confirmed at:** 2026-09-03T13:38:04Z
- **Implementation started at:** 2026-09-03T13:38:04Z
- **Work completed at:** 2026-09-03T14:00:32Z
- **Assurance started at:** 2026-09-03T14:00:32Z
- **Assurance completed at:** 2026-09-03T14:02:48Z
- **Ready for validation at:** 2026-09-03T14:02:48Z
- **Human validation:** VALID — original response `VALID`, recorded at 2026-09-03T14:06:08Z.

## Fix characterization

- **Symptom:** The moved project cannot run one honest root format/lint/typecheck/test gate: dependency versions drift by workspace, inherited formatter/linter files are absent, Header expects an absent fixture, Footer diagnostics differ under current TypeBox and strict typechecking reports two defects, and OpenSpec 1.6.0 rejects planning-only changes despite `skip_specs: true`.
- **Cause:** The handoff intentionally imported authored package trees without their Galactica parent development environment, retained two child lockfiles plus unconstrained development ranges, and relied on a planning metadata extension unsupported by upstream OpenSpec validation.
- **Bounded repair:** Own dependencies and development configuration at the standalone root, repair only the characterized type/test defects, preserve original import hashes separately from the evolved source manifest, and provide a tested schema-aware planning validator without modifying global OpenSpec.
- **Regression check:** A clean offline `npm ci` followed by root format, lint, strict typecheck, all component tests, current-source integrity, original-import record, schema-aware planning validation, and isolated Pi package loading passes.

## Value

Human can develop `pi-vimux-starship` as a clean standalone workspace whose verification does not depend on hidden Galactica parent files or silently incompatible package versions.

## Acceptance criteria

- [x] One root lockfile and pinned root development dependencies reproduce the workspace with offline `npm ci` after the Human-populated cache.
- [x] Repository-owned Prettier, Biome, ESLint, and TypeScript configuration runs without rewriting unrelated imported source.
- [x] Status, Header, Footer, and Vim checks pass; strict typechecking covers every authored TypeScript package.
- [x] The missing Header fixture and bounded Footer TypeBox/type defects are repaired without changing visible cockpit behavior.
- [x] The original import hash manifest remains immutable and distinct from the intentionally evolved current-source manifest.
- [x] A tested repository-local validator honors planning-only `skip_specs: true` while retaining strict upstream validation for changes that own spec deltas.
- [x] Offline isolated Pi package loading still succeeds and no Pi, Neovim, bridge, or protected settings are changed.
- [x] Human validates the clean development boundary before the blocked consolidation Task resumes.

## Scope and boundaries

Included paths are root package metadata and lockfile, root formatter/linter/typecheck configuration, baseline manifests and checker, a repository-local OpenSpec checker and test, bounded imported package manifests/config/type/test defects, development documentation, this Fix progress, and the blocked consolidation Task progress.

The exact confirmed path set is `AGENTS.md`, `package.json`, `package-lock.json`, `.prettierignore`, `.prettierrc.json`, `biome.json`, `eslint.config.js`, `tsconfig.json`, `baseline/source.sha256`, new `baseline/imported-source.sha256`, `scripts/check-baseline.mjs`, new `scripts/check-openspec.mjs`, new `test/check-openspec.test.ts`, `docs/baseline-evidence.md`, `docs/development.md`, the four workspace `package.json` files, removal of the two child `package-lock.json` files, new Footer and Vim `tsconfig.json` files, `packages/galactica-context-header/test/gauge.test.ts` plus its local fixture, all Footer `src/*.ts` files for one mechanical formatter boundary (with logic repairs limited to `config.ts`, `render.ts`, `shared.ts`, and `git.ts`), Vim `index.ts`, `prompt-rail.ts`, `word-boundary-cache.ts`, `test/external-editor-intercept.test.ts`, `test/prompt-external-editor.test.ts`, and `test/prompt-rail.test.ts`, this change's artifacts, and `openspec/changes/consolidate-imported-pi-cockpit/tasks.md`.

Excluded are header-deck visuals, telemetry redesign, Insert routing, Pi settings, Neovim configuration, bridge changes, global OpenSpec installation, further network operations, publication, destructive cleanup, and history rewriting. The Human-created root lockfile is expected scope. Original import evidence remains recoverable at Git root commit `9d7bb84`.

Read-only preflight and the final revised brief were presented before mutation. Human confirmed the exact revised brief with `YES` at 2026-09-03T13:38:04Z. The clean lint gate then exposed six Vim formatting/safe-regex paths plus one Footer dead-code path; Human confirmed that exact nonbehavioral addendum with `OK` at 2026-09-03T13:53:52Z. The complete formatting gate subsequently exposed 14 untouched Footer TypeScript files; Human confirmed their exact formatter-only addendum with `OK` at 2026-09-03T13:56:36Z. No protected Pi configuration or network authority carries from any confirmation.

## Method and execution

Fix is appropriate because the symptoms, causes, bounded repair, and discriminating checks are known. Direct execution is a bounded exception to Full Mode: dependency and configuration changes must remain synchronized with one lockfile and the affected tests. The earlier read-only audit used Taskflow, but implementation remains direct as declared.

Every Step uses only the named paths, nearest focused checks, one scoped Git checkpoint, and independent commit/path verification before the next Step. A material behavior or authority change stops for a revised brief.

## Verification

Run formatter writes only on edited files, repository-wide non-mutating format and lint checks, strict TypeScript checks, every component suite, baseline/current-source scripts, the schema-aware OpenSpec test and grouped check, a clean offline reinstall, and `pi --offline --no-extensions -e "$(pwd -P)" --list-models`. Human then runs the focused root checks and confirms the standalone development boundary.

**Final history target:** `fix(tooling): establish clean standalone verification`

**Checkpoint policy:** Each successful Step commits only declared tooling, source/test repair, documentation, and matching progress as `step(tooling): concise value`. Commit hashes are recorded in owner-only external receipts and independently verified. The final conventional Task commit waits for Human validation.
