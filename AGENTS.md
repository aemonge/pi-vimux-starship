# pi-vimux-starship repository instructions

## Repository role

This repository is the canonical development home for `pi-vimux-starship`, a Vim- and
tmux-inspired command deck for Pi. It begins as a byte-identical import of four
Galactica-managed extensions and will consolidate them behind one package identity
without redesigning the Human-validated cockpit.

The repository is temporarily staged at `~/galactica/pi-vimux-starship` only for Human
handoff. Do not initialize Git while it remains anywhere inside Galactica. After Human
moves it to `~/projects/pi-vimux-starship`, discover the actual root with `pwd -P` and
confirm the destination before any mutation.

## Current baseline

The root `package.json` is an umbrella Pi manifest. Its four exact extension entrypoints
preserve the current startup order:

1. `packages/pi-fancy-footer-full-palette/src/index.ts`
2. `packages/status/index.ts`
3. `packages/galactica-context-header/index.ts`
4. `packages/pi-vim-top-border/index.ts`

The imported trees began as the comparison baseline and stayed byte-identical until the
confirmed `repair-imported-development-toolchain` Fix replaced their development-tooling
role. Preserve the original import at Git commit `9d7bb84` and in the immutable
`baseline/imported-source.sha256`; `baseline/source.sha256` verifies the intentionally
evolved current package tree. New consolidated code should use bounded modules rather
than one oversized entrypoint.

The imported source contained no `node_modules`, generated artifacts, credentials, or
repository metadata. Keep those exclusions after every intentional evolution.

## Product boundaries

The package owns the visible Pi cockpit:

- narrative lifecycle and selected work above the prompt;
- Vim editing, mode, and immediate telemetry on the prompt surface;
- compact project, model, quota, context, cost, and resource telemetry below;
- optional capability adapters that never grant authority.

Raw prompts, generated prose, tool arguments, child output, credentials, authentication
material, clipboard contents, hidden reasoning, and unintended paths must not enter
status surfaces.

Core behavior must fail soft without Git, OpenSpec, Taskflow, Devbox, Nerd Fonts,
Neovim, tmux, or provider quota data. Pi core is the API authority. Preserve `pi-vim`
and Fancy Footer licenses and local-change provenance.

## Required sequence

1. Move the scaffold outside Galactica.
2. Initialize normal Git and create the exact imported-baseline commit before source
   changes.
3. Validate one-package load parity through the focused consolidation Plan.
4. Consolidate configuration and prove the private package.
5. Obtain Human validation.
6. Only then consider the separate external-Insert Plan.

Keep Ctrl-E as the direct Neovim editor route. Future automatic Insert routing must call
the same Pi external-editor action, request at the centralized Insert transition, and
launch only after the current input dispatch has completed its text/cursor mutation. Do
not duplicate the private Neovim bridge or alter Starship/Zsh as part of that Plan.

## OpenSpec

`openspec/changes/share-pi-vimux-starship` is the parent Idea.

The active implementation sequence is defined by:

- `openspec/changes/consolidate-imported-pi-cockpit`;
- `openspec/changes/route-insert-through-neovim`, deferred until parity is accepted.

A focused Task is authoritative. Before source or configuration mutation, perform a
bounded read-only preflight, present one exact implementation brief, and ask:
`Can I implement this exact brief?` Wait for a clear direct confirmation. A material
change to paths, architecture, dependencies, execution, security, external effects, or
history requires a revised brief and renewed confirmation.

Human validation remains conversational and distinct from automated checks, Taskflow,
OpenSpec checkboxes, or Git commits.

## Development

Use current Pi documentation under `/usr/lib/pi/docs` as the API authority. Relevant
starting points are `packages.md`, `extensions.md`, `tui.md`, `sdk.md`, and
`keybindings.md`; read referenced documents before changing compatibility code.

Use the root package as the only installed package identity. During isolated probes,
avoid duplicate extension registration:

```bash
pi --offline --no-extensions -e "$(pwd -P)" --list-models
```

Pi local packages are linked by path with `pi install /absolute/path`; `npm link` is not
the package-registration mechanism. Do not mutate protected Pi settings without exact
`ALLOW PI CONFIG` authority. Do not run network installs, publication, live provider
requests, service operations, or external synchronization without separate bounded Human
direction.

Keep build output and caches outside authored source where tools allow. Never commit
`node_modules`, credentials, tokens, `.env` files, Pi session state, screenshots, or
private runtime data.

## Verification

Run nearest focused checks before broader checks. Every edited file must receive its
configured formatter, non-mutating formatter check, and applicable linter. Type-check
TypeScript and run the relevant component and package tests. Preserve deterministic
coverage for startup order, event protocols, responsive rendering, Unicode, ANSI,
optional capability absence, malformed inputs, Vim key sequences, and external-editor
handoff.

Before changing the current package tree, run `npm run check:baseline`; after the
confirmed change passes focused checks, update the current manifest with
`node scripts/check-baseline.mjs --write` and rerun the check. Never modify
`baseline/imported-source.sha256`.

Use `npm run check:openspec` for the repository's schema-aware planning boundary.
Planning-only `ramona-idea` and `ramona-plan` changes with `skip_specs: true` must have
complete artifacts; every other change retains upstream strict validation.

Packed-artifact and local-package checks must be offline and credential-free unless
Human separately authorizes otherwise. Static checks do not prove live TUI behavior;
provide concrete manual checks and stop at Human validation.

## Git history after the move

Do not initialize or commit Git while this tree is inside Galactica. After the Human
moves it to the standalone project root, the first commit should contain the complete
scaffold and imported baseline with subject:

```text
chore: import Galactica cockpit baseline
```

Thereafter inspect workspace-wide status and target diffs before mutation. Each OpenSpec
Step gets one scoped conventional Step commit containing only declared source, tests,
and matching progress. Never bypass identity, signing, hooks, or safety; never amend,
squash, reset, rebase, or otherwise rewrite history without explicit Human direction.
The final Task commit waits for Human validation.
