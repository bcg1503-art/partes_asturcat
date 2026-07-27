# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Next.js 15 (App Router) + TypeScript + Tailwind + Supabase app for managing "partes de trabajo" (work orders/timesheets) for a construction/maintenance business. UI copy and domain terms are in Spanish (parte, obra, cliente, trabajador). Not a git repository at present.

## Commands

```bash
npm run dev            # start dev server
npm run build           # production build
npm run start           # run production build
npm run lint             # next lint
npm run apply-schema  # apply supabase/schema.sql + supabase/seeds.sql via DATABASE_URL (Postgres connection string), see scripts/apply-schema.js
```

There is no test suite configured in this repo.

### Environment

Required env vars (`.env.local`, see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Supabase clients degrade to stub objects (throwing clear errors at call time) when env vars are missing, so the app can still be statically built without them configured.

## Architecture

### Data layer split: `services/` vs `actions/`

- `services/*.ts` — client-side data access using the browser Supabase client (`lib/supabase-client.ts`, anon key). Used from client components for reads and auth (`services/auth.ts`, `services/clientes.ts`, `services/obras.ts`, `services/partes.ts`).
- `actions/*.ts` — server-side data access using the server Supabase client (`lib/supabase-server.ts`, cookie-based session, anon key + RLS). Used from Server Components / route handlers for reads and writes (`actions/auth.ts`, `actions/database.ts`, `actions/partes.ts`).
- `lib/supabase-admin.ts` — service-role client that bypasses RLS. Only used server-side in `app/api/**/route.ts` handlers (profile creation, `dev`-prefixed debug endpoints). Never expose this client to client components.

When adding a new entity, follow this same three-tier pattern rather than calling Supabase directly from components.

### Auth flow (custom cookie bridge, not the default auth-helpers cookie flow)

1. Client signs in via `supabase.auth.signInWithPassword` (browser client, `services/auth.ts` / `app/signin/page.tsx`).
2. The client then POSTs the resulting session to `app/api/auth/set-session/route.ts`, which manually sets httpOnly `sb-access-token` / `sb-refresh-token` cookies.
3. `proxy.ts` (Next.js 16's renamed `middleware.ts` convention) gates `/dashboard/:path*` and `/signin`. It checks both cookie presence and whether the access token's JWT `exp` claim has passed (`lib/jwt.ts#isAccessTokenExpired`, signature not verified — that's still enforced by Supabase/RLS) and redirects accordingly.
4. `lib/supabase-server.ts` (via `@supabase/auth-helpers-nextjs`) reads cookies in Server Components/actions to get the authenticated session.
5. `app/api/auth/clear-session/route.ts` clears both cookies on sign-out.

Sign-up (`services/auth.ts#signUpUser`) calls `supabase.auth.signUp` client-side, then POSTs to `app/api/create-profile` (service-role) to insert the row into the `users` profile table, since RLS otherwise requires an authenticated session that doesn't exist mid-signup.

### Roles & RLS

Two roles: `trabajador` and `administrador` (`types/index.ts` `UserRole`). Authorization is enforced primarily via Postgres RLS policies in `supabase/schema.sql`, not app-level checks:
- `trabajador` can only see/edit their own `partes`, and only while `estado = 'pendiente'`.
- `administrador` has full access to `clientes`, `obras`, and all `partes`.
- When adding new tables/queries, add corresponding RLS policies in `supabase/schema.sql` — don't rely solely on filtering in application code.

### Dev/debug API routes

`app/api/dev/**` (`create-parte`, `create-sample-data`, `list-db`) and `app/api/auth/create-test-user` use the service-role client with no auth guard, for local seeding/debugging only. Treat these as unsafe for production and don't extend the pattern to real feature endpoints.

### UI composition

- Page layout is composed either via `<MainShell>` (`components/layout/MainShell.tsx`, wraps `Navbar` + `Sidebar` + content) or, in a few older pages (e.g. `app/dashboard/partes/page.tsx`), by manually assembling `Navbar`/`Sidebar` inline — prefer `MainShell` for new pages. `components/navbar.tsx` and `components/sidebar.tsx` at the root are thin re-exports of `components/layout/Navbar.tsx`/`Sidebar.tsx` kept for backward-compat imports.
- `components/ui/*` are small local primitives (Button, Input, Select, Modal, Toast, etc.) styled with the `cn()` classname helper (duplicated in both `lib/utils.ts` and `utils/cn.ts` — check which one a file imports before adding a new copy).
- Path aliases are defined in `tsconfig.json` (`@/components/*`, `@/lib/*`, `@/actions/*`, `@/services/*`, `@/hooks/*`, `@/types`, `@/utils/*`, `@/styles/*`) — use these instead of relative imports.
- Dark mode uses `next-themes` (`class` strategy) wired in `app/providers.tsx`; use `useThemeMode()` (`hooks/use-theme.ts`) or `useClientMounted()` (`hooks/use-client-mounted.ts`) to avoid hydration mismatches when reading the resolved theme client-side.
- Forms use `react-hook-form` + `zod` via `@hookform/resolvers` (see `components/partes/parte-form.tsx`).

### Database schema

`supabase/schema.sql` is the source of truth for tables (`users`, `clientes`, `obras`, `partes`, `fotosparte`) and RLS policies; `supabase/seeds.sql` has sample seed data. Apply both with `npm run apply-schema` (requires `DATABASE_URL`) or by pasting into the Supabase SQL editor. Shared TypeScript types mirroring these tables live in `types/index.ts`.
