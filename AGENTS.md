<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

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
