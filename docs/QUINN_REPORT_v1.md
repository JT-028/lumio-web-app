QUINN TEST REPORT — v1.0
Project: Lumio
Input: Rex Report v1.3, Alex Plan v1.0, Mason M1 (Theo API and Jules pages), Luna Review v1.0

## Test Summary
Total tests: 26
  Passing: 26
  Failing: 0
  Skipped: 0

Command: `npm test`
Runner: node:test via tsx (happy-dom for pages). Database and the Supabase auth client are mocked. No live Supabase, Resend, xAI, or Google call.

Coverage (`npm test`, V8, include `src/**/*.ts` and `src/**/*.tsx`):
  Lines: 88.74%
  Branches: 85.22%
  Functions: 92.29%
  Modules below 80% lines: src/components/role-screen.tsx (70.04%), src/lib/lumio-client.ts (72.39%)

The role screen’s save and validation branches, and the browser `postProfile` / `postSignOut` helpers, are not fully exercised. The route handlers those helpers call are covered.

## Test Results by Layer

### Unit Tests
  [PASS] .env.example lists key names and contains no secret values
  [PASS] lumio-web-app is its own git repo and sibling repos have no Lumio commits
  [PASS] the tagline is not hidden at 320px or 1280px, and reduced motion shows the wordmark

### Integration Tests
  [PASS] GET /api/me returns 500 INTERNAL when the server is not configured
  [PASS] GET /api/me without a session is 401 UNAUTHENTICATED when the server is configured
  [PASS] Google callback does not insert a profile, and the session still resolves on a second read
  [PASS] POST /api/profile accepts parent and student once
  [PASS] POST /api/profile rejects teacher and a second role with Aria's envelope
  [PASS] first name rules reject blank, 41 characters, digits, and @
  [PASS] a non-string first name is rejected
  [PASS] two Gmail addresses that share an email_key are not labeled ROLE_ALREADY_SET
  [PASS] an accented first name is stored composed
  [PASS] an unlinked student resolves to /wait, including when the guide route does not exist
  [PASS] POST /api/sign-out clears the session so the next read is 401

### E2E Tests (happy-dom page renders, not a live browser)
  [PASS] the signed-out page and the signed-in shell show Lumio and the tagline at both widths
  [PASS] M1 pages do not render an owl image or a sprite frame
  [PASS] email sign-in goes through the Supabase browser client and a wrong password is refused
  [PASS] email sign-up goes through the Supabase browser client and stays on the page
  [PASS] passwords that differ do not call the Supabase client
  [PASS] Google sign-in calls signInWithOAuth and does not leave for Google
  [PASS] the role form offers parent and student and never offers teacher
  [PASS] a student with no parent is sent to /wait from /home
  [PASS] a signed-out visitor is not shown the waiting page
  [PASS] check again on /wait stays there and says the student is still waiting
  [PASS] a parent with no child sees no child list, and the connect form does not send email
  [PASS] sign out returns to /

## Acceptance Criteria Coverage
  [✓] US-001: email and Google registration go through the Supabase browser client; a new Google callback does not insert a profile; an unlinked student resolves to /wait. A guide file is not served because `src/app/guides` is not in this milestone.
  [✓] US-002, M1 slice only: the parent home shows the connect form. Submit does not call `POST /api/invites` and does not say an email was sent. The Resend send is M2 and was not tested.
  [✓] US-006, M1 slice: an unlinked student is sent to /wait from /home and from `pathAfterSignIn`. No guide route exists, so no guide HTML is returned. Opening a linked guide is not in this milestone.
  [—] US-003 through US-005 and US-007 through US-020: M2–M7. No tests were written.

## DoD Verification
  [✓] Task 0.2 — key names only in `.env.example`; this folder is its own git repo; `grade6-reviewers` has no Lumio commit; `booklet-app` is not present. Tests: `.env.example lists key names and contains no secret values`, `lumio-web-app is its own git repo and sibling repos have no Lumio commits`.
  [—] Task 0.1 — not tested. Live Supabase, Resend, and xAI keys are still an owner setup. Blocked on the user.
  [✓] Task 1.1 — signed-out landing and signed-in shell render Lumio and “Learn. Grow. Level Up.” at 320px and 1280px. CSS does not hide `.tagline` or `.wordmark`. Reduced motion sets the wordmark opacity to 1 with no fade. Not a screenshot from a desktop browser.
  [✓] Task 1.2 — landing, role, wait, and home renders have no `img`, `svg`, owl, or sprite. Advice and tutor routes were not required.
  [✓] Task 1.3 — `signUp` and `signInWithPassword` are the calls made. A wrong password shows “That email and password do not match. Try again.” and does not navigate. Mismatched confirm passwords do not call Supabase.
  [✓] Task 1.4 — `signInWithOAuth` provider `google` with `redirectTo` `/auth/callback`. The callback exchanges the code, redirects to `/role`, and inserts no profile. The same mocked session is returned by a second `GET /api/me`. Cookies are mocked. Google is not contacted.
  [✓] Task 1.5 — the form offers only parent and student. `POST /api/profile` returns 201 for each role once, 400 `VALIDATION` for `teacher` and for a bad first name, and 409 `ROLE_ALREADY_SET` for a second role. The body is `{ error: { code, message, details } }`. A second save does not change the stored role.
  [✓] Task 1.6 — `/home` for a student with no parent calls `location.replace("/wait")` and does not show the parent home. A signed-out visitor on `/wait` is sent to `/` and does not see “Waiting for a parent”. `GET /api/me` without a session is 401 `UNAUTHENTICATED` when public env is set, and 500 `INTERNAL` (“The server is not configured.”) when env is missing. `pathAfterSignIn` for that student is `/wait`. `src/app/guides` and `content/guides` are absent, so a guide path does not serve guide bytes.
  [✓] Task 1.7 — a parent with no child sees “No child is linked yet.” and the connect form, and no child list. Submit of a Gmail does not fetch `POST /api/invites` and the status says nothing was sent.

## Findings Requiring Code Changes
None. No assertion failed.

Luna regressions that were required to stay as they are:
- Shared Gmail key (`ada@gmail.com` and `ada@googlemail.com`) returns 500 `INTERNAL`, not 409 `ROLE_ALREADY_SET`.
- NFD “José” (5 code units) is stored as NFC “José” (4 code units).

## Notes for Dep (Deployment)
- Dep is still blocked. Task 0.1 still needs the owner’s live Supabase, Resend, and xAI keys. This seat did not push or deploy.
- `npm test` is the CI command. It needs Node 24 (module mocks) and the devDependencies `tsx` and `happy-dom`. `npm run typecheck` excludes `test/` so the app check stays separate.
- Do not point this suite at a real Supabase project. The session tests fail the run if `fetch` is called.
- M2 `POST /api/invites` is still absent on purpose. Do not treat a green M1 suite as permission to send connect email.
