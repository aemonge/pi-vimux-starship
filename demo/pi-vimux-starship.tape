# Run from the pi-vimux-starship repository root.
# Requires Pi and VHS; no provider, session, or private editor bridge is used.

Output docs/assets/pi-vimux-starship.gif

Set Shell "bash"
Set Theme "Gruvbox Light"
Set Width 1400
Set Height 520
Set Padding 20
Set FontSize 24
Set TypingSpeed 35ms
Set Framerate 30
Set PlaybackSpeed 1

# Keep routine startup out of the public recording and clear its shell line.
Hide
Type "clear && pi --offline --no-session --no-extensions --no-context-files --tui-mode regular -e ."
Enter
Wait+Screen /waiting/
Show
Sleep 4s

# Exercise a real ephemeral title change without creating a session.
Type ":name Public cockpit demo"
Enter
Wait+Screen /Public cockpit demo/
Sleep 3s

# Dispatch the credential-free health report through Pi Vim's Normal-mode EX bridge.
Type ":vimux-health"
Enter
Wait+Screen /pi-vimux-starship health/
Sleep 5s
