# Plan: Develop the frozen status architecture

- **Idea:** `share-pi-vimux-starship`
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Deliver the smallest complete snapshot-driven cockpit that
  renders the frozen contract's grammar with zero layout changes, keeping each Task
  independently Human-validatable and every drift exhibit provably dead.
- **Execution source:** native-direct
- **Execution name:** Sequential strangler slices
- **Execution reason:** The status producer, header deck, and footer are coupled
  through shared event channels; sequential slices keep every visible transition
  attributable and leave a runnable boundary after each Task.
- **Execution outline:** Build the ledger and reducer, rewire producers behind
  byte-identical output, switch renderers to the snapshot while deleting the
  priority waterfalls, grow runs into a span tree, then hook up declared stages and
  retire the compatibility channels. Legacy package names retire with the slices
  that own them (`status` in Task 1, `header` in Task 3).
- **Estimate basis:** The frozen contract (`docs/status-architecture.md`, commit
  `8733686`) fixes the data model; module sizes are known from inspection
  (galactica-status `index.ts` 1460 lines, `publisher.ts` 1251, deck 608); no
  comparable accepted Plan exists, so confidence starts low and every Task carries
  an explicit split trigger.
- **Estimated implementation:** 4–7 hours across five Tasks excluding Human wait;
  per-Task ranges and triggers live in `tasks.md`.

## Acceptance

- Phase B scenarios S1–S10 from the validation guide pass in a live session.
- All five exhibits are dead with discriminating regression tests: fallback-title
  glue, header em-dash, task/steps placeholders, triple-state waiting, and
  emptiness narration (`no OpenSpec` family).
- `npm run check`, including baseline, composition, and openspec boundaries, stays
  green after every Task.
- The frozen contract's privacy boundary is preserved: no prompts, prose, tool
  arguments, child output, credentials, or hidden reasoning enter any surface.

## Scope

- **In:** `packages/status` (renamed from `galactica-status` in Task 1: ledger,
  reducer, producer rewiring, publisher retirement), `packages/header` (renamed
  from `galactica-context-header` in Task 3) render paths, footer widget feeds,
  terminal title derivation, and their tests.
- **Out:** layout or element relocation (explicitly deferred by the contract); the
  Ramona `AGENTS.md` stage-emission duty itself (separate galactica slice with its
  own confirmation and authority); tmux/starship external snapshot files; any Pi
  core change; subagent-package enrichment beyond parsing existing partials.

## Verification

Each Task declares its focused checks in `tasks.md`; the nearest gates are
`npm run test:status`, `npm run test:header`, `npm run check:baseline`,
`npm run check:composition`, and `npm run check:openspec`. Render Tasks add
live Phase B scenarios as their Human validation.

## Dependencies and authority

Task 5 depends on a separate galactica-owned slice that adds the stage-emission
duty to the global Ramona `AGENTS.md`; that edit requires its own implementation
brief and exact `ALLOW PI CONFIG` authority and is never implied by this Plan.
Tasks 1–4 are fully local to this repository.

## Risks

- Pi render API drift: `/usr/lib/pi/docs` remains the API authority; private seams
  stay behind feature-detected adapters.
- Parity (Task 2) may hide semantic drift behind formatting equality; golden
  sequences must cover focus, goal, work, subject, taskflow, and collector inputs.
- Low estimate confidence: ranges are planning aids, not promises; split triggers
  are mandatory, not advisory.
