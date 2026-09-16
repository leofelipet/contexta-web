# Contexta Web

Administrative interface for [Contexta](https://github.com/leofelipet/contexta), a personal WhatsApp data platform and read-only MCP server.

The application is built with Next.js, React, TypeScript, and Tailwind CSS. It acts as a backend-for-frontend: the browser authenticates with an HTTP-only session cookie, while the Contexta REST Bearer token remains available only to the Next.js server.

## Features

- Single-user administrative login
- Dashboard with contacts, conversations, messages, and integration health
- Responsive conversation explorer with incremental history loading
- Contact directory and full-text message search
- UAZAPI status and webhook configuration
- MCP server status and tool inventory
- Privacy-safe operational activity viewer

## Requirements

- Node.js 24 or newer
- pnpm 10 or newer
- A running Contexta backend

## Setup

```sh
cp .env.example .env.local
pnpm install
pnpm password:hash -- your-admin-password
```

Put the generated, quoted `ADMIN_PASSWORD_HASH` assignment in `.env.local`, then configure:

```text
CONTEXTA_API_URL=http://localhost:8080
CONTEXTA_API_TOKEN=the-backend-api-bearer-token
SESSION_SECRET=at-least-32-random-characters
SESSION_COOKIE_SECURE=false
```

Start the development server:

```sh
pnpm dev
```

The interface is available at `http://localhost:3000`.

## Production

Build and run locally:

```sh
pnpm build
pnpm start
```

Or build the standalone container:

```sh
docker build -t contexta-web .
docker run --rm -p 3000:3000 --env-file .env.local contexta-web
```

Production deployments must use HTTPS, set `SESSION_COOKIE_SECURE=true`, and apply reverse-proxy rate limiting to `/login` in addition to the in-process limiter.

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --prod
```

## License

MIT
