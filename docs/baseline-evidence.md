# Baseline evidence

Captured during the 2026-09-03 handoff from Galactica and preserved through the first
standalone-toolchain repair.

## Original import

- Source files before copy: 87.
- Imported lines reported by `wc -l`: 35,920.
- Source-before versus source-after SHA-256 manifest: PASS.
- Source-before versus destination SHA-256 manifest: PASS.
- Copied `node_modules`: 0.
- Copied `.git` or `.rustory` metadata: 0.
- Exact imported Git boundary: `9d7bb84` (`chore: import Galactica cockpit baseline`).

`baseline/imported-source.sha256` is the immutable 87-file import record. Its own digest
is pinned by `scripts/check-baseline.mjs`; intentional standalone changes never rewrite
it.

## Evolved source integrity

`baseline/source.sha256` tracks the current intentional package tree. Run:

```bash
npm run check:baseline
```

The check verifies every current package file and independently verifies that the
original import manifest itself has not changed. Only a confirmed Task that intentionally
changes package files may run `node scripts/check-baseline.mjs --write`, after its focused
checks pass and before its scoped checkpoint.

The first toolchain repair moved the current tree to 88 files by removing two child
lockfiles, adding package-owned TypeScript configs and a Header test fixture, centralizing
workspace development dependencies, normalizing TypeBox 1.3.25's duplicate unknown-key
diagnostic, and repairing two strict Footer type defects. The original bytes remain
recoverable from `9d7bb84` and the immutable import manifest.

## Standalone verification evidence

- Root Pi development packages resolve to `0.84.4`.
- Status: 108 tests.
- Context Header: 69 tests.
- Fancy Footer: 158 tests and strict TypeScript.
- Pi Vim: 13 tests and strict TypeScript.
- Root formatting, lint, TypeScript and tooling tests are repository-owned.
- Isolated loading uses Pi's offline, no-extension boundary.
- `npm run check:openspec` validates completed planning artifacts for `ramona-idea` and
  `ramona-plan` changes declaring `skip_specs: true`; changes without that marker still
  use upstream `openspec validate --strict`.

OpenSpec 1.6.0 does not implement `skip_specs`, so its generic validator still requests
spec deltas for planning-only changes. The repository-local checker tests this explicit
schema boundary rather than manufacturing irrelevant product specifications or changing
the global OpenSpec installation.

## Not yet claimed

The toolchain repair does not claim:

- live TUI parity from the umbrella package;
- consolidated runtime configuration;
- automatic Insert-to-Neovim behavior;
- Human validation of the standalone package.
