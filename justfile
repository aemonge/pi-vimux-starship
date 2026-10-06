# pi-vimux-starship gates and release.

# Static gates: formatting, lint, types.
lint:
    npm run format:check
    npm run lint
    npm run typecheck

# Full test suite: tooling and component tests.
test:
    npm test

# Packed-artifact gate: the package ships source, so packing is the build.
build:
    npm run check:package:load

# Full release: gates, then bump+commit+tag, publish, reinstall, confirm.
publish VERSION: lint test build
    npm version {{VERSION}} --message "chore(release): v%s"
    npm publish
    npm install -g @aemonge-dev/pi-vimux-starship
    pi-agents --version
