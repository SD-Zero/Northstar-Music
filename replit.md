# Auralis Music Player

A private, offline-first music player that keeps songs, playlists, artwork, and listening preferences on the user's device.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/auralis/src/App.tsx` — player, library panel, local playlist management, and import interactions
- `artifacts/auralis/src/index.css` — Auralis visual theme, responsive layout, and motion styling
- `attached_assets/` — original product brief and uploaded source material

## Architecture decisions

- Music data and preferences are stored locally in the browser; the first build intentionally has no accounts, cloud sync, or remote music service.
- Seeded sample tracks provide an immediately useful player experience while imported audio uses browser-local object URLs.
- The now-playing screen owns the primary experience; the library is a slide-out surface so it does not compete with listening.

## Product

Auralis provides a tablet-first now-playing experience with a layered album carousel, simulated playback for seeded tracks, browser playback for imported local audio, playlists, search, sort, favorites, queue navigation, and local persistence.

## User preferences

- Main accent color: bright teal.

## Gotchas

- Keep the app local-only unless the user explicitly changes the privacy/offline requirement.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
