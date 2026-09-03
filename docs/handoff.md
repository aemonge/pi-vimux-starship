# Handoff to the standalone project

## Human move

This directory was intentionally created without Git metadata inside Galactica. Human
owns the move:

```bash
mv ~/galactica/pi-vimux-starship ~/projects/
cd ~/projects/pi-vimux-starship
```

If either source or destination differs, inspect both resolved paths before acting. Do
not overwrite an existing destination.

## First fresh Pi session

Start Pi from the moved root. The existing global Galactica cockpit remains loaded, so
the session is usable before this package replaces anything.

The fresh session should:

1. read `AGENTS.md`, this handoff, and the OpenSpec Idea and Plans;
2. verify `pwd -P` is outside Galactica and the imported baseline passes;
3. inspect the complete workspace status;
4. obtain explicit Human direction before initializing Git if it is still absent;
5. create the initial commit containing exactly this imported scaffold:
   `chore: import Galactica cockpit baseline`;
6. select `consolidate-imported-pi-cockpit`, Task 1 only on explicit Human direction;
7. perform a fresh read-only preflight and obtain confirmation before implementation.

Do not mark any consolidation Step complete merely because the baseline was imported.
The import is its starting point, not evidence that one-package parity has been
accepted.

## Safe package transition

Do not install the umbrella package while the original four extensions are also loaded.
First use the isolated probe documented in `development.md`. After automated and Human
parity checks pass, propose one exact Pi settings migration that replaces:

- `./packages/pi-fancy-footer-full-palette`;
- `./packages/galactica-status`;
- `./packages/galactica-context-header`;
- `./packages/pi-vim-top-border`;

with the standalone absolute local path. That protected mutation requires exact
`ALLOW PI CONFIG` authority and a rollback instruction.

## Deferred feature

Do not begin `route-insert-through-neovim` until consolidation Task 1 has canonical
Human `VALID` evidence. The future implementation must preserve Ctrl-E, use the existing
Pi external-editor action, and defer automatic launch until each Insert-producing
command has completed dispatch.

## Known starting evidence

- imported file and hash parity: PASS;
- status package tests: 108 passed;
- context-header checks: 69 tests passed with formatting and TypeScript checks;
- Neovim handoff focused test: passed;
- footer and Vim package developer environments: incomplete; see `baseline-evidence.md`.

No Pi settings, Neovim, tmux, Starship/Zsh, provider, network, or original package
source was changed during this handoff.
