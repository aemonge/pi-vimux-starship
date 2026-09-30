# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — pi-agents on the PATH

- **Value:** The command center is one word away from any shell.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Smallest complete install; no extras.
- **Execution source:** native-direct
- **Execution name:** Single-slice install
- **Estimate basis:** Manifest lines and one symlink; no unknowns.
- **Estimated implementation:** 10–20 minutes; Human wait excluded.
- **Estimate confidence:** High.
- **Human-wait estimate:** Separate and unbounded after deterministic checks.
- **Refinement trigger:** Split if install touches more than the manifest,
  the integrity list, and the symlink.

- [x] Register and link: `"bin": { "pi-agents": "bin/cockpit-agents.mjs" }`
      in the root manifest with `bin/*.mjs` packed; `REQUIRED_FILES` gains
      the bin path; symlink `~/.local/bin/pi-agents` to the repo bin
      (executable); gates plus a live `command -v pi-agents` run from `$HOME`.
  - Subject: `step(pi-agents): installable bin and path symlink`.
  - Started/Completed: 2026-09-29T15:39Z–15:43Z (≈4 min).
  - Check: manifest `bin` + packed `bin/*.mjs`; REQUIRED_FILES gains
    the bin (packed artifact 77 files, load PASS); baseline, composition,
    format, lint, typecheck, 53/53 tooling green. Boundary: the sandbox
    mounts `~/.local/bin` read-only, so the symlink is a Human-run
    one-liner in validation — not bypassed.
  - Human feedback (15:46Z): a symlink is not an install — the repo must
    exist at `~/projects`. Real install verified in a sandbox probe:
    `npm install -g --offline --legacy-peer-deps <tarball>` places a
    repo-independent copy with a working `pi-agents` shim. Honest note:
    the `bin` manifest field was lost to an atomic edit failure earlier
    (half the edit re-applied); caught by the probe, fixed, repacked,
    re-verified (shim links, installed bin runs).
- [x] Human validation: run `pi-agents` (and `pi-agents -w`) from a
      different directory; confirm the board renders; original response,
      canonical outcome, and UTC recorded here.
  - Subject: `feat(pi-agents): pi-agents on the path`.
  - Rerouted 2026-09-30 by Human direction: no symlink — validation lands
    through `publish-pi-vimux-starship` Task 1's `npm install -g
    @aemonge-dev/pi-vimux-starship`; this Plan archives at that boundary.
  - Outcome: canonical `VALID` (via `publish-pi-vimux-starship` Task 1),
    2026-09-30T14:21:20Z — original response `VALID`; `pi-agents` renders
    from any directory with `~/.npm-global/bin` on PATH. Archived same
    boundary.
