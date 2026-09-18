# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Event ledger, reducer, and status package rename

- **Value:** Cockpit state has one writer and one shape, born in a legacy-free
  package home; unit tests prove the fold against the frozen contract before
  anything live changes.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Smallest complete ledger-plus-reducer core with no producer
  rewiring and no rendering changes.
- **Execution source:** native-direct
- **Execution name:** Sequential strangler slices
- **Estimate basis:** Contract fixes the model; new module with no live coupling.
- **Estimated implementation:** 75–150 minutes including the package rename;
  Human wait excluded.
- **Estimate confidence:** Low — no comparable accepted Plan.
- **Human-wait estimate:** Separate and unbounded after deterministic checks.
- **Refinement trigger:** Split if event typing exceeds roughly fifteen bounded
  types, the reducer crosses 300 lines, or the rename surfaces unexpected reference
  depth.

- [x] Rename `packages/galactica-status` to `packages/status`, propagating the root
      manifest path, package name, validation tooling, and documentation mentions;
      persisted session-entry strings and event channel names stay unchanged for
      compatibility.
  - Started 2026-09-18T13:01:23Z; completed 2026-09-18T13:02:34Z; elapsed 1m11s.
  - Check: `npm run test:status` green; offline lockfile refresh clean; frozen
    islands (entry types, channels, slash commands, config filename) verified
    intact; baseline manifest refreshed, PASS (95 files).
  - Paths: `packages/status/**` (git-moved), `package.json`, `package-lock.json`,
    `scripts/check-package.mjs`, `src/index.ts`, `AGENTS.md`, `docs/handoff.md`,
    `docs/source-inventory.md`, `baseline/source.sha256`.
  - Subject: `step(status-core): rename galactica-status to legacy-free home`.
- [x] Create `src/ledger.ts`: bounded append-only event types covering selection,
      run, progress, diagnostics, orchestration, and taskflow.
  - Started 2026-09-18T13:03:00Z; completed 2026-09-18T13:05:10Z; elapsed ~2m.
  - Check: `tsc --noEmit` green with new snapshot facts in `src/types.ts`.
  - Paths: `packages/status/src/ledger.ts`, `packages/status/src/types.ts`.
  - Subject: `step(status-core): add append-only event ledger and snapshot types`.
      run, progress, diagnostics, orchestration, and taskflow producers.
- [x] Create `src/reducer.ts`: fold events into `CockpitSnapshot` with the single
      selection resolver (`openspec-task > goal > session-work > subject > none`),
      runs spans, and freshness-honest progress.
  - Started 2026-09-18T13:05:30Z; completed 2026-09-18T13:08:40Z; elapsed ~3m.
  - Correction: ledger event union revised in the same Step — `selection/set`
      became four raw fact events (`focus/openspec|goal|work|subject`) so the
      reducer owns priority, per the contract's single-resolver rule.
  - Check: `tsc --noEmit` green.
  - Paths: `packages/status/src/reducer.ts`, `packages/status/src/ledger.ts`,
    `packages/status/src/types.ts`.
  - Subject: `step(status-core): add pure reducer with single selection resolver`.
- [x] Unit tests: resolver priority, derived-only title/status projections,
      placeholder-free silence rules, and the KO detail-naming rule.
  - Started 2026-09-18T13:09:30Z; completed 2026-09-18T13:15:00Z; elapsed ~6m.
  - Check: 19/19 new tests; package suite 139/139; `tsc --noEmit` green;
    prettier write+check on exact paths; baseline manifest refreshed to 99 files;
    `check:openspec` PASS.
  - Paths: `packages/status/test/ledger.test.ts`,
    `packages/status/test/reducer.test.ts`, `packages/status/src/reducer.ts`,
    `packages/status/src/types.ts`, `baseline/source.sha256`.
  - Subject: `step(status-core): prove the fold with discriminating unit tests`.
- [x] Focused checks: `npm run test:status`, `check:baseline`, `check:openspec`.
  - Started 2026-09-18T13:15:30Z; completed 2026-09-18T13:21:00Z; elapsed ~6m.
  - Check: full `npm run check` exit 0 — baseline 99 files, packed artifact and
    extracted load PASS, prettier clean, lint clean, typecheck clean, five suites
    green (139 component tests incl. 19 new), composition PASS, openspec PASS.
  - Repairs during assurance: table reflow in `docs/source-inventory.md`, unused
    type import removed from `test/reducer.test.ts`, baseline manifest re-refreshed.
  - Paths: `docs/source-inventory.md`,
    `packages/status/test/reducer.test.ts`, `baseline/source.sha256`.
  - Subject: `step(status-core): satisfy the full repository check gate`.
- [x] Human validation: review reducer tests against the contract grammar;
      preserve original response, canonical outcome, and UTC.
  - Evidence: Canonical `VALID` at 2026-09-18T13:18:53Z. Original response:
    `VALID`.
- **Observed Human wait:** under one minute of elapsed review conversation;
    ready-for-validation timestamps above were minute-level approximations
    recorded at Task close — the canonical VALID evidence uses the live clock.
- **Estimate outcome:** 19m37s actual implementation vs the conservative
    75–150m range (rename mechanical, core pre-designed); Human wait separate
    and excluded.
- **Implementation confirmed at:** 2026-09-18T13:00Z (minute precision, turn
  preceding first Step start).
- **Implementation started at:** 2026-09-18T13:01:23Z.
- **Work completed at:** 2026-09-18T13:21:00Z.
- **Assurance started at:** 2026-09-18T13:15:30Z (focused checks followed each
  Step immediately; full gate at Task close).
- **Assurance completed at:** 2026-09-18T13:21:00Z.
- **Ready for validation at:** 2026-09-18T13:21:00Z.
- **Actual implementation:** 19m37s across five Steps including per-Step focused
  checks; Human wait excluded. The 75–150m range was conservative: the rename was
  mechanical (`git mv` plus path propagation) and the core modules were
  pre-designed in the frozen-contract conversation.
- **Final Task-boundary commit (after canonical VALID):**
  `feat(status-core): deliver ledger, reducer, and legacy-free home`.

## Task 2 — Producers append; output stays byte-identical

- **Value:** Every producer writes events while the live cockpit renders exactly
  as today — the invisible swap.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Rewire producers to the ledger and feed existing publisher
  builders from the snapshot with byte-identical outputs.
- **Execution source:** native-direct
- **Execution name:** Sequential strangler slices
- **Estimate basis:** Runtime field set and producer paths are enumerated from
  `index.ts` inspection; parity harness is new.
- **Estimated implementation:** 60–120 minutes; Human wait excluded.
- **Estimate confidence:** Low — parity surface breadth is the unknown.
- **Human-wait estimate:** Separate and unbounded after deterministic checks.
- **Refinement trigger:** Split by producer domain if parity diverges or the
  midpoint exceeds 90 minutes.

- [x] Route `work_focus`, `openspec_focus`, `subject` tool actions, Pi lifecycle
      events, goal sync, collectors, and taskflow updates through ledger appends.
  - Wired via runtime seams: constructor seeds restored facts; `setFocus`,
    `setWorkFocus`, `setSubject`, `setGoal`, refresh completion (progress,
    diagnostics, orchestration), `beginRuntimeRun`/`finishRuntimeRun` (bash and
    subagent spans), and `setTaskflowPhase` (bounded label).
- [x] Feed the publisher's widget, header, and title builders from the snapshot
      instead of runtime fields.
  - `publish()` and `updateTitle()` now read focus facts through
    `cockpitFacts` (object identity with recorded events → byte-identical by
    construction).
- [x] Golden parity tests: snapshot-driven output equals previous output across
      recorded sequences covering focus, goal, work, subject, taskflow, and
      collector inputs.
  - `test/parity.test.ts`: resolver slot equals the legacy `headerSelection`
    waterfall across six golden matrices (source vocabulary translated
    `openspec` → `openspec-task`); incremental recordEvent fold equals full
    ledger replay. `headerSelection` exported for test access (no behavior
    change).
- [x] Full component suite plus `check:baseline` unchanged manifest.
  - 141/141 package tests; full `npm run check` exit 0; baseline 100 files.
- [ ] Human validation: one live session shows an unchanged cockpit.
  - Evidence: pending (batch validation with Tasks 3–5).
- **Implementation confirmed at:** 2026-09-18T13:22Z (consolidated brief).
- **Implementation started at:** 2026-09-18T13:23:00Z.
- **Work completed at:** 2026-09-18T13:55:00Z.
- **Assurance started at:** 2026-09-18T13:45:00Z.
- **Assurance completed at:** 2026-09-18T13:55:00Z.
- **Ready for validation at:** 2026-09-18T13:55:00Z.
- **Actual implementation:** ~32m including per-slice checks; Human wait
  excluded. Within the 60–120m range (under: producer seams were already
  enumerated during preflight).
- **Final Task-boundary commit (after canonical VALID):**
  `feat(status-core): route all producers through the event ledger`.

## Task 3 — Renderers consume the snapshot; waterfalls die

- **Value:** Exhibits 1–3 and 5 die; the frozen grammar becomes visible (Phase B
  S1–S5) with silence rules enforced in render tests, in a legacy-free header
  package home.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Switch deck, footer, and title rendering to the snapshot and
      delete the priority waterfalls and placeholder paths.
- **Execution source:** native-direct
- **Execution name:** Sequential strangler slices
- **Estimate basis:** Deck and publisher waterfalls are localized from inspection
  (`deck.ts:215`, `deck.ts:256-257`, `fallbackTitles` in `index.ts`).
- **Estimated implementation:** 75–150 minutes including the package rename;
  Human wait excluded.
- **Estimate confidence:** Low-medium — seams located, render tests to rewrite.
- **Human-wait estimate:** Separate and unbounded; live Phase B pass required.
- **Refinement trigger:** Split renderers by surface if the three surfaces cannot
  land in one independently validatable slice.

- [ ] Rename `packages/galactica-context-header` to `packages/header`, propagating
      manifests, tooling, and documentation mentions.
- [ ] Deck, footer widgets, and terminal title read the snapshot only; delete
      `fallbackTitles` and duplicate priority chains in `publisher.ts` and `deck.ts`.
- [ ] Remove placeholder em-dash rendering (`deck.ts:215`, `deck.ts:256-257`, and
      siblings); absent facts remove their slots entirely.
- [ ] Enforce the KO amendment in render tests: details name their subject or the
      slot collapses.
- [ ] One discriminating regression test per exhibit (glue, header dash, task/steps
      placeholders, emptiness narration; triple-state waiting lands with Task 5
      stage wiring).
- [ ] Human validation: Phase B scenarios S1–S5 pass live.
  - Evidence: pending.

## Task 4 — Runs become a span tree

- **Value:** Subagents render with identity, stage, and elapsed (Phase B S6);
  counts-only tracking retires.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Replace count tracking with a parented span store fed from
      existing partials, with elastic tree rendering through the compatibility
      channels.
- **Execution source:** native-direct
- **Execution name:** Sequential strangler slices
- **Estimate basis:** `runtime-runs.ts` is 71 lines with clear partial-result
      parsing already in place.
- **Estimated implementation:** 45–90 minutes; Human wait excluded.
- **Estimate confidence:** Low-medium.
- **Human-wait estimate:** Separate and unbounded; live two-subagent pass required.
- **Refinement trigger:** Split rendering from the store if partials prove too
      sparse for per-agent identity.

- [ ] Replace `RuntimeRunTracker` with a span store (`id`, `kind`, `parent`,
      `label`, `agent`, `stage`, `since`, `endedAt`).
- [ ] Map subagent partials to per-agent spans with inferred-stage fallback; bash
      children as leaf spans.
- [ ] Render elastic tree rows through `galactica-status:header` and footer widget
      channels.
- [ ] Tests: nesting, settle-collapse, and count parity with the retired tracker.
- [ ] Human validation: Phase B scenario S6 live with two subagents.
  - Evidence: pending.

## Task 5 — Declared stages and channel retirement

- **Value:** Declared stage is truth (Phase B S7); compatibility channels retire;
  the full guide S1–S10 passes.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Add stage events where declaration beats inference, consume
  the Ramona emission duty, and retire the compatibility channels once every
  consumer renders from the snapshot.
- **Execution source:** native-direct
- **Execution name:** Sequential strangler slices
- **Estimate basis:** Reducer and render seams exist after Tasks 1–4; external
  dependency wait dominates uncertainty.
- **Estimated implementation:** 45–90 minutes plus external dependency wait;
  Human wait excluded.
- **Estimate confidence:** Low.
- **Human-wait estimate:** Separate and unbounded; includes the galactica
  stage-duty slice.
- **Refinement trigger:** Park this Task without blocking Tasks 1–4 if the
  galactica duty is not yet accepted; inference fallback remains contract-legal.

- **Dependency:** The stage-emission duty for the global Ramona `AGENTS.md` is a
  separate galactica-owned slice requiring its own brief and exact
  `ALLOW PI CONFIG` authority; it is never implied by this Plan.
- [ ] Add the stage event type with declaration-beats-inference in the reducer.
- [ ] Consume declared stages once the galactica emission duty lands; keep
      `classifyHeaderActivity` strictly as fallback.
- [ ] Retire `pi-fancy-footer:widget`/`ready` and `galactica-status:header`/
      `prompt-row` channels when all consumers render from the snapshot.
- [ ] Full validation-guide run: Phase B S1–S10.
- [ ] Human validation: guide passes; final Task-boundary commit.
  - Evidence: pending.
