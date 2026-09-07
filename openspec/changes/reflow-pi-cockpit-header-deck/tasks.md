# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Deliver the open-sided Header Deck

- **Value:** Human sees one responsive, colored cockpit above an editor-only prompt, with bounded narrative, project, work, capability, model, context, quota, resource, and cost state and no duplicate lower surfaces.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Deliver the smallest complete header-only cockpit with explicit component modes, bounded telemetry, deterministic responsive rendering, and no feature growth into editor routing.
- **Execution source:** direct
- **Execution name:** Sequential cockpit ownership reflow
- **Execution reason:** Composition order, shared event contracts, TUI ownership, and custom-editor rendering are tightly coupled; one sequential implementation keeps every visible transition attributable.
- **Execution outline:** Add explicit composition and telemetry modes, render the approved open-sided deck from bounded state, then retire visible footer/prompt-rail duplication and prove reload/external-editor parity.
- **Estimate basis:** Accepted Task 1 provides 7 tooling and 348 component tests plus a four-factory composition probe; current ownership is isolated to one Footer `setFooter`, one Header `setWidget`, and Pi Vim's render override. No comparable accepted visual reflow exists.
- **Estimated implementation:** 60–90 minutes; Human wait excluded.
- **Estimate confidence:** Low because Footer telemetry extraction, optional work counters, and borderless editor cursor behavior have not yet been exercised together.
- **Human-wait estimate:** Separate and unbounded after deterministic checks.
- **Refinement trigger:** Stop at 90 minutes or for a cursor/external-editor regression, new dependency, unnamed runtime path, fabricated telemetry, or architecture outside the declared composition modes.
- **Implementation confirmed at:** 2026-09-03T14:47:41Z
- **Header-only scope addendum confirmed at:** 2026-09-07T08:16:56Z — Human explicitly excluded every Vim and Neovim code and behavior change. Context Header may activate the approved deck and suppress Pi's footer; existing Vim-owned prompt rails remain unchanged.
- **Implementation started at:** 2026-09-03T14:47:41Z
- **Header-only implementation resumed at:** 2026-09-07T08:16:56Z
- **Rich-header repair confirmed at:** 2026-09-07T09:06:10Z
- **Ornament/time correction confirmed at:** 2026-09-07T09:08:20Z — retain runtime and frame the header as top-left `󰠭 >` through bottom-right `< 󰠭`.
- **Rich-header repair started at:** 2026-09-07T09:08:20Z
- **Chrome refinement confirmed at:** 2026-09-07T10:00:13Z
- **Chrome refinement started at:** 2026-09-07T10:00:13Z
- **Hierarchy refinement confirmed at:** 2026-09-07T10:26:24Z
- **Hierarchy refinement started at:** 2026-09-07T10:26:24Z
- **Compact telemetry refinement confirmed at:** 2026-09-07T10:45:51Z
- **Compact telemetry refinement started at:** 2026-09-07T10:45:51Z
- **Single-row hierarchy correction confirmed at:** 2026-09-07T10:57:13Z
- **Work completed at:** 2026-09-07T11:05:38Z for the compact telemetry refinement and single-row correction.
- **Assurance started at:** Approximately 2026-09-07T10:47:00Z for the compact telemetry refinement; exact initial command-start timestamp was not separately captured.
- **Assurance completed at:** 2026-09-07T11:05:38Z
- **Ready for validation at:** 2026-09-07T11:05:38Z, subject to independent Step-history verification.
- **Actual implementation:** Step 1.7 took 19m47s including focused checks, Human-caught hierarchy correction, complete assurance, and independent review; prior Steps remain recorded separately and Human wait is excluded.
- **Observed Human wait:** Pending
- **Estimate outcome:** Pending
- **Final history target:** `feat(cockpit): reflow telemetry into the header deck`
- **Current non-Git boundary:** Not applicable; the repository uses Git.
- **Human validation:** CHANGE — prior visual changes remain preserved; latest original response begins `CHANGE: 0.2% · 292M...`, canonical outcome `CHANGE`, recorded before the compact telemetry confirmation at 2026-09-07T10:45:51Z. Compact telemetry refinement validation remains pending.

- [x] Step 1.1 Centralize explicit composition modes and bounded Footer, work-counter, LSP, MCP, and Vim-mode telemetry contracts.
  - Estimate: 20–30 minutes; uncertainty was extracting Footer refresh state without preserving visible footer ownership.
  - Timing: 2026-09-03T14:47:41Z–2026-09-03T14:56:02Z (8m21s implementation and focused checks).
  - Check: PASS — Footer 159/159, Status 108/108, Header 72/72, Vim 13/13, and root tooling 12/12 tests pass; strict TypeScript, zero-finding lint, Prettier, current 88-file integrity, and immutable 87-file import record pass. The root composition declares telemetry/provider/deck/editor-only modes; bounded cost/qta, agts/stps/files, LSP/MCP, and Vim-mode contracts reject malformed values without changing the currently loaded four-entrypoint surface.
  - Paths: `src/index.ts`, root composition test, Footer `api.ts`, `index.ts`, and `index.test.ts`; Status orchestration/types/publisher and focused tests; Header options, gauge/capability parsers and focused tests; Vim mode option; current source manifest; and this Plan/Task.
  - History: Expected `step(cockpit): centralize header deck composition`.
- [x] Step 1.2 Render the approved colored open-sided deck with deterministic responsive fallbacks.
  - Estimate: 25–35 minutes; uncertainty was fitting icon-rich Unicode/ANSI groups without semantic truncation.
  - Timing: 2026-09-03T14:57:20Z–2026-09-03T15:01:46Z (4m26s implementation and focused checks).
  - Check: PASS — 3 deck fixtures prove the exact open-sided wide structure, no spacer rows, two opposing ladybugs, compact labels, honest unavailable telemetry, and width-safe collapse at 160/100/79/59/39/20 cells. Header 75/75, strict TypeScript, zero-finding lint, Prettier, and current 90-file/original 87-file integrity pass. Context Header deck mode now renders live bounded state while legacy mode retains its accepted one-line surface.
  - Paths: new Header `src/deck.ts` and `test/deck.test.ts`, Header `index.ts`, current source manifest, and this Task ledger.
  - History: Expected `step(cockpit): render the open-sided header deck`.
- [x] Step 1.3 Activate the approved deck through the root package entrypoint and suppress only Pi's visible footer; preserve all Vim and Neovim code and behavior unchanged under the confirmed header-only scope addendum.
  - Estimate: 15–25 minutes; uncertainty was package reload and empty-footer lifecycle behavior.
  - Timing: 2026-09-07T08:16:56Z–2026-09-07T08:22:20Z (5m24s implementation and checks).
  - Check: PASS automation, NOT VALID visually — the root manifest activated one composition entrypoint and all automated checks passed, but Human rejected the resulting 11-line open-sided deck as inconsistent with the intended visual contract.
  - Paths: `package.json`, `src/index.ts`, `src/local-load-probe.ts`, `test/local-load-probe.test.ts`, Header `index.ts` and new `test/surface.test.ts`, current source manifest, and this Task ledger.
  - History: `56b4fe9` — `step(cockpit): activate the header-only deck`.
- [x] Step 1.4 Replace the rejected open-sided deck with the Human-approved rich header: ornamental ladybugs, no side borders or footer, title-row Task/Step progress, compact project/Git state, balanced global/local telemetry, and prompt-colored rules; leave Vim and Neovim untouched.
  - Estimate: 35–55 minutes; uncertainty was bounded Task/Step hierarchy parsing and ANSI-safe responsive alignment.
  - Timing: Planning record started 2026-09-07T09:06:10Z; production implementation ran 2026-09-07T09:08:20Z–2026-09-07T09:36:10Z (27m50s including checks and review corrections).
  - Check: PASS — focused Status 109/109 and Header 78/78 tests prove bounded Task/Step hierarchy, title-right progress, exact `󰠭 > … < 󰠭` ornaments, prompt-colored rules and major separators, compact nonzero Git, context tokens, retained runtime, balanced ANSI-safe rows, no side borders, no LSP, no footer, honest absence, live deck refresh paths, distinct activity/focus, and width retention at 160/100/79/59/39/20 cells. The complete root gate passes 371 tests plus Prettier, zero-finding lint, strict TypeScript, current 91-file and immutable 87-file integrity, composition, and OpenSpec validation. Isolated offline Pi loading passes with 208 output rows. Independent review findings about stale telemetry, fabricated absence, title duplication, decimal CPU refresh, and superseded acceptance were corrected within scope.
  - Paths: Header `index.ts`, `src/deck.ts`, `src/gauge.ts`, and `test/deck.test.ts`; Status `src/types.ts`, `src/openspec.ts`, `src/publisher.ts`, `test/openspec.test.ts`, and `test/publisher.test.ts`; this Plan/Task; and current source manifest. No Vim or Neovim path changed.
  - History: `8316876` — `fix(cockpit): render the agreed rich header`.
- [x] Step 1.5 Refine rich-header chrome with `󰠭 › … ‹ 󰠭`, pale solid internal rules, flowing two-line description, percentage-only context, corrected telemetry grouping, and existing editor-only composition that suppresses legacy prompt telemetry without modifying Vim or Neovim source.
  - Estimate: 15–25 minutes; uncertainty was responsive narrative wrapping and the host prompt surface left by editor-only mode.
  - Timing: 2026-09-07T10:00:13Z–2026-09-07T10:17:53Z (17m40s including checks and review corrections).
  - Check: PASS — Header 80/80 proves Plan/Task-only one/two-line narrative flow, ANSI-safe widths at 160/100/79/59/39/20, fancy ornaments, pale internal rules, percentage-only context, corrected telemetry grouping, and retained runtime. Root tooling 12/12 binds the shared `editor-only` composition surface to the invocation. The complete root gate passes 373 tests plus formatting, zero-finding lint, strict TypeScript, current 91-file and immutable 87-file integrity, composition, and OpenSpec validation. Isolated offline Pi loading passes with 208 output rows; independent review passes; no Vim or Neovim source path changed. One earlier filtered root-test invocation passed its intended 12 tests but returned a non-product npm option-forwarding error; the normal focused and complete commands passed afterward.
  - Paths: `src/index.ts`, `test/local-load-probe.test.ts`, Header `src/deck.ts` and `test/deck.test.ts`, this Plan/Task, and current source manifest. No Vim or Neovim source path changed.
  - History: `1712279` — `fix(cockpit): refine rich header chrome`.
- [x] Step 1.6 Replace internal rules with pale dotted dividers and move the Plan title onto the status row while retaining only the current Task in the wrapping narrative.
  - Estimate: 10–20 minutes; uncertainty was fitting status/focus/Plan beside focused progress at responsive widths.
  - Timing: 2026-09-07T10:26:24Z–2026-09-07T10:33:15Z (6m51s including checks and review).
  - Check: PASS — Header 80/80 proves exact dotted `dim` dividers, solid prompt-colored outer ornaments, status/focus/Plan hierarchy, current-Task-only one/two-line narrative flow, and ANSI-safe widths at 160/100/79/59/39/20. The complete root gate passes 373 tests plus formatting, zero-finding lint, strict TypeScript, current 91-file and immutable 87-file integrity, composition, and OpenSpec validation. Isolated offline Pi loading passes with 208 output rows; independent review passes; no Vim or Neovim source path changed.
  - Paths: Header `src/deck.ts` and `test/deck.test.ts`, this Plan/Task, and current source manifest. No Vim or Neovim source path changed.
  - History: `ea57172` — `fix(cockpit): clarify header hierarchy`.
- [x] Step 1.7 Move the iconless activity timer onto the status row and collapse compact icon-led telemetry into left/right islands with neutral dim dotted dividers.
  - Estimate: 15–25 minutes; uncertainty was one-row retention across responsive widths, ANSI-safe neutral dim styling, and removing active Task duplication.
  - Timing: 2026-09-07T10:45:51Z–2026-09-07T11:05:38Z (19m47s including checks, correction, and review).
  - Check: PASS — Header 82/82 proves `(HH:MM'SS)` activity age, one-line status/progress with left-side truncation, waiting/active Plan hierarchy without Task duplication, Task-only two-line narrative, single-title behavior, neutral terminal-dim dotted rules, compact icon-led left/right telemetry islands, one-cell fit retention, honest absence, and ANSI-safe widths at 160/100/79/59/39/20. The complete root gate passes 375 tests plus formatting, zero-finding lint, strict TypeScript, current 91-file and immutable 87-file integrity, composition, and OpenSpec validation. Isolated offline Pi loading passes with 208 output rows; final independent review passes; no Vim or Neovim source path changed.
  - Paths: Header `src/deck.ts` and `test/deck.test.ts`, this Plan/Task, and current source manifest. No Vim or Neovim source path changed.
  - History: Expected `fix(cockpit): compact header telemetry`.

### Human validation

- [ ] Human validates the rich header colors, pale internal rules, narrative wrapping, telemetry grouping, wide/narrow resizing, lifecycle transitions, package reload, no footer, and no legacy prompt telemetry rails; preserve original response, canonical outcome, and UTC.
