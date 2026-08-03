#!/bin/bash
#
# Brings up the app for the end-to-end specs. Started by Playwright's webServer,
# so it must serve on $PORT and stay in the foreground.
#
# Every step is included on purpose. The old Selenium suite expected a build and
# migrations to have already happened, which is a large part of why it stopped
# working: there was no single command that produced a running app.
#
# Environment wins over these defaults, which is how CI points it at its own
# postgres and redis.
set -euo pipefail

# The server serves the client itself outside production (see server/dev/routes),
# and reads the login key check as satisfied in this stage (server/test/routes),
# which is what lets a spec log in as an arbitrary seeded user.
export NODE_ENV=test
export PORT="${PORT:-3001}"
export POSTGRES_URL="${POSTGRES_URL:-postgres://localhost:5432/choochootest}"
# The path is used as a key prefix rather than a database index, so this keeps
# e2e sessions from colliding with a dev server's.
export REDIS_URL="${REDIS_URL:-redis://localhost:6379/choochootest}"

# Migrations run from bin/, so the build has to come first. tsc is incremental,
# so this is only slow the first time.
npm run build-server
node bin/scripts/migrations up

# From source, not bin/: tsc compiles the .ts and leaves the client's HTML
# behind, so the compiled server cannot serve a page.
exec npx ts-node src/server/index.ts
