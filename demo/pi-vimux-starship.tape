# Run from the pi-vimux-starship repository root.
# Requires Pi, Neovim, VHS, and the user's configured blocking Neovim bridge.

Output docs/assets/pi-vimux-starship.gif

Set Shell "bash"
Set Width 1400
Set Height 900
Set FontSize 24
Set TypingSpeed 35ms
Set Framerate 30
Set PlaybackSpeed 1

Type "nvim +'terminal' +'startinsert'"
Enter
Sleep 2s

# Launch only this package, offline and without a session.
Type "pi --offline --no-session --no-extensions --no-context-files --tui-mode regular -e \"$PWD\""
Enter
Sleep 4s

# Pi starts in Normal. Insert opens the configured bridge in this Neovim instance.
Type "i"
Sleep 2s
Type "/vimux-health"
Sleep 1s
Escape
Type ":x"
Enter

# The explicit write closes Neovim's prompt buffer and auto-submits once.
Sleep 5s
