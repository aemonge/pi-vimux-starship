# pi-vimux-starship

A Vim- and tmux-inspired command deck for [Pi](https://pi.dev): lifecycle context above
the prompt, modal editing at the controls, and responsive operational telemetry below.

> [!IMPORTANT]
> This repository is currently a byte-identical imported baseline. Its root manifest
> loads the four proven Galactica extensions as one Pi package, but their internal
> package and configuration boundaries have not yet been consolidated.

“Vimux” joins Vim's editing language with tmux-inspired terminal navigation. “Starship”
names the integrated cockpit experience; this package does not depend on `starship.rs`.

## What is present

```text
lifecycle header
       │
       ▼
Vim prompt editor ◀── prompt rails ◀── bounded status snapshots
       │
       ▼
responsive footer
```

The imported implementation lives under [`packages/`](packages/):

- `galactica-status` — focus, lifecycle, OpenSpec, Goal, Taskflow, and diagnostics
  state;
- `galactica-context-header` — lifecycle header and bounded local telemetry;
- `pi-fancy-footer-full-palette` — responsive footer renderer and provider status;
- `pi-vim-top-border` — Vim editor, prompt rails, clipboard policy, and external-editor
  action.

The root Pi manifest lists their existing entrypoints in dependency-safe startup order.
No implementation was flattened into one large `index.ts`.

## Handoff

This tree is staged temporarily inside Galactica without Git metadata. Move it first:

```bash
mv ~/galactica/pi-vimux-starship ~/projects/
cd ~/projects/pi-vimux-starship
```

Then start a fresh Pi session in that directory and follow
[`docs/handoff.md`](docs/handoff.md). The intended first Git commit is:

```text
chore: import Galactica cockpit baseline
```

Starting Pi after the move does not replace the existing global cockpit. Galactica's
original four package entries remain configured until a later, explicitly authorized
migration.

## Isolated package probe

Do not load this umbrella package alongside the four original packages. An isolated
probe can disable discovered extensions while retaining the explicit package:

```bash
pi --offline --no-extensions -e "$PWD" --list-models
```

After one-package parity is validated, install the local source with:

```bash
pi install "$(pwd -P)"
```

Changing protected Pi settings requires explicit Human authority.

## Baseline integrity

The import contains 87 authored files and 35,920 lines. `node_modules`, caches,
generated artifacts, and repository metadata were excluded. Verify the immutable import
with:

```bash
npm run check:baseline
```

See [`docs/baseline-evidence.md`](docs/baseline-evidence.md) for the captured checks and
known development-environment gaps.

## Durable direction

- [Package Idea](openspec/changes/share-pi-vimux-starship/idea.md)
- [Cockpit consolidation Plan](openspec/changes/consolidate-imported-pi-cockpit/plan.md)
- [Deferred external-Insert Plan](openspec/changes/route-insert-through-neovim/plan.md)

Package consolidation comes first. Routing Insert transitions through Neovim begins only
after Human validates one-package parity. Ctrl-E remains the direct external-editor
route.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — current and target boundaries;
- [`docs/source-inventory.md`](docs/source-inventory.md) — imported source ownership;
- [`docs/development.md`](docs/development.md) — local package and test workflow;
- [`docs/handoff.md`](docs/handoff.md) — exact continuation steps.
