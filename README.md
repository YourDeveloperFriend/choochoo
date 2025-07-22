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
