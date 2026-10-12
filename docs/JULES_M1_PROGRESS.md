FRONTEND PROGRESS — M1
Project: Lumio

## Files
- lumio-web-app/src/app/layout.tsx — root layout and self-hosted font variables
- lumio-web-app/src/app/globals.css — paper, ink, accent, notebook rule, gold underline, focus, reduced motion
- lumio-web-app/src/app/page.tsx — signed-out `/`
- lumio-web-app/src/app/role/page.tsx — `/role`
- lumio-web-app/src/app/wait/page.tsx — `/wait`
- lumio-web-app/src/app/home/page.tsx — `/home`
- lumio-web-app/src/components/shell.tsx — Lumio, tagline, sign out
- lumio-web-app/src/components/landing.tsx — Google, sign in, create account
- lumio-web-app/src/components/account-gate.tsx — signed-in redirects
- lumio-web-app/src/components/role-screen.tsx — role form
- lumio-web-app/src/components/wait-screen.tsx — unlinked student wait
- lumio-web-app/src/components/home-screen.tsx — empty parent home and connect fields
- lumio-web-app/src/lib/fonts.ts — Fraunces and Atkinson Hyperlegible
- lumio-web-app/src/lib/supabase/browser.ts — browser Supabase client for email and Google
- lumio-web-app/src/lib/lumio-client.ts — GET /api/me, POST /api/profile, POST /api/sign-out
- lumio-web-app/src/lib/form-checks.ts — client checks for email, first name, and child Gmail
- lumio-web-app/src/lib/auth-errors.ts — maps Supabase failures without showing the provider body
- lumio-web-app/src/fonts/ — self-hosted WOFF2 files and OFL licenses

No edits to `src/app/api/**`, `src/app/auth/**`, `src/services/**`, `src/data/**`, `src/domain/**`, `src/middleware.ts`, or `supabase/migrations/**`.

## Screens done
- `/` — states covered: session check with wordmark and tagline and no form, blank sign-in, blank create account, wrong password, email not confirmed, passwords differ, email already registered, rejected password, Google waiting, Google did not finish, other sign-in failure, check-email success, session redirect
- `/role` — states covered: skeleton until GET /api/me, redirect when a role exists, empty form, missing role, blank name, length, bad characters, 400 validation on the field or above the button, 409 with the editor removed, other save failure, parent to `/home`, student to `/wait`, saved but the next page did not open
- `/wait` — states covered: skeleton, empty wait, check failed, still waiting, redirect when the account is no longer an unlinked student
- `/home` — states covered: skeleton, empty parent state, blank Gmail, non-Gmail, connect email unavailable. No send success, no token, no link
- Sign out on `/role`, `/wait`, and `/home` — 204 goes to `/`; other failures stay with “Sign-out did not finish. Try again.”

Tagline “Learn. Grow. Level Up.” is on all four pages. `prefers-reduced-motion` turns the wordmark fade off.

## API dependencies
- GET /api/me — used by `/`, `/role`, `/wait`, and `/home`
- POST /api/profile — used by `/role`
- POST /api/sign-out — used by `/role`, `/wait`, and `/home`
- Supabase `signInWithPassword` and `signUp` — used by `/` only. No Lumio password table and no Lumio sign-in route
- Supabase `signInWithOAuth` provider `google`, `redirectTo` `/auth/callback` — used by `/`. The callback route was not changed
- GET /api/home — not called
- POST /api/invites — not called

## Blockers
- Connect email cannot be sent. Theo did not build POST /api/invites or GET /api/home. `/home` still shows the empty line and the connect fields. Submit does not call a route and does not say an email was sent. Status: “Connect email is not available in this milestone. Nothing was sent.” Greeting uses `first_name` from GET /api/me. Needs: backend developer
- A student with `has_main_parent` stays on `/wait`. Theo’s `pathAfterSignIn` sends every student to `/wait`, and `/home` sends a student back, so Check again does not open `/home` for a student. Needs: backend developer, when a household can exist, plus a routing decision that does not loop
- Public Supabase env is still empty in git, so a live account cannot be created until those values exist. Needs: user

## Ready for
- [x] Luna

`npm run typecheck` passed. `next build` passed. No production deploy and no git push.
