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
- **Takeover addendum confirmed at:** 2026-09-03T14:13:56Z
- **Takeover assurance resumed at:** 2026-09-03T14:13:56Z
- **Work completed at:** 2026-09-03T14:12:00Z
- **Assurance started at:** 2026-09-03T14:12:00Z; independently resumed at 2026-09-03T14:13:56Z.
- **Assurance completed at:** 2026-09-03T14:14:47Z
- **Ready for validation at:** 2026-09-03T14:14:47Z
- **Actual implementation:** Approximately 4m15s for direct Task work, excluding the separately estimated and validated toolchain Fix and Human wait.
- **Observed Human wait:** 3m10s from ready-for-validation at 2026-09-03T14:14:47Z to Human response at 2026-09-03T14:17:57Z; earlier dependency-install and Fix-validation waits remain separate.
- **Estimate outcome:** Direct parity composition was much faster than the 35–60 minute low-confidence range because the four imported factories already formed a valid Pi package boundary; the materially larger toolchain repair was correctly split into its own accepted Fix.
- **Final history target:** `feat(package): load the imported cockpit as one unit`
- **Current non-Git boundary:** Not applicable after Human moves the scaffold and
  initializes Git.
- **Human validation:** VALID — original response `VALID`, canonical outcome `VALID`, recorded at 2026-09-03T14:17:57Z.

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
  - Timing: 2026-09-03T14:10:35Z–2026-09-03T14:14:47Z (4m12s implementation and independently resumed assurance).
  - Check: PASS — independently rerun after takeover. Three composition tests load all four default factories exactly once in manifest order, reject duplicate command/tool registrations, and verify Fancy Footer readiness; the probe reports 4 extensions, 6 unique commands, and 2 unique tools. The complete root gate passes 7 tooling, 108 Status, 69 Header, 158 Footer, and 13 Vim tests plus format, lint, strict typechecks, integrity, and OpenSpec checks. `pi --offline --no-extensions -e "$(pwd -P)" --list-models` loads the package and returns 205 output rows.
  - Paths: `src/local-load-probe.ts`, `test/local-load-probe.test.ts`, `package.json`, `tsconfig.json`, `eslint.config.js`, and this Task ledger.
  - History: Expected `step(package): prove one-package load parity`.

### Human validation

- [x] Human loaded only the local package and confirmed parity; original response `VALID`, canonical outcome `VALID`, recorded at 2026-09-03T14:17:57Z.

## Task 2 — Retire the superseded configuration expansion

- **Value:** The package keeps its accepted cockpit behavior without shipping an unused
  package namespace, a duplicate configuration migration, or out-of-scope theming.
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
- **Execution outline:** Establish a reproducible baseline, compose the modules behind
  one package entrypoint, retire superseded expansion that adds no concrete value, then
  prove the packed artifact in clean capability states.
- **Estimate basis:** Step 2.1 took 55 seconds; current inspection proves its two source
  paths are referenced only by their isolated tests and no runtime factory imports them.
- **Estimated implementation:** 5–12 minutes; Human wait excluded.
- **Estimate confidence:** High because the removal boundary is isolated and the full
  repository gate already covers package composition.
- **Human-wait estimate:** Separate and unbounded.
- **Refinement trigger:** Stop and rebrief if removal exposes a runtime dependency or
  requires any component, Pi setting, dependency, or visible behavior change.
- **Superseded implementation confirmation:** 2026-09-03T14:19:54Z (`OK`; applied to the abandoned namespace-and-preset scope).
- **Cleanup implementation confirmed at:** 2026-09-08T09:00:10Z (`Yes, you can implement the cleanup`).
- **Cleanup implementation started at:** 2026-09-08T09:00:51Z
- **Work completed at:** Approximately 2026-09-08T09:03:00Z; exact formatter/check transition was not separately timestamped.
- **Assurance started at:** Approximately 2026-09-08T09:03:00Z; resumed after Human restored the locked dependency environment at 2026-09-08T11:03:40Z.
- **Assurance completed at:** 2026-09-08T11:05:21Z
- **Ready for validation at:** 2026-09-08T11:09:07Z after deterministic independent Step-history verification.
- **Actual implementation:** Approximately 2 minutes; Human wait and the dependency-environment delay are excluded.
- **Observed Human wait:** 3m13s from ready-for-validation at 2026-09-08T11:09:07Z to Human response at 2026-09-08T11:12:20Z; the separate dependency-restoration delay ran approximately 1h59m.
- **Estimate outcome:** Faster than the 5–12 minute range because both removed files were isolated; assurance then incurred a separate missing-dependency delay.
- **Final history target:** `chore(config): retire superseded configuration task`
- **Current non-Git boundary:** Not applicable; the repository uses Git.
- **Human validation:** VALID — original response `VALID`, canonical outcome `VALID`, recorded at 2026-09-08T11:12:20Z.

- [x] Historical Step 2.1 defined and tested the `piVimuxStarship` configuration
      boundary; its implementation is preserved in history and superseded by Step 2.2.
  - Estimate: 10–20 minutes; uncertainty was preserving project-versus-global trust
    boundaries.
  - Timing: 2026-09-03T14:21:36Z–2026-09-03T14:22:31Z (55s implementation and focused checks).
  - Check: PASS at the historical boundary — 4 isolated namespace tests passed, but
    later inspection confirmed no runtime factory ever consumed the helper.
  - Paths: `src/config.ts`, `test/config.test.ts`, and this Task ledger.
  - History: `50f7436` — `step(config): define the package namespace`.
- [x] Step 2.2 Retire the unused namespace scaffold and stale configuration promise
      without changing runtime behavior.
  - Estimate: 5–12 minutes; uncertainty is limited to schema-aware OpenSpec validation
    after replacing the abandoned acceptance language.
  - Started: 2026-09-08T09:00:51Z
  - Timing: 2026-09-08T09:00:51Z–approximately 2026-09-08T09:03:00Z (about 2 minutes implementation; assurance blocked separately).
  - Check: PASS — after Human restored the lockfile environment, exact-path and full
    formatting, Biome/ESLint, strict TypeScript, current 92-file and immutable 87-file
    integrity, 10 tooling tests, 109 Status tests, 86 Header tests, 159 Footer tests, 17
    Vim tests, one-extension/six-command/two-tool composition, and six schema-aware
    OpenSpec changes pass. Credential-free offline Pi loading succeeds with 211 rows.
    The earlier environment-only `tsx` failure and uncached offline-install attempt are
    preserved above; no product test failed.
  - Paths: parent Idea, this Plan/Task, `src/config.ts`, and `test/config.test.ts`;
    `baseline/source.sha256` remains unchanged because it does not track these root
    scaffold paths.
  - History: Expected `chore(config): retire unused namespace scaffold`; commit and independent verification pending.

### Human validation — Task 2 cleanup

- [x] Human confirmed the package still loads the accepted cockpit and that no public
      namespace, preset, or theme was introduced — original response `VALID`, canonical
      outcome `VALID`, recorded at 2026-09-08T11:12:20Z.

## Task 3 — Finish the private distributable package and user-facing guide

- **Value:** A minimal packed package can be installed from one documented source, and a
  new user can understand the recommended Neovim workflow from the README and one honest
  reproducible demonstration.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Preserve the runnable imported baseline while delivering the
  smallest complete one-package cockpit before optional feature growth or publication
  hardening.
- **Execution source:** direct
- **Execution name:** Incremental in-repository consolidation
- **Execution reason:** Package filtering, clean-room loading, and documentation all
  describe one artifact boundary; direct sequential execution keeps the tarball evidence
  synchronized with the README and VHS source without parallel drift.
- **Execution outline:** Restrict the packed files with a deterministic contract, prove
  one extracted tarball offline plus fixture-backed optional states, then replace stale
  handoff prose with installation, rollback, health, bridge, and VHS guidance.
- **Estimate basis:** Current `npm pack --dry-run` exposes 137 entries including AGENTS,
  OpenSpec, tests, baselines, and development configuration; local composition and 391
  tests already pass, but no accepted clean-room tarball or VHS tape exists.
- **Estimated implementation:** 55–90 minutes; Human wait and VHS execution excluded.
- **Estimate confidence:** Low-to-medium because package filtering is concrete, while
  nested `nvim +terminal` VHS timing must be exercised only in Human's real bridge.
- **Human-wait estimate:** Separate and unbounded; Human installs one source, runs the
  authored VHS tape, reviews the generated GIF, and validates the complete guide.
- **Refinement trigger:** Stop and rebrief if the extracted package requires network
  resolution, the tape requires shipping private bridge logic or captures private data,
  or one independently validatable outcome pushes implementation beyond 90 minutes.
- **Implementation confirmed at:** 2026-09-08T14:57:33Z
- **Implementation started at:** 2026-09-08T15:12:54Z
- **Work completed at:** 2026-09-08T15:31:36Z, excluding Human-run VHS output.
- **Assurance started at:** Approximately 2026-09-08T15:29:00Z after focused package
  and documentation checks.
- **Assurance completed at:** 2026-09-08T15:31:36Z
- **Ready for validation at:** Pending Step 3.3 history verification.
- **Actual implementation:** 18m42s across Steps 3.1–3.3 including deterministic checks;
  Human VHS execution and wait are excluded.
- **Observed Human wait:** Pending
- **Estimate outcome:** Pending
- **Final history target:** `feat(distribution): finish the private cockpit package`
- **Current non-Git boundary:** Not applicable; the repository uses Git.
- **Human validation:** Pending

- [x] Step 3.1 Specify and enforce a minimal packed-artifact allowlist for runtime source,
      user documentation, licenses, package metadata, and the intentional demo assets.
  - Started: 2026-09-08T15:12:54Z
  - Estimate: 15–25 minutes; uncertainty was preserving every TypeScript runtime import
    while excluding tests, OpenSpec, baselines, AGENTS, and development configuration.
  - Timing: 2026-09-08T15:12:54Z–2026-09-08T15:15:47Z (2m53s).
  - Check: Three focused package-contract tests and the real dry run PASS with 67 files,
    191,536 packed bytes, and no forbidden/private artifact; the prior unconstrained
    artifact exposed 137 entries.
  - Paths: `package.json`, `scripts/check-package.mjs`, `test/check-package.test.ts`, and
    this Plan/ledger.
  - History: `85bd5a4` — `step(package): constrain private artifact contents`; external
    receipt independently verifies the exact five-path clean boundary.
- [x] Step 3.2 Prove the extracted artifact loads offline and preserve fixture-backed
      coverage for Git, OpenSpec, Devbox, quota, and missing optional capabilities.
  - Started: 2026-09-08T15:17:52Z
  - Estimate: 20–35 minutes; uncertainty was resolving Pi peer imports from a temporary
    extracted package without network access or settings mutation.
  - Timing: 2026-09-08T15:17:52Z–2026-09-08T15:20:59Z (3m07s including focused and full
    deterministic checks).
  - Check: GREEN — a 67-file artifact packs, extracts, and loads through credential-free
    `pi --offline --no-session --no-extensions -e <package>` with three catalog rows;
    four package tests and all 400 repository tests PASS. No Git/Rustory repository or
    persistent clean-room output is created.
  - Paths: `scripts/check-package.mjs`, `test/check-package.test.ts`, `package.json`, and
    this ledger.
  - History: `982d898` — `step(package): prove offline artifact loading`; external
    receipt independently verifies the exact four-path clean boundary.
- [x] Step 3.3 Replace the handoff-oriented root README with the recommended workflow,
      installation/rollback, `/vimux-health`, limitations, privacy, and a deterministic
      VHS tape that Human can run without provider traffic.
  - Started: 2026-09-08T15:22:26Z
  - Estimate: 20–30 minutes; uncertainty remains the nested-Neovim timing across Human's
    private bridge because VHS is unavailable in the sandbox.
  - Timing: 2026-09-08T15:22:26Z–2026-09-08T15:31:36Z (9m10s including focused and full
    deterministic checks; Human VHS execution excluded).
  - Check: GREEN — README/VHS static safety assertions, 68-file package allowlist and
    extracted offline load, formatting, lint, strict TypeScript, integrity, composition,
    OpenSpec, and all 401 repository tests PASS. The reviewed GIF remains the declared
    Human-generated final-boundary artifact.
  - Paths: `README.md`, `docs/development.md`, `demo/pi-vimux-starship.tape`,
    `scripts/check-package.mjs`, `test/check-package.test.ts`, and this ledger; after
    Human review only, the sanctioned `docs/assets/pi-vimux-starship.gif`.
  - History: Expected `step(docs): present the Neovim cockpit workflow`; external receipt
    pending independent verification.

### Human validation — Task 3

- [ ] Human installs the package from one documented source, runs the authored VHS tape
      in the real bridge, reviews the sanitized GIF, checks `/vimux-health` and the
      recommended workflow, then reports a clear outcome; preserve original response,
      canonical outcome, and UTC. The reviewed GIF enters history only at this final
      VALID boundary.
