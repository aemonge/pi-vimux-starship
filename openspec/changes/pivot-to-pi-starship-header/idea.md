# Idea: Pivot the cockpit to pure `pi-starship-header` chrome

The cockpit stops owning an editor and becomes pure terminal chrome: the rich
header/footer/status deck named `pi-starship-header`, fed read-only by the
ecosystem packages that own the brains. Editing, goals, and protection are no longer
embedded concerns; they are neighboring packages whose state the deck
renders.

The division of labor is fixed:

- Prompt editing belongs to an external engine chosen and installed by the
  Human (today `@burneikis/pi-vim`), never to a cockpit-bundled fork.
- Goal planning and persistence belong to `pi-goal-x`; the deck reads its
  storage and renders its state, while goal-x's own persistent widget rows go
  dark and only its on-demand modals remain.
- Tool protection belongs to `pi-openappa`; the deck mirrors its gate, health,
  and denial signals as one telemetry segment.
- The retired `pi-vim-top-border` fork and its Neovim bridge stay in the tree
  dormant, runnable but never composed, until the Human orders deletion.

This pivot supersedes the premise of the deferred `route-insert-through-neovim`
change: Insert no longer routes through any bridge. The Human navigates the
conversation through the outer `nvim :terminal` and submits from the in-process
engine. Renames and publication happen last, after behavior is validated.

The privacy boundary is unchanged: raw prompts, generated prose, tool inputs,
child output, credentials, clipboard content, hidden reasoning, and unintended
paths never enter status surfaces. Core behavior still fails soft without Git,
OpenSpec, Nerd Fonts, or any of the neighboring brain packages.
