# Run from the pi-vimux-starship repository root.
# Requires Pi and VHS; no provider, session, or private editor bridge is used.

Output docs/assets/pi-vimux-starship.gif

Set Shell "bash"
Set Theme "Gruvbox Light"
Set Width 1400
Set Height 900
Set FontSize 24
Set TypingSpeed 35ms
Set Framerate 30
Set PlaybackSpeed 1

# Launch only this package, offline and without a session.
Type "pi --offline --no-session --no-extensions --no-context-files --tui-mode regular -e ."
Enter
Wait+Screen /waiting/
Sleep 1s

# Dispatch the credential-free health report through Pi Vim's Normal-mode EX bridge.
Type ":vimux-health"
Enter
Wait+Screen /pi-vimux-starship health/
Sleep 5s
