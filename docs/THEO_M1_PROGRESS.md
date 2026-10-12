BACKEND PROGRESS — M1
Project: Lumio

## Files
- lumio-web-app/package.json — Next.js app, dev port 3010, pinned dependencies
- lumio-web-app/package-lock.json — locked install
- lumio-web-app/tsconfig.json — strict TypeScript
- lumio-web-app/next.config.ts — traces this app, not the parent portfolio folder
- lumio-web-app/next-env.d.ts — Next.js types
- lumio-web-app/.gitignore — ignores .env, .env.local, .env*.local, node_modules, and .next
- lumio-web-app/.env.example — key names only, empty values
- lumio-web-app/supabase/migrations/20261012120000_profiles.sql — profiles table only
- lumio-web-app/src/middleware.ts — refreshes the Supabase session cookie
- lumio-web-app/src/lib/env.ts — reads public and secret env and fails closed
- lumio-web-app/src/lib/logger.ts — one JSON line per request, no email, token, or cookie
- lumio-web-app/src/lib/http.ts — success JSON and the shared error envelope
- lumio-web-app/src/lib/supabase/public-config.ts — Supabase URL, publishable or anon key, app origin
- lumio-web-app/src/lib/supabase/cookie-options.ts — httpOnly, SameSite=Lax, Secure on HTTPS
- lumio-web-app/src/lib/supabase/cookie-client.ts — cookie session client
- lumio-web-app/src/lib/supabase/server.ts — session client for route handlers
- lumio-web-app/src/lib/supabase/admin.ts — secret-key client, server only
- lumio-web-app/src/data/db.ts — service-role door
- lumio-web-app/src/data/profiles.ts — profile read and insert
- lumio-web-app/src/domain/types.ts — session and me types
- lumio-web-app/src/domain/name.ts — first-name rule
- lumio-web-app/src/domain/role.ts — parent or student only
- lumio-web-app/src/domain/email-key.ts — lowercase email and Gmail canonical key
- lumio-web-app/src/services/errors.ts — AppError and the envelope mapper
- lumio-web-app/src/services/authz.ts — require a session, or end it
- lumio-web-app/src/services/profile.ts — me, create profile, callback path
- lumio-web-app/src/app/api/me/route.ts — GET /api/me
- lumio-web-app/src/app/api/profile/route.ts — POST /api/profile
- lumio-web-app/src/app/api/sign-out/route.ts — POST /api/sign-out
- lumio-web-app/src/app/auth/callback/route.ts — GET /auth/callback

No page.tsx, layout, CSS, or Iris copy was added.

## Endpoints
- GET /api/me — auth: user — DoD: a session returns `{ id, role, first_name, email, has_main_parent }`; no profile yet means role and first_name are null; a missing session is 401 UNAUTHENTICATED.
- POST /api/profile — auth: user, no profile yet — DoD: `{ first_name, role }` inserts once and returns 201 in the same shape as /api/me; a bad name, teacher, or any other role is 400 VALIDATION; an existing profile is 409 ROLE_ALREADY_SET and role and email are not updated.
- POST /api/sign-out — auth: user — DoD: a session returns 204 and the cookies are cleared; a missing session is 401 UNAUTHENTICATED.
- GET /auth/callback — auth: OAuth code — DoD: the code is exchanged, cookies are set, and the browser is redirected; no profile goes to /role; a student goes to /wait; a parent goes to /home; no profile row is inserted.

Every JSON error is `{ "error": { "code", "message", "details" } }`. `details` is null or `{ "field" }`. Responses send `Cache-Control: private, no-store`.

## Schema
- profiles only — migration: yes. `id` equals `auth.users.id`. `role` is null until set, then parent or student only. `first_name` is 1–40 letters, spaces, hyphen, or apostrophe, and rejects `@`. `email` is lowercase. `email_key` is the Gmail canonical key for Gmail, otherwise the lowercase address. Unique email and unique email_key. `created_at` is required. A trigger rejects updates to role, email, email_key, id, and created_at. RLS is on with no policies. anon and authenticated have no grants. The service role may select and insert only.
- households was not created. `has_main_parent` is false on every M1 response because that table does not exist yet.

## Blockers
- Supabase URL, publishable key, and secret key are empty in git, and this migration is not applied — needs: user, before a live demo
- Browser sign-in helpers are not in this milestone — needs: frontend, for Google and password sign-in
- /role, /wait, and /home are redirect targets only — needs: frontend; no page was built
- Next.js is pinned to 15.5.27 so `src/middleware.ts` still runs. Next 16 renamed that file to `proxy.ts` — needs: Aria, only if the app should move to Next 16

## Ready for
- [x] Frontend developer (contract is stable)
- [x] Luna

`npm run typecheck` passed. `next build` passed. No production deploy and no git push.
