<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Contexta Web

Single-user admin panel for the Contexta backend (Next.js App Router, React, TypeScript, Tailwind v4).

## Contexta: three repos

Contexta lives in three sibling repos under the same folder:

- `contexta-backend`: Go API, MCP server and Postgres migrations.
- `contexta-web`: Next.js admin panel, which calls the API.
- `contexta-android`: Kotlin app, which calls the API directly.

Features ship as paired commits with the same version: `internal/version` in the backend and `package.json` in the web. Android has its own `versionName`; bump its `versionCode` too, so the in-app update sees the new version.

**Push order:** backend first, then web, then Android. The web and the app depend on API changes such as migrations and new fields.

**Verification before each push:**

- Backend: `go build ./... && go vet ./... && go test ./...`. Integration tests need `TEST_DATABASE_URL`.
- Web: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.
- Android: **do not run `./gradlew` on the local machine.** Gradle plus the Kotlin daemon use 2 to 3 GB of RAM and freeze the computer. Push, and let GitHub Actions verify: the `APK` workflow runs `test assembleRelease` and publishes the release. Follow it with `gh run watch <id> -R leofelipet/contexta-android --exit-status`.

Do not run heavy builds in parallel. When reporting a result, use the command's real exit code: `cmd | tail; echo $?` reports the exit code of `tail`.

## Architecture: backend-for-frontend

- The browser never sees the backend token. Every backend call goes through `lib/api.ts` (`apiFetch`, which is `server-only` and calls `requireSession()`), and that file adds `CONTEXTA_API_TOKEN`.
- Pages are async Server Components that fetch with `apiFetch`. Mutations are Server Actions in `app/actions.ts`.
- Every action starts with `await requireSession()` and ends with `revalidatePath(...)` or `redirect(...)`.
- Actions used with `useActionState` return `{ error?: string, ... }` instead of throwing.
- Request-body builders and API-error-to-message mappers live in `lib/*-form.ts`, with a `*.test.ts` next to them (vitest).
- `lib/types.ts` mirrors the API JSON exactly, in snake_case. Change it together with the backend.

## Auth

- There is a single admin user: a password (bcrypt hash in env, can be disabled) and/or passkeys.
- The session is a signed HTTP-only cookie.
- `proxy.ts` guards pages, but its matcher skips `/api`. Every route handler under `app/api` must check `hasSession()` itself, except the passkey login routes, which are public by design (the `verify` step is rate-limited).

## UI

- All UI text is in Brazilian Portuguese.
- Use the color tokens in `app/globals.css` (`ink`, `muted`, `line`, `brand`, ...), not new ad-hoc colors.
- Reuse `components/ui.tsx` (`PageHeader`, `Badge`, `EmptyState`) and `ConfirmDialog` for destructive actions. Never use `window.confirm`.
- Pages are grouped by `SectionTabs` (`components/section-tab-items.ts`), and the sidebar lives in `components/app-shell.tsx`. Add new pages to both.
- Format dates with `lib/format.ts`, which uses a fixed display timezone; do not format dates by hand.
- Live updates come from `/api/events`, which proxies the backend SSE; on each event, refetch.
