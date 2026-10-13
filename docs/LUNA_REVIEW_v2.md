LUNA REVIEW — v1.0
Project: Lumio
Input: UI since Luna v1 (login, wait, role chrome, parent home, linked-student home), Iris M1, Iris M2, Iris student home, login prototype

## Summary
0 CRITICAL, 0 HIGH, 0 MED, 2 LOW findings.
Overall status: PASS WITH CONDITIONS

The wide student rail laid Lumio and the tagline on one row. That is fixed in the local commit below. The other screens match the checks for this pass. Push and production stay blocked.

## Findings

### LOW — Parent home does not list children
File: src/components/home-screen.tsx, Line: 76
Issue: Parent /home always shows "No child is linked yet." and the connect form. It does not render `children[].first_name`. Nothing in the client calls `GET /api/home`.
Risk: None today. No route returns linked children, so the empty line is the only true state. After that read exists, a parent with a child would still see the empty line.
Fix: Leave it. Do not add `GET /api/home` in this review. Theo builds that read later. Do not invent a child after a 201.

### LOW — Google return still sends every student to /wait
File: src/services/profile.ts, Line: 96
Issue: `pathAfterSignIn` sends every student to `/wait`. `has_main_parent` on `GET /api/me` is still the constant false. The browser helper `pathForAccount` would send a linked student to `/home`.
Risk: None until a household can set the flag. A student with no main parent stays on `/wait`. Check again calls `GET /api/me` and leaves for `/home` only when the flag is true. The student dashboard is not painted on `/wait`.
Fix: Leave the server path. Do not add households here.

## Blueprint Conformance
- [✓] `/` keeps Google `signInWithOAuth`, email `signInWithPassword`, and `signUp`. Google sends no role. A session with no profile still goes to `/role`. `/role` is still in the app.
- [✓] The owner replaced "Google is the only navy button" with the login prototype. Sign in and Create account use the navy button. Continue with Google stays white. That was not reverted.
- [✓] Create account collects Parent or Student and a first name. When sign-up returns a session and `GET /api/me` has no role, the page calls `POST /api/profile` once with `{ first_name, role }`. An existing profile is not posted again. Email confirmation with no session does not post, stays on `/`, and shows the check-email line.
- [✓] Forgot password shows "Password reset is not available yet." and does not call a route. Remember me is not sent and does not say a session was saved.
- [✓] `/wait` keeps the Milestone 1 waiting copy. Check again calls `GET /api/me`, not `POST /api/invites` and not `GET /api/home`. An unlinked student stays. A linked flag sends the student to `/home` without painting the dashboard on the way.
- [✓] Parent `/home` posts `{ invited_email }` only to `POST /api/invites`. Success is one line with that address. The page does not show an id, an expiry, a token, or a URL. Blank and non-Gmail do not post.
- [✓] Linked-student `/home` reads `GET /api/me` only. Courses and study sections are text, not links. Today's study says "No study time yet." The page has no XP, streak, friends, leaderboard, or paywall.
- [✓] `/role` chrome is cream `#FFF9EF`, navy `#172B4D`, Baloo 2, and Nunito. The role fields and `POST /api/profile` body are unchanged.
- [✗] Parent child names need `GET /api/home`. Accepted for this pass. See the LOW finding.
- [✗] A live linked student cannot appear until `has_main_parent` can be true. Accepted. See the LOW finding.

## Checklist Verification
- [✓] Signed-out `/` can use Google or email, and create account can save a role once.
- [✓] A student with no main parent stays on `/wait`. The dashboard is not on that page.
- [✓] Parent `/home` is the empty child line and the connect form. The send body is `{ invited_email }` only.
- [✓] Linked-student `/home` shows the greeting, Lumi's greeting cell, the two empty sentences, four courses with both quarters, and six study sections.
- [✓] `/role` remains, and a Google user with no profile still lands there.
- [✓] `npm run typecheck` passed. `npm test` passed, 31 tests, 0 failed.

## Plugin Gate
- ponytail-review verdict: Ship
- thermos: no open criticals. Unused login selectors were deleted instead of splitting the stylesheet.
- pstack skills applied: poteto-mode, principle-laziness-protocol, principle-subtract-before-you-add, principle-minimize-reader-load, principle-fix-root-causes, principle-prove-it-works, principle-sequence-verifiable-units, principle-type-system-discipline, typescript-best-practices, no-comments, unslop, technical-writing
- optimizations applied: src/app/globals.css. The wide rail brand stacks. Dead `.modes`, `.button-mode`, `.show-password`, `.text-button`, and `.login-secondary` rules are gone. One false font comment is gone. Net about 67 lines removed.
- shortcut debt: No shortcut debt. Clean ledger.
- no-comments: 1 false comment deleted. 0 restored. The remember-me note, the Lumi crop note, and the empty sign-out catch stay because each states a constraint the code does not show.
- local commit: 446761d422a66cc7436ddf6f518fa583f25a52be
- push / prod: BLOCKED until Quinn PASS and this gate is PASS

## Handoff Recommendation
- Ready for Quinn (QA): yes
- Ready for Dep (Deployment): no. Push and production stay blocked until this gate is PASS and Quinn has passed.

## Notes for Quinn (QA)
- Run `npm run typecheck` and `npm test` on commit 446761d422a66cc7436ddf6f518fa583f25a52be.
- At 1280px the student rail brand is a column. Lumio is above "Learn. Grow. Level Up." At 320px the top bar shows that pair, and the rail brand is hidden.
- Create account with a session posts `{ first_name, role }` once. Create account with no session does not post. Forgot password must not call a route.
- Parent connect must not show a token or a URL. Student pages must not call `POST /api/invites` or `GET /api/home`.
- Do not expect linked child names until `GET /api/home` exists. Do not expect `has_main_parent` true until households exist.
