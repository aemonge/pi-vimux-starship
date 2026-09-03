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
- **Implementation started at:** 2026-09-03T14:47:41Z
- **Work completed at:** Pending
- **Assurance started at:** Pending
- **Assurance completed at:** Pending
- **Ready for validation at:** Pending
- **Actual implementation:** Pending
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
- [ ] Step 1.2 Render the approved colored open-sided deck with deterministic responsive fallbacks.
  - Estimate: 25–35 minutes; uncertainty is fitting icon-rich Unicode/ANSI groups without semantic truncation.
  - Timing: Pending
  - Check: Pending
  - History: Pending
- [ ] Step 1.3 Retire visible footer and prompt rails in composed mode, then prove reload, cursor, and external-editor parity.
  - Estimate: 15–25 minutes; uncertainty is removing editor border rows without disturbing cursor-marker placement.
  - Timing: Pending
  - Check: Pending
  - History: Pending

### Human validation

- [ ] Human validates colors, wide/narrow resizing, lifecycle and mode transitions, no footer/duplicate rails, reload, and Ctrl-E; preserve original response, canonical outcome, and UTC.
