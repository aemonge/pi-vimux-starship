# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Drop the vi engine from composition

- **Value:** The cockpit renders only header, footer, and status, letting the
  Human-installed engine own the editor seat with zero conflicts.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Smallest complete composition change — vi entrypoint
  out, chrome untouched, dormant fork preserved.
- **Execution source:** native-direct
- **Execution name:** Single-slice composition edit
- **Estimate basis:** Root composition mapped at `src/index.ts` lines 14–35;
  entrypoint list in root `package.json`; gates green at last boundary.
- **Estimated implementation:** 25–45 minutes.
- **Estimate confidence:** Low-medium — composition surface mapped; hidden
  vim references in tests are the main unknown.
- **Human-wait estimate:** Separate and unbounded; local launch after checks.
- **Refinement trigger:** Split if removal touches package sources beyond the
  root composition and test lockstep.

- [ ] Remove the vi entrypoint from the root composition: drop the
      `pi-vim-top-border` entry from root `package.json` `pi.extensions` and
      remove `COCKPIT_SURFACES.vim`, the `piVim` import, and its deck-surface
      wiring from `src/index.ts`. Keep `packages/pi-vim-top-border` sources
      and tests dormant and untouched.
  - Check: offline local-load probe passes without the vim surface.
  - Paths: `package.json`, `src/index.ts`.
  - Subject: `step(reshape): remove vim entrypoint from composition`.
- [ ] Ignore scratch: add `.tmp/` to `.gitignore` so candidate harnesses and
      local probes never enter history.
  - Check: `git status --short` no longer lists `.tmp/`.
  - Paths: `.gitignore`.
  - Subject: `step(reshape): ignore tmp scratch`.
- [ ] Lockstep tests: update tooling and component expectations that assume
      the vi surface is composed; run `test:tooling`, `test:status`,
      `test:header`, `test:footer`, `test:telemetry`, and `test:vim`.
  - Check: all component suites green.
  - Paths: affected test files only as discovered.
  - Subject: `step(reshape): lockstep composition tests`.
- [ ] Refresh the current baseline manifest
      (`node scripts/check-baseline.mjs --write`) and verify
      `npm run check:baseline`; `baseline/imported-source.sha256` untouched.
  - Check: `check:baseline` PASS with refreshed manifest.
  - Paths: `baseline/source.sha256`.
  - Subject: `step(reshape): refresh current baseline manifest`.
- [ ] Offline smoke: `pi --offline --no-extensions -e "$(pwd -P)"
      --list-models` loads the chrome-only package.
  - Check: smoke PASS.
  - Paths: none.
  - Subject: `step(reshape): offline chrome smoke`.

- [ ] Human validation: with `npm:@burneikis/pi-vim` installed, launch Pi and
      confirm the deck renders, the engine owns the prompt, no vim rails or
      bridge redirects appear, and `ctrl+g`/`ctrl+e` external editing works.
- **Final commit:** `feat(cockpit): compose header footer status only`

## Task 2 — Absorb goal-x state into the deck

- **Value:** With one focused goal, the deck shows the full goal block owning
  the focus headline, and goal-x's own persistent rows are dark.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Smallest complete absorption — disable goal-x's widget
  by its own settings, render its storage state at density A.
- **Execution source:** native-direct
- **Execution name:** Storage read, deck render
- **Estimate basis:** `packages/status/src/goal.ts` already reads goal state;
  goal-x 0.32.3 storage and widget inspected read-only this session.
- **Estimated implementation:** 60–100 minutes.
- **Estimate confidence:** Low — auditor/runs storage fields and the exact
  widget-disable settings key are mapped but unverified in execution.
- **Human-wait estimate:** Separate; settings file applied by Human on request.
- **Refinement trigger:** Split auditor/runs segments into their own Task if
  storage fields exceed the mapped set.

- [ ] Pin the widget-disable switch: read `goal-widget.ts` settings
      consumption and record the exact settings key, layer file, and value
      that disables its persistent rows without touching its modals.
  - Check: finding recorded in this Step with file and line evidence.
  - Paths: none (read-only).
  - Subject: `step(goals): pin widget disable switch`.
- [ ] Extend the status goal consumer with task subtree counts, auditor
      phase/percentage, autonomous runs against limit, oracle flag, and
      waiting, read from goal-x storage entries.
  - Check: `test:status` green with new consumer cases.
  - Paths: `packages/status/src/goal.ts`, tests.
  - Subject: `step(goals): extend goal state consumer`.
- [ ] Render the density-A goal block in the header deck: headline takeover
      when the goal leads the focus chain, compressed tail segment when
      outranked, absent with no goal, responsive degradation to the minimal
      glyph ladder.
  - Check: `test:header` green for focused, outranked, and absent states.
  - Paths: `packages/header/src/deck.ts`, tests.
  - Subject: `step(goals): render density-a goal block`.
- [ ] Apply the goal-x settings change through the Human (exact layer file
      and key supplied), then verify `/goal` modals still open and its
      persistent rows are gone.
  - Check: manual — widget dark, `/goal` dashboard opens on demand.
  - Paths: none in repo.
  - Subject: `step(goals): disable goal-x persistent widget`.
- [ ] Refresh baseline manifest and rerun component gates.
  - Check: `check:baseline` PASS; header/status suites green.
  - Paths: `baseline/source.sha256`.
  - Subject: `step(goals): refresh baseline manifest`.

- [ ] Human validation: focus a real goal, confirm the block owns the
      headline with tasks/auditor/runs rows, degrades when outranked, and
      disappears when unfocused; `/goal` modals unaffected.
- **Final commit:** `feat(header): goal-x state owns the focus headline`

## Task 3 — Mirror the appa guard in telemetry

- **Value:** One telemetry segment answers "is protection on, is the runtime
  alive, has anything been denied" without opening a command.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Smallest complete guard mirror — gate, health, and
  denial count rendered as a degrading telemetry segment.
- **Execution source:** native-direct
- **Execution name:** Status watcher plus segment
- **Estimate basis:** openappa 0.32.3-era source inspected: env/config gate
  read, loopback health probe, `appa:` block reasons visible in tool results.
- **Estimated implementation:** 30–55 minutes.
- **Estimate confidence:** Low-medium — probe cadence and denial-event shape
  are the unknowns.
- **Human-wait estimate:** None beyond validation.
- **Refinement trigger:** Split if the health probe needs its own scheduling
  decision beyond the status refresh cycle.

- [ ] Add the appa gate reader and denial watcher to the status package:
      gate state and source from the same env/config signals openappa reads,
      denial count from tool results carrying its `appa:` block reasons.
  - Check: `test:status` green for on, off, and denied-count cases.
  - Paths: `packages/status/src/`, tests.
  - Subject: `step(appa): gate reader and denial watcher`.
- [ ] Add the runtime health probe on the status refresh cycle and expose
      unreachable as a distinct state.
  - Check: `test:status` green for reachable and unreachable cases.
  - Paths: `packages/status/src/`, tests.
  - Subject: `step(appa): runtime health probe`.
- [ ] Render the appa telemetry segment in the header deck with the four
      glyph states and responsive degradation to bare glyph, then nothing.
  - Check: `test:header` green for all four states.
  - Paths: `packages/header/src/deck.ts`, tests.
  - Subject: `step(appa): telemetry segment glyph ladder`.
- [ ] Refresh baseline manifest and rerun component gates.
  - Check: `check:baseline` PASS; suites green.
  - Paths: `baseline/source.sha256`.
  - Subject: `step(appa): refresh baseline manifest`.

- [ ] Human validation: with `pi-openappa` installed, toggle protection and
      (when convenient) the runtime, and confirm the four glyph states and
      denial badge render and degrade correctly.
- **Final commit:** `feat(telemetry): appa guard status segment`

## Task 4 — Rename to pi-starship-header and publish

- **Value:** The package name tells the truth — `@aemonge-dev/pi-starship-header`
  installs the chrome deck, and the old name redirects to it.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Smallest complete identity change — manifest, docs, and
  gates in lockstep; publish and install are Human actions.
- **Execution source:** native-direct
- **Execution name:** Identity lockstep, Human publish
- **Estimate basis:** The earlier publish plan's manifest/docs/gate pattern is
  accepted; registry mechanics already proven for the old name.
- **Estimated implementation:** 30–60 minutes agent work; Human publish,
  deprecate, install, and host dir move excluded.
- **Estimate confidence:** Medium — rename lockstep follows an accepted
  pattern; the Human-side sequence is procedural.
- **Human-wait estimate:** Separate and bounded: publish, deprecate, install,
  and the host directory move.
- **Refinement trigger:** Split if rename grows beyond identity, docs, and
  gate lockstep into structural moves.

- [ ] Change in-repo identity: root `package.json` name to
      `@aemonge-dev/pi-starship-header` with a minor version bump, README and
      docs rename with install commands updated, tooling name assertions and
      package gates in lockstep.
  - Check: `check:package`, `test:tooling`, and offline local-load probe
      green under the new identity.
  - Paths: `package.json`, `README.md`, `docs/`, `scripts/check-package.mjs`,
    `test/`, `src/local-load-probe.ts`.
  - Subject: `step(rename): pi-starship-header identity lockstep`.
- [ ] Full gate pass under the new identity: `format:check`, `lint`,
      `typecheck`, component suites, `check:baseline`, `check:openspec`.
  - Check: full `npm run check` green.
  - Paths: lockstep with the previous Step.
  - Subject: `step(rename): full gate under new identity`.

- [ ] Human validation: publish the new name, deprecate the old name toward
      it, swap the personal install, and move the host directory; a fresh
      `pi install npm:@aemonge-dev/pi-starship-header` loads the deck.
- **Final commit:** `chore(rename): pi-starship-header identity`
