# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Show z.ai GLM quota windows in the footer deck

- **Value:** The footer deck reports live z.ai GLM quota windows for the provider the
  Human actually drives, using the stored `zai` key, while failing soft exactly like the
  existing Codex and Anthropic sources.
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
- **Final history target:** `feat(footer): show z.ai GLM quota telemetry`

- [ ] Step 1.1 Probe the z.ai monitor quota endpoint once with the stored key and record
      a sanitized fixture.
  - Estimate: 5–10 minutes; uncertainty is which Authorization form the endpoint accepts
    and the exact `limits[]` field names, percentage scale, and reset-time format.
  - Boundary: one authorized read-only GET to
    `https://api.z.ai/api/monitor/usage/quota/limit` using the existing `zai` entry in
    pi auth; try `Bearer` first, then raw, on 401. No other requests, no writes, no key
    material in output. Evidence and the sanitized fixture land in this ledger; the
    probe itself needs no source commit.
  - Fallback: if the probe is not authorized or both forms fail, implement against the
    documented monitor shape with bounded tolerance, flag the gap, and let Human
    validation judge live behavior.

- [ ] Step 1.2 Implement the `zai` provider-status source with normalizer, GLM model
      relevance, and config constants, covered by focused tests.
  - Estimate: 30–45 minutes; uncertainty is mapping the probed field names and scale
    into windows while keeping unknown-source relevance defaulting to relevant.
  - Covers: `ZAI_SOURCE` (id `zai`, label `GLM`, authoritative full-list behavior, no
    header parsing), static-key auth read from pi auth with a friendly missing-key
    error, `normalizeZaiQuotaResponse` mapping TOKENS_LIMIT to the primary `5h` window
    and the weekly limit to the secondary `7d` window with clamped percentages and reset
    times, tolerant envelope handling, TIME_LIMIT exclusion, source registration, the
    `looksLikeZaiModel` relevance branch, and `zai` in the known provider ids and
    default config.
  - Tests: fixture mapping, malformed and missing fields, unknown limit types ignored,
    percentage clamping, GLM/non-GLM relevance matrix, missing key fail-soft, fetch and
    cache behavior through the existing harness, and config defaults.

- [ ] Step 1.3 Document the zai quota telemetry and run complete offline assurance while
      refreshing the source-integrity manifest.
  - Estimate: 15–25 minutes; uncertainty is wording the new provider in package and root
    documentation without overpromising live behavior.
  - Covers: README and architecture documentation updates, `check:baseline` before the
    manifest refresh, `scripts/check-baseline.mjs --write` plus rerun, and the full
    offline check through OpenSpec validation.

### Human validation

- [ ] Human runs the deck on a GLM-family model, sees live 5h and 7d gauges with reset
      countdowns, confirms they disappear on a non-GLM model and with the provider
      disabled in config, then reports a clear outcome; preserve the original response,
      canonical outcome, and UTC.
