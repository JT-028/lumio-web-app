# LUNA REVIEW v1.0: Audit cleanup

Project: Lumio. Branch `chore/lumio-audit-cleanup`, cut from `cb40ac1`.
Input: the 2026-11-25 audit leftovers, Aria `ARIA_INVITE_CAP_v1`, and the Theo, Jules and Quinn reports.
Date: 26 November 2026.

## Summary

0 CRITICAL, 0 HIGH, 0 MED and 2 LOW findings are open. Luna fixed 2 more LOW findings, and a later Dep commit resolved the CI finding. The happy-dom 21.0.4 bump cleared the `npm audit` failure.
**Overall status: PASS.** The code gate is clear. The real-Postgres burst check passed on 28 November 2026, so the MED finding is resolved.

The change does five things:
1. It replaces count-then-insert with one atomic RPC for the 10-per-hour invite cap (audit C3).
2. It deletes server and client helpers that nothing called.
3. It makes the test typecheck real. `test/**` is now compiled, and it has 0 errors.
4. It makes `npm test` run under `sh` as well as `cmd`.
5. It lets `test/m1-repo.test.ts` find the repo root from its own location.

The change covers 26 paths. The 22 tracked files lose 205 lines net. The new files are a 64-line migration, two small test-support files and the Aria doc.

## Behaviour freeze

- `git diff cb40ac1 --stat` shows no change under `src/app`, `src/components`, `src/domain`, `src/middleware.ts`, `src/services/connect.ts`, `src/lib/auth-security.ts`, `src/lib/supabase/public-config.ts` or the three older migrations.
- `POST /api/invites` keeps every status, code, message and `details` value. It still answers 400 `INVALID_EMAIL`, 503 `EMAIL_NOT_CONFIGURED`, 429 `RATE_LIMITED`, 502 `EMAIL_FAILED`, 500 `INTERNAL` and 201 with `{ id, invited_email, expires_at, state }`. The checks run in the same order, and no row or mail exists on any failure path.
- The stricter origin check cannot be seen at the route. `assertCsrf` already called `resolveAppOrigin()` at `cb40ac1`, so a bad origin was 503 `AUTH_UNAVAILABLE` before this change and is 503 now. The new 500 in `createInvite()` is defence in depth.
- Grep finds no caller in `src/` or `test/` for `countRecentInvites`, `insertSentInvite`, `configuredAppOrigin`, `endSession`, `applyAuthCacheHeaders`, `pathAfterSignIn`, `noContent`, `postInvite`, `postSignOut`, `pathForAccount`, `ProfileFailure`, `browserSupabase`, `@/lib/supabase/browser` or `@/lib/auth-errors`. The `postProfile` hits are a local helper in `test/m1-profile.test.ts`. The server `acceptConnect` in `src/services/connect.ts` stays.
- No deletion left an import or helper without a caller. `createSupabaseServerClient`, `linkedStudent` and `findProfileById` are still used.

## SQL review: `20261126120000_connect_invites_rate_cap.sql`

| Question | Result |
| --- | --- |
| Does the lock serialize sends by one parent? | Yes. A second call blocks on `select ... for no key update` of the same `profiles` row until the first transaction commits. PostgREST runs RPCs at READ COMMITTED, the Supabase default. |
| Is the count fresh after the wait? | Yes. The function is VOLATILE, the default. Under READ COMMITTED every statement in a VOLATILE plpgsql function takes a new snapshot, so the `count(*)` after the lock sees the rival's committed row. Marking it `stable` would break this, and the migration does not. |
| Can it deadlock with other writers? | No. `for no key update` does not conflict with the `for key share` locks that FK checks take (`connect_invites.parent_id`, `households.main_parent_id`). `accept_connect_invite` reads `profiles` without a lock. `service_role` has no UPDATE on `profiles`, so no app path competes for the row. |
| Is the `security definer` surface minimal? | Yes. Only `service_role` can execute it. The revoke block covers `public`, `anon`, `authenticated` and `service_role`, then grants `execute` to `service_role` with the full `(uuid, text, text, text)` signature. That matches `accept_connect_invite`. Every relation is schema-qualified, so `search_path = public` cannot be shadowed through `pg_temp`. |
| Is the sender checked? | Yes, twice. The function raises 42501 when the locked row is missing or is not a parent. The `connect_invites_require_parent` trigger still fires on the inner insert. |
| Does `revoke insert` break anything? | No. `src/data/invites.ts` was the only insert path, and it now calls the RPC. `service_role` keeps `select`, `update` and `delete`, so the Resend rollback in `deleteInvite` still works. The function inserts as its owner, so the revoke does not affect it. |
| Do the triggers still set the key and the expiry? | Yes. `normalize_email`, `require_parent` and `set_expiry` are BEFORE INSERT triggers and fire on the inner insert. `expires_at` is still `created_at + 7 days`. |
| Clock | One DB clock sets `created_at` and the window, so app-server skew no longer moves a row in or out of the hour. |

## Findings

### MED (resolved). The row lock had not run against real Postgres
File: `supabase/migrations/20261126120000_connect_invites_rate_cap.sql`.
Issue: The burst test in `test/m2-invites.test.ts` proves the contract with a synchronous in-memory fake. No test runs the migration or two real concurrent transactions. Luna also did not run the burst test against the old count-then-insert code. The claim that it fails there is reasoned: all 15 sends await the same chain, so every count runs before any insert.
Risk: A mistake that only real Postgres shows, such as a grant the owner lacks or a snapshot that is not fresh, would ship unseen. The function would then fail closed with 500 or let a burst past the cap.
Fix: Before `supabase db push`, apply the migration to a local `supabase start` stack. Fire 15 parallel `rpc('create_connect_invite_capped', ...)` calls for one parent and expect exactly 10 `sent` and 5 `rate_limited`. Then confirm that `service_role` cannot insert into `connect_invites` directly. Owner: Quinn, with Dep for the stack.
Result (28 November 2026): PASS on real Postgres.
- Where: the owner applied all four migrations, in order, through the SQL editor to `dftcafuvgjbffplyezia`. The owner confirmed on 29 November 2026 that this is the live Production database. It had no Lumio tables before. No local stack was used.
- Burst: four rounds, all for one throwaway parent. Each round sent 15 parallel `rpc('create_connect_invite_capped', ...)` calls through PostgREST with the secret key.
- Every round gave exactly 10 `sent` and 5 `rate_limited` and stored 10 rows. A 16th call returned `rate_limited`.
- A direct `service_role` insert into `connect_invites` failed with 42501.
- The test invite rows were deleted afterwards. The test parent's profile and auth user `bff2bb36-f64c-424f-96bf-7a861e44137f` stay until the owner deletes them in the SQL editor, because `service_role` cannot delete profiles.
- The migrations are live, but `supabase_migrations.schema_migrations` has no record of them. Before any `supabase db push` to this project, run `supabase migration repair --status applied 20261012120000 20261013120000 20261013140000 20261126120000`.

### LOW. Two fault guards in the capped insert have no test
File: `src/data/invites.ts`, lines 32 to 37.
Issue: Two guards in `insertSentInviteCapped` throw `INTERNAL`, and no test reaches them. One is an unknown `result`. The other is a `sent` result whose row is malformed or whose `invited_email` differs from the input. Branch coverage of the file is 92.59%.
Risk: A later edit could turn a malformed RPC answer into a 201 or a mail with a bad link, and no test would fail.
Fix: Add two cases to the inline `rpc` fake in `test/m2-invites.test.ts`: `{ result: "other" }`, and `sent` with another address. Expect 500 `INTERNAL`, no row and no mail for both. Owner: Quinn.

### LOW. `expires_at` now carries microseconds
File: `supabase/migrations/20261126120000_connect_invites_rate_cap.sql`, `src/lib/resend.ts` line 31.
Issue: `created_at` used to come from the app's `toISOString()`, so `expires_at` had milliseconds (`.123+00:00`). Postgres `now()` now sets it, so the 201 body and the mail text carry microseconds (`.123456+00:00`). The field is still an ISO timestamptz string in the same shape. `connectExpiry()` and `new Date()` parse both forms.
Risk: There is no break. The mail prints the raw timestamp to the recipient, as it did before, now with three more digits.
Fix: None needed for this change. If the mail should show a readable date, that is a copy change for Aria and Iris. Deferred.

### LOW (resolved). CI does not use the new portability
File: `.github/workflows/ci.yml`.
Issue: The test job still copies the checkout to `D:\PORTFOLIO\booklet-web-app\lumio-web-app`, and its header comment says `test/m1-repo.test.ts` needs that path. The test now finds the root from `import.meta.url`, so the copy step is unnecessary. CI also runs only `npm run typecheck`, which excludes `test/`, so the test typecheck that is now clean is not enforced.
Risk: CI stays tied to Windows and a fixed drive path, and a type error in `test/**` can merge.
Fix: Remove the robocopy step and the `working-directory` overrides, and run `npm ci` and `npm test` in the workspace. Add a `npx tsc --noEmit -p test/tsconfig.json` step to the lint job. Luna did not edit CI. Owner: Dep.
Resolved by the `ci:` commit on top of `2557158`. Every job runs on `ubuntu-latest` in the plain checkout, the robocopy step and both `working-directory` lines are gone, and the lint job runs `npm run typecheck:test`. Luna checked it: the YAML parses in strict mode, triggers, permissions, `needs`, pinned SHAs and the deploy job are unchanged, and `typecheck:test` exits 0.
Unverified until the first ubuntu run: `npm ci`, `npm test` and `next build` on Linux, and Node 24.18.0 (local checks ran on Windows with Node 26.12.1).

### MED (fixed). Node 24.18 gave the auth handler tests the real supabase-js
File: `test/support/auth-provider.ts`.
Issue: The first ubuntu run, on Node 24.18.0, failed 14 tests in `test/auth-recovery-handlers.test.ts` with 503 where 200 was expected. The Windows run at `314997b` failed the same 14, so the failures are older than this branch. `@supabase/supabase-js` maps `import` to `dist/index.mjs` and `require` to `dist/index.cjs`. tsx loads this CommonJS-typed project through `require()`. Without the nodejs/node#58231 fix, a bare-specifier `mock.module()` covers only the ESM entry, so `isolatedAuthClient()` got the real SDK. Its fetch hit the fixture's "Live network is forbidden" guard, and `src/services/auth.ts` line 57 answered `unavailable()`. `@supabase/ssr` has no `exports` map, so its bare mock already covered both loaders.
Risk: None in production. Next bundles the SDK there, and nothing is mocked. In CI, the handler tests fail on any Node that lacks the fix.
Fix applied: The fixture mocks the same `createClient` object a second time, under the `file:` URL of the `require()` entry. Without that line, Node 24.18.0 fails exactly those 14 tests and Node 26.12.1 passes all 60. With it, both pass 60 of 60 and `test/auth-recovery-middleware.test.ts` passes 28 of 28, so the second registration does not clash on Node 26.

### MED (fixed). `npm audit` failed on happy-dom 20.10.6
File: `package.json`, `package-lock.json`, `test/support/ui.ts`, `test/support/dom.ts`.
Issue: Ubuntu CI run 45846626532 passed lint, test and build. Its security-scan job failed because `npm audit` found 1 high in the dev dependency `happy-dom` 20.10.6. The advisories are GHSA-834v-8h66-3h79, fixed in 21.0.4, GHSA-c8p4-j97h-3vg8, fixed in 21.0.0, and GHSA-5fpq-26gf-qwcr, fixed in 20.14.6. No 20.x release fixes all three.
Risk: happy-dom runs only in tests, so production is not exposed. The failed job blocks CI.
Fix applied: The owner approved the major bump, and `happy-dom` is now pinned to exactly `21.0.4`.
- The lockfile changes only the happy-dom entry. Its version, `resolved` URL on registry.npmjs.org and `integrity` match `npm view happy-dom@21.0.4`. The dependency list and `engines` (`node >=20.0.0`) are the same as in 20.10.6, so no other package moved.
- `test/support/ui.ts`: 20.10.6 gave wrong answers from `contains()`, `closest()` and `compareDocumentPosition()` for a form that React builds detached and then attaches. 21.0.4 answers correctly, so `within` and `precedes` now call `contains()` and `compareDocumentPosition()` instead of walking `querySelectorAll("*")`. A 16-case probe on Node 24.18.0 gave the expected answer in every case. `precedes` still returns false for a detached node, for the wrong order and for the same node.
- `test/support/dom.ts`: the `@layer` and `clamp()` workaround stays. A probe on 21.0.4 still returns an empty computed value for a rule inside `@layer` and for a `clamp()` value. Only the comment changed.
Checks: `npm audit` reports 0 vulnerabilities and `npm ci --dry-run` is clean. Both typechecks exit 0. `test/auth-recovery-ui.test.tsx` passes 38 of 38 on Node 24.18.0. Quinn's full `npm test` passed 317 of 317 on Node 24.18.0 and on 26.12.1, with 97.04% lines and 90.72% branches.

### LOW (fixed). `m2-client.ts` still accepted POST and accept-only codes
File: `src/lib/m2-client.ts`.
Issue: After the client `acceptConnect` was removed, `request()` still took a `"GET" | "POST"` method, and nothing passes `"POST"`. Its `codes` set still listed `ROLE_NOT_STUDENT`, `EMAIL_MISMATCH` and `ALREADY_USED`. Only `POST /api/connect/:token/accept` returns those codes, and that call now goes through `authPost` in `connect-screen.tsx`. `GET /api/home` and `GET /api/connect/:token` return only `ROLE_REQUIRED`, `NOT_FOUND`, `LINK_EXPIRED` and other codes that the set already drops.
Fix applied: `request(path)` is GET only, and `codes` is `NOT_FOUND`, `LINK_EXPIRED` and `ROLE_REQUIRED`. No route that `m2-client` calls can produce a removed code, so every result is the same.

### LOW (fixed). The Aria doc said "500" for a bad origin without the route case
File: `docs/ARIA_INVITE_CAP_v1.md`, section 4 case 6 and section 5.
Issue: Both places said a bad origin gives 500 `INTERNAL`. That holds for `createInvite()` called directly. Through `POST /api/invites` the answer is 503 `AUTH_UNAVAILABLE`, from `assertCsrf`, as it was at `cb40ac1`. Quinn's last origin test asserts exactly that.
Fix applied: Both places now name the service-level 500 and the route-level 503.

## Test honesty

- Added lines contain no `any`, `as unknown as`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `eslint-disable`, `skip`, `todo` or `only`.
- 12 assertions left the tests and 50 arrived. Each removed assertion has a replacement that runs live code:
  - `applyAuthCacheHeaders` became `AuthSession.apply()`, with the same three checks on `Cache-Control`.
  - `pathAfterSignIn` became `GET /api/auth/context`, which answers `next: "/wait"`.
  - `pathForAccount` became the `navigations` that `HomeScreen` and `WaitScreen` really perform.
  - `postInvite` became the `HomeScreen` invite form. It drives the live `invite-card.tsx` mapping, where the code alone puts the fixed sentence on the field.
  - The client `acceptConnect` checks are covered by the `ConnectScreen` accept tests, including "malformed acceptance stays retryable".
- The `dom.matchMedia` stub deleted from `test/m1-shell.test.tsx` was dead. Nothing in `src/` calls `matchMedia`.
- `test/support/node-test.d.ts` only declares the `exports` option that the tests already passed to `mock.module()` at `cb40ac1`. It changes no runtime code.

## `npm test` under `sh`

The new script has nothing that only `cmd` understands. The old `set TSX_TSCONFIG_PATH=...&&` set positional parameters under `sh`, not the environment. Now `node --env-file=test/tsx.env` loads `TSX_TSCONFIG_PATH` before `--import tsx` runs. Node 20.6 added `--env-file`, and CI uses 24.18.0. Child test processes inherit the variable through `process.env`. Every glob is in double quotes, so `sh` passes it unchanged and `node --test` expands it. The env file holds a path, not a secret. Luna checked this by reading the script and the Node docs. No Linux run was possible.

## Line endings

Every touched file has CRLF in the working tree and LF in the index, like the rest of the repo (`core.autocrlf=true`). Luna's two edits were normalized back to CRLF before staging.

## Checks after Luna's fixes

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | exit 0 |
| `npx tsc --noEmit -p test/tsconfig.json` | exit 0 |
| `test/m2-frontend.test.tsx` and `test/m1-shell.test.tsx` (touch `m2-client.ts`) | 95 tests, 95 pass |
| `npm test` | 317 tests, 317 pass, 0 fail, skipped or todo. Lines 97.04%, branches 90.72%. Before Luna's fix it was 96.98% and 90.72%. `m2-client.ts` is now 100% lines |

## Deploy note for Dep

- The migration and the code are one release. Each one breaks invites without the other. Old code with the migration fails its direct insert. New code without the migration calls an RPC that does not exist. Both cases fail closed: `POST /api/invites` answers 500 `INTERNAL`, writes no row and sends no mail. Neither order lets a parent go past the cap.
- Order: run `supabase db push` for `20261126120000`, then promote the Vercel deploy right away, so the 500 window is as short as possible. Both steps need the owner's **ship it**.
- Status (29 November 2026): the database step is done. The owner applied the migrations to the live project on 28 November. Until this code is promoted, Production code that still uses the direct insert cannot send invites.
- After the push, check these privileges:
  - `has_function_privilege('service_role', 'public.create_connect_invite_capped(uuid,text,text,text)', 'execute')` is true.
  - The same check is false for `anon` and `authenticated`.
  - `has_table_privilege('service_role', 'public.connect_invites', 'insert')` is false.
  - `has_table_privilege('service_role', 'public.connect_invites', 'delete')` is true.
- If PostgREST does not see the function, run `notify pgrst, 'reload schema';`.
- Smoke test: one invite send returns 201 and one mail.
- Rolling back the code alone is not enough. The old code needs `grant insert on table public.connect_invites to service_role`, and that grant brings back the count-then-insert race. Roll back both or neither.
- CI follow-up (Dep): resolved. See the CI finding above. The first ubuntu run failed 14 auth tests on Node 24.18, fixed in the supabase-js finding. Ubuntu run 45850013829 on `43da253` then passed lint, test, build and security-scan.

## Plugin gate

- ponytail-review verdict: Ship.
- thermos: no open criticals. Both passes ran inline, because the `thermo-nuclear-*-subagent` types are not available in this harness.
- pstack skills applied: poteto-mode (refactoring playbook), principle-laziness-protocol, principle-subtract-before-you-add, principle-minimize-reader-load, principle-fix-root-causes, principle-prove-it-works, principle-sequence-verifiable-units, principle-migrate-callers-then-delete-legacy-apis, typescript-best-practices, principle-test-behavior-not-implementation, no-comments (inline, without the Comment Sicko agent), unslop and technical-writing on this doc and the commit message.
- ponytail-debt: no `shortcut:` or `ponytail:` markers. Clean ledger.
- Optimizations applied: `src/lib/m2-client.ts`, and the wording in `docs/ARIA_INVITE_CAP_v1.md`.
- Local commit: one commit on `chore/lumio-audit-cleanup` that carries this review. Its hash goes to the orchestrator.
- Push and prod: blocked until Quinn PASS and **ship it**.

## Handoff

- Ready for Quinn: yes.
- Ready for Dep: Quinn PASS and the real-Postgres check are done. The migration is already live in Production, so the old code can no longer insert invites. Promoting this code to Production still needs the owner's **ship it**.

## Notes for Quinn

- Done: the real-Postgres burst check from the MED finding passed on 28 November 2026.
- Add the two malformed-RPC cases from the first LOW finding.
- The uncovered line 12 that the report shows for `src/services/invites.ts` is a comment line. It is source-map drift, not a gap.
