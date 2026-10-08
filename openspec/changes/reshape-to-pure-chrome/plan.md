# Plan: Reshape the cockpit into pure chrome

- **Idea:** `pivot-to-pi-starship-header`
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Smallest complete chrome-only value per Task — drop the
  vi composition, absorb goal-x state, mirror the appa guard, rename last —
  with no bridge repair, no engine work, and no hidden extras.
- **Execution source:** native-direct
- **Execution name:** Four chrome slices
- **Execution reason:** Bounded repo edits against established component gates;
  Ramona sequences natively and no isolated subagent context adds value.
- **Execution outline:** Task 1 removes the vi entrypoint; Task 2 absorbs
  goal-x state into the deck; Task 3 adds the appa telemetry segment; Task 4
  renames the identity and coordinates the Human publish. Each Task ends at
  Human validation before the next begins.
- **Estimate basis:** Composition, deck, and status sources mapped in this
  session's read-only preflights; goal-x 0.32.3 and openappa 0.2.0 inspected
  read-only; component gates green at the last accepted boundary. No
  comparable accepted reshape exists, so calibration is weak.
- **Estimated implementation:** 145–260 minutes across four Tasks; local
  installs, publish, and host moves are Human waits and excluded.
- **Estimate confidence:** Low — first reshape of this shape; storage fields
  and widget-disable key are mapped but unexecuted.
- **Refinement trigger:** Split Task 2 further if goal storage fields exceed
  the mapped set, or Task 4 if rename mechanics grow beyond identity, docs,
  and gate lockstep.

## Acceptance

- The root package composes only header, footer, and status; the vi fork and
  bridge stay dormant in the tree and out of runtime.
- With `@burneikis/pi-vim` installed, the engine owns the editor seat and the
  deck renders unchanged around it.
- A focused goal renders the density-A goal block owning the focus headline
  (tree rows: tasks, auditor, runs), compresses when outranked, and vanishes
  with no goal; goal-x's persistent widget rows are disabled by its own
  settings while its modals keep working.
- The telemetry row carries an appa segment with four states (on, on+denied,
  off, unreachable) that degrades responsively.
- The package is published as `@aemonge-dev/pi-starship-header` and the old
  name points to it as deprecated.

## Scope

- In: root composition, `.gitignore`, status goal consumer, header deck
  goal block and appa segment, tests and gates in lockstep, baseline refresh,
  package identity/docs rename, Human publish coordination.
- Out: editing the dormant vi fork, engine packages, goal-x or openappa
  sources, external-editor behavior, transcript navigation, theme work.

## Architecture

Native direct execution in this repo. Runtime capabilities: writable repo
root, offline package gates, read access to installed `pi-goal-x` and
`pi-openappa` sources and storage. No network or protected configuration
authority is exercised by the agent; publish and installs are Human actions.

## Verification

Deterministic: `check:baseline`, component tests (`test:status`, `test:header`,
`test:footer`, `test:telemetry`, `test:vim` while the package remains),
`test:tooling`, `format:check`, `lint`, `typecheck`, offline local-load probe.
Manual: deck renders with the engine owning the prompt; goal block states;
appa segment states; `/goal` modals intact after widget disable.

## Human validation

Each Task carries its own unchecked validation item in `tasks.md`. Work is
accepted only on the Human's canonical `VALID` at each Task boundary.
