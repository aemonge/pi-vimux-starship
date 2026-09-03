# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Establish one-package load parity

- **Value:** The imported cockpit loads from one local `pi-vimux-starship` package
  source with reproducible tests and no duplicate extension registration.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Preserve the runnable imported baseline while delivering the
  smallest complete one-package cockpit before optional feature growth or publication
  hardening.
- **Execution source:** direct
- **Execution name:** Incremental in-repository consolidation
- **Execution reason:** The imported modules already communicate through bounded event
  protocols; direct, sequential consolidation keeps compatibility and presentation
  changes reviewable without parallel edits to tightly coupled startup order.
- **Execution outline:** Establish a reproducible baseline, compose and namespace the
  modules, consolidate configuration with compatibility fallbacks, then prove the packed
  artifact in clean capability states.
- **Estimate basis:** No comparable accepted extraction exists; the imported baseline
  has 35,920 authored lines and known partial test evidence.
- **Estimated implementation:** 35–60 minutes; Human wait excluded.
- **Estimate confidence:** Low because the imported footer and Vim development
  environments currently have missing or unusable dependencies.
- **Human-wait estimate:** Separate and unbounded.
- **Refinement trigger:** Split before dependency repair if it would change production
  behavior or push this Task beyond 90 minutes.
- **Implementation confirmed at:** 2026-09-03T13:16:34Z
- **Implementation started at:** 2026-09-03T13:17:16Z
- **Work completed at:** 2026-09-03T14:12:00Z
- **Assurance started at:** 2026-09-03T14:12:00Z
- **Assurance completed at:** 2026-09-03T14:13:04Z
- **Ready for validation at:** 2026-09-03T14:13:04Z
- **Actual implementation:** Approximately 4m15s for direct Task work, excluding the separately estimated and validated toolchain Fix and Human wait.
- **Observed Human wait:** Pending final parity validation; the dependency-install and Fix-validation waits remain separate from implementation.
- **Estimate outcome:** Direct parity composition was much faster than the 35–60 minute low-confidence range because the four imported factories already formed a valid Pi package boundary; the materially larger toolchain repair was correctly split into its own accepted Fix.
- **Final history target:** `feat(package): load the imported cockpit as one unit`
- **Current non-Git boundary:** Not applicable after Human moves the scaffold and
  initializes Git.
- **Human validation:** Pending

- [x] Step 1.1 Verify the imported baseline hashes, entrypoints, startup order, and
      runtime dependencies.
  - Estimate: 5–10 minutes; uncertainty is module resolution outside Galactica.
  - Timing: 2026-09-03T13:17:04Z–2026-09-03T13:17:05Z (1 second).
  - Check: PASS — baseline integrity covered 87 files; the four exact entrypoints
    exist in declared order; all imported packages have no undeclared runtime
    dependencies; isolated offline loading and single-package registration passed.
  - Paths: `package.json`, `packages/*/package.json`, `baseline/source.sha256`.
  - History: Read-only verification; recorded with Step 1.2 progress.
- [x] Step 1.2 Establish one root dependency, formatting, lint, typecheck, and test
      environment without changing visible runtime behavior.
  - Estimate: 15–30 minutes; uncertainty was reconciling the incomplete legacy tool
    installations.
  - Timing: Initial attempt 2026-09-03T13:17:16Z–2026-09-03T13:18:31Z (1m15s blocked); resumed after the accepted Fix at 2026-09-03T14:08:40Z–2026-09-03T14:09:02Z (22s focused verification). Repair implementation is recorded separately by `repair-imported-development-toolchain`.
  - Check: PASS — accepted Fix `5d75457` establishes a clean offline root install, current/original integrity, Prettier, zero-finding Biome and ESLint, strict TypeScript, 4 tooling tests, Status 108/108, Header 69/69, Footer 158/158, Vim 13/13, and schema-aware OpenSpec validation. A fresh root `npm run check` and `npm ls` reconfirmed the gate and unified Pi 0.84.4 peers.
  - Paths: Root toolchain and bounded repair paths are preserved in Fix Step commits `911227d`, `5ef919b`, and `ec3873e`; this checkpoint records matching consolidation progress only.
  - History: Expected `step(package): establish root verification toolchain`; prior failure remains recorded by `e4a55db`.
- [x] Step 1.3 Add composition and no-duplicate package-load checks, then demonstrate
      isolated local loading.
  - Estimate: 15–20 minutes; uncertainty was the smallest reliable headless Pi smoke
    boundary.
  - Timing: 2026-09-03T14:10:35Z–2026-09-03T14:13:04Z (2m29s implementation and assurance).
  - Check: PASS — 3 composition tests load all four default factories exactly once in manifest order, reject duplicate command/tool registrations, and verify Fancy Footer readiness; the probe reports 4 extensions, 6 unique commands, and 2 unique tools. The complete root gate passes 7 tooling, 108 Status, 69 Header, 158 Footer, and 13 Vim tests plus format, lint, strict typechecks, integrity, and OpenSpec checks. `pi --offline --no-extensions -e "$(pwd -P)" --list-models` loads the package and returns 204 model rows.
  - Paths: `src/local-load-probe.ts`, `test/local-load-probe.test.ts`, `package.json`, `tsconfig.json`, `eslint.config.js`, and this Task ledger.
  - History: Expected `step(package): prove one-package load parity`.

### Human validation

- [ ] Human loads only the local package, reloads Pi, and confirms the imported cockpit
      matches the existing assembly; preserve the original response, canonical outcome,
      and UTC.

## Task 2 — Provide one configuration namespace and reference preset

- **Value:** New users configure one package namespace while current Galactica settings
  continue to reproduce the accepted cockpit during migration.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Preserve the runnable imported baseline while delivering the
  smallest complete one-package cockpit before optional feature growth or publication
  hardening.
- **Execution source:** direct
- **Execution name:** Incremental in-repository consolidation
- **Execution reason:** The imported modules already communicate through bounded event
  protocols; direct, sequential consolidation keeps compatibility and presentation
  changes reviewable without parallel edits to tightly coupled startup order.
- **Execution outline:** Establish a reproducible baseline, compose and namespace the
  modules, consolidate configuration with compatibility fallbacks, then prove the packed
  artifact in clean capability states.
- **Estimate basis:** No comparable accepted extraction exists; three existing
  configuration surfaces must be preserved or migrated.
- **Estimated implementation:** 40–75 minutes; Human wait excluded.
- **Estimate confidence:** Low because the Fancy Footer editor currently owns a separate
  strict file format.
- **Human-wait estimate:** Separate and unbounded.
- **Refinement trigger:** Split preset delivery from legacy compatibility if either
  becomes independently Human-validatable or total work approaches 90 minutes.
- **Implementation confirmed at:** Pending
- **Implementation started at:** Pending
- **Work completed at:** Pending
- **Assurance started at:** Pending
- **Assurance completed at:** Pending
- **Ready for validation at:** Pending
- **Actual implementation:** Pending
- **Observed Human wait:** Pending
- **Estimate outcome:** Pending
- **Final history target:** `feat(config): add the vimux starship namespace and preset`
- **Current non-Git boundary:** Not applicable after Human moves the scaffold and
  initializes Git.
- **Human validation:** Pending

- [ ] Step 2.1 Define and validate the `piVimuxStarship` configuration boundary and
      security-sensitive setting precedence.
  - Estimate: 10–20 minutes; uncertainty is preserving project-versus-global trust
    boundaries.
  - Timing: Pending
  - Check: Pending
  - History: Pending
- [ ] Step 2.2 Ship the Ramona Gruvbox preset, semantic defaults, Unicode fallbacks, and
      deterministic module configuration.
  - Estimate: 15–30 minutes; uncertainty is exact parity across three current config
    sources.
  - Timing: Pending
  - Check: Pending
  - History: Pending
- [ ] Step 2.3 Add legacy compatibility tests and migration guidance without silently
      rewriting user settings.
  - Estimate: 15–25 minutes; uncertainty is coexistence with the existing Fancy Footer
    editor.
  - Timing: Pending
  - Check: Pending
  - History: Pending

### Human validation — Task 2

- [ ] Human selects the reference preset, checks wide and narrow rendering, and confirms
      legacy configuration still behaves as documented; preserve the original response,
      canonical outcome, and UTC.

## Task 3 — Prove the private distributable package

- **Value:** A packed or Git/local installation works from one instruction across the
  declared capability matrix.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Preserve the runnable imported baseline while delivering the
  smallest complete one-package cockpit before optional feature growth or publication
  hardening.
- **Execution source:** direct
- **Execution name:** Incremental in-repository consolidation
- **Execution reason:** The imported modules already communicate through bounded event
  protocols; direct, sequential consolidation keeps compatibility and presentation
  changes reviewable without parallel edits to tightly coupled startup order.
- **Execution outline:** Establish a reproducible baseline, compose and namespace the
  modules, consolidate configuration with compatibility fallbacks, then prove the packed
  artifact in clean capability states.
- **Estimate basis:** No comparable accepted clean-room demonstration exists; the
  expected matrix has six bounded states.
- **Estimated implementation:** 35–60 minutes; Human wait excluded.
- **Estimate confidence:** Low because clean-room Pi package resolution has not yet been
  exercised for this code.
- **Human-wait estimate:** Separate and unbounded.
- **Refinement trigger:** Stop and rebrief if a check requires credentials, provider
  requests, external publication, or platform support beyond current Linux behavior.
- **Implementation confirmed at:** Pending
- **Implementation started at:** Pending
- **Work completed at:** Pending
- **Assurance started at:** Pending
- **Assurance completed at:** Pending
- **Ready for validation at:** Pending
- **Actual implementation:** Pending
- **Observed Human wait:** Pending
- **Estimate outcome:** Pending
- **Final history target:** `feat(distribution): prove private package installation`
- **Current non-Git boundary:** Not applicable after Human moves the scaffold and
  initializes Git.
- **Human validation:** Pending

- [ ] Step 3.1 Make the packed artifact include only required source, documentation,
      licenses, and runtime metadata.
  - Estimate: 10–15 minutes; uncertainty is package-file filtering.
  - Timing: Pending
  - Check: Pending
  - History: Pending
- [ ] Step 3.2 Run offline clean-room checks for plain, Git, OpenSpec, Devbox,
      quota-state, and missing-capability behavior.
  - Estimate: 15–30 minutes; uncertainty is deterministic fixtures for optional
    capabilities.
  - Timing: Pending
  - Check: Pending
  - History: Pending
- [ ] Step 3.3 Document local-path and pinned-Git installation, rollback, and the Human
      validation checklist.
  - Estimate: 10–15 minutes; uncertainty is none beyond matching current Pi
    documentation.
  - Timing: Pending
  - Check: Pending
  - History: Pending

### Human validation — Task 3

- [ ] Human installs the package from one source, checks the declared capability states,
      and reports a clear outcome; preserve the original response, canonical outcome,
      and UTC.
