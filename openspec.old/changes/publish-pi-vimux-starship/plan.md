# Plan: Publish pi-vimux-starship to npm

- **Idea:** `share-pi-vimux-starship`
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Smallest complete publication — scoped MIT manifest at
  0.1.0, npm-first docs and gates, then a public recording of the real
  two-command install — no registry automation, no host mutation by the agent.
- **Execution source:** native-direct
- **Execution name:** Two-boundary slices
- **Execution reason:** One repo-only slice, then one post-publish recording
  slice; the Human publish action is the boundary between them.
- **Execution outline:** Task 1 makes the package publication-ready and gates
  the npm install docs; Human publishes; Task 2 rewrites the tape around the
  published install, re-renders the GIF, and re-pins the demo gates.
- **Estimate basis:** Manifest/license/README/gate edits target files already
  mapped in preflight; `check:package*` gates were green on 2026-09-29 (77
  files, load PASS); both registry names probed free (E404); the npm-global
  tarball install was already proven in the earlier sandbox probe.
- **Estimated implementation:** 70–120 minutes across two Tasks; Human publish
  wait and VHS render wall-clock excluded.
- **Estimate confidence:** Medium — comparable pack-gate work accepted; the
  networked-install recording is new.
- **Refinement trigger:** Split if publication readiness exceeds manifest,
  LICENSE, README, and gate edits, or if the VHS render proves flaky and must
  be separated from the tape/gate slice.

## Acceptance

- From any directory, `pi install npm:@aemonge-dev/pi-vimux-starship` loads the
  cockpit and `npm install -g @aemonge-dev/pi-vimux-starship` puts `pi-agents` on
  the PATH — zero cloning, after Human runs the one publish.
- Offline gates stay green: `check:package`/`check:package:load` cover the
  LICENSE and npm install docs; demo gates pin the new recording.
- `docs/assets/pi-vimux-starship.gif` shows the real published install, the
  `pi-agents` board, and the cockpit health report.
- `install-pi-agents-cli` is retired honestly: its symlink Task stays recorded
  with its rejection, and its validation lands through the npm-global install.

## Scope

- **In:** root `package.json` (name, version, license, `private` removal,
  `pi.image`), `LICENSE`, README installation/demo sections,
  `scripts/check-package.mjs` gates, `demo/pi-vimux-starship.tape`, GIF
  re-render, OpenSpec artifacts for this Plan and the supersede notes.
- **Out:** the `npm publish --access public` action itself (Human-run with
  Human credentials), git remote/repository manifest fields (no authorized
  remote yet), legacy Galactica package cleanup (deferred to a later change by
  Human direction), host-side global installs, OpenSpec schema repair for the
  sandbox.

## Verification

`npm run check:package && npm run check:package:load` offline; `check:baseline`,
`check:composition`, `format:check`, `lint`, `typecheck`, component suites;
tape gates green; GIF regenerated. Human: publish, two-command install from
`$HOME`, `pi` cockpit render, `pi-agents` run, GIF eyeball, host-side
`npm run check:openspec`.

## Dependencies and authority

Publish and every global/PATH install are explicit Human external actions with
Human-owned credentials. No protected Pi configuration is mutated by the agent;
the recording isolates `HOME` so the demo never touches live settings.
