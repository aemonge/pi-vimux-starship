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
- **Work completed at:** 2026-09-07T08:22:20Z for the confirmed header-only scope.
- **Assurance started at:** 2026-09-07T08:20:08Z for the confirmed header-only scope.
- **Assurance completed at:** 2026-09-07T08:22:20Z
- **Ready for validation at:** 2026-09-07T08:22:20Z, subject to independent Step-history verification.
- **Actual implementation:** Approximately 18m11s across Steps 1.1–1.3, excluding Human wait; Step 1.3 took 5m24s including focused and Task-level checks.
- **Observed Human wait:** Pending
- **Estimate outcome:** Pending
- **Final history target:** `feat(cockpit): reflow telemetry into the header deck`
- **Current non-Git boundary:** Not applicable; the repository uses Git.
- **Human validation:** Pending

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
  - Check: PASS — the root manifest now activates one composition entrypoint; focused Header 76/76 and root tooling 12/12 tests pass; the complete gate passes 368 tests, Prettier, zero-finding lint, strict TypeScript, OpenSpec validation, current 91-file integrity, and immutable 87-file import integrity. The isolated offline Pi load passes with 208 output rows. A focused surface contract proves deck mode replaces Pi's footer with an empty component and restores it on cleanup. Workspace inspection confirms no Vim or Neovim path changed, and root composition preserves Pi Vim's existing rails mode.
  - Paths: `package.json`, `src/index.ts`, `src/local-load-probe.ts`, `test/local-load-probe.test.ts`, Header `index.ts` and new `test/surface.test.ts`, current source manifest, and this Task ledger.
  - History: Expected `step(cockpit): activate the header-only deck`.

### Human validation

- [ ] Human validates header colors, wide/narrow resizing, lifecycle transitions, package reload, and no Pi footer while confirming the existing Vim-owned prompt rails remain unchanged; preserve original response, canonical outcome, and UTC.
