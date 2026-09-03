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
- **Work completed at:** Pending
- **Assurance started at:** Pending
- **Assurance completed at:** Pending
- **Ready for validation at:** Pending
- **Actual implementation:** Pending
- **Observed Human wait:** Pending
- **Estimate outcome:** Pending
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
- [-] Step 1.2 Establish one root dependency, formatting, lint, typecheck, and test
      environment without changing runtime behavior.
  - Estimate: 15–30 minutes; uncertainty is reconciling the incomplete legacy tool
    installations.
  - Timing: 2026-09-03T13:17:16Z–2026-09-03T13:18:31Z (1 minute 15 seconds;
    blocked before root metadata or runtime source mutation).
  - Check: BLOCKED — an isolated `npm install --offline --ignore-scripts` could not
    resolve `@earendil-works/pi-ai@0.84.3` (`ETARGET`). Substituting cached older Pi
    packages would change the compatibility target; network access was excluded.
    OpenSpec 1.6.0 strict validation also rejected all three planning-only changes for
    missing spec deltas despite their declared `skip_specs: true` schema metadata.
  - Paths: OpenSpec progress only; the failed install probe was confined to `/tmp`.
  - History: Failure recorded by `e4a55db` (`error(package): offline toolchain cache incomplete`).
  - Repair dependency: `repair-imported-development-toolchain` now has passing deterministic checks and a clean offline install; this Step remains interrupted until that Fix receives Human validation and focus returns here.
- [ ] Step 1.3 Add composition and no-duplicate package-load checks, then demonstrate
      isolated local loading.
  - Estimate: 15–20 minutes; uncertainty is the smallest reliable headless Pi smoke
    boundary.
  - Timing: Pending
  - Check: Pending
  - History: Pending

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
