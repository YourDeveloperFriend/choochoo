# Choo Choo Games

## About

[Choo Choo Games](https://www.choochoo.games) is a free, open-source website for playing train games.

## Contributors

Special thanks to all the [contributors](https://github.com/YourDeveloperFriend/choochoo/graphs/contributors) who help make this project what it is!

## Development

Please submit [issues](https://github.com/YourDeveloperFriend/choochoo/issues) and [pull requests](https://github.com/YourDeveloperFriend/choochoo/pulls).

### Quick Start with Docker Compose (Recommended)

The easiest way to get started is using Docker Compose. This will start the service and watch for changes.

```bash
docker-compose up --watch
```

Visit http://localhost:3001 to see the application.

#### Rebuilding Containers

When you need to rebuild the Docker containers (after pulling updates, merging branches, or changing dependencies):

```bash
docker-compose down
docker-compose up --build --watch
```

**Note:** 
- If you encounter port conflicts, check for existing services with `lsof -i :PORT_NUMBER`

### Manual Setup

Alternatively, you can set up services manually.

To run locally, you should start a local postgres and redis instance.
With docker you can run:

```
docker run -d --name choochoo-pg -p 5432:5432 -e POSTGRES_PASSWORD=choochoo -e POSTGRES_USER=choochoo postgres:latest 
docker run -d --name choochoo-redis -p 6379:6379 redis:latest
```

Create and source an environment variable with something like the following:

```
export NODE_ENV=development
export POSTGRES_URL=postgresql://choochoo:choochoo@localhost:5432/choochoo
export REDIS_URL=redis://localhost:6379
export SESSION_SECRET=foobar
```

Apply database migrations with `npm run migrate`.
You can then start up a server with `npm run dev`.

### Move Calculator Performance Harness

There is an engine-level benchmark test for the move calculator route search:

```bash
npm run test -- searcher_perf_test
```

To export a complex real game into a reproducible fixture:

```bash
npm run export-game-fixture -- 716 src/e2e/goldens/move_perf_716.json
```

Named flags are also supported when your shell forwards them correctly:

```bash
npm run export-game-fixture -- --game-id 716 --output src/e2e/goldens/move_perf_716.json
```

Then run the benchmark against that fixture:

```bash
MOVE_SEARCH_PERF_FIXTURE=src/e2e/goldens/move_perf_716.json npm run test -- searcher_perf_test
```

To enforce a soft regression gate (for example 30% over a known baseline):

```bash
MOVE_SEARCH_PERF_FIXTURE=src/e2e/goldens/move_perf_716.json \
MOVE_SEARCH_PERF_BASELINE_MS=47000 \
MOVE_SEARCH_PERF_ALLOWED_REGRESSION=0.3 \
npm run test -- searcher_perf_test
```

Defaults:

- Fixture: `src/e2e/goldens/create_game_after.json`
- Runs: 1 warmup + 3 measured iterations
- Output: route count and timing stats (min/median/max)

Optional environment variables:

- `MOVE_SEARCH_PERF_FIXTURE`: workspace-relative JSON fixture path
- `MOVE_SEARCH_PERF_GAME_KEY`: required only when fixture is raw serialized game data without top-level metadata
- `MOVE_SEARCH_PERF_VARIANT`: JSON string for special variants (for example Puerto Rico)
- `MOVE_SEARCH_PERF_WARMUP_RUNS`: warmup iteration count
- `MOVE_SEARCH_PERF_RUNS`: measured iteration count
- `MOVE_SEARCH_PERF_BASELINE_MS`: baseline median to compare against
- `MOVE_SEARCH_PERF_ALLOWED_REGRESSION`: soft budget ratio (default `0.3` = 30%)
- `MOVE_SEARCH_PERF_MAX_MS`: optional absolute median cap

For e2e smoke coverage, `src/e2e/move_good_test.ts` opens Move Calculator and times completion. You can set an optional soft timeout with `MOVE_CALCULATOR_E2E_TIMEOUT_MS`.
