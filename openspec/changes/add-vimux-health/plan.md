# Plan: Diagnose whether the cockpit is ready to use

- **Idea:** `share-pi-vimux-starship`
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
- **Human validation:** Pending

## Value

A user can run `/vimux-health` and immediately see whether the consolidated cockpit is
ready, recommended, or merely missing an optional capability, without leaking private
configuration or changing the machine.

## Acceptance criteria

- [ ] `/vimux-health` registers once at the package root and emits one bounded,
      deterministic `PASS`/`WARN`/`INFO` report through supported Pi command/UI APIs.
- [ ] The report distinguishes package load, TUI context, recommended Neovim-terminal
      context, external-editor configuration/executable readiness, duplicate cockpit
      command risk, and optional Git/OpenSpec/Devbox/tmux capability presence.
- [ ] Missing optional capabilities remain informational; a missing required prompt
      handoff is actionable without claiming unsupported detection certainty.
- [ ] Output contains no credential, environment value, settings content, editor command,
      private bridge endpoint, or unnecessary absolute path and performs no writes,
      network requests, service operations, or configured-command execution.
- [ ] The existing exact EX bridge reaches `:vimux-health`, package composition remains
      unique, and all package checks stay GREEN.

## Scope and boundaries

Included paths are `src/health.ts`, `src/index.ts`, focused root tests including the
composition expectation, and this Plan's artifacts. Probes use Node/Pi public surfaces
and injected local filesystem/environment evidence; they do not create a persistent
service or add dependencies.

Excluded are configuration mutation, automatic repair, live provider/auth inspection,
Nerd Font certainty, fullscreen introspection unsupported by public APIs, private bridge
logic, telemetry, package publication, network access, and broad platform guarantees.
The optional command-palette keybinding remains Human-owned Pi configuration.

The current root is writable and clean, Pi is locally available, and VHS is absent from
the sandbox. Implementation still requires the exact final brief and a direct answer to
`Can I implement this exact brief?`; no protected Pi-configuration authority is implied.

## Method and execution

TDD first commits focused failures for severity, redaction, optional absence, duplicate
command provenance, and registration. Native direct execution then implements one pure
collector/formatter and one root command registration. No subagent is selected because
one bounded module and its composition seam are tightly local; an independent receipt
checker verifies each history boundary.

## Verification

Run focused RED/GREEN root tests, exact-path formatting and lint, strict TypeScript,
composition and duplicate-registration checks, the complete repository gate, current
source/import integrity, and a credential-free offline Pi load. Human runs
`/vimux-health` and `:vimux-health` inside the real `nvim +terminal` bridge and confirms
that results are accurate, useful, and non-sensitive.

**Final history target:** `feat(health): diagnose cockpit readiness`

**Checkpoint policy:** Each successful Step commits only declared implementation, tests,
and matching progress as `step(health): concise value`; the final Task commit waits for
Human validation and is independently receipt-verified.
