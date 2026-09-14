# Plan: Show z.ai GLM quota telemetry in the cockpit deck

- **Idea:** `share-pi-vimux-starship`
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Deliver the smallest complete z.ai quota slices — authorized live
  probe, source collection, then deck window paint — before only Task-required
  hardening; excludes repair work and RED/GREEN scaffolding.
- **Execution source:** native-direct
- **Execution name:** Sequential z.ai quota integration
- **Execution reason:** Two packages own the pipe — footer collection and header deck
  paint — and the telemetry protocol joins them, so direct sequencing best protects the
  protocol contract, the relevance guard, and the cache seams.
- **Execution outline:** Probe the monitor endpoint once, implement the `zai` source
  with focused tests, then extend footer telemetry with both quota windows and paint
  them as compact deck tiles.
- **Estimate basis:** The existing Codex/Anthropic sources, the validated telemetry
  protocol with strict parsing, and the deck paint are Human-validated seams; the
  endpoint's exact fields, percentage scale, and Authorization form are the remaining
  unknowns, settled by the probe Step.
- **Estimated implementation:** 85–140 minutes across two Tasks; Human wait excluded.
- **Estimate confidence:** Low because no comparable provider-source addition has been
  Human-validated under calibration yet.
- **Human-wait estimate:** Separate and unbounded; Human validates each Task's live
  behavior once after its offline assurance.
- **Refinement trigger:** Stop and revise if the endpoint needs an auth scheme beyond a
  raw or Bearer API key, token windows lack usable percentages, the deck paint requires
  breaking the telemetry protocol for existing consumers, or wiring would require Pi
  core changes or a new dependency.

## Value

As a GLM Coding Plan subscriber driving the cockpit daily, I want the deck's quota slot
to show my live z.ai five-hour and weekly percentages as compact tiles — and a reset
countdown when a window runs hot — so the deck reflects the provider I actually use
instead of a dash.

## Acceptance criteria

- [ ] With a `zai` key in pi auth and a GLM-family model active, the z.ai snapshot is
      collected, cached, and mapped: TOKENS_LIMIT to the primary `5h` window and the
      weekly limit to the secondary `7d` window, with clamped percentages and reset
      times.
- [ ] The deck's quota slot paints both windows as compact percent-first tiles in the
      deck dialect — `42% 5h ‣ 12% 7d` — before the unchanged cost tile, with per-window
      severity color, replacing today's `—`.
- [ ] The reset countdown paints per the Human's chosen mode and only from a provider
      reset time; it never fabricates a reset.
- [ ] The zai snapshot stays hidden for non-GLM models; Codex and Anthropic relevance
      are unchanged, and unknown future sources keep default-relevant behavior.
- [ ] With no key, offline, malformed, or failed responses the deck renders exactly as
      today: `—` fail-soft, no crash, no invented quota, no stale window.
- [ ] The stored key never appears in status surfaces, telemetry, logs, committed
      tests, or artifacts; test fixtures are sanitized before commit.
- [ ] `zai` is a known optional provider id accepted by the config schema and enabled
      by default, and the deck stays clean when it is disabled in config.
- [ ] The telemetry extension is additive and backward compatible: an older footer or
      header still parses, and absent windows degrade to the current single-percent or
      `—` behavior.
- [ ] No new dependency, no Pi core change, and no protected Pi configuration.
- [ ] Focused and full offline checks pass, and Human validates live deck behavior.

## Scope and boundaries

Implementation is confined to the footer package's provider-status source, telemetry
publisher and tests; the header package's telemetry type and parser, deck quota paint
and tests; shared provider-id constants and default config; related config/render test
additions; package and root documentation; the mutable source-integrity manifest; and
this Plan/ledger.

The monthly TIME_LIMIT (MCP) window is a documented exclusion: the deck slot renders two
windows. A credit value maps only if the probed fixture exposes one cleanly. The zai key
is a static API key: no refresh-token machinery, no OAuth flow, no persistence of auth
material.

The Plan excludes changes to the Codex and Anthropic sources beyond the shared relevance
guard, the footer's own `qta` widget formats beyond passing windows through, z.ai
account or plan management, publication, network activity outside the single authorized
probe and normal runtime refresh, and history rewriting.

## Method and execution

Happy-path delivers two independently validatable Tasks in the smallest complete order.
Task 1 makes z.ai quota real: the probe Step is read-only evidence gathering whose
sanitized fixture anchors the tests, the implementation Step adds the source, normalizer,
GLM relevance, and config constants, and the assurance Step proves the package offline;
its immediate visible effect is the deck's existing single-percent slot losing its dash.
Task 2 makes the paint honest: telemetry carries both windows, the deck renders compact
percent-first tiles with per-window severity and the chosen countdown mode, and
assurance refreshes docs and the integrity manifest. A diagnosed, scope-preserving
mismatch may return to implementation for at most five rounds; a material change to
auth scheme, response shape, protocol compatibility, dependencies, or authority stops
for Human direction.

## Verification

Run the focused provider-status suite for fixture mapping, malformed shapes, unknown
limit types, percentage clamping, the model-relevance matrix, missing-key fail-soft, and
config defaults. Run focused header tests for telemetry parsing (present, absent,
malformed windows) and deck paint (both windows, one window, none, hot-window countdown,
severity colors). Then run format, lint, TypeScript, tooling and component tests, source
integrity, the offline composition probe, and OpenSpec validation. Human runs the deck
on a GLM model, checks live `5h`/`7d` tiles and the countdown mode chosen, switches to a
non-GLM model to see the slot return to `—`, and disables the provider in config to
confirm silence.

**Final history targets:** `feat(footer): collect z.ai GLM quota` and
`feat(deck): paint z.ai quota windows`

**Checkpoint policy:** Each mutating Step uses one scoped Git commit containing only
declared paths and matching OpenSpec progress. Record and independently verify hashes
outside commits. The probe Step records evidence without source history. Each Task's
final conventional commit waits for Human validation.
