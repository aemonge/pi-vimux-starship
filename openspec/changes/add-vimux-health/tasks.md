# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Report cockpit readiness without changing the environment

- **Value:** A user can run one command to distinguish required prompt-handoff problems,
  recommended topology, and optional capability absence without exposing private data.
- **Method source:** predefined
- **Method name:** TDD
- **Method contract:** Specify a compact, privacy-bounded health report with
  discriminating test-only RED failures, implement the minimum command-time local
  probes, then refactor while focused, composition, and package checks stay GREEN.
- **Execution source:** native-direct
- **Execution name:** Root-package health reporter
- **Execution reason:** The root composition owns package identity and can inspect its
  configured command set and local runtime context without coupling component internals
  or starting background work.
- **Execution outline:** Add pure fixture-driven report contracts, register one root
  command backed by bounded local probes, and assure both direct `/vimux-health` and
  existing exact EX-command dispatch.
- **Estimate basis:** The accepted prompt repair took 8m32s plus 1m05s assurance and the
  root composition already has deterministic registration probes, but no comparable
  Human-validated health reporter exists.
- **Estimated implementation:** 25–45 minutes; Human wait excluded.
- **Estimate confidence:** Low-to-medium because Pi exposes command provenance but not
  every desirable terminal detail, and executable resolution must mirror the actual
  external-editor boundary without exposing configuration.
- **Human-wait estimate:** Separate and unbounded; Human validates the report once in the
  recommended Neovim terminal environment.
- **Refinement trigger:** Stop and revise if useful checks require private Pi APIs,
  executing arbitrary configured commands, reading credentials, or redesigning an
  imported component.
- **Implementation confirmed at:** 2026-09-08T14:57:33Z
- **Implementation started at:** 2026-09-08T14:57:57Z
- **Work completed at:** 2026-09-08T15:05:20Z
- **Assurance started at:** 2026-09-08T15:05:21Z
- **Assurance completed at:** 2026-09-08T15:07:07Z
- **Ready for validation at:** Pending
- **Actual implementation:** Pending
- **Observed Human wait:** Pending
- **Estimate outcome:** Pending
- **Final history target:** `feat(health): diagnose cockpit readiness`
- **Current non-Git boundary:** Not applicable; the repository uses Git.
- **Human validation:** Pending

- [x] Step 1.1 Specify report classification, redaction, optional absence, duplicate
      command detection, and root registration with test-only RED contracts.
  - Started: 2026-09-08T14:57:57Z
  - Estimate: 8–15 minutes; uncertainty was representing public command provenance with a
    compact fixture that still discriminates duplicate package loading.
  - Timing: 2026-09-08T14:57:57Z–2026-09-08T14:59:39Z (1m42s).
  - Check: RED as required — focused execution reports exactly two failures: the absent
    `src/health.ts` module and missing `vimux-health` root registration; three neighboring
    composition tests remain GREEN.
  - Paths: `test/health.test.ts`, `test/local-load-probe.test.ts`, and this Plan/ledger.
  - History: Expected `step(health): specify cockpit readiness report`; external receipt
    pending independent verification.
- [x] Step 1.2 Implement bounded local probes, deterministic formatting, and root command
      registration, then run complete assurance.
  - Started: 2026-09-08T15:01:44Z
  - Estimate: 17–30 minutes; uncertainty was safe executable lookup for the actual
    external-editor setting without parsing or running arbitrary shell text.
  - Timing: 3m36s implementation plus 1m46s deterministic assurance; below estimate
    because injected boolean/local-file evidence avoided process execution and UI work.
  - Check: GREEN — exact lint/format, strict TypeScript, 9 focused tests, full 396-test
    repository gate, 92-file current and 87-file import integrity, one-extension/
    seven-command/two-tool composition, six OpenSpec changes, and credential-free offline
    Pi load with 213 rows all PASS.
  - Paths: `src/health.ts`, `src/index.ts`, `test/health.test.ts`, this Plan/ledger, and
    formatter-owned changes to those exact paths.
  - History: Expected `step(health): report cockpit readiness`; external receipt pending
    independent verification.

### Human validation

- [ ] Human runs `/vimux-health` and `:vimux-health` in the real non-fullscreen
      `nvim +terminal` workflow, confirms useful accurate classifications and no sensitive
      disclosure, and reports a clear outcome with original response, canonical result,
      and UTC preserved.
