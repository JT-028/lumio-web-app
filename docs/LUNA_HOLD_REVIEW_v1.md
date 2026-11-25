# Luna hold review v1

Date: 2026-11-25. Project: Lumio. Branch `feat/lumio-m1-shell`.
Scope: commit `314997b` (the unreviewed auth-recovery rewrite, already on origin) plus the uncommitted fixes on top of it from Aria, Theo, and Quinn.
Contract: `docs/ARIA_AUTH_DECISIONS_v1.md`, including its "Theo notes" section.

## Summary

0 CRITICAL, 0 HIGH, 0 MED, 5 LOW findings.
Overall status: **PASS**.

The fixes match Aria's contract. The new tests fail against the `314997b` source and pass against the fixed source. Tests, both typechecks, the production build, and the production dependency audit are clean. Every finding is LOW and none blocks Quinn.

## What this change does

`314997b` moves every sign-in path onto one server-held session. It adds sealed state cookies, CSRF on every write, OAuth nonce and PKCE checks, and staged email links.

The fixes on top close four audit items.

- A1. `parseProfile` in `src/data/profiles.ts` reads a null-role row as "no role chosen". `GET /api/me` returns it, routing sends it to `/role`, and `POST /api/profile` answers 409 `ROLE_ALREADY_SET`. No write path or migration was added.
- B1. Only an identity rejection clears auth cookies. `isTransientAuthError` in `src/services/auth.ts` is the single rule. `currentIdentity`, `userFromClient`, and `requireUser` use it. On a transient failure, middleware sends account and auth pages to `/resting` with a 303 and keeps every cookie, including SDK rotations. API routes keep their JSON 503 or 429.
- C2. An authenticated `GET /api/auth/context` re-seals `lumio_auth_v1` with a fresh 7-day expiry. The marker no longer ends an active session 7 days after sign-in.
- A3. `next` is pinned to exactly 15.5.29, and the lockfile agrees for every `@next/*` package.

## Findings

### LOW. `/resting` copy differs from the contract sentence

File: `src/app/resting/page.tsx`, line 11.
Issue: Aria asked for one sentence that says sign-in is temporarily unavailable. The page says "Lumio is taking a short rest. Please try again in a moment."
Risk: A user may not connect the page to sign-in. The page is a placeholder that Jules replaces from an Iris spec.
Fix: None now. Copy belongs to Iris and Jules.

### LOW. Dead server helpers left by `314997b`

Files: `src/services/authz.ts:41` (`endSession`, no callers), `src/lib/supabase/cookie-options.ts:41` (`applyAuthCacheHeaders`, test callers only), `src/services/profile.ts:89` (`pathAfterSignIn`, test callers only).
Issue: The rewrite moved sign-out to `handleAuth` and the OAuth callback to `handleOAuthCallback`, so these helpers lost their last app caller.
Risk: A reader may think they are live paths.
Fix: Add them to the C1 cleanup. Delete each helper together with its test.

### LOW. Repeated cleanup in `handleOAuthCallback`

File: `src/services/auth.ts:354-357`.
Issue: The `finally` block clears the OAuth state and PKCE cookies. Every path then calls `finish()`, which clears the same cookies again.
Risk: None at runtime. A reader has to check that the two blocks agree.
Fix: Delete the `finally` block during the B3 readability pass.

### LOW. happy-dom advisory accepted as a test-only risk

Package: `happy-dom` 20.10.6, a devDependency.
Issue: `npm audit` reports one high entry that covers three advisories. The newest 20.x release, 20.14.6, fixes only the moderate cookie-scope advisory (GHSA-5fpq-26gf-qwcr). GHSA-834v-8h66-3h79 affects versions up to 21.0.3, and GHSA-c8p4-j97h-3vg8 affects versions up to 20.14.6. Only 21.0.4, a major release, fixes all three.
Risk: The advisories need happy-dom to parse untrusted HTML. Lumio's tests parse only markup that the repo renders. The package is not in the production bundle, and `npm audit --omit=dev` reports 0 vulnerabilities.
Fix: No patch or minor release clears the high entry, so no bump was made. Move to happy-dom 21 in a separate test-tooling change with a full test run.

### LOW. The `314997b` commit message does not describe the commit

Commit: `314997b`.
Issue: The message says "Add comprehensive tests for authentication recovery UI and legacy auth writer". The commit rewrites auth across 79 files and also commits two test output logs.
Risk: A reader searching history for the auth rewrite will not find it by its message.
Fix: The commit is on origin and is not rewritten. This review and the follow-up commit body record what it contains. The follow-up commit deletes the two logs and adds `*.log` to `.gitignore`, so test output cannot be committed again.

## Known open items, confirmed non-blocking

- B2. Middleware and route handlers each call `getUser`, so an account page makes more than one provider call. The cost is latency, not correctness.
- B3. `operation()` in `src/services/auth.ts` and `src/components/auth-screen.tsx` stay hard to read. The UI redesign rewrites `auth-screen.tsx`. The repeated OAuth cleanup above joins this item.
- C1. Dead code. The UI redesign removes `fonts.ts` and the dead CSS. The three server helpers above join this item.
- C3. The duplicate invite origin check and the rate-limit race are unchanged.
- C4. The `npm test` script uses cmd syntax (`set X=...&&`), so it runs only on Windows. A Linux CI job fails until Dep or Quinn makes the script portable.

## Blueprint conformance

Each line checks an item from "Notes for Luna" in `ARIA_AUTH_DECISIONS_v1.md`.

- [x] No new migration. `profiles` still grants only `select, insert` to `service_role` (`supabase/migrations/20261012120000_profiles.sql:77`). A search of `src` and `supabase` finds no `.update(` on profiles and no `grant update`.
- [x] Every cookie clear sits on an identity branch. The middleware `catch` and the missing-config branch no longer clear. `currentIdentity` clears only when the provider rejects the identity or `verifiedIdentity` rejects the user. `requireUser` skips the clear for an `AppError` with status 429 or 503.
- [x] The marker is renewed only in the context operation, after `migrate()` and a non-null `currentIdentity`. A middleware test asserts that middleware never sets `lumio_auth_v1`.
- [x] `/resting` is a static page (`○` in the build output) with no auth, data, or user content. Middleware returns early for it, so it makes no provider call.
- [x] The `/resting` redirect is a fixed path with no query or return parameter. Theo's deviation from a relative `Location` is required. Next 15.5.29 parses the middleware `Location` with `new NextURL(location)` and no base (`node_modules/next/dist/server/web/adapter.js:344`), and a direct call with `/resting` throws `ERR_INVALID_URL`. The absolute URL comes from the request, so it also works when app config is broken. A spoofed `Host` header changes only the attacker's own response, and that response carries `Cache-Control: private, no-store`.
- [x] Status 0, a missing status, and `AuthRetryableFetchError` never become 401 or signed out. Middleware and `/api/me` tests cover each one.
- [x] Tests changed expectations. None were deleted or skipped. The run reports 0 skipped and 0 todo.
- [x] `next` is pinned to exactly 15.5.29, and the lockfile agrees.
- [x] `POST /api/auth/refresh` and `POST /api/auth/cancel` are unchanged.
- [ ] The `/resting` copy differs from the contract sentence. See the first LOW finding.

The fixture change in `test/m1-profile.test.ts` and `test/m2-connect.test.ts` follows Theo's note. The real SDK returns `AuthSessionMissingError` with status 400. The installed `@supabase/auth-js` 2.117.3 sets that status in `node_modules/@supabase/auth-js/dist/main/lib/errors.js:117`, so the fixtures now match the SDK.

## Evidence

Every command ran on Windows with Node v26.12.1, after Luna's two edits.

| Check | Command | Result |
| --- | --- | --- |
| Tests | `npm test` | 267 of 267 pass, 0 skipped, 0 todo |
| App types | `npx tsc --noEmit` | exit 0 |
| Test types | `npx tsc --noEmit -p test/tsconfig.json` | exit 0 |
| Build | `npx next build` | exit 0, `/resting` prerendered as static |
| Production audit | `npm audit --omit=dev` | 0 vulnerabilities |
| Full audit | `npm audit` | 1 high (happy-dom, dev only, accepted above) |

The new tests prove the fixes. Luna put the `314997b` versions of the four fixed source files back in place and ran the four affected test files. 29 of 109 tests failed. The failures include the A1 null-role test, every B1 outage and identity-rejection test, both C2 marker tests, and the two M2 tests that Aria named. Luna then restored the fixed files, and a SHA-256 check confirmed each one matched its saved copy byte for byte.

## Plugin gate

- ponytail-review verdict: Ship.
- ponytail-debt: 0 `shortcut:` or `ponytail:` markers in the combined diff.
- thermos: The skill launches `thermo-nuclear-review-subagent` and `thermo-nuclear-code-quality-review-subagent`. Neither agent type exists in this environment, so Luna ran both passes inline from their SKILL.md prompts. Neither pass found a critical issue. No file passes 1,000 lines (`src/services/auth.ts` has 359), and the change adds one flag (`resting`) to middleware, not scattered special cases.
- pstack: `poteto-mode` with the bug-fix playbook. Its step 5 asks for the failing test in an earlier commit than the fix. That step was skipped because the squad brief asks for one commit, and the failing-before run above stands in for it. Luna also applied `principle-laziness-protocol`, `principle-subtract-before-you-add`, `principle-minimize-reader-load`, `principle-fix-root-causes`, `principle-prove-it-works`, `principle-sequence-verifiable-units`, `principle-test-behavior-not-implementation`, `principle-type-system-discipline`, `typescript-best-practices`, `tdd`, `blast-radius`, `unslop`, and `technical-writing`.
- no-comments: The Comment Sicko agent is not available, so Luna did the pass inline. One comment changed. The `/resting` comment now states why the page must stay static. Before, it was a note about who replaces the page.
- Optimizations applied by Luna: `src/app/resting/page.tsx` (comment only) and `.gitignore` (`*.log`).
- Local commit: made on `feat/lumio-m1-shell` after this review. `git log -1` shows the hash.
- Push and production: blocked until Quinn passes. Luna does not push.

## Handoff recommendation

- Ready for Quinn: yes.
- Ready for Dep: no. Dep waits for Quinn's PASS and the owner's **ship it**.

## Notes for Quinn

- Check `/resting` in a real browser. Visit `/home` with a session cookie while the provider is unreachable. Expect a 303 to `/resting`, the session cookies still present, and the "Try again" link returning to `/home`.
- Watch the session over more than 7 days of activity if you can simulate it. Each account page mount should re-set `lumio_auth_v1`. A 7-day idle gap should still sign the user out.
- Confirm that an anonymous visit to `/login` still renders during a provider outage. A missing session never reaches the network, so it is an identity result, not an outage.
- The `npm test` script is Windows-only (C4). Run it from cmd or PowerShell.
