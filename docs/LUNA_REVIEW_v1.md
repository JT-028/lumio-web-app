LUNA REVIEW — v1.0
Project: Lumio
Input: Mason Progress M1 (Theo API and Jules pages), Aria Blueprint v1, Iris M1, Alex M1

## Summary
0 CRITICAL, 0 HIGH, 1 MED, 2 LOW findings.
Overall status: PASS WITH CONDITIONS

## Findings

### MED — Shared Gmail key returns 500
File: src/services/profile.ts, Line: 87
Issue: `email_key` is unique. `a@gmail.com` and `a@googlemail.com` produce the same key. The second account's insert hits that unique index. The row belongs to the other user, so the reread by id finds nothing and the route returns 500 `INTERNAL`.
Risk: That person cannot save a role. Retrying shows "Your role could not be saved. Try again." and never succeeds.
Fix: Leave it. Aria has no code for "this Gmail key is already used by someone else." Do not map it to `ROLE_ALREADY_SET`. That code means this account already chose a role.

### LOW — Connect form does not send
File: src/components/home-screen.tsx, Line: 42
Issue: Iris says the button posts `{ invited_email }` to `POST /api/invites`. Theo did not build that route. A valid Gmail sets the status to "Connect email is not available in this milestone. Nothing was sent." and does not call the network.
Risk: A parent cannot send a connect email in M1. The page does not claim that a message was sent, and it does not show a token or a link.
Fix: Leave it. Do not add `POST /api/invites` in this review. That route is M2.

### LOW — Students always stay on /wait
File: src/lib/lumio-client.ts, Line: 15
Issue: Iris sends a student with `has_main_parent` true to `/home`. `pathForAccount` sends every student to `/wait`. `pathAfterSignIn` in `src/services/profile.ts` line 96 does the same. `has_main_parent` is always false because the households table does not exist.
Risk: None in M1. When a household can exist, a linked student stays on `/wait` unless both functions change together. Sending the student to `/home` now would bounce them back.
Fix: Leave it until households exist.

## Blueprint Conformance
- [✓] M1 URLs are `/`, `/role`, `/wait`, `/home`, `GET /api/me`, `POST /api/profile`, `POST /api/sign-out`, and `GET /auth/callback`.
- [✓] `GET /api/me` and `POST /api/profile` return `{ id, role, first_name, email, has_main_parent }`. Profile create returns 201. An existing profile returns 409 `ROLE_ALREADY_SET`. `teacher` is 400 `VALIDATION`.
- [✓] `POST /api/sign-out` returns 204 for a session and 401 `UNAUTHENTICATED` without one. JSON errors use `{ error: { code, message, details } }`. Authenticated responses send `Cache-Control: private, no-store`.
- [✓] Google callback exchanges the code and does not insert a profile. No profile goes to `/role`, a student goes to `/wait`, and a parent goes to `/home`.
- [✓] `profiles` is the only table. RLS is on, anon and authenticated have no grants, and the service role may select and insert only. Role, email, email_key, id, and created_at cannot be updated.
- [✓] `has_main_parent` is false on every M1 response.
- [✓] Pages call only Theo's routes plus the Supabase browser SDK for email, password, and Google. No password table.
- [✓] Framing is denied with `frame-ancestors 'none'` and `X-Frame-Options: DENY`.
- [✗] `POST /api/invites` is not called. Accepted for M1. See the LOW finding.
- [✗] A student path ignores `has_main_parent`. Accepted until households exist. See the LOW finding.
- [✓] Signed-in pages are `src/app/role`, `src/app/wait`, and `src/app/home`, not an `(app)` route group. The URLs match. `AccountGate` performs the redirects in the browser.

## Checklist Verification
- [✗] 0.1 DoD not met. Supabase, Resend, and xAI keys are still empty. Blocked on the user. Not a code defect.
- [✓] 0.2 This folder is its own git repo. The commit does not include `.env`. Sibling repos were not modified by this review.
- [✓] 1.1 The shell renders Lumio and "Learn. Grow. Level Up." Viewport widths were not opened in a browser.
- [✓] 1.2 M1 pages have no sprite and no image.
- [✗] 1.3 Code calls `signInWithPassword` and `signUp`. A live wrong-password check was not run. Quinn test.
- [✗] 1.4 Code calls `signInWithOAuth` and `GET /auth/callback`. A live Google return was not run. Quinn test.
- [✓] 1.5 The role form offers parent or student only. The word teacher is not in the UI. The server rejects any other role.
- [✗] 1.6 `/wait` is the unlinked student page, and `/role` and `/home` redirect in the browser. A guide URL 404s because no guide route exists. No guide file is served. Do not add that route in M1.
- [✓] 1.7 The parent home shows "No child is linked yet." and the connect fields. The send itself is the accepted M1 limit above.

## Plugin Gate
- ponytail-review verdict: Ship
- thermos: no open criticals
- pstack skills applied: poteto-mode, principle-laziness-protocol, principle-subtract-before-you-add, principle-minimize-reader-load, principle-fix-root-causes, principle-prove-it-works, principle-sequence-verifiable-units, principle-type-system-discipline, typescript-best-practices, no-comments, unslop, technical-writing
- optimizations applied: src/domain/name.ts, src/lib/form-checks.ts, src/components/role-screen.tsx, next.config.ts
- local commit: 4129d75a7fd31cee7b44c52cb115950a4e0e8b24
- push / prod: BLOCKED until Quinn PASS and this gate is PASS

## Handoff Recommendation
- Ready for Quinn (QA): yes
- Ready for Dep (Deployment): no. Push and production stay blocked until this gate is PASS and Quinn has passed.

## Notes for Quinn (QA)
- `npm run typecheck` passed. There is no test suite. This gate stays PASS WITH CONDITIONS until you cover the flows.
- A node check composed NFD "José" (5 code units, including U+0301) into NFC "José" (4 code units) and rejected blank, `@`, 41 characters, hyphens only, and a non-string. Postgres was not running, so the SQL check was not executed.
- Supabase URL and keys in git are empty. Do not expect a live account until those exist. Do not print `.env`.
- The connect button must not call `POST /api/invites` and must not say an email was sent.
- `has_main_parent` cannot be true yet. Check again on `/wait` should stay on the page and show "Still waiting for a parent."
- Confirm sign-out returns to `/` and a refresh does not restore the session.
- Confirm the tagline at 320px and at 1280px, and that reduced motion shows the wordmark without a fade.
- No shortcut debt in this change.
