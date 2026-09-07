# Plan: Finish semantic header and prompt chrome

- **Idea:** `share-pi-vimux-starship`
- **Method source:** predefined
- **Method name:** Fix
- **Method contract:** Characterize the visible color-role and duplicate-editor-rule symptoms, repair only their diagnosed rendering seams, and prove each with discriminating render regressions.
- **Execution source:** native-direct
- **Execution name:** Sequential render-only chrome repair
- **Execution reason:** Header color roles, runtime/emphasis hierarchy, and Pi Vim editor-only borders are separate small render seams; direct sequential work keeps each source/history boundary independently verifiable.
- **Execution outline:** Preserve the completed timer/emphasis/spacing fixes, use accent blue for `next direction › Plan` and the current Task while retaining contextual bold lifecycle, keep the typed in-memory deck surface inside the existing borderless editor, and prove lifecycle, cursor, autocomplete, reload, responsive, and package behavior.
- **Estimate basis:** The accepted rich-header Steps completed comparable render fixes in 7–20 minutes, and the current causes are isolated in pure render branches with existing tests.
- **Estimated implementation:** Prior delivery took 26m32s; confirmed public-API composition repair is 35–60 additional minutes; Human wait excluded.
- **Estimate confidence:** Medium-low because the public seams are known, but cross-extension reload/invalidation and short-terminal clipping are new composition behavior.
- **Human-wait estimate:** Separate and unbounded after deterministic checks.
- **Refinement trigger:** Stop and split or redesign if the typed surface cannot preserve prompt/cursor/autocomplete behavior, requires Pi core/settings/private layout mutation, or cannot fail soft across reload.
- **Implementation confirmed at:** 2026-09-07T12:29:09Z; revised timer/emphasis scope confirmed at 2026-09-07T12:39:00Z; public-API composition repair confirmed at 2026-09-07T13:49:33Z
- **Implementation started at:** 2026-09-07T12:29:09Z
- **Work completed at:** Public-API composition repair completed 2026-09-07T14:05:12Z after prior delivery reopened at 2026-09-07T13:28:15Z
- **Assurance started at:** Final assurance start was not separately timestamped; it followed focused checks and independent review within Step 1.7.
- **Assurance completed at:** 2026-09-07T14:05:12Z
- **Ready for validation at:** 2026-09-07T14:27:23Z after independent Step 1.9 history verification
- **Human validation:** Prior `NOT VALID` at 2026-09-07T13:28:15Z is preserved; `CHANGE` at 2026-09-07T14:15:26Z requests accent-blue title hierarchy while keeping `waiting` bold.

## Symptom, cause, repair, and regression check

- **Symptom:** Plan/Task colors change with lifecycle, progress is not visually independent, and Pi's inherited editor rails create extra solid rules around the prompt beneath the accepted header.
- **Cause:** The rich deck applies `work.color` to every title role and hardcodes available progress as `accent`; Pi Vim's `editor-only` path disables telemetry but returns the inherited bordered `CustomEditor` rendering unchanged.
- **Bounded repair:** Keep contextual color and bold on lifecycle, use accent blue for `next direction › Plan` and the current Task, derive progress color from completion, retain fixed-width `MM:SS'cc` and agreed emphasis, and keep the pure deck renderer inside the existing borderless editor through a typed public-API surface.
- **Regression check:** Pure fixtures prove timer/emphasis/colors; surface tests prove renderer/invalidation/cleanup; editor tests prove deck → prompt → autocomplete ordering with unchanged cursor-bearing content, mode, app behavior, and bridge wiring; composition tests prove no above-editor deck registration.

## Value

Human sees one calm blue-titled cockpit composed contiguously with its unframed prompt at Pi's safe public-API spacing minimum: lifecycle remains contextual and bold, progress is independent, and fullscreen editor filler no longer expands the gap below the deck.

## Acceptance criteria

- [x] Lifecycle uses `work.color` and remains bold; timer remains dim; activity remains accent; `next direction › Plan` is entirely accent blue and regular; current Task is accent blue and bold; major separators retain prompt-separator color.
- [x] Runtime age uses fixed-width `MM:SS'cc` at the existing 50 ms refresh cadence so active work has visible subsecond motion.
- [x] Bold is limited to lifecycle, current Task narrative, Task/Step progress cells, the Devbox marker, and major separators; timer, activity, next direction, Plan, folder/PWD, Git, telemetry, minor separators, and rules remain regular.
- [x] Task and Step counters use `success` only when complete, `accent` while available but incomplete, and `dim` when unavailable.
- [x] The rich deck is no longer an above-editor widget and instead prepends to the existing borderless editor through a typed in-memory surface, removing fullscreen editor filler while preserving every prompt content row, multiline input, cursor-bearing rendering, autocomplete rows, application controls, mode transitions, and existing external-editor bridge behavior.
- [x] The surface transports only a bounded renderer and invalidation callback, disconnects safely on reload/cleanup, and never receives prompt text, generated prose, tool arguments, credentials, or hidden reasoning.
- [x] Remaining Pi-owned spacing is honest: one host row above the editor dock, one actual empty prompt row, and a possible reserved empty footer row; no Pi core, settings, dependency, or private layout mutation is used.
- [x] Rails mode remains behaviorally compatible and retains inherited/editor telemetry rails.
- [x] The accepted header structure, telemetry, responsive widths, footer suppression, and package composition remain unchanged.
- [ ] Human validates colors and the borderless prompt after `/reload`.

## Scope and boundaries

Repair paths are new `src/deck-surface.ts`, `src/index.ts`, new `test/deck-surface.test.ts`, `test/local-load-probe.test.ts`, `packages/galactica-context-header/index.ts`, `packages/galactica-context-header/src/deck.ts`, `packages/galactica-context-header/test/deck.test.ts`, `packages/galactica-context-header/test/surface.test.ts`, `packages/pi-vim-top-border/index.ts`, `packages/pi-vim-top-border/test/editor-only-surface.test.ts`, this change's `plan.md` and `tasks.md`, and `baseline/source.sha256`.

Excluded are package manifests, mode-transition behavior, forced Neovim launch, Normal navigation, bridge implementation, Pi core, Pi settings, dependencies, network operations, protected configuration, private layout mutation, and history rewriting. Temporary Pi dialogs may replace the editor and briefly hide the deck; very short terminals may clip upper deck rows to preserve the cursor. Human selected the public-API minimum and explicitly prohibited Pi core changes.

Read-only preflight inspected current Pi extension/TUI/keybinding/SDK documentation, the inherited Pi Editor rendering, current Pi Vim editor-only branch, mode transitions, bridge, and header color seams. The exact path-scoped brief was confirmed with `yes`; repository mutation only is authorized.

## Method and execution

Fix is appropriate because live Human review identified two reproducible rendering defects with isolated causes and discriminating checks. Native direct execution is proportional; an independent reviewer checks the staged result but owns no implementation, authority, history, or Human validation.

Mutation requires the current Git root and named targets writable. No protected Pi configuration, external execution, or network authority is granted.

## Verification

Run focused Context Header tests for the accent-blue title hierarchy and existing timer/emphasis/progress behavior; typed surface tests for render/invalidation/disposal; editor fixtures for deck → prompt → autocomplete order, cursor-bearing multiline preservation, and rails compatibility; root composition tests proving editor-deck wiring without an above-editor widget. Format and lint every edited file, type-check TypeScript, run relevant Header/Vim/root tests, baseline integrity, composition, OpenSpec validation, offline Pi load, and independent semantic review. Human runs `/reload`, verifies the blue title hierarchy and reduced public-API-minimum spacing with single-line, multiline, and autocomplete prompts.

**Final history target:** `fix(cockpit): finish header and prompt chrome`

**Checkpoint policy:** Commit each successful Step with only declared source/tests, matching OpenSpec progress, and current baseline manifest; record owner-only receipts and independently verify before the next Step. The final Task-boundary commit follows only after Human `VALID`.
