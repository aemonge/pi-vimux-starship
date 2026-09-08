# pi-vimux-starship

A Vim- and tmux-inspired command deck for [Pi](https://pi.dev): lifecycle context,
external-Neovim prompt composition, Vim command handling, and responsive operational
telemetry in one package.

> [!IMPORTANT]
> This repository preserves its byte-identical Galactica import at Git commit `9d7bb84`
> and in `baseline/imported-source.sha256`. The consolidated root package has since
> evolved intentionally; `baseline/source.sha256` verifies its current authored tree.

“Vimux” joins Vim's editing language with tmux-inspired terminal navigation. “Starship”
names the integrated cockpit experience; this package does not depend on `starship.rs`.

## What is present

```text
Header Deck ◀── bounded lifecycle and telemetry snapshots
    │
    └── bottom separator ◀── live Vim Normal / Visual / EX mode

focused zero-row Vim command surface ── Insert transition / Ctrl-E ──▶ Neovim
                                     ◀── hidden draft ────────────────┘
```

The imported implementation lives under [`packages/`](packages/):

- `galactica-status` — focus, lifecycle, OpenSpec, Goal, Taskflow, and diagnostics
  state;
- `galactica-context-header` — lifecycle header and bounded local telemetry;
- `pi-fancy-footer-full-palette` — responsive footer renderer and provider status;
- `pi-vim-top-border` — focused Vim command surface, clipboard policy, and
  external-editor handoff.

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
- [External-editor-only prompt Plan](openspec/changes/route-insert-through-neovim/plan.md)

The consolidated package selects an explicit `external-editor-only` Pi Vim surface. In
regular Pi mode it renders no native prompt rows: the Header Deck remains visible, starts
in Normal mode, and places the live mode icon on its bottom separator. Every supported
Insert-producing command and direct Ctrl-E opens the existing Neovim handoff after the
current command mutation completes. Saving returns a hidden draft; Enter submits it, and
another Insert command or Ctrl-E reopens it. Pi fullscreen retains its core three-row
editor slot and is not the target workflow.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — current and target boundaries;
- [`docs/source-inventory.md`](docs/source-inventory.md) — imported source ownership;
- [`docs/development.md`](docs/development.md) — local package and test workflow;
- [`docs/handoff.md`](docs/handoff.md) — exact continuation steps.
