# Plan: Install pi-agents CLI

- **Idea:** `share-pi-vimux-starship`
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Superseded 2026-09-30 — the PATH symlink mechanism
  was rejected by Human direction ("a symlink is not an install"); delivery
  now lands through `publish-pi-vimux-starship` Task 1's npm-global install.
  The original contract text follows for history: smallest complete install —
  bin manifest entry, packed integrity, PATH symlink — one Human-validatable
  outcome.
- **Execution source:** native-direct
- **Execution name:** Single-slice install
- **Execution reason:** One micro-slice; no parallelizable parts.
- **Execution outline:** One Task registers the bin in the root manifest and
  packed-artifact checks, then symlinks `~/.local/bin/pi-agents` to the repo
  bin; gates and a live PATH run verify.
- **Estimate basis:** Three manifest lines, one integrity-list line, one
  symlink; no unknowns.
- **Estimated implementation:** 10–20 minutes; Human wait excluded.

## Acceptance

- `pi-agents` (and `-w`) runs from any directory.
- Packed artifact includes `bin/cockpit-agents.mjs`; `REQUIRED_FILES` covers
  it; all gates stay green.

## Scope

- **In:** root `package.json` `bin` + `files`, `scripts/check-package.mjs`
  `REQUIRED_FILES`, `~/.local/bin/pi-agents` symlink.
- **Out:** npm registry publication, shell completion, aliases, man pages.

## Verification

`command -v pi-agents`; live run from `$HOME`; `check:package:load`,
`check:baseline`, `check:composition`, format, lint, typecheck, suites.

## Dependencies and authority

Local symlink in the user's `~/.local/bin` under explicit Human direction;
no network, no registry, no protected Pi configuration.
