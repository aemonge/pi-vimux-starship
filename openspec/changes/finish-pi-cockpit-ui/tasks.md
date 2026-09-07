# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Finish semantic header and prompt chrome

- **Value:** Human sees stable title roles, honest semantic progress colors, and a borderless prompt beneath the accepted rich header without editor behavior changes.
- **Method source:** predefined
- **Method name:** Fix
- **Method contract:** Characterize the visible color-role and duplicate-editor-rule symptoms, repair only their diagnosed rendering seams, and prove each with discriminating render regressions.
- **Execution source:** native-direct
- **Execution name:** Sequential render-only chrome repair
- **Execution reason:** Header color roles, runtime/emphasis, and editor composition are bounded render seams; direct sequential work keeps source/history boundaries independently verifiable while the typed bridge preserves package responsibilities.
- **Execution outline:** Preserve completed colors/timer/emphasis, restore stable violet Plan/Task chroma, publish the pure deck through a typed in-memory surface instead of an above-editor widget, prepend it in the existing borderless editor, and run focused/full assurance.
- **Estimate basis:** Prior rich-header render Steps completed in 3–20 minutes, while the public-API composition adds new cross-extension reload/invalidation behavior.
- **Estimated implementation:** Prior delivery took 26m32s; confirmed public-API composition repair is 35–60 additional minutes; Human wait excluded.
- **Estimate confidence:** Medium-low because public seams are known, but cross-extension lifecycle and short-terminal clipping are new composition behavior.
- **Human-wait estimate:** Separate and unbounded after deterministic checks.
- **Refinement trigger:** Stop and split or redesign if border removal changes prompt text/cursor geometry, application keybindings, mode transitions, bridge behavior, or requires Pi core/settings changes.
- **Implementation confirmed at:** 2026-09-07T12:29:09Z; revised timer/emphasis scope confirmed at 2026-09-07T12:39:00Z; public-API composition repair confirmed at 2026-09-07T13:49:33Z
- **Implementation started at:** 2026-09-07T12:29:09Z
- **Work completed at:** Public-API composition repair completed 2026-09-07T14:05:12Z after prior delivery reopened at 2026-09-07T13:28:15Z
- **Assurance started at:** Final assurance start was not separately timestamped; it followed focused checks and independent review within Step 1.7.
- **Assurance completed at:** 2026-09-07T14:05:12Z
- **Ready for validation at:** Pending verified Step 1.9 history boundary
- **Actual implementation:** Prior delivery 26m32s plus 15m39s for the public-API composition repair, including focused/full checks and independent-review provider latency; Human wait excluded because no reliable finer provider-latency split was captured.
- **Observed Human wait:** 6m24s before timer/emphasis confirmation plus 21m18s between spacing failure evidence and public-API repair confirmation; current validation wait pending.
- **Estimate outcome:** Public-API repair completed below its 35–60 minute range because the typed bridge and existing editor seam composed directly; prior repair history remains preserved.
- **Symptom:** Contextual lifecycle color leaks into Plan/Task text, progress lacks completion color, and inherited editor rails duplicate the accepted header frame.
- **Cause:** Rich-deck rendering reuses `work.color` broadly and hardcodes available progress as accent; editor-only disables telemetry but not inherited border rows.
- **Bounded repair:** Preserve semantic progress and fixed-width activity age, use accent blue for `next direction › Plan` and current Task while keeping lifecycle bold/contextual, and compose the deck inside the existing borderless editor through a typed public-API surface without Pi core or private layout mutation.
- **Regression check:** Timer/emphasis/color fixtures discriminate blue title roles from contextual lifecycle and semantic progress; surface tests prove render/invalidation/cleanup; editor tests prove deck → prompt → autocomplete ordering and unchanged editor state; root composition proves editor-deck wiring.
- **Final history target:** `fix(cockpit): finish header and prompt chrome`
- **Current non-Git boundary:** Not applicable; the repository uses Git.
- **Human validation:** Prior `NOT VALID` at 2026-09-07T13:28:15Z is preserved; `CHANGE` at 2026-09-07T14:15:26Z requests accent blue for `next direction › Plan` and the current Task while keeping `waiting` bold.

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
- [x] Step 1.7 Compose the rich deck into the existing editor through a typed public-API surface and restore stable violet Plan/Task chroma.
  - Estimate: 35–60 minutes; uncertainty was cross-extension reload/invalidation lifecycle plus short-terminal clipping while preserving the existing editor instance's cursor and autocomplete rows.
  - Timing: 2026-09-07T13:49:33Z–2026-09-07T14:05:12Z (15m39s including focused/full checks and independent review).
  - Check: PASS — tooling 14/14 proves renderer/invalidation/reconnect/fail-soft behavior and editor-deck root composition; Header 86/86 proves editor-deck renderer lifecycle without above-editor widget registration plus violet Plan/Task chroma; Vim 17/17 proves contiguous deck → borderless prompt → autocomplete ordering with unchanged text/mode. Full gate PASS with formatting, lint, strict TypeScript, 385 tests, current 92-file and immutable 87-file integrity, one-extension/six-command/two-tool composition, six valid OpenSpec changes, and credential-free offline Pi load with 213 rows. Independent review PASS with no Critical/High/Medium findings; its low ledger-drift finding was corrected before the full gate.
  - Paths: New typed root surface and tests, root composition/probe, Context Header renderer/surface/tests, Pi Vim editor composition/test, Plan/Task evidence, and current baseline manifest.
  - History: Expected `fix(cockpit): compose deck with editor surface`.
- [x] Step 1.8 Verify the public-API repair history boundary and prepare Human revalidation.
  - Estimate: 1–3 minutes; uncertainty was limited to independent receipt/commit consistency.
  - Timing: Completed 2026-09-07T14:08:52Z.
  - Check: PASS — independent verifier matched Step 1.7 commit `04af3caa3ae0ac1ef5431be0b2ba1a72701922c4`, parent, subject, exact 13-path set, committed progress, owner-only receipt, clean workspace, and awaiting-Human state.
  - Paths: Plan/Task readiness evidence only.
  - History: Expected `step(cockpit): prepare editor deck validation`.
- [x] Step 1.9 Replace loud violet title chroma with the confirmed accent-blue hierarchy.
  - Estimate: 5–12 minutes; uncertainty was limited to preserving bold and separator boundaries while changing only title-role colors.
  - Timing: Completed 2026-09-07T14:15:26Z–2026-09-07T14:24:45Z (9m19s implementation and assurance; no Human wait).
  - Check: PASS — direct fixtures prove contextual bold lifecycle, dim timer, accent-blue `next direction › Plan`, accent-blue bold Task, prompt-colored major separator, and independent complete/incomplete/unavailable progress; Header 86/86 and full 385-test gate pass with formatting, lint, strict TypeScript, baseline integrity (92 current / 87 immutable files), composition, six OpenSpec changes, and offline Pi load (213 rows). Independent review found no Critical/High/Medium issue; its dim-branch assertion suggestion was added before the final gate.
  - Paths: `packages/galactica-context-header/src/deck.ts`, `packages/galactica-context-header/test/deck.test.ts`, `openspec/changes/finish-pi-cockpit-ui/plan.md`, `openspec/changes/finish-pi-cockpit-ui/tasks.md`, and `baseline/source.sha256`.
  - History: Expected `fix(cockpit): soften title chroma`.

### Human validation

- [ ] Human reloads Pi and validates lifecycle/title/progress colors plus borderless single- and multi-line prompts; preserve original response, canonical outcome, and UTC.
  - Evidence: `NOT VALID` at 2026-09-07T13:28:15Z. Original decisive feedback: “I think you put the title color less :( :( :(” and “Feel like extra space,” with one blank row annotated before the deck and three after it.
  - Evidence: `CHANGE` at 2026-09-07T14:15:26Z. Original decisive feedback: “just blue and keep waiting in bold” and “blue for all ‘next direction › finish pi cockpit ui’ and ‘Separate contextual lifecycle, stable title, and completion-aware progress colors’.”
