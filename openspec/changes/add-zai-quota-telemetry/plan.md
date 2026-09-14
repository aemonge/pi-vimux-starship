# Plan: Show z.ai GLM quota telemetry in the footer deck

- **Idea:** `share-pi-vimux-starship`
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Deliver the smallest complete z.ai quota slice — authorized live
  probe, source implementation with focused coverage, wiring and offline assurance —
  before only Task-required hardening; excludes repair work and RED/GREEN scaffolding.
- **Execution source:** native-direct
- **Execution name:** Sequential z.ai source integration
- **Execution reason:** One package owns the entire seam — source fetch, normalize,
  relevance, config constants, and tests — so direct sequencing best protects the shared
  model-relevance guard, the cache contract, and the two existing provider sources.
- **Execution outline:** Probe the monitor endpoint once with the stored key, implement
  the `zai` source with focused tests against the sanitized fixture, then wire config
  defaults, document, and run complete offline assurance.
- **Estimate basis:** The existing Codex and Anthropic sources, their test harness, and
  the shared relevance/cache seams are Human-validated; the endpoint's exact response
  fields, percentage scale, and Authorization form are the remaining unknowns, settled
  by the probe Step.
- **Estimated implementation:** 45–80 minutes; Human wait excluded.
- **Estimate confidence:** Low because no comparable provider-source addition has been
  Human-validated under calibration yet.
- **Human-wait estimate:** Separate and unbounded; Human validates live GLM gauges once
  after offline assurance.
- **Refinement trigger:** Stop and revise if the endpoint needs an auth scheme beyond a
  raw or Bearer API key, token windows lack usable percentages, or wiring would require
  Pi core changes or a new dependency.

## Value

As a GLM Coding Plan subscriber driving the cockpit daily, I want the footer to show my
z.ai five-hour and weekly quota gauges live, so the deck reflects the provider I actually
use instead of an empty dash.

## Acceptance criteria

- [ ] With a `zai` key in pi auth and a GLM-family model active, the footer shows the
      primary 5h and secondary 7d quota gauges with percentages and reset countdowns from
      the monitor endpoint, cached like the existing sources.
- [ ] The zai snapshot stays hidden for non-GLM models; Codex and Anthropic relevance is
      unchanged, and unknown future sources keep the default-relevant behavior.
- [ ] With no key, offline, malformed, or failed responses the deck renders exactly as
      today: unavailable fail-soft, no crash, no invented quota, no stale window.
- [ ] The stored key never appears in status surfaces, snapshots, logs, committed tests,
      or artifacts; test fixtures are sanitized before commit.
- [ ] `zai` is a known optional provider id accepted by the config schema and enabled by
      default, and the deck stays clean when it is disabled in config.
- [ ] No new dependency, no Pi core change, and no protected Pi configuration.
- [ ] Focused and full offline checks pass, and Human validates live GLM gauges.

## Scope and boundaries

Implementation is confined to the footer package's provider-status source and tests, the
shared provider-id constants and default config, related config/render test additions,
package and root documentation, the mutable source-integrity manifest, and this
Plan/ledger.

The monthly TIME_LIMIT (MCP) window is a documented exclusion: the deck renders two
windows, so only TOKENS_LIMIT (primary) and the weekly limit (secondary) map. A credit
value maps only if the probed fixture exposes one cleanly. The zai key is a static API
key: no refresh-token machinery, no OAuth flow, no persistence of auth material.

The Plan excludes changes to the Codex and Anthropic sources beyond the shared relevance
guard, z.ai account or plan management, publication, network activity outside the single
authorized probe and normal runtime refresh, and history rewriting.

## Method and execution

Happy-path delivers the smallest complete useful slice in three pending Steps. The probe
Step is read-only evidence gathering whose sanitized fixture anchors the tests; the
implementation Step adds the `zai` source, normalizer, GLM model relevance, and config
constants with focused coverage; the assurance Step wires nothing new and proves the
package offline. A diagnosed, scope-preserving mismatch may return to implementation for
at most five rounds; a material change to auth scheme, response shape, dependencies, or
authority stops for Human direction.

## Verification

Run the focused provider-status suite for fixture mapping, malformed shapes, unknown
limit types, percentage clamping, the model-relevance matrix, missing-key fail-soft, and
config defaults. Then run format, lint, TypeScript, tooling and component tests, source
integrity, the offline composition probe, and OpenSpec validation. Human runs the deck on
a GLM model, checks live 5h/7d gauges with reset countdowns, switches to a non-GLM model
to see the tiles disappear, and disables the provider in config to confirm silence.

**Final history target:** `feat(footer): show z.ai GLM quota telemetry`

**Checkpoint policy:** Each mutating Step uses one scoped Git commit containing only
declared paths and matching OpenSpec progress. Record and independently verify hashes
outside commits. The probe Step records evidence without source history. The final
conventional Task commit waits for Human validation.
