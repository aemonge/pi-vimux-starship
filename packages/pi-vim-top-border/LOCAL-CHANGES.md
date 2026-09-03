# Local changes

This is a Galactica-managed local fork of [`pi-vim`](https://github.com/lajarre/pi-vim)
0.14.1.

## Prompt telemetry rails

The lifecycle header owns the `❯` prompt anchor. Compact status islands now float inside
the editor rails while each rail balances its own left and right groups:

```text
 wait › Human validation ⟩ Implement compact telemetry islands on the prompt rails
─ 󰏫 ─────────────────────────  3/3 ⟩  9/19 ›  48/64 ──
│
─ 00:00'00 ───────────── 󰾆 51.1% › 󰎞 2 ⟩ ▤ 252M ›  1% ⟩ $1.73 ──
```

The top rail keeps the vi-mode glyph alone on the left, with live MCP availability and
work progress in one right-anchored island. The MCP segment uses the plug glyph ``,
stays visible as dim `0/0` before valid status arrives, yields first on narrow
terminals, and deliberately excludes Neovim LSP inventory because that is not an agent
capability. The bottom rail keeps the eight-cell foreground-activity chronometer on the
left, with context, compaction count, RAM, CPU, and session cost on the right. A major
separator splits context from process resources; the separator before cost uses the same
purple major-boundary color rather than inheriting the blue cost value. Telemetry is
right-aligned immediately before the closing `──`. The footer model group instead ends
with Ramona's bounded `⟨ 󰠭` avatar tail. The header remains unpadded; no cross-row
alignment consumes its working width. On narrow terminals, optional progress and process
resources disappear before mode, chronometer, or context. The chronometer is deep cyan
while foreground work is active and dim only while settled. Rail data is consumed from
the existing bounded `pi-fancy-footer:widget` snapshots; session cost is derived locally
from assistant usage already present in the active branch.

Mode words are replaced with single Nerd Font glyphs:

| Mode                 | Glyph | Theme token          |
| -------------------- | ----- | -------------------- |
| Insert               | `󰏫`   | `success`            |
| Normal               | `󰆾`   | `borderAccent`       |
| Visual / Visual Line | `󰒅`   | `customMessageLabel` |
| EX                   | `󰆍`   | `warning`            |

Pending commands do not expand the mode island; the single glyph remains stable while
the command is composed. Labels use foreground color only—no reverse-video or background
block. Mode remains alone at the top-left edge.

## Integrated Neovim prompt handoff

The configured `app.editor.external` key is intercepted inside the modal editor before
Pi's blocking external-editor handler. The prompt is round-tripped through the
configured `externalEditor` while Pi's TUI remains live, so normal edits do not print
launch/resume messages. During handoff the inactive Pi prompt border uses the theme's
`dim` color; the mode color returns when Neovim closes. Neovim owns terminal-row
reservation so the PTY receives a real resize instead of relying on a Pi widget. Prompt
files live only in private temporary directories, and the `PI_NVIM_BRIDGE` descriptor is
inherited by the launcher rather than written or passed as an argument.

## Portable clipboard helper

Clipboard reads and writes use self-contained platform commands (`wl-copy` / `wl-paste`,
X11 tools, macOS tools, Windows PowerShell, or Termux) with OSC 52 fallback for remote
sessions. The fork therefore does not require a physical
`@earendil-works/pi-coding-agent` installation just to resolve clipboard code.

## Updating

This package is linked from Galactica into `~/.pi/agent/packages` and loaded by the
relative settings entry `./packages/pi-vim-top-border`. Do not overwrite it with
`pi update`. To adopt a newer upstream release, copy the newer source into this managed
directory, reapply the focused local changes, and run diagnostics plus the interactive
render and clipboard smoke tests.
