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
- **Work completed at:** Pending
- **Assurance started at:** Pending
- **Assurance completed at:** Pending
- **Ready for validation at:** Pending
- **Actual implementation:** Pending
- **Observed Human wait:** Pending
- **Estimate outcome:** Pending
- **Symptom:** Root checks depend on missing parent configuration, version-skewed workspace installs, one missing fixture, three TypeBox-diagnostic mismatches, two Footer type defects, and unsupported planning-only strict validation.
- **Cause:** The imported authored trees omitted Galactica's parent development environment and retained package-local dependency assumptions rather than one standalone root boundary.
- **Bounded repair:** Centralize tooling, repair only diagnosed nonvisual defects, separate original and current integrity manifests, and add schema-aware local planning validation.
- **Regression check:** Clean offline install plus all root deterministic checks and isolated package loading passes.
- **Final history target:** `fix(tooling): establish clean standalone verification`
- **Current non-Git boundary:** Not applicable; the repository uses Git.
- **Human validation:** Pending

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
- [ ] Step 1.3 Add schema-aware planning validation, document the standalone boundary, and prove a clean offline reinstall.
  - Estimate: 15–25 minutes; uncertainty is clean-install behavior after removing child lockfiles.
  - Timing: Pending
  - Check: Pending
  - History: Pending

### Human validation

- [ ] Human runs the documented root checks and confirms the standalone development boundary; preserve the original response, canonical outcome, and UTC.
