# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Publication-ready package identity

- **Value:** Any Pi user on a fresh machine installs the cockpit and the CLI
  from npm with two commands and zero cloning.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Smallest complete publication-ready identity — scoped
  MIT manifest at 0.1.0, npm-first docs, gates in lockstep — no tape work and
  no publish action.
- **Execution source:** native-direct
- **Execution name:** Single-slice identity
- **Estimate basis:** All target files mapped in preflight; pack/load gates
  green on 2026-09-29; registry names probed free.
- **Estimated implementation:** 30–50 minutes; Human wait excluded.
- **Estimate confidence:** Medium.
- **Human-wait estimate:** Separate and unbounded after deterministic checks.
- **Refinement trigger:** Split if readiness exceeds manifest, LICENSE, README,
  and gate edits.

- [ ] Set the public identity: `LICENSE` (MIT, Andres Monge), `license: MIT`,
      drop `private`, `name: @aemonge/pi-vimux-starship`, `version: 0.1.0`,
      `pi.image: docs/assets/pi-vimux-starship.gif`; keep bundled pi-vim and
      Fancy Footer licenses in `files`.
  - Subject: `step(publish): scoped mit manifest at 0.1.0`.
- [ ] Rewrite README installation npm-first: `pi install
      npm:@aemonge/pi-vimux-starship` plus `npm install -g
      @aemonge/pi-vimux-starship` headline, local path demoted to development,
      rollback updated, Human publish runbook (`npm publish --access public`).
  - Subject: `step(publish): npm-first installation docs`.
- [ ] Move gates in lockstep: `REQUIRED_FILES` gains `LICENSE`;
      `validateDemoSources` README pins require the npm install commands;
      `check:package` and `check:package:load` green offline under the new
      name and version.
  - Subject: `step(publish): gates cover license and npm install docs`.
- [ ] Human validation: publish from the repository root on the host
      (`npm publish --access public`), then from a different directory run
      `pi install npm:@aemonge/pi-vimux-starship` and `npm install -g
      @aemonge/pi-vimux-starship`; confirm the cockpit loads and `pi-agents`
      runs; original response, canonical outcome, and UTC recorded here. This
      validation also satisfies and closes `install-pi-agents-cli` Task 1,
      whose acceptance (`pi-agents` from any directory) is met by the real
      mechanism.
  - Subject: `feat(publish): package live on npm`.

## Task 2 — Professional public demo recording

- **Value:** The README recording proves the published two-command install and
  the live cockpit without exposing anything private.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Tape records an isolated-HOME npm install, the
  `pi-agents` board, and the cockpit health report; GIF re-rendered; gates
  re-pinned — no changes to cockpit source.
- **Execution source:** native-direct
- **Execution name:** Single-slice demo refresh
- **Estimate basis:** Existing tape/gate structure reused; VHS v0.11.0 already
  produced the current GIF; the networked-install recording is new.
- **Estimated implementation:** 40–70 minutes; Human wait and VHS render
  wall-clock excluded.
- **Estimate confidence:** Medium-low — first recording of a networked install.
- **Human-wait estimate:** Separate and unbounded after deterministic checks.
- **Refinement trigger:** Split the GIF re-render into its own Step-boundary if
  VHS proves flaky; reroute the CLI segment if the user-prefix install reads
  as unprofessional on screen.

- [ ] Rewrite `demo/pi-vimux-starship.tape`: isolated demo `HOME`, user-prefix
      `npm install -g @aemonge/pi-vimux-starship` and a brief `pi-agents`
      board, `pi install npm:@aemonge/pi-vimux-starship`, launch
      `pi --no-session --no-context-files`, then the existing `:name` and
      `:vimux-health` beats; keep provider/credential-free launch flags.
  - Subject: `step(demo): tape records published npm install`.
- [ ] Re-render `docs/assets/pi-vimux-starship.gif` with VHS and pin gates to
      the new tape: required commands, order, and forbidden patterns updated;
      README demo section matches the recording.
  - Subject: `step(demo): gif and gates match published install`.
- [ ] Human validation: review the GIF against the recorded flow, optionally
      re-run the tape on the host; original response, canonical outcome, and
      UTC recorded here.
  - Subject: `feat(demo): professional install recording`.
