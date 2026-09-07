# Plan: Reflow cockpit telemetry into one open-sided header deck

- **Idea:** `share-pi-vimux-starship`
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
- **Human validation:** Pending

## Value

Human gets one colorful, open-sided command deck above the prompt: spacious work context, project/Git state, compact operational and model telemetry, and a strong mode-aware prompt entrance with opposing ladybugs. No visible footer or duplicate prompt rails remain.

## Acceptance criteria

- [ ] Wide rendering matches the approved structure without side borders or blank spacer rows: `─ 󰠭 > ─` top ornament, narrative block, thin horizontal section dividers, project/Git block, two icon-rich telemetry rows, and a heavy mode rail ending `< 󰠭 ══`.
- [ ] Runtime syntax is `00:00:07 ⟩ waiting › next direction`; semantic groups use `⟩` while related values use spacing or `·`.
- [ ] Labels stay compact: `agts`, `stps`, `files`, `ctx`, `zips`, and `qta`.
- [ ] `agts` uses bounded Taskflow worker counts, `stps` uses focused OpenSpec Step progress, `files` uses only explicit orchestration progress, LSP and MCP are optional bounded capability feeds, `ctx` is percentage, `zips` is active-branch compaction count, `qta` is provider quota, and unavailable values render honestly.
- [ ] CPU and resident memory render together as ` 48.2% (268M)` with M/G/T scaling.
- [ ] Theme colors distinguish lifecycle, focus, Git state, model/thinking, pressure, resources, separators, mode, and the heavy magenta rail without hard-coded ANSI.
- [ ] Wide, medium, narrow, and tiny layouts never exceed terminal width and preserve narrative, mode, context, and the prompt entrance before optional telemetry.
- [ ] One root composition entrypoint selects Footer telemetry-only, Status semantic-provider, Header deck, and Vim editor-only modes in accepted startup order.
- [ ] Context Header is the sole visible compositor; no persistent default/custom footer or decorated prompt rails remain.
- [ ] Existing Ctrl-E external-Neovim behavior, cursor behavior, editor input, event sanitization, optional-capability absence, and isolated offline loading remain valid.
- [ ] Human validates colors, resizing, lifecycle transitions, mode changes, reload, and Ctrl-E before final history.

## Scope and boundaries

Create this Plan's `.openspec.yaml`, `plan.md`, and `tasks.md`. Root scope is `package.json`, `src/index.ts`, `src/local-load-probe.ts`, `test/local-load-probe.test.ts`, `README.md`, `docs/architecture.md`, `docs/development.md`, and `baseline/source.sha256`.

Fancy Footer scope is `src/api.ts`, `src/index.ts`, `src/index.test.ts`, and `src/shared.ts`. Galactica Status scope is `index.ts`, `src/types.ts`, `src/orchestration.ts`, `src/openspec.ts`, `src/publisher.ts`, and focused `test/orchestration.test.ts`, `test/openspec.test.ts`, `test/publisher.test.ts`, and `test/active-work.test.ts`. Context Header scope is `index.ts`, `src/gauge.ts`, `src/capabilities.ts`, new `src/deck.ts`, `test/gauge.test.ts`, `test/capabilities.test.ts`, and new `test/deck.test.ts`. Pi Vim scope is `index.ts`, `test/prompt-rail.test.ts`, `test/external-editor-intercept.test.ts`, and new `test/header-deck-surface.test.ts`.

Excluded are collapsed Normal/control mode, automatic Insert routing, Neovim/bridge changes, Pi settings, dependencies, lockfile changes, publication, live provider requests, service operations, credentials, destructive cleanup, and history rewriting. Missing file/LSP data renders `—`; no unavailable telemetry is inferred.

The exact revised brief was presented after read-only source/TUI preflight. Human confirmed it with `Yes` at 2026-09-03T14:47:41Z. Repository mutation only is authorized; network and protected Pi configuration remain unauthorized.

## Method and execution

Happy-path is appropriate because this is one new Human-validatable visual outcome, not a repair or disposable investigation. Direct sequential execution is proportional because each provider mode must be available before the sole compositor can consume it, and editor rail removal follows only after the header owns mode visibility.

Use Pi's documented multi-line `setWidget` component contract, theme callbacks, `visibleWidth`/`truncateToWidth`, and `requestRender`. The Header owns an empty custom footer because `setFooter(undefined)` restores Pi's default. Root composition passes explicit modes while package defaults retain standalone regression compatibility.

Each Step gets nearest focused tests, exact formatting/lint/typecheck, a scoped Git commit, an owner-only receipt, and independent history/path verification before the next Step.

## Human-corrected rich-header contract

Human rejected the activated 11-line open-sided deck as `NOT VALID`. This replacement supersedes the conflicting visual acceptance above while preserving its security, sanitization, responsive-width, package-composition, and Human-validation boundaries. The replacement confirmed at 2026-09-07T09:08:20Z keeps two ornamental violet ladybugs as `─ 󰠭 > ─…` and `…─ < 󰠭 ─`, removes side borders and the footer, and uses prompt-colored horizontal rules. The title row balances lifecycle, optional activity, major focus boundary, and focus on the left with honest focused OpenSpec Task/Step progress on the right. Two bounded narrative lines follow. Project/path balances shortened branch and nonzero Git counters; model/thinking balances context/tokens, compactions, quota, and cost; runtime/agents/files balances CPU/RAM and MCP. Major `⟩` separators use the rule color, minor `›` separators follow their semantic text, and tightly related values use `·`. Vim and Neovim code and behavior remain excluded.

## Human-corrected chrome refinement

Human returned `CHANGE` after live review and confirmed the bounded refinement at 2026-09-07T10:00:13Z. Use fancy `󰠭 ›` and `‹ 󰠭` ornaments, strong prompt-colored outer rules, pale solid `borderMuted` internal rules, and a combined Plan/Task narrative that occupies one line when it fits and at most two when wrapped. Show context percentage without token counts; group context and compactions with minor `›`, then quota and cost behind major `⟩`; keep CPU and RAM joined by `·`. Retain only focused Task/Step progress. Root composition selects Pi Vim's existing `editor-only` surface to suppress legacy prompt telemetry while preserving editor mechanics and leaving every Vim and Neovim source path unchanged. Full prompt-border removal and the future Neovim-first Normal/Insert/Visual interaction model remain separate work.

## Human-corrected hierarchy refinement

Human returned `CHANGE` on the pale solid rules and combined Plan/Task narrative, then confirmed the bounded repair at 2026-09-07T10:26:24Z. Render both internal dividers as dotted `┈` in the paler `dim` semantic color while preserving solid prompt-colored outer ornaments. Place the Plan title after the status focus on the first content row (`lifecycle ⟩ focus › Plan`) and reserve the narrative below for only the current Task, wrapping to a second line only when required. Preserve focused progress, existing telemetry grouping, editor-only composition, and the no-Vim/Neovim-source boundary.

## Verification

Use pure render fixtures at wide, medium, narrow, and tiny widths; assert ANSI/Unicode width bounds, icon/order contracts, semantic colors, unavailable telemetry, pressure transitions, and exactly two ladybugs. Verify composition options, Footer snapshots, Status counters, LSP/MCP parsing, mode publication and borderless editor rendering. Run all root checks, current/original integrity, offline isolated Pi loading, and a credential-free package dry run. Human then validates the live deck at multiple widths and exercises Ctrl-E.

**Final history target:** `feat(cockpit): reflow telemetry into the header deck`

**Checkpoint policy:** Commit each successful Step as `step(cockpit): concise value` with only declared source, tests, current integrity, and matching progress. Store and independently verify commit receipts outside the repository. The final conventional commit waits for Human validation.
