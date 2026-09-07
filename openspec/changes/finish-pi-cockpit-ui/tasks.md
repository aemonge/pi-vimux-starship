# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Finish semantic header and prompt chrome

- **Value:** Human sees stable title roles, honest semantic progress colors, and a borderless prompt beneath the accepted rich header without editor behavior changes.
- **Method source:** predefined
- **Method name:** Fix
- **Method contract:** Characterize the visible color-role and duplicate-editor-rule symptoms, repair only their diagnosed rendering seams, and prove each with discriminating render regressions.
- **Execution source:** native-direct
- **Execution name:** Sequential render-only chrome repair
- **Execution reason:** Header color roles, runtime/emphasis hierarchy, and Pi Vim editor-only borders are separate small render seams; direct sequential work keeps each source/history boundary independently verifiable.
- **Execution outline:** Separate lifecycle, title, and progress colors; sharpen the timer and bold hierarchy; then make only editor-only rendering borderless while preserving editor behavior; run focused and complete assurance.
- **Estimate basis:** The accepted rich-header Steps completed comparable render fixes in 7–20 minutes, and the current causes are isolated in pure render branches with existing tests.
- **Estimated implementation:** 25–45 minutes total from initial confirmation; Human wait excluded.
- **Estimate confidence:** Medium because render seams are known, but removing inherited editor rails must preserve multiline cursor geometry and indicators.
- **Human-wait estimate:** Separate and unbounded after deterministic checks.
- **Refinement trigger:** Stop and split or redesign if border removal changes prompt text/cursor geometry, application keybindings, mode transitions, bridge behavior, or requires Pi core/settings changes.
- **Implementation confirmed at:** 2026-09-07T12:29:09Z; revised timer/emphasis scope confirmed at 2026-09-07T12:39:00Z
- **Implementation started at:** 2026-09-07T12:29:09Z
- **Work completed at:** Prior delivery completed 2026-09-07T13:07:08Z; reopened after Human validation failure at 2026-09-07T13:28:15Z
- **Assurance started at:** Prior assurance started 2026-09-07T13:09:20Z
- **Assurance completed at:** Prior assurance completed 2026-09-07T13:10:13Z; repair assurance pending
- **Ready for validation at:** Prior delivery was ready 2026-09-07T13:10:13Z; no longer ready
- **Actual implementation:** 26m32s elapsed across five Steps, including focused/full checks and independent-review provider latency; Human wait excluded because no reliable finer provider-latency split was captured.
- **Observed Human wait:** 6m24s between initial Step evidence and revised timer/emphasis confirmation; final validation wait pending.
- **Estimate outcome:** Within the revised 25–45 minute range; known render seams kept implementation small, while autocomplete ordering required one assurance-driven repair.
- **Symptom:** Contextual lifecycle color leaks into Plan/Task text, progress lacks completion color, and inherited editor rails duplicate the accepted header frame.
- **Cause:** Rich-deck rendering reuses `work.color` broadly and hardcodes available progress as accent; editor-only disables telemetry but not inherited border rows.
- **Bounded repair:** Separate semantic color roles, use a fixed-width `MM:SS'cc` activity age, apply bold only to current control/status anchors, and strip only first/last inherited editor rows in editor-only mode.
- **Regression check:** Timer/emphasis/color-call fixtures discriminate each role and editor-only fixtures compare bordered rails mode against borderless content-preserving output.
- **Final history target:** `fix(cockpit): finish header and prompt chrome`
- **Current non-Git boundary:** Not applicable; the repository uses Git.
- **Human validation:** `NOT VALID` at 2026-09-07T13:28:15Z — original decisive feedback: “I think you put the title color less :( :( :(” and “Feel like extra space,” with evidence marking one blank row before the deck and three blank rows after it.

- [x] Step 1.1 Separate contextual lifecycle, stable title, and completion-aware progress colors.
  - Estimate: 8–15 minutes; uncertainty was retaining existing separator and responsive ANSI contracts while distinguishing every role.
  - Timing: 2026-09-07T12:29:09Z–2026-09-07T12:32:36Z (3m27s including focused checks).
  - Check: PASS — Header 83/83 proves contextual lifecycle, dim timer, accent activity, stable text Plan/Task, accent incomplete progress, green complete progress, prompt-colored major separators, responsive ANSI bounds, and unchanged rich-header structure. Strict TypeScript, current 91-file and immutable 87-file integrity, and OpenSpec validation pass.
  - Paths: Header `src/deck.ts` and `test/deck.test.ts`, this change's complete Plan/Task artifacts, `.openspec.yaml`, and current baseline manifest.
  - History: Expected `step(cockpit): separate header semantic colors`.
- [x] Step 1.2 Show fixed-width hundredths and apply the agreed bold hierarchy.
  - Estimate: 7–14 minutes; uncertainty was preserving fixed responsive width while testing partial bold spans independently from color.
  - Timing: 2026-09-07T12:39:00Z–2026-09-07T12:42:16Z (3m16s including focused checks).
  - Check: PASS — Header 85/85 proves fixed-width `MM:SS'cc`, subsecond precision, 99:59'99 saturation, lifecycle/Task/progress/Devbox/major-separator emphasis, regular Plan/timer/PWD/Git/telemetry, semantic colors, and responsive ANSI bounds. Strict TypeScript, current 91-file and immutable 87-file integrity, and OpenSpec validation pass.
  - Paths: Header `src/deck.ts` and `test/deck.test.ts`, revised Plan/Task artifacts, and current baseline manifest.
  - History: Expected `step(cockpit): sharpen runtime and emphasis`.
- [x] Step 1.3 Remove inherited editor border rows only from editor-only rendering and prove prompt parity.
  - Estimate: 10–18 minutes; uncertainty was preserving multiline cursor-bearing geometry after removing the first and last inherited rows.
  - Timing: 2026-09-07T12:46:29Z–2026-09-07T12:49:45Z (3m16s including focused checks and fixture correction).
  - Check: PASS — Vim 15/15 proves editor-only output equals the inherited rendering without its first/last frame rows, preserves both multiline prompt rows, text, mode, and cursor-bearing content, and leaves rails mode framed. Root lint and strict TypeScript, current 92-file and immutable 87-file integrity, and OpenSpec validation pass. The initial fixture lacked `tui.terminal.rows`; adding the public render dependency made the regression representative without production changes.
  - Paths: Pi Vim `index.ts`, new `test/editor-only-surface.test.ts`, matching Task progress, and current baseline manifest.
  - History: Expected `step(cockpit): remove editor-only prompt rails`.
- [x] Step 1.4 Repair assurance-found autocomplete framing and malformed timer bounds.
  - Estimate: 5–12 minutes; uncertainty was identifying the inherited bottom frame without dropping autocomplete rows or prompt content.
  - Timing: 2026-09-07T12:51:28Z–2026-09-07T13:07:08Z (15m40s including the initial full gate, independent failure review, repair, focused checks, and passing re-review).
  - Check: PASS — Header 85/85 proves finite, NaN, and infinite fixed-width timer bounds; Vim 16/16 proves frame removal preserves multiline cursor-bearing prompt and every autocomplete row while retaining rails framing. Lint, strict TypeScript, current 92-file and immutable 87-file integrity, and OpenSpec validation pass. Independent re-review found no Critical/High/Medium defects and returned PASS; residual low risk is coupling to Pi's current autocomplete render ordering.
  - Paths: Header and Pi Vim source/tests, matching Task progress, and current baseline manifest.
  - History: Expected `fix(cockpit): preserve autocomplete and timer bounds`.
- [x] Step 1.5 Rerun complete package assurance and verify the exact accepted UI scope.
  - Estimate: 3–8 minutes; uncertainty was no broader than deterministic package/tool latency.
  - Timing: 2026-09-07T13:09:20Z–2026-09-07T13:10:13Z (53s).
  - Check: PASS — full gate reports formatting, lint, strict TypeScript, 381 tests, current 92-file and immutable 87-file integrity, root composition with one extension/six commands/two tools, six valid OpenSpec changes, and credential-free offline Pi load with 213 rows. Independent semantic re-review PASS with no Critical/High/Medium findings.
  - Paths: Matching Task/Plan completion evidence only; source and current baseline were already committed and clean.
  - History: Expected `step(cockpit): verify finished cockpit UI`.
- [x] Step 1.6 Diagnose the Human-reported title-color and outer-spacing validation failure without source mutation.
  - Estimate: 3–8 minutes; uncertainty was whether blank rows came from deck/editor output or Pi's host layout.
  - Timing: Completed 2026-09-07T13:28:15Z after bounded local source inspection and an independent read-only architecture check.
  - Check: PASS — Plan/Task were deliberately changed from contextual color to plain `text`; Pi unconditionally inserts one row before above-editor widgets, fullscreen allocates at least three editor rows, and its footer reserves one row. The borderless empty prompt emits one content row, exposing two editor filler rows. Public widget/editor options provide no gap or minimum-height control.
  - Paths: Read-only evidence from Context Header, Pi Vim, root composition, Pi 0.84.4 TUI documentation, and installed Pi/TUI layout source.
  - History: Read-only diagnosis; no source checkpoint.
- [ ] Step 1.7 Implement only a newly confirmed title-color and spacing repair.
  - Estimate: Pending exact architecture selection.
  - Timing: Pending
  - Check: Pending
  - History: Pending exact conventional subject.

### Human validation

- [ ] Human reloads Pi and validates lifecycle/title/progress colors plus borderless single- and multi-line prompts; preserve original response, canonical outcome, and UTC.
  - Evidence: `NOT VALID` at 2026-09-07T13:28:15Z. Original decisive feedback: “I think you put the title color less :( :( :(” and “Feel like extra space,” with one blank row annotated before the deck and three after it.
