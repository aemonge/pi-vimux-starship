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
    @v=$(node -p 'require("./package.json").version'); \
     if [ "$v" = "{{VERSION}}" ]; then echo "already at {{VERSION}}, resuming"; \
     else npm version {{VERSION}} --message 'chore(release): v%s'; fi
    npm publish
    npm install -g @aemonge-dev/pi-vimux-starship@{{VERSION}}
    pi-agents --version
