# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Cockpit telemetry sink entrypoint

- **Value:** Every live cockpit session mirrors its `HeaderStatusEvent` into
  one package-owned JSON snapshot, giving any external reader a truthful,
  fail-soft live feed of agent state.
- **Method source:** predefined
- **Method name:** TDD
- **Method contract:** Test-only RED contracts for payload projection,
  fail-soft, atomic write, and prune fail for their discriminating expected
  reasons before production exists; deterministic RED evidence is recorded,
  then minimum GREEN and refactor/still-GREEN stay within this Task's scope.
- **implementation_confirmed_at:** 2026-09-29T07:43Z (Human `Yes` to the exact
  Task 1 TDD brief).
- **Execution source:** native-direct
- **Execution name:** Sequential sink-then-render slices
- **Estimate basis:** Channel and event shape known from inspection; new
  package with no render coupling; test-first overhead has no comparable
  accepted evidence.
- **Estimated implementation:** 75–150 minutes; Human wait excluded.
- **Estimate confidence:** Low — no comparable accepted Plan.
- **Human-wait estimate:** Separate and unbounded after deterministic checks.
- **Refinement trigger:** Split if the snapshot schema exceeds roughly twelve
  fields, entrypoint registration touches more than the root manifest and
  baseline refresh, or any `galactica-status:header` contract change becomes
  necessary.

- [x] RED — test-only contracts in `packages/cockpit-telemetry/test/`, no
      production code yet: the snapshot payload holds exactly the
      `HeaderStatusEvent` facts plus `sessionId`, `pid`, `cwd`, `sessionStart`
      (captured at `session_start`), `updatedAt`, and nothing else; writes are
      atomic (tmp + rename, never a partial file); every failure path (missing
      directory, unwritable directory, malformed event) fails soft without
      disturbing the host; the session's own snapshot is pruned on
      `session_shutdown`. Each contract fails for its discriminating expected
      reason; record the deterministic RED evidence (command and failing
      assertions) in this Step's entry.
  - Started: 2026-09-29T07:44Z. Completed: 2026-09-29T07:49Z (≈5 min).
  - RED evidence: `npm test` in `packages/cockpit-telemetry` — 2 suites,
    10 contracts, 0 pass / 2 suite-level fails; discriminating reason
    `ERR_MODULE_NOT_FOUND: Cannot find module
    '.../packages/cockpit-telemetry/src/sink.ts'` (and `../index.ts` for the
    wiring suite): production does not exist. Typecheck is expected to fail
    identically until GREEN; format and lint are kept clean.
  - Paths: `packages/cockpit-telemetry/package.json`, `tsconfig.json`,
    `.prettierignore`, `test/README.md`, `test/sink.test.ts`,
    `test/wiring.test.ts`.
  - Subject: `step(telemetry-sink): red snapshot contracts`.
- [x] GREEN — minimum sink in `packages/cockpit-telemetry`: extension factory
      subscribing to `GALACTICA_HEADER_CHANNEL` via `pi.events.on`, atomically
      writing `~/.local/state/pi-vimux-starship/agents/<sessionId>.json` on
      each event, capturing `sessionStart` at `session_start`, keeping `pid`
      for gone-detection, pruning on `session_shutdown`; the RED suite passes
      with no test modification.
  - Started: 2026-09-29T07:51Z. Completed: 2026-09-29T07:57Z (≈6 min).
  - Check: `npm test` — 11/11 pass; `tsc --noEmit` clean; eslint clean;
    prettier clean.
  - Honest note: the atomicity test's expected constant was wrong in RED
    (index 4 of an alternating loop lands on `true`, not `false`); fixed to
    `blocked: index === 4` which is the stronger last-writer-wins
    discriminator. No production code was accommodated; one type predicate
    annotation (`isHeaderEvent`) was needed to spread the narrowed event.
  - Paths: `packages/cockpit-telemetry/src/sink.ts`, `index.ts`,
    `test/sink.test.ts`.
  - Subject: `step(telemetry-sink): green minimum snapshot sink`.
- [x] Refactor/still-GREEN and registration: refactor only within the confirmed
      scope if the minimum GREEN needs it; register the package as the fifth
      entrypoint in the root package composition (`src/index.ts`, startup order
      preserved) with manifest `files` coverage as needed, refresh the baseline
      manifest (`node scripts/check-baseline.mjs --write`), and run the focused
      gates: new package tests, `check:baseline`, `check:package:load`,
      `check:composition`, format, lint, typecheck.
  - Started: 2026-09-29T08:03Z. Completed: 2026-09-29T08:09Z (≈6 min).
  - Refinement trigger fired (registration touches more than root manifest and
    baseline): also `scripts/check-package.mjs` REQUIRED_FILES,
    `src/local-load-probe.ts` expectations, `test/local-load-probe.test.ts`
    composition, and `COCKPIT_COMPOSITION`. No split taken: all five points
    are mechanical integrity checks (~15 lines), no new Human-validatable
    outcome; recorded rather than silently absorbed.
  - No refactor needed: the minimum GREEN stayed clean; still-GREEN held.
  - Checks: `test:telemetry` 11/11; `check:baseline` PASS (108 current, 87
    imported untouched); `check:package:load` PASS (76 files);
    `check:composition` PASS (1 extension, 8 commands, 4 tools);
    `format:check` clean; `lint` exit 0; `typecheck` exit 0; `test:tooling`
    24/24.
  - Paths: `src/index.ts`, `test/local-load-probe.test.ts`,
    `scripts/check-package.mjs`, `package.json`, `baseline/source.sha256`.
  - Subject: `step(telemetry-sink): register fifth entrypoint and pass gates`.
- [x] Human validation: isolated probe (`pi --offline --no-extensions -e
      "$(pwd -P)" --list-models` pattern) then a live session — confirm the
      snapshot appears, updates during activity, and disappears on shutdown.
      RED evidence is not a Human approval gate; validation happens once here.
  - Original response: `VALID` (2026-09-29T08:19:53Z), preceded by pasted
    live evidence: isolated probe wrote nothing (empty, expected); live
    session snapshot appeared with exactly `HeaderStatusEvent` facts plus
    `sessionId`, `pid`, `cwd`, `sessionStart`, `updatedAt`; `updatedAt`
    advanced during activity (…856247 → …861275) with nested run spans and
    subject selection flowing; canonical outcome `VALID` closes Task 1.
  - Wait: implementation completed 08:09Z; Human validation 08:19Z (~10 min,
    interactive shell checks). Task 1 complete.
  - Subject: `feat(telemetry-sink): live cockpit snapshot sink`.

## Task 2 — Command center live triage board

- **Estimate calibration (Task 1, Human-validated):** actual implementation
  ≈25 min vs 75–150 min estimated — overestimate driven by crisp frozen
  contracts and established package patterns; narrow the next comparable
  Task's range accordingly.
- **implementation_confirmed_at:** 2026-09-29T08:47Z (Human `Yes` to the
  exact Task 2 TDD brief).

- **Value:** `node bin/cockpit-agents.mjs` (and `-w`) reports every live agent
  as the validated triage board from any shell, ending pane-hopping.
- **Method source:** predefined
- **Method name:** TDD
- **Method contract:** Test-only RED golden render and state-derivation
  contracts fail for their discriminating expected reasons before the reader
  exists; deterministic RED evidence is recorded, then minimum GREEN and
  refactor/still-GREEN stay within this Task's scope.
- **Execution source:** native-direct
- **Execution name:** Sequential sink-then-render slices
- **Estimate basis:** Frozen TUI contract validated and committed (`4aa1cfa`);
  render exists as the committed mock; reader and derivation are new and
  test-first against fixture snapshots.
- **Estimated implementation:** 90–180 minutes; Human wait excluded.
- **Estimate confidence:** Low — no comparable accepted Plan.
- **Human-wait estimate:** Separate and unbounded after deterministic checks.
- **Refinement trigger:** Split if state derivation exceeds roughly 150 lines
  or more than four states, or the narrow-width policy outgrows a simple
  truncation guard.

- [x] RED — test-only contracts, reader does not exist yet: a golden render
      test over fixture snapshots reproduces the frozen TUI contract sample
      byte-identically, covering dynamic widths (including `COLUMNS`
      fallback), surrogate-safe title math, `NO_COLOR`, sublines, project
      column auto-sizing, and the narrow-width truncation guard; derivation
      tests pin the four states — attention (`requesting-validation`/
      `requesting-redirection`/`requesting-input`/`awaiting-resume` suggestion,
      `approvalRequired`, or `blocked`), working (active lifecycle or live run
      spans), parked (listening/waiting), gone (stale heartbeat or dead pid) —
      order attention → working → parked → gone, most recent first within a
      group, 3-char stable id from `sessionId`, time column `now -
      sessionStart`. Each contract fails for its discriminating expected
      reason; record the deterministic RED evidence in this Step's entry.
  - Started: 2026-09-29T08:48Z. Completed: 2026-09-29T08:58Z (≈10 min).
  - RED evidence: `npm run test:tooling` — 16 contracts in
    `test/cockpit-agents.test.ts` all fail with `SyntaxError: The requested
    module '../bin/cockpit-agents.mjs' does not provide an export named
    'colorWanted'`: the reader/derivation/render module boundary does not
    exist; the pre-existing 24 tooling tests stay green. Fixture sessionIds
    pre-searched so sha256-derived ids reproduce `001`–`005`; golden literals
    computed from the frozen sample's geometry (width 80, header gap 24,
    subline overflow 86 preserved). Typecheck is expected to fail
    identically until GREEN.
  - Subject: `step(command-center): red golden board contracts`.
- [x] GREEN — minimum reader: replace mock fixtures in `bin/cockpit-agents.mjs`
      with the snapshot directory reader (parse
      `~/.local/state/pi-vimux-starship/agents/`, tolerate corrupt or missing
      files), state derivation per the RED contracts, `-w`/`--interval`
      (default 2s, clear + reprint), `--json` raw snapshot dump; empty
      directory renders the header plus a dim `no live agents` line; the RED
      suite passes with no test modification.
  - Started: 2026-09-29T08:59Z. Completed: 2026-09-29T09:10Z (≈11 min).
  - Check: `npm run test:tooling` — 40/40 (24 pre-existing + 16 new);
    `tsc --noEmit` clean via `allowJs` (no tsconfig change needed); eslint
    clean; prettier clean; live `node bin/cockpit-agents.mjs` prints the
    honest empty board against the real state dir.
  - Honest note: two test expectations were wrong, not production — the
    header icon is a surrogate pair (UTF-16 length vs code points) and the
    header/sublines keep their natural frozen overflow (the validated sample
    overflows at width 80), so the narrow guard pins main row lines only.
    Also dropped an unused import and added one explicit-any annotation in
    the test. The bin's frozen look code was transplanted verbatim; only the
    fixtures became derived rows.
  - Paths: `bin/cockpit-agents.mjs`, `test/cockpit-agents.test.ts`.
  - Subject: `step(command-center): green live reader watch and json`.
- [x] Refactor/still-GREEN: refactor only within the confirmed scope if the
      minimum GREEN needs it; wire the suite into the repository test tooling
      and run the focused gates plus full check.
  - Started/Completed: 2026-09-29T09:11Z–09:16Z (≈5 min).
  - No refactor needed: derivation stays ~60 lines (split trigger is 150),
    the bin module is bounded, still-GREEN held throughout.
  - Checks: `check:baseline` PASS (108 files — bin/test sit outside the
    packages manifest, no refresh needed); `check:package:load` PASS
    (76 files); `check:composition` PASS; `format:check` clean; `lint` 0;
    `typecheck` 0; full `npm test` exit 0 (tooling + all five component
    suites). `check:openspec` fails with the same pre-existing schema-loss
    crash (`check-openspec.mjs:75`) recorded in the Plan — excluded, repair
    is the separate Fix.
  - Paths: ledger only.
  - Subject: `step(command-center): still-green board suite and full gates`.
- **CHANGE round 2 (Human feedback, recorded 2026-09-29T12:04Z):** `I'm
  missing the title` + `timme must match identically as 󰠭 000:28'33` +
  `Feels like we are timeing different things` — deck shows
  `󰠭 000:15'07 ⟩ Testing a 20-second sleep command`; board showed `working`
  and three live-idle sessions as `gone`. Canonical `CHANGE`; confirmed
  brief: title via `selection.titles` fallback, pid-liveness-only gone,
  deck-clock match via idleMs/span + drift compensation (12:04Z `Yes`).
- [x] Repair 3 — match the deck: task title falls back to
      `selection.titles[0]`; gone = dead pid only (stale-but-alive renders
      parked); time column = root-span `elapsedMs` while working, `idleMs`
      when idle, each plus snapshot-age drift so the column ticks with the
      deck tile even though idle snapshots freeze; session-age fallback when
      neither is present; gone rows report session lifetime. Busy-face
      caveat recorded: mid-turn the deck shows its private
      since-last-message clock, which the event cannot carry.
  - Started/Completed: 2026-09-29T12:05Z–12:16Z (≈11 min).
  - Check: RED on all four new/changed contracts, then 44/44 tooling;
    typecheck (one fixtures-type annotation added), eslint, prettier,
    baseline, package:load, composition all clean/green. Golden stayed
    byte-identical (fixture 005 now carries a dead pid to stay `gone`).
    One test-construction fix along the way: stale-but-alive with a working
    lifecycle stays `working` — the parked pin uses an explicit listening
    lifecycle.
  - Paths: `bin/cockpit-agents.mjs`, `test/cockpit-agents.test.ts`.
- **CHANGE round 3 (Human feedback, recorded 2026-09-29T12:31Z):** board
  paste — `Title correct`; `time should be the same as 󰠭 000:00'00`; `what's
  the 609 for?`; `why keep legacy closed chats there?`. Canonical `CHANGE`;
  confirmed brief (12:31Z `yes`): parked rows always compute
  `(idleMs ?? 0) + drift` (publisher omits idleMs at zero — session-age
  fallback was wrong for just-idle sessions); board self-heals the state dir
  by pruning provably dead-pid snapshots each paint (CLI becomes a state-dir
  mutator for its own package files only); 3-char ids stay per the frozen
  grammar.
- [x] Repair 4 — deck-exact idle clock and state hygiene: parked/attention
      rows show `(idleMs ?? 0) + snapshot-age drift`; gone rows keep session
      lifetime; working rows keep span+drift; golden fixtures gain idleMs and
      root spans so the frozen sample stays byte-identical;
      `pruneDeadSnapshots(dir)` deletes dead-pid snapshot files, wired into
      every CLI paint including `--json`.
  - Amended by Human direction during confirmation (`Use defaults, seven!`):
    ids become 7-char sessionId prefixes (git-style, resolvable via
    `pi --session <id>`); sha256 hash removed; golden regenerated at 7-char
    ids under this Human-directed round; narrow guard floor moves 45 → 47.
  - Started/Completed: 2026-09-29T12:32Z–13:02Z (≈30 min).
  - Check: RED at the module boundary (missing `pruneDeadSnapshots`), then
    46/46 tooling; typecheck, eslint, prettier, baseline, package:load,
    composition all clean. Live smoke: first paint pruned the four legacy
    dead-pid snapshots (579/597/852/562) from the real state dir.
    Honest notes: one malformed edit spliced `formatClock`'s signature during
    GREEN (caught immediately, restored, no commit carried the damage);
    three tests needed fixture-aware fixes after golden fixtures gained root
    spans; the narrow test moved to 48 columns for the new floor.
  - Paths: `bin/cockpit-agents.mjs`, `test/cockpit-agents.test.ts`.
- **CHANGE round 4 (Human feedback, recorded 2026-09-29T13:07Z):** board
  paste — project column showed the basename `aemonge` (`Not the suer, but
  the PWD so not aemonge but ~ or $HOME or /home/aemonge … use the
  /h/aemonge or the shorten one`), and `the timer isn't the same we get in
  the header … should be IDENTICAL`. Canonical `CHANGE`; confirmed brief
  (13:10Z `yes`): deck-parity PWD (`~`-form via `formatFooterPath`
  semantics), and an exact-clock pipe — the sink mirrors the header's
  activity-clock rule (same Pi events) and stamps `activityElapsedMs`; the
  board prefers it. Golden regenerated under this directed round.
- [x] Repair 5 — deck PWD and identical clock: sink hooks the header's
      activity events (`before_agent_start` busy+mark; `turn_start`,
      `before_provider_request`, `after_provider_response`, assistant
      `message_start/update/end`, `tool_execution_end` mark; `agent_settled`
      and shutdown clear) and stamps `activityElapsedMs` into each snapshot
      while busy; board project column shows `~`-form paths; time chain
      becomes activity → idle → span → session age (gone keeps lifetime).
  - Started/Completed: 2026-09-29T13:11Z–13:24Z (≈13 min).
  - Check: sink suite 13/13 (two new activity-clock contracts), tooling
    48/48 (golden regenerated at `~`-form paths, activity-clock precedence,
    deck-form PWD); typecheck, eslint, prettier, package:load, composition
    green; baseline refreshed to 109 files (imported record untouched).
    Four tests needed fixture-aware fixes (strip `activityElapsedMs` where
    older clocks are pinned; narrow floor moves 47 → 49 with raw paths).
  - Paths: `packages/cockpit-telemetry/index.ts`, `src/sink.ts`,
    `test/activity-clock.test.ts`, `bin/cockpit-agents.mjs`,
    `test/cockpit-agents.test.ts`, `baseline/source.sha256`.
- **CHANGE round 1 (Human feedback, recorded 2026-09-29T11:35Z):** pasted live
  CLI output + `The CLI isn't "live" I need to call it and call it .....` and
  `The timer don't match the timer here` (quoting the deck's 󰠭 turn timer).
  Canonical outcome `CHANGE` — Task 2 validation stays unchecked; bounded
  repair reopened. Human direction `yes`: both repair slices, sequential.
  Preflight correction: the deck timer is the header-private agent-turn clock;
  its semantic twin (`activeRunSpans` root-span `elapsedMs`) already flows in
  the event, so the timer slice uses span-elapsed-first with session-age
  fallback instead of extending the frozen publisher.
- [x] Repair 1 — turn-clock time column: `deriveAgents` shows the newest
      live root agent-span `elapsedMs` when spans exist, else `now -
      sessionStart`; derivation contracts updated accordingly (the original
      `time column is now - sessionStart` pin is superseded by this CHANGE);
      golden fixtures carry no spans so the frozen sample stays
      byte-identical.
  - Started/Completed: 2026-09-29T11:38Z–11:44Z (≈6 min).
  - Check: RED on the new span-clock contract, then 41/41 tooling; typecheck,
    prettier clean. Spans update per header event, so the column trails the
      deck's real-time clock by one event tick (seconds-level freshness).
  - Paths: `bin/cockpit-agents.mjs`, `test/cockpit-agents.test.ts`.
  - Subject: `step(command-center): show the live turn clock in the time
    column`.
- [x] Repair 2 — live by default on a TTY: watch mode becomes the default
      when stdout is a TTY (unless `--json`); `--once` forces a single render;
      a `watchWanted({ tty, json, once })` pure helper carries the contract;
      non-TTY stays single-shot.
  - Started/Completed: 2026-09-29T11:46Z–11:52Z (≈6 min).
  - Check: RED on the missing `watchWanted` export, then 42/42 tooling;
    typecheck and eslint clean; `--once` piped renders once and exits.
  - Paths: `bin/cockpit-agents.mjs`, `test/cockpit-agents.test.ts`.
  - Subject: `step(command-center): watch by default on a terminal`.
- [x] Human validation: two concurrent live agents — one left awaiting
      validation (attention), one actively working — confirm states, order,
      right-flush alignment, `-w` refresh, and `NO_COLOR`; original response,
      canonical outcome, and UTC recorded here.
  - Original response: `VALID` (2026-09-29T13:49:31Z), after four repair
    rounds (live-by-default + turn clock; deck title/clock/liveness;
    resolvable 7-char ids, deck-exact idle clock, snapshot pruning; deck-form
    PWD + sink-mirrored identical activity clock). Canonical outcome `VALID`
    closes Task 2 as of commit `3f6b02f`; the Human immediately requested two
    further deck-parity items (activity path `understanding › interpreting`
    and the deck timer format `000:00'00`), which open Task 3 rather than
    reopening this validation.
  - Wait: implementation completed 13:24Z; validation 13:49Z (~25 min,
    live two-agent checks across repair rounds). Task 2 complete.
  - Subject: `feat(command-center): live agent triage board`.

## Task 3 — Deck-parity polish: activity path and timer format

- **implementation_confirmed_at:** 2026-09-29T13:52Z (Human `Yes`).

- [x] Deck stage and timer face: working/parked task cells append
      `${lifecycle} › ${activityPath compact labels}`; time column renders
      the deck face `mmm:ss'cc` (cap `999:59'99`), column width 8 → 9;
      golden regenerated under this directed round.
  - Started/Completed: 2026-09-29T13:52Z–14:03Z (≈11 min).
  - Check: RED on 7 contracts, then 49/49 tooling; typecheck, eslint,
    prettier, baseline, package:load, composition green; live smoke renders
    the empty board. One stale test expectation updated (title fallback now
    carries the stage suffix); ledger heading briefly misplaced during the
    Task 3 append and repaired before commit.
  - Paths: `bin/cockpit-agents.mjs`, `test/cockpit-agents.test.ts`.
- [x] Human validation: one fresh working agent — the row names its stage
      (`… · understanding › interpreting`) and the timer matches the deck
      tile digit-for-digit, centiseconds included; original response,
      canonical outcome, and UTC recorded here.
  - Original response: `Pefect !!` (2026-09-29T14:15:16Z) followed
    immediately by a new grammar request (`HASH › pwd ⟩ TITLE › STATUS(ES)`
    left, timer right, violet separators, no padded columns) — canonical
    `VALID` closes Task 3 as of `f79f5ac`; the grammar request opens Task 4.
  - Wait: implementation completed 14:03Z; validation 14:15Z (~12 min).
    Task 3 complete.
  - Subject: `feat(command-center): deck-parity polish`.

## Task 4 — Natural-width row grammar

- **implementation_confirmed_at:** 2026-09-29T14:18Z (Human `Yes`).

- [x] Natural-width rows: `MARK HASH › pwd ⟩ TITLE › STAGES` left at
      natural widths (no project padding), `mmm:ss'cc` right-flushed,
      gap ≥ 1 absorbs slack; `›`/`⟩` separators in title purple `#5c5ca8`;
      title→stage separator becomes `›`; sublines indent under their row's
      title; narrow guard truncates the title/stage segment; golden
      regenerated under this directed round.
  - Started/Completed: 2026-09-29T14:18Z–14:24Z (≈6 min).
  - Check: RED on 5 contracts, then 49/49 tooling; typecheck, eslint,
    prettier, baseline, package:load, composition green; live smoke renders.
    Honest notes: the attention body briefly rendered the subject instead
    of the reason word (caught by golden, fixed via `title` field); the
    hand-counted golden subline indent was one short (pwd is 19 code points
    — production was right, literal corrected by computation); the narrow
    guard gained a pwd clamp (floor now 25 + pwd); one sloppy two-line edit
    during the fix was reverted before commit.
  - Paths: `bin/cockpit-agents.mjs`, `test/cockpit-agents.test.ts`.
- [x] Human validation: live board — rows read
-      `MARK HASH › pwd ⟩ TITLE › STAGES` with violet separators, timer hard
-      right, no padded columns; original response, canonical outcome, and
-      UTC recorded here.
  - Original response: `FANSTATIC - VALID` (2026-09-29T15:21:28Z), after
    three repair rounds within Task 4 (frozen idle zero; event-driven
    fs.watch with zero polling; zeros-when-idle + flush-left `↳` sublines
    with ellipsized truncation). Canonical outcome `VALID` closes Task 4
    as of `41252ac`; the Human immediately added `Still feels a bit slow`,
    which opens a latency Task rather than reopening this validation.
  - Wait: implementation completed 15:12Z; validation 15:21Z (~9 min).
    Task 4 complete.
  - Subject: `feat(command-center): deck grammar rows`.