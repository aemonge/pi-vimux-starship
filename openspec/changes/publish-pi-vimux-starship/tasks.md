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

- [x] Set the public identity: `LICENSE` (MIT, Andres Monge), `license: MIT`,
      drop `private`, `name: @aemonge-dev/pi-vimux-starship`, `version: 0.1.0`,
      `pi.image: docs/assets/pi-vimux-starship.gif`; keep bundled pi-vim and
      Fancy Footer licenses in `files`.
  - Started/completed: 2026-09-30T12:12:45Z–12:13:50Z (≈1 min; timing
    corrected 2026-09-30 to true wall-clock stamps).
  - Check: `check:package` PASS (78 files, LICENSE packed, bundled licenses
    intact); `check:baseline` refreshed and PASS (109 files); prettier green.
  - Boundary: `package-lock.json` is devbox read-only, so the lockfile
    identity refresh is a Human host command (`npm install
    --package-lock-only` + its own commit) before publish — not bypassed.
  - Paths: `package.json`, `LICENSE`, `baseline/source.sha256`.
  - Subject: `step(publish): scoped mit manifest at 0.1.0`.
  - Subject: `step(publish): scoped mit manifest at 0.1.0`.
- [x] Rewrite README installation npm-first: `pi install
      npm:@aemonge-dev/pi-vimux-starship` plus `npm install -g
      @aemonge-dev/pi-vimux-starship` headline, local path demoted to development,
      rollback updated, Human publish runbook (`npm publish --access public`).
  - Started/completed: 2026-09-30T12:14:00Z–12:16:00Z (≈2 min; timing
    corrected 2026-09-30 to true wall-clock stamps).
  - Check: prettier green; markdownlint green for `README.md` (only
    pre-existing `packages/*` findings remain); `check:package` PASS (78
    files, README/VHS source PASS with pinned headings preserved);
    `check:baseline` PASS (109 files, no refresh needed).
  - Paths: `README.md`.
  - Subject: `step(publish): npm-first installation docs`.
  - Subject: `step(publish): npm-first installation docs`.
- [x] Move gates in lockstep: `REQUIRED_FILES` gains `LICENSE`;
      `validateDemoSources` README pins require the npm install commands;
      `check:package` and `check:package:load` green offline under the new
      name and version.
  - Started/completed: 2026-09-30T12:16:30Z–12:19:43Z (≈3 min).
  - Check: `test:tooling` green (one name assertion updated in
    `local-load-probe.test.ts` lockstep); `check:package` PASS (78 files);
    `check:package:load` PASS offline under the new identity; eslint and
    prettier green on touched files.
  - Paths: `scripts/check-package.mjs`, `test/check-package.test.ts`,
    `test/local-load-probe.test.ts`.
  - Subject: `step(publish): gates cover license and npm install docs`.
- [x] Repair (Human-reported `NOT VALID` 2026-09-30): publish of
      `@aemonge/pi-vimux-starship` failed with registry `E404` on `PUT` —
      the `aemonge` scope is not writable by the logged-in user `aemonge`
      (org/user namespace conflict, org taken); Human directed the
      `aemonge-dev` org. Symptom: 404 on PUT; cause: unwritable scope;
      rename `@aemonge/` → `@aemonge-dev/` across manifest, README, gates,
      and test expectations.
  - Started/completed: 2026-09-30T14:00:05Z–14:04:00Z (≈4 min).
  - Check: registry probe `@aemonge-dev/pi-vimux-starship` free (E404 GET);
    `test:tooling`, `check:package`, `check:package:load` green under the
    renamed identity; prettier green.
  - Boundary: `package-lock.json` (host-refreshed with the old scope) needs
    one more host `npm install --package-lock-only` after this commit.
  - Paths: `package.json`, `README.md`, `scripts/check-package.mjs`,
    `test/check-package.test.ts`, `test/local-load-probe.test.ts`,
    `openspec/changes/publish-pi-vimux-starship/{plan,tasks}.md`,
    `openspec/changes/install-pi-agents-cli/tasks.md`.
  - Subject: `step(publish): scope to aemonge-dev org`.
  - Subject: `step(publish): gates cover license and npm install docs`.
- [x] Human validation: publish from the repository root on the host
      (`npm publish --access public`), then from a different directory run
      `pi install npm:@aemonge-dev/pi-vimux-starship` and `npm install -g
      @aemonge-dev/pi-vimux-starship`; confirm the cockpit loads and `pi-agents`
      runs; original response, canonical outcome, and UTC recorded here. This
      validation also satisfies and closes `install-pi-agents-cli` Task 1,
      whose acceptance (`pi-agents` from any directory) is met by the real
      mechanism.
  - Subject: `feat(publish): package live on npm`.
  - Outcome: canonical `VALID` — original response `DONE TY` + `VALID`,
    2026-09-30T14:21:20Z. Evidence: publish output
    `+ @aemonge-dev/pi-vimux-starship@0.1.0`; `npm i -g` added 125 packages;
    `pi remove` of the path entry and `pi install npm:` both clean; `pi-agents`
    board renders with `~/.npm-global/bin` on PATH (Human dotfile fix);
    registry visible (`npm view` → 0.1.0). Repair round: one (`@aemonge` →
    `@aemonge-dev` scope, registry 404 on unwritable scope).
  - Actual vs estimated: implementation ≈17 min (est. 30–50, incl. ≈4 min
    repair); Human wait ≈1h55m separate (publish, PATH fix, validation).
  - Lockfile identity commit: host `2ca5c23` by Human.

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

- [x] Rewrite `demo/pi-vimux-starship.tape`: isolated demo `HOME`, user-prefix
      `npm install -g @aemonge-dev/pi-vimux-starship` and a brief `pi-agents`
      board, `pi install npm:@aemonge-dev/pi-vimux-starship`, launch
      `pi --no-session --no-context-files`, then the existing `:name` and
      `:vimux-health` beats; keep provider/credential-free launch flags.
  - Started/completed: 2026-09-30T14:23:41Z–14:33:00Z (≈9 min).
  - Check: `check:package` PASS (78 files, new tape pins green against the
    real tape); `test:tooling` 53/53 with reordered fixture; prettier and
    eslint green; README demo section matches the recording.
  - Boundary: VHS cannot render in this sandbox — its Chromium needs a
    root-owned SUID helper (`/usr/lib/chromium/chrome-sandbox` mode 4755),
    impossible inside the devbox user namespace; not bypassed. The render
    moved to the Human host command in the README runbook.
  - Paths: `demo/pi-vimux-starship.tape`, `scripts/check-package.mjs`,
    `test/check-package.test.ts`, `README.md`.
  - Subject: `step(demo): tape records published npm install`.
- [-] Re-render `docs/assets/pi-vimux-starship.gif` with VHS and pin gates to
      the new tape: required commands, order, and forbidden patterns updated;
      README demo section matches the recording.
      Started: 2026-09-30T14:33:00Z; gates and README already landed with the
      tape Step — the remaining work is the host render plus review.
- [ ] Human validation: review the GIF against the recorded flow, optionally
      re-run the tape on the host; original response, canonical outcome, and
      UTC recorded here.
  - Subject: `feat(demo): professional install recording`.
