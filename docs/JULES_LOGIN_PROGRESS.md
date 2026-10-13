FRONTEND PROGRESS — signed-out login
Project: Lumio

## Files
- lumio-web-app/src/components/landing.tsx — signed-out `/`: cream page, white card, Lumi’s greeting cell, Google, sign in, create account
- lumio-web-app/src/app/globals.css — login-only type, color, crop, and layout. Other routes keep the morning-workbook rules
- lumio-web-app/src/fonts/baloo-2-latin-700.woff2 — Baloo 2 for the wordmark and the hero
- lumio-web-app/src/fonts/nunito-latin-400.woff2 — Nunito body
- lumio-web-app/src/fonts/nunito-latin-500.woff2 — Nunito labels
- lumio-web-app/src/fonts/nunito-latin-700.woff2 — Nunito buttons
- lumio-web-app/src/fonts/Baloo2-OFL.txt — SIL Open Font License for Baloo 2
- lumio-web-app/src/fonts/Nunito-OFL.txt — SIL Open Font License for Nunito
- lumio-web-app/src/assets/lumio_mascot.png — existing sheet, not cropped and not replaced. CSS shows row 1, column 1
- lumio-web-app/test/m1-shell.test.tsx — landing copy and Lumi alt. `/role`, `/wait`, and `/home` still have no image
- lumio-web-app/docs/JULES_LOGIN_PROGRESS.md — this note

No edits to `src/app/api/**`, `src/app/auth/**`, `src/services/**`, `src/data/**`, `src/domain/**`, `src/middleware.ts`, or `supabase/migrations/**`. `/role`, `/wait`, `/home`, and `/connect` were not restyled. Milestone 2 was not built.

## Screens done
- `/` — states covered: session check paints cream, Lumio, both lines, and Lumi, with no fields; blank sign-in; blank create account; wrong password; email not confirmed; passwords differ; email already registered; rejected password; Google waiting; Google did not finish; other sign-in failure; check-email success; session redirect. No password reset. No fade.

Both lines on the card: “Your little guide to big ideas.” and “Learn. Grow. Level Up.” Lumi’s line is real text under the greeting pose.

## API dependencies
- GET /api/me — used by `/` to leave the page. No profile → `/role`, student → `/wait`, parent → `/home`
- Supabase `signInWithPassword` — used by `/` sign-in. No Lumio password table
- Supabase `signUp` — used by `/` create account. Confirm password is client-only
- Supabase `signInWithOAuth` provider `google`, `redirectTo` `/auth/callback` — used by Continue with Google. No role is sent
- POST /api/invites — not called
- POST /api/profile — not called
- POST /api/sign-out — not called
- No password-reset route — not called

## Blockers
- None on this page. Password reset stays unbuilt because Aria has no route for it. Needs: nothing

## Ready for
- [ ] Luna

`npm run typecheck` passed. `npm test` passed (26 tests). No production deploy and no git push.
