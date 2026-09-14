# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Collect z.ai GLM quota in the footer package

- **Value:** The footer collects, caches, and maps live z.ai GLM quota windows using the
  stored `zai` key, so the deck's existing quota slot immediately shows a real percent
  instead of `—` on GLM models.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Deliver the smallest complete z.ai collection slice — authorized
  live probe, source implementation with focused coverage, offline assurance — before
  only Task-required hardening; excludes repair work and RED/GREEN scaffolding.
- **Execution source:** native-direct
- **Execution name:** Sequential z.ai source integration
- **Execution reason:** One package owns the fetch, normalize, relevance, config, and
  test seams, so direct sequencing best protects the shared relevance guard and the
  cache contract.
- **Execution outline:** Probe the monitor endpoint once with the stored key, implement
  the `zai` source with focused tests against the sanitized fixture, then run complete
  offline assurance.
- **Estimate basis:** The existing Codex and Anthropic sources, their test harness, and
  the shared relevance/cache seams are Human-validated; the endpoint's exact response
  fields, percentage scale, and Authorization form are settled by the probe Step.
- **Estimated implementation:** 50–80 minutes; Human wait excluded.
- **Estimate confidence:** Low because no comparable provider-source addition has been
  Human-validated under calibration yet.
- **Human-wait estimate:** Separate and unbounded; Human validates live collection once
  after offline assurance.
- **Refinement trigger:** Stop and revise if the endpoint needs an auth scheme beyond a
  raw or Bearer API key or token windows lack usable percentages.
- **Final history target:** `feat(footer): collect z.ai GLM quota`
- **Implementation confirmed at:** 2026-09-14T13:28:13Z; probe authorized and
  countdown mode `hot-only` fixed by Human at 2026-09-14T13:29Z.
- **Implementation started at:** 2026-09-14T13:36:39Z
- **Work completed at:** 2026-09-14T13:46:01Z
- **Assurance completed at:** 2026-09-14T13:46:01Z — full offline `npm run check` inside
  Step 1.3
- **Actual implementation:** about 11m30s total (3m probe evidence, 3m37s Step 1.2,
  4m52s Step 1.3); Human wait excluded; far below the 50–80 minute range because the
  probed fixture removed the shape unknown and every seam accepted the change without
  repair.
- **Human validation:** VALID at 2026-09-14T14:00:48Z; original response: “I can see
  it !!! but not as expected ... not the d and p we talked” — the concern names the
  Task 2 two-window tile paint, which the confirmed brief explicitly deferred; Task 1's
  scoped visible effect was the single-percent slot losing its dash.
- **Observed Human wait:** About 15 minutes from ready-for-validation, including a
  Human-side config fix; excluded from implementation.

- [x] Step 1.1 Probe the z.ai monitor quota endpoint once with the stored key and record
      a sanitized fixture.
  - Estimate: 5–10 minutes; uncertainty is which Authorization form the endpoint accepts
    and the exact `limits[]` field names, percentage scale, and reset-time format.
  - Started: 2026-09-14T13:30:00Z; Completed: 2026-09-14T13:33:35Z.
  - Timing: about 3 minutes, including two attempts rejected because pi auth stores an
    env reference rather than a literal key.
  - Evidence: `Bearer <key>` accepted with the real key resolved from `ZAI_API_KEY`;
    raw form untested because Bearer succeeded. pi auth shape is root
    `zai: { key: "${ZAI_API_KEY}", type: "api_key" }`, so the resolver must expand
    `${ENV}` references at runtime. The endpoint answers HTTP 200 even for auth
    errors; success lives in body `success`/`code`/`msg`. Sanitized live fixture:
    `{ code: 200, success: true, data: { level: "max", limits: [
    { type: "CREDIT_LIMIT", usage: 28000, currentValue: 13096, percentage: 46,
    nextResetTime: 1789397375340 },
    { type: "CREDIT_LIMIT", usage: 140000, currentValue: 13096, percentage: 9,
    nextResetTime: 1789984038973 } ] } }`.
  - Findings: no TOKENS_LIMIT on this plan; CREDIT_LIMIT pairs with reset ordering as
    the stable discriminator (nearest reset is the 5h window, next is weekly). Percent
    scale 0–100; `nextResetTime` is a ms epoch. No credentials in the fixture.
  - Fallback: not needed.
  - Boundary: one authorized read-only GET to
    `https://api.z.ai/api/monitor/usage/quota/limit` using the existing `zai` entry in
    pi auth; try `Bearer` first, then raw, on 401. No other requests, no writes, no key
    material in output. Evidence and the sanitized fixture land in this ledger; the
    probe itself needs no source commit.
  - Fallback: if the probe is not authorized or both forms fail, implement against the
    documented monitor shape with bounded tolerance, flag the gap, and let Human
    validation judge live behavior.

- [x] Step 1.2 Implement the `zai` provider-status source with normalizer, GLM model
      relevance, and config constants, covered by focused tests.
  - Started: 2026-09-14T13:36:39Z; Completed: 2026-09-14T13:40:16Z.
  - Timing: 3m37s implementation/check time; below estimate because the probed fixture
    removed the response-shape uncertainty and existing seams accepted the source
    without repair.
  - Check: GREEN — footer suite 167/167 including 7 new focused tests (fixture mapping
    with reset ordering, percent derivation with clamping, TIME_LIMIT exclusion,
    malformed payload rejection, GLM relevance matrix, env-reference auth with Bearer
    header capture, unset-env and error-envelope fail-soft); Prettier PASS; ESLint
    PASS on all edited files.
  - Paths: `packages/pi-fancy-footer-full-palette/src/{provider-status.ts,
    provider-status.test.ts, shared.ts, config.test.ts}`, this ledger, and
    `baseline/source.sha256`.
  - History: `step(footer): add zai quota source`; verified independently after commit.
  - Estimate: 30–45 minutes; uncertainty is mapping the probed field names and scale
    into windows while keeping unknown-source relevance defaulting to relevant.
  - Covers: `ZAI_SOURCE` (id `zai`, label `GLM`, authoritative full-list behavior, no
    header parsing), static-key auth read from pi auth with a friendly missing-key
    error, `normalizeZaiQuotaResponse` mapping TOKENS_LIMIT to the primary `5h` window
    and the weekly limit to the secondary `7d` window with clamped percentages and
    reset times, tolerant envelope handling, TIME_LIMIT exclusion, source registration,
    the `looksLikeZaiModel` relevance branch, and `zai` in the known provider ids and
    default config.
  - Tests: fixture mapping, malformed and missing fields, unknown limit types ignored,
    percentage clamping, GLM/non-GLM relevance matrix, missing key fail-soft, fetch and
    cache behavior through the existing harness, and config defaults.

- [x] Step 1.3 Run complete offline assurance for the collection slice while refreshing
      the source-integrity manifest.
  - Started: 2026-09-14T13:41:09Z; Completed: 2026-09-14T13:46:01Z.
  - Timing: 4m52s implementation/check time; within estimate. One full-check rerun was
    needed because the README landed after the first manifest refresh.
  - Pre-existing defect repaired: `npm run check` failed on clean `main` inputs because
    `test/local-load-probe.test.ts` still expected only `openspec_focus` and
    `work_focus` while `galactica-status` unconditionally registers the Human-validated
    `subject` tool from commits newer than the assertion's last update. Bounded repair:
    the expected list now includes `subject`; disclosed here and committed separately.
  - Check: full `npm run check` PASS — baseline integrity (95 current, 87 imported),
    offline package load, format, lint, TypeScript, tooling and component tests,
    composition probe (1 extension, 8 commands, 3 tools), and OpenSpec (5 changes).
    Focused footer suite 167/167 with the seven new zai tests.
  - Paths: `packages/pi-fancy-footer-full-palette/README.md`,
    `test/local-load-probe.test.ts`, this ledger, and `baseline/source.sha256`.
  - History: `fix(probe): expect the session subject tool` for the pre-existing repair
    and `step(footer): document zai quota telemetry` for this Step; both verified
    independently after commit.
  - Estimate: 15–25 minutes; uncertainty is documentation wording that keeps the deck
    paint promise honest before Task 2 lands.
  - Covers: `check:baseline` before the manifest refresh,
    `scripts/check-baseline.mjs --write` plus rerun, focused and full offline checks
    through OpenSpec validation, and package documentation for the new provider.

### Human validation

- [x] Human runs the cockpit on a GLM-family model and confirms the deck's quota slot
      shows a live z.ai percent instead of `—`, and that it returns to `—` on non-GLM
      models, then reports a clear outcome; preserve the original response, canonical
      outcome, and UTC.
  - Evidence 2026-09-14T14:00:48Z — original response: “Relaoded .... I can see it !!!
    but not as expected ... not the d and p we talked” with the live footer line
    showing `52%` in the quota slot; canonical outcome: VALID. The “not as expected”
    concern targets the Task 2 two-window tiles, deferred by the confirmed brief.
  - Root cause of the initial `—`: `~/.pi/agent/fancy-footer.json` carried an explicit
    empty `providers: []` that had disabled every provider source; Human set all three
    provider ids themselves and reloaded. Non-GLM hiding not re-tested live; covered by
    the focused relevance matrix.
  - Estimate refinement: comparable provider-source slices should start at 20–35
    minutes, retaining a live-TUI uncertainty premium.

## Task 2 — Paint both z.ai quota windows as compact deck tiles

- **Value:** The deck's quota slot shows both live windows in the deck dialect —
  percent-first `5h` and `7d` tiles with severity color and the Human-chosen reset
  countdown — instead of one collapsed percent.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Deliver the smallest complete paint slice — additive telemetry
  windows, compact deck tiles, chosen countdown mode, offline assurance — before only
  Task-required hardening; excludes repair work and RED/GREEN scaffolding.
- **Execution source:** native-direct
- **Execution name:** Sequential deck quota paint
- **Execution reason:** The telemetry protocol joins two packages, so direct sequencing
  best protects backward compatibility for older footer and header builds.
- **Execution outline:** Extend the telemetry message and parser with both windows,
  paint compact percent-first tiles with severity and countdown in the deck slot, then
  document and assure offline.
- **Estimate basis:** The telemetry protocol, strict parser, and deck quota paint are
  Human-validated seams with focused tests on both sides.
- **Estimated implementation:** 35–60 minutes; Human wait excluded.
- **Estimate confidence:** Low until the first comparable deck-paint slice is
  Human-validated under calibration.
- **Human-wait estimate:** Separate and unbounded; Human validates the live paint once
  after offline assurance.
- **Refinement trigger:** Stop and revise if window paint would break the telemetry
  protocol for existing consumers or require Pi core changes.
- **Countdown mode:** `hot-only` — countdown paints at or above 75% used, matching
  footer behavior; fixed by Human on 2026-09-14.
- **Final history target:** `feat(deck): paint z.ai quota windows`
- **Implementation started at:** 2026-09-14T14:03:10Z
- **Work completed at:** 2026-09-14T14:14:50Z
- **Assurance completed at:** 2026-09-14T14:14:50Z — full offline `npm run check` inside
  Step 2.2
- **Actual implementation:** about 11m40s total (9m20s Step 2.1, 2m30s Step 2.2);
  Human wait excluded; below the 35–60 minute range because both seams were already
  Human-validated and the only friction was glyph-byte anchoring, not design.

- [x] Step 2.1 Extend footer telemetry with both quota windows and paint compact
      percent-first deck tiles with severity color and the chosen countdown mode.
  - Started: 2026-09-14T14:03:10Z; Completed: 2026-09-14T14:12:30Z.
  - Timing: about 9m20s implementation/check time; within the 20–35 minute estimate.
    Two friction points: Nerd Font glyph bytes in `deck.ts` anchors defeated text
    matching (patched through a byte-precise script), and the first render showed the
    tile separator without its surrounding spaces, corrected against the deck dialect.
  - Check: GREEN — header 101/101 including telemetry window parsing, hot-countdown
    formatting, and two-window/single-window tile rendering; footer 172/172 including
    additive telemetry windows parsing, malformed rejection, window collapse ordering,
    pessimistic same-label merge, and unknown-usage skip; Prettier PASS; ESLint PASS.
  - Paths: `packages/pi-fancy-footer-full-palette/src/{api.ts, api.test.ts, index.ts,
    provider-status.ts, provider-status.test.ts}`,
    `packages/galactica-context-header/src/{deck.ts, gauge.ts}`,
    `packages/galactica-context-header/test/{deck.test.ts, gauge.test.ts}`, this
    ledger, and `baseline/source.sha256`.
  - History: `step(deck): publish and paint quota windows`; verified independently
    after commit.
  - Estimate: 20–35 minutes; uncertainty is keeping the telemetry extension additive
    and strictly parsed while the deck degrades cleanly to `—`.
  - Covers: window list (label, used percent, optional reset time) in the telemetry
    message and `FooterTelemetrySnapshot`, strict optional parsing that tolerates older
    messages, deck quota-slot tiles `NN% 5h ‣ NN% 7d` before the cost tile, per-window
    severity color at the existing warning threshold, the chosen countdown mode from
    provider reset times, one-window and no-window degradation, and focused tests in
    both packages.

- [x] Step 2.2 Document the deck quota tiles and run complete offline assurance while
      refreshing the source-integrity manifest.
  - Started: 2026-09-14T14:13:20Z; Completed: 2026-09-14T14:14:50Z.
  - Timing: 1m30s implementation/check time; below estimate because documentation was a
    two-paragraph addition and the full gate passed on the first run.
  - Check: full `npm run check` PASS — baseline integrity (95 current, 87 imported),
    offline package load, format, lint, TypeScript, tooling and component tests,
    composition probe (1 extension, 8 commands, 3 tools), and OpenSpec (5 changes).
  - Paths: `packages/galactica-context-header/README.md`,
    `packages/pi-fancy-footer-full-palette/README.md`, this ledger, and
    `baseline/source.sha256`.
  - History: `step(deck): document quota window tiles`; verified independently after
    commit.
  - Estimate: 15–25 minutes; uncertainty is documenting the countdown mode boundary
    without overpromising provider reset-time fidelity.
  - Covers: package and root documentation updates, `check:baseline` before the manifest
    refresh, `scripts/check-baseline.mjs --write` plus rerun, and the full offline check
    through OpenSpec validation.

### Human validation

- [ ] Human runs the deck on a GLM-family model, sees live `5h` and `7d` percent tiles
      with the chosen countdown behavior, confirms one-window and non-GLM degradation,
      then reports a clear outcome; preserve the original response, canonical outcome,
      and UTC.
