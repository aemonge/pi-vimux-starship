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

- [ ] Register and link: `"bin": { "pi-agents": "bin/cockpit-agents.mjs" }`
      in the root manifest with `bin/*.mjs` packed; `REQUIRED_FILES` gains
      the bin path; symlink `~/.local/bin/pi-agents` to the repo bin
      (executable); gates plus a live `command -v pi-agents` run from `$HOME`.
  - Subject: `step(pi-agents): installable bin and path symlink`.
- [ ] Human validation: run `pi-agents` (and `pi-agents -w`) from a
      different directory; confirm the board renders; original response,
      canonical outcome, and UTC recorded here.
  - Subject: `feat(pi-agents): pi-agents on the path`.
