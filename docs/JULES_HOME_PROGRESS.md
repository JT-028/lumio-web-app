FRONTEND PROGRESS — home and login
Project: Lumio

## Files
- lumio-web-app/src/components/landing.tsx — `/` uses the prototype layout with real sign-in, create account, and Google
- lumio-web-app/src/components/wait-screen.tsx — `/wait` keeps the waiting copy on the cream theme, with the hero still
- lumio-web-app/src/components/student-home.tsx — linked-student `/home` only
- lumio-web-app/src/components/home-screen.tsx — parent child line and connect form, or the student dashboard
- lumio-web-app/src/components/role-screen.tsx — same fields; blank name still stays on `/role`
- lumio-web-app/src/components/shell.tsx — shared sign-out for the shell and the student home
- lumio-web-app/src/app/globals.css — cream, navy, Baloo 2, and Nunito for the shell, login, wait, and student home
- lumio-web-app/src/app/layout.tsx — pages use the self-hosted Baloo 2 and Nunito faces
- lumio-web-app/src/lib/lumio-client.ts — linked students open `/home`; parent connect posts `{ invited_email }`
- lumio-web-app/src/assets/lumi-hero.png — copied from the login prototype. `lumio_mascot.png` is unchanged
- lumio-web-app/test/m1-shell.test.tsx — landing, wait, student home, and connect-send copy
- lumio-web-app/docs/JULES_HOME_PROGRESS.md — this note

No edits to `src/app/api/**`, `src/app/auth/**`, `src/services/**`, `src/data/**`, `src/domain/**`, `src/middleware.ts`, or `supabase/migrations/**`. No new API route.

## What each route shows
- `/` — cream page, navy type, one gold star and the Level Up underline. Header: Lumio, Learn. Grow. Level Up., and Create account. Wide: hero beside the card. Narrow: hero above the card. Hero file is Lumi with the storybook. Card: Sign in or Create account. Email is an email field. Confirm password, Parent or Student, and first name are on Create account only. Sign in shows Remember me and Forgot password. Remember me is not stored. Forgot password says “Password reset is not available yet.” and calls no route. Continue with Google stays. Error sentences already in the app stay.
- `/role` — same parent or student choice, first name, and Save and continue. Chrome is cream, navy, Baloo 2, and Nunito. No new owl.
- `/wait` — Waiting for a parent, the waiting sentence, Check again, and Sign out. A still hero sits above the heading. Check again calls GET /api/me. A student with `has_main_parent` true goes to `/home`. The student dashboard is not on this page.
- `/home`, parent — Home, Hello, {first_name}., No child is linked yet., and the connect form. Submit calls the existing POST /api/invites with `{ invited_email }`. Success is one line: Connect email sent to {invited_email}. No id, expiry, token, or URL. Failure sentences do not print a link.
- `/home`, linked student — left rail at 1280px (Lumio, tagline, Home, first name, Sign out) and a bottom Home bar at 320px. Greeting Hello, {first_name}. Lumi’s greeting cell from `lumio_mascot.png`. Continue learning and Today’s study stay empty: “Your next guide is not on this page yet.” and “No study time yet.” Four courses with both quarters, and six study sections, as text, not links. No XP, streak, friends, leaderboard, or upgrade.

## Screens done
- `/` — states covered: session check with no fields; blank sign-in; blank create account with role and first name; wrong password; passwords differ; email confirmation with no profile post; session plus one POST /api/profile; existing profile is not posted again; Google without a role; forgot password with no route; remember me without a saved session
- `/role` — states covered: same form and errors; cream chrome
- `/wait` — states covered: waiting copy; still waiting; linked student leaves for `/home`; signed-out visitor leaves for `/`
- `/home` — states covered: parent empty list and connect success or failure line; unlinked student never sees the dashboard; linked student sees the fixed regions at 320px and 1280px

## API dependencies
- GET /api/me — used by `/`, `/role`, `/wait`, and `/home`
- Supabase `signInWithPassword` — `/` sign-in. Remember me is not sent
- Supabase `signUp` — `/` create account. Confirm password, role, and first name are not Supabase fields
- Supabase `signInWithOAuth` provider `google`, `redirectTo` `/auth/callback` — no role is sent
- POST /api/profile — once, after create account, only when a session exists and GET /api/me has no role yet. Body is `{ first_name, role }`
- POST /api/invites — parent `/home` only, body `{ invited_email }`. Not called from student pages
- POST /api/sign-out — Sign out, then `/`
- GET /api/home — not called
- No password-reset route — not called
- No new route

## Blockers
- Parent `/home` still has no child names. GET /api/home is not in this client. Needs: backend developer, when that read exists
- Google callback still uses the server path, which sends every student to `/wait`. Check again, or a later GET /api/me, sends a linked student to `/home`. Needs: nothing on this pass

## Ready for
- [ ] Luna

`npm run typecheck` passed. `npm test` passed (31 tests). No production deploy and no git push.
