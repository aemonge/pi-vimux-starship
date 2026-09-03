# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Establish clean standalone verification

- **Value:** Human can install dependencies once at the standalone root and run honest reproducible checks without hidden Galactica parent configuration.
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
- **Takeover confirmed at:** 2026-09-03T14:00:32Z
- **Takeover resumed at:** 2026-09-03T14:00:32Z
- **Work completed at:** 2026-09-03T14:00:32Z
- **Assurance started at:** 2026-09-03T14:00:32Z
- **Assurance completed at:** 2026-09-03T14:02:48Z
- **Ready for validation at:** 2026-09-03T14:02:48Z
- **Actual implementation:** Approximately 16–18 minutes; takeover assurance added 2m16s after two earlier bounded Human confirmation waits.
- **Observed Human wait:** 3m20s after ready-for-validation; two earlier scope-addendum waits remain separate.
- **Estimate outcome:** Faster than the 45–75 minute low-confidence range because the Human-populated cache resolved the pinned graph and both source defects were already discriminated; formatter and stale-lock discovery added scope but remained mechanical.
- **Symptom:** Root checks depend on missing parent configuration, version-skewed workspace installs, one missing fixture, three TypeBox-diagnostic mismatches, two Footer type defects, and unsupported planning-only strict validation.
- **Cause:** The imported authored trees omitted Galactica's parent development environment and retained package-local dependency assumptions rather than one standalone root boundary.
- **Bounded repair:** Centralize tooling, repair only diagnosed nonvisual defects, separate original and current integrity manifests, and add schema-aware local planning validation.
- **Regression check:** Clean offline install plus all root deterministic checks and isolated package loading passes.
- **Final history target:** `fix(tooling): establish clean standalone verification`
- **Current non-Git boundary:** Not applicable; the repository uses Git.
- **Human validation:** VALID — original response `VALID`, canonical outcome `VALID`, recorded at 2026-09-03T14:06:08Z.

- [x] Step 1.1 Centralize and pin the standalone dependency, formatting, lint, and TypeScript boundary.
  - Estimate: 15–25 minutes; uncertainty was npm override behavior across the version-skewed imported workspaces.
  - Timing: 2026-09-03T13:38:04Z–2026-09-03T13:43:03Z (4m59s implementation and focused checks).
  - Check: Offline root `npm ci` installed 259 packages; after removing stale generated child `node_modules`, `npm ls` resolves all workspace Pi peers to 0.84.4 and root TypeBox peers to 1.3.25; Prettier config/package checks and `node --check eslint.config.js` pass. The original baseline passed before this intentional replacement and now reports the expected changed file set until Step 1.2 establishes dual manifests.
  - Paths: `package.json`, `package-lock.json`, `.prettierignore`, `.prettierrc.json`, `biome.json`, `eslint.config.js`, `tsconfig.json`, four workspace `package.json` files, removed Status/Header child lockfiles, new Footer/Vim `tsconfig.json` files, and this Fix change.
  - History: Expected `step(tooling): centralize standalone development dependencies`.
- [x] Step 1.2 Repair the characterized fixture, TypeBox diagnostic, Footer type, and source-integrity defects without visible runtime change.
  - Estimate: 15–25 minutes; uncertainty was retaining exact validation messages across TypeBox versions.
  - Timing: 2026-09-03T13:44:21Z–2026-09-03T13:46:55Z (2m34s implementation and focused checks).
  - Check: Header 69/69 and Footer 158/158 tests pass under root dependencies; Footer strict TypeScript and focused Prettier checks pass; current source integrity passes for 88 files and the immutable original import record passes for 87 files.
  - Paths: `baseline/source.sha256`, new `baseline/imported-source.sha256`, `scripts/check-baseline.mjs`, Header fixture and its test reference, Footer `src/config.ts`, `src/render.ts`, `src/shared.ts`, and this Task ledger.
  - History: Expected `step(tooling): repair imported verification defects`.
- [x] Step 1.3 Add schema-aware planning validation, document the standalone boundary, and prove a clean offline reinstall.
  - Estimate: 15–25 minutes; uncertainty was clean-install behavior after removing child lockfiles.
  - Timing: 2026-09-03T13:47:39Z–2026-09-03T14:02:48Z (15m09s wall time including two earlier Human confirmation waits and independent takeover assurance).
  - Check: PASS — independently rerun after takeover. Root and clean-copy `npm run check` pass current/original integrity, Prettier, zero-finding Biome and ESLint, strict TypeScript, 4 tooling tests, Status 108/108, Header 69/69, Footer 158/158, Vim 13/13, and four schema-aware OpenSpec changes. A clean offline `npm ci` installs 241 packages with no child `node_modules`; all workspace Pi peers resolve to 0.84.4. Isolated offline Pi loading passes, and `npm pack --dry-run` reports 122 credential-free files with no generated dependency trees.
  - Paths: `.prettierignore`, `AGENTS.md`, `biome.json`, `package.json`, `package-lock.json`, `tsconfig.json`, `scripts/check-openspec.mjs`, `test/check-openspec.test.ts`, `docs/baseline-evidence.md`, `docs/development.md`, current source manifest, approved mechanical Footer/Vim formatting and dead-code cleanup, this Fix Plan/Task, and blocked consolidation Task progress.
  - History: Expected `step(tooling): prove standalone verification boundary`.

### Human validation

- [x] Human ran the documented validation boundary and replied `VALID`; canonical outcome `VALID`, recorded at 2026-09-03T14:06:08Z.
