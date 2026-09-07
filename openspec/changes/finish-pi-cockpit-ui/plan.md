# Plan: Finish semantic header and prompt chrome

- **Idea:** `share-pi-vimux-starship`
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
- **Human validation:** `NOT VALID` at 2026-09-07T13:28:15Z — title lost too much color and blank layout rows remain above/below the deck.

## Symptom, cause, repair, and regression check

- **Symptom:** Plan/Task colors change with lifecycle, progress is not visually independent, and Pi's inherited editor rails create extra solid rules around the prompt beneath the accepted header.
- **Cause:** The rich deck applies `work.color` to every title role and hardcodes available progress as `accent`; Pi Vim's `editor-only` path disables telemetry but returns the inherited bordered `CustomEditor` rendering unchanged.
- **Bounded repair:** Keep contextual color only on lifecycle, use stable text for Plan/Task, derive progress color from completion, render fixed-width `MM:SS'cc` activity age, apply the agreed bold hierarchy, and remove only the inherited first/last editor border rows in `editor-only` mode.
- **Regression check:** Pure fixtures prove timer precision, emphasis, and independent semantic colors; editor-only tests prove border rows disappear while prompt content, multiline shape, cursor-bearing content, app behavior, modes, and bridge wiring remain unchanged.

## Value

Human sees one visually stable cockpit and an unframed prompt: lifecycle remains contextual, Plan/Task text stays readable, complete progress turns green without mislabeling incomplete work, and no duplicate editor rules compete with the rich header.

## Acceptance criteria

- [ ] Lifecycle alone uses `work.color`; timer remains dim; activity remains accent; Plan and Task retain a stable visible color distinct from progress; major separators retain prompt-separator color.
- [x] Runtime age uses fixed-width `MM:SS'cc` at the existing 50 ms refresh cadence so active work has visible subsecond motion.
- [x] Bold is limited to lifecycle, current Task narrative, Task/Step progress cells, the Devbox marker, and major separators; timer, activity, next direction, Plan, folder/PWD, Git, telemetry, minor separators, and rules remain regular.
- [x] Task and Step counters use `success` only when complete, `accent` while available but incomplete, and `dim` when unavailable.
- [ ] The rich deck and borderless editor compose with the smallest safe outer spacing available through Pi's public API while preserving every prompt content row, multiline input, cursor-bearing rendering, autocomplete rows, application controls, mode transitions, and existing external-editor bridge behavior.
- [x] Rails mode remains behaviorally compatible and retains inherited/editor telemetry rails.
- [x] The accepted header structure, telemetry, responsive widths, footer suppression, and package composition remain unchanged.
- [ ] Human validates colors and the borderless prompt after `/reload`.

## Scope and boundaries

Included paths are `packages/galactica-context-header/src/deck.ts`, `packages/galactica-context-header/test/deck.test.ts`, `packages/pi-vim-top-border/index.ts`, new `packages/pi-vim-top-border/test/editor-only-surface.test.ts`, this change's `.openspec.yaml`, `plan.md`, and `tasks.md`, and `baseline/source.sha256`.

Excluded are root composition, package manifests, mode-transition behavior, forced Neovim launch, Normal navigation, bridge implementation, Pi settings, dependencies, network operations, protected configuration, and history rewriting. The inherited editor border rows also carry scroll indicators; Human explicitly prioritizes a borderless prompt in this composition, so the focused regression proves content/cursor preservation while those border indicators are intentionally absent.

Read-only preflight inspected current Pi extension/TUI/keybinding/SDK documentation, the inherited Pi Editor rendering, current Pi Vim editor-only branch, mode transitions, bridge, and header color seams. The exact path-scoped brief was confirmed with `yes`; repository mutation only is authorized.

## Method and execution

Fix is appropriate because live Human review identified two reproducible rendering defects with isolated causes and discriminating checks. Native direct execution is proportional; an independent reviewer checks the staged result but owns no implementation, authority, history, or Human validation.

Mutation requires the current Git root and named targets writable. No protected Pi configuration, external execution, or network authority is granted.

## Verification

Run focused Context Header tests for `MM:SS'cc` precision, the exact bold hierarchy, color-role separation, and completion semantics. Add an editor-only fixture proving top/bottom rail removal with unchanged content/cursor rows and unchanged rails mode. Format and lint every edited file, type-check TypeScript, run relevant Header/Vim/root tests, baseline integrity, composition, OpenSpec validation, and offline Pi load. Inspect staged paths and obtain independent review/history verification. Human runs `/reload`, observes subsecond timer motion, compares emphasis and complete/incomplete progress colors, and verifies no editor rules surround single- or multi-line prompts.

**Final history target:** `fix(cockpit): finish header and prompt chrome`

**Checkpoint policy:** Commit each successful Step with only declared source/tests, matching OpenSpec progress, and current baseline manifest; record owner-only receipts and independently verify before the next Step. The final Task-boundary commit follows only after Human `VALID`.
