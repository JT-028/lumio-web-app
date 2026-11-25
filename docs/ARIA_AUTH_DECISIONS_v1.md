# ARIA BLUEPRINT AMENDMENT — Auth decisions v1.0

Date: 2026-11-25. Project: Lumio. Branch `feat/lumio-m1-shell`, reviewed against HEAD `314997b` (unreviewed auth-recovery rewrite, repo on HOLD).
Input: audit findings A1, C2, B1, A3; `ARIA_BLUEPRINT_v1.md` (profiles, `POST /api/profile`); `ARIA_AUTH_RECOVERY_v1.md` (session/marker); `supabase/migrations/20261012120000_profiles.sql`.
Status: decisions frozen. No application code, test, or migration is supplied here. This amends only the sections named below; everything else in `ARIA_AUTH_RECOVERY_v1.md` stands.

## ADR summary

- A1: Test `test/auth-recovery-handlers.test.ts:311` is wrong. A null-role row is readable and means "no role chosen". The app never completes or changes it. **No migration.** Reason: the app only inserts profiles, and always with a role and name. A completion path would add an UPDATE grant to the identity table for a row state the app never creates.
- C2: The 7-day absolute session cap is **not intended**. The `lumio_auth_v1` marker is migration hygiene and was never meant to decide identity. It now slides on every authenticated `GET /api/auth/context`, on the server. The client does not call refresh. The `refresh` and `cancel` routes stay as they are.
- B1: Auth cookies are cleared only on **identity failures**. Transient failures keep the cookies. On account and auth pages they get a 303 to `/resting`. API routes keep their JSON 503/429. The same bug exists in `currentIdentity` and `requireUser`, not only in the middleware catch, so all three are in Theo's scope.

## A1 — Null-role profile rows

### Evidence

- Blueprint: "A profile does not exist until `POST /api/profile`". The route requires "session, and no profile yet" and returns "409 `ROLE_ALREADY_SET` if a profile already exists". It also says "no policy and no route updates `role`".
- SQL: `service_role` is granted `select, insert` only, with **no UPDATE grant**. The trigger `profiles_reject_identity_update` rejects any change to `role`. The table comment says "inserted only by POST /api/profile".
- Code: `insertProfile` is the only writer, and its `ProfileInsert.role` is typed `Role`, never null. No migration function inserts or updates `profiles`. So a null-role row can only come from writes outside the app.
- `ARIA_AUTH_RECOVERY_v1`: "immutable saved role/name … No schema migration", "Existing profiles always win", "This sealed hint cannot mutate an existing profile". The line in `IRIS_AUTH_RECOVERY_v1` that says "ask only for missing information" is about UI copy. It does not create an API path, because Iris does not invent fields.

### Decision: option (a)

Option (b) is rejected. It would need four things: a new migration granting UPDATE on `profiles`, a trigger rewrite to allow `null → role` once, a new data function, and a second branch in `createProfile`. That widens write access to the identity table to serve a state that no code path produces. Option (a) keeps the M1 rule: one Parent/Student choice, made at creation.

### Contract for Theo: `src/data/profiles.ts` only

`function parseProfile(data: unknown): ProfileRecord` (signature unchanged):

| Row | Result |
| --- | --- |
| `id` or `email` is not a string | `AppError("INTERNAL", 500)` (unchanged) |
| `role` is not `null`, `"parent"` or `"student"` | `AppError("INTERNAL", 500)` (unchanged) |
| `first_name` is not `null` and not a string | `AppError("INTERNAL", 500)` (unchanged) |
| `role` is `"parent"` or `"student"` and `parseFirstName(first_name).ok` is false | `InvalidProfileError` (500, unchanged class) |
| `role` is `null` (any `first_name` that is null or a string) | Return `{ id, role: null, first_name, email }`. Do **not** throw. |

Replace the comment at lines 106–107 with: "Null-role rows are SQL-valid and read as no role chosen. The app never completes them: profiles are insert-only, there is no UPDATE grant, and the role is immutable."

No change to `createProfile`, `authz.ts` role guards, `getMe`, `pathAfterSignIn`, `resolveAuthNext`, or SQL. **Migration: none.**

Resulting behavior for a session whose row is `{ role: null }`:

| Call | Result |
| --- | --- |
| `GET /api/me` | 200, `role: null`, `first_name` as stored, `has_main_parent: false` |
| Context `next`, sign-in `next`, middleware on `/home` or `/wait` | `/role` |
| `POST /api/profile` (any valid body) | **409 `ROLE_ALREADY_SET`**. The row is unchanged and nothing is inserted. |
| Sign-up or confirm finalize with a bound onboarding intent | `createProfile` gets 409, which is swallowed (existing code). The onboarding intent is cleared and `next` is `/role`. |
| `GET /api/home` (requireChosenRole) | 403 `ROLE_REQUIRED` (fixes `m2-connect.test.ts:779`) |
| Invite send (requireParentRole) | 403 `ROLE_FORBIDDEN` (fixes `m2-invites.test.ts:120`) |
| Connect accept (requireStudent) | 403 `ROLE_NOT_STUDENT` |

The `/role` screen already handles the 409 without looping. It locks the form, re-reads context, gets `next === "/role"`, and shows its "check failed" status. That is acceptable for a state the app cannot produce.

### Contract for Quinn: rewrite the test, do not delete it

Replace `"schema-valid existing profile without name or role can finish onboarding exactly once"` (line 311) with `"schema-valid null-role profile routes to /role and is never completed or changed"`. Seed the same row and sign in. Then assert:
- sign-in `next` is `/role` and context `next` is `/role`
- `GET /api/me` returns 200 with `role: null` and `first_name: null`
- `POST /api/profile {first_name:"Ada", role:"student"}` fails with 409 `ROLE_ALREADY_SET`
- `profiles.length === 1`, `profiles[0].role === null`, `profiles[0].first_name === null`, and `inserts.length === 0`

Keep the next test (the checked-in schema test) as it is.

## C2 — Session lifetime and the `lumio_auth_v1` marker

### Facts

- `TTL.marker = 604800`. Only `finalize()` re-seals the marker with a fresh `iat`/`exp`. That covers sign-in, sign-up, confirm, the OAuth callback and `refresh`.
- `AuthSession.migrate()` runs on every `GET /api/auth/context`. It clears all auth cookies when the marker is missing or expired.
- Session cookies slide. `@supabase/ssr` rewrites them with a 7-day `maxAge` on every token rotation, in middleware and in context.
- The client reads context on every account page mount (`account-gate.tsx`) and before every write (`authPost`).
- Result: 7 days after the last sign-in, page views still render as signed in, but the next context read signs the user out. The browser holds an inconsistent state, and the marker is acting as identity authority. That contradicts `ARIA_AUTH_RECOVERY_v1` ("migration hygiene, never identity authority"; "refresh validity remains provider-controlled").

### Decision

There is no absolute session cap. Lumio's session policy is: a 7-day idle window set by cookie `maxAge` and renewed on activity, plus provider-controlled refresh and revocation.

### Contract for Theo: `src/services/auth.ts`, `operation(scope, "context")` only

After `const user = await currentIdentity(scope)` returns a **non-null** user, call `scope.set(STATE.marker, sealState("marker", { migrated: true }), TTL.marker)`. Do not pass `previous`: the marker needs a fresh `iat`/`exp`. Do not renew it for anonymous context, in middleware, or anywhere else.

This is safe because `migrate()` runs first in the same request. If the marker was missing or expired, `migrate()` has already removed the auth cookies from `scope.values`, so `currentIdentity` returns null. Renewal can therefore only extend a marker that was valid when the request started. Middleware must never renew the marker, because it never runs `migrate()` and would bless legacy browser cookies.

- **Client: no change.** Nothing calls `/api/auth/refresh`. Jules does nothing for C2.
- **Routes:** `POST /api/auth/refresh` and `POST /api/auth/cancel` stay unchanged. Both are in the frozen contract, CSRF-protected and tested. The client needs neither. They are not removed in this fix (see Open Questions).
- **Contract change:** none. Status codes and JSON shapes are unchanged. The only new behavior is that a successful authenticated context response also sets `lumio_auth_v1` with Max-Age 604800.

## B1 — Identity failures versus transient failures

### Classification: one rule, used everywhere

`export function isTransientAuthError(error: unknown): boolean` in `src/services/auth.ts`. It applies to an SDK `result.error` object.

| Class | Condition | Cookies |
| --- | --- | --- |
| **Identity** | `result.error.status` is a number from 400 to 499, is not 429, and `code` is not `"unexpected_failure"`. This includes `refresh_token_not_found`, `session_not_found`, `bad_jwt`, `user_not_found` and `AuthSessionMissingError`. Also identity: no error and no user. Also identity: the user is returned but `verifiedIdentity` rejects it (non-UUID id, unusable email, unconfirmed email). | Clear all auth chunks. Keep any deletions the SDK itself wrote. |
| **Transient** | Anything thrown by `getUser()`: network error, the 10-second abort, `scope.client()` or config failure. Also any `result.error` with status 0, a missing or non-numeric status (`AuthUnknownError`), 429, ≥500, `name === "AuthRetryableFetchError"`, or `code === "unexpected_failure"`. Also every failure after identity is established: profile or household DB reads, `InvalidProfileError`, `resolveAuthNext`. Also missing Supabase public config. | **Do not clear.** Keep all cookies, including SDK rotations already in `scope.writes`. |

Status 0 is how the SDK reports a network failure. Today it falls through to "signed out" (401 or `clearAuth`). Under this rule it is transient.

### Contract for Theo, file by file

1. `currentIdentity(scope: AuthSession): Promise<SessionUser | null>` in `src/services/auth.ts`:
   - Identity failure: call `scope.clearAuth()` and return `null`. This includes a `verifiedIdentity` rejection, which now returns null instead of throwing.
   - Transient failure: throw `providerFailure(error)` (503 `AUTH_UNAVAILABLE` or 429 `RATE_LIMITED`) **without** `clearAuth()`. Remove the blanket `clearAuth()` from its catch.
2. `userFromClient(supabase): Promise<SessionUser>` in `src/services/authz.ts`:
   - Transient `result.error`, judged by `isTransientAuthError`, throws `providerFailure(error)`. Status 0 now becomes 503, not 401.
   - Identity failures keep their current codes: 401 `UNAUTHENTICATED`, 403 `EMAIL_UNCONFIRMED`, 500 `INTERNAL` for a bad UUID, 400 `VALIDATION` for a bad email.
3. `requireUser(request): Promise<SessionUser>` in `src/services/authz.ts`: call `clearServerAuthCookies()` only when the caught error is **not** an `AppError` with `httpStatus` 429 or 503. Behavior for API routes:
   - transient: JSON 503 `AUTH_UNAVAILABLE` or 429 `RATE_LIMITED`, cookies kept
   - identity: existing codes, cookies cleared
4. `src/middleware.ts`:
   - Early-return `NextResponse.next({ request })` for exactly `/resting`, as well as for `/api/` and `/auth/`, so there are no provider calls during an outage.
   - Remove `scope.clearAuth()` from both the `catch` and the missing-config `else` branch.
   - In both of those branches, account routes (`/role`, `/home`, `/wait`) and auth routes (`/login`, `/signup`) return **303 with a relative `Location: /resting`**. Do not compute an origin, so it still works when config is broken. Do not add a return URL or query string.
   - Apply `scope.writes` to the outage response. Set `Cache-Control: private, no-store` and `Referrer-Policy: no-referrer`.
   - Other pages (`/`, `/connect/...`, etc.) get `NextResponse.next`, with cookies untouched.
   - Remove the JSON 503 body from middleware entirely.
   - Keep the log line with code `AUTH_REFRESH_FAILED` and `user_id: null`.
   - Identity failures still 303 to `/login`, as today.
5. `src/app/resting/page.tsx` (new, minimal placeholder, Theo for now): a static server component with no data, no auth, no client JS and no user content. It shows one heading, one sentence saying sign-in is temporarily unavailable, and a "Try again" link to `/home`. Middleware sends `/home` to `/login`, `/role`, `/wait` or `/home` as appropriate. Jules replaces the content later from an Iris spec, and Lux is called only if that design needs a Lumi picture. Do not add `/resting` to the account or auth route lists.

Not in scope: the `handleAuth` catch that clears auth on a failed sign-in, sign-up, confirm or refresh. A half-established session should be cleared, so that stays as it is.

### A3

Pin `"next": "15.5.29"` (exact) in `package.json` and regenerate `package-lock.json`. Leave the `overrides.next.postcss` entry unchanged. This raises no contract problem.

## Notes for Quinn (tests; Theo does not edit `test/`)

- Rewrite `auth-recovery-handlers.test.ts:311` as specified in A1.
- Rewrite `auth-recovery-middleware.test.ts:42` (`"provider outage returns unavailable and propagates cookie cleanup"`). It encodes the B1 bug. It should now expect status 303, `location === "/resting"`, no `Max-Age=0` for any session chunk, and request cookies still present.
- Add middleware tests:
  - `readError {status: 0}` gives `/resting` and keeps cookies
  - `getUser` throwing gives `/resting` and keeps cookies
  - a profile DB failure during `resolveAuthNext` gives `/resting` and keeps cookies
  - `/resting` makes zero provider calls
  - the existing `refresh_token_not_found` test still clears cookies and sends the user to `/login`
- Add an API test: `/api/me` with `readError {status: 503}` and with `{status: 0}` returns 503 `AUTH_UNAVAILABLE` with no auth cookie cleared. With `{status: 401}` it returns 401 and clears the cookies.
- Add C2 tests:
  - an authenticated context sets a fresh `lumio_auth_v1` (Max-Age 604800)
  - with a marker sealed 6 days 23 hours earlier (mock `Date.now`), context stays authenticated and the new marker's `exp` is about now + 7 days
  - anonymous context does not renew the marker
  - the existing legacy-marker-absent clearing test stays unchanged
- The two M2 tests (`m2-connect.test.ts:779`, `m2-invites.test.ts:120`) must pass unmodified.

## Notes for Luna

- No new migration. `profiles` is still insert-only for `service_role`. Grep that there is no `.update(` on `profiles` and no `grant update`.
- Every `clearAuth()` and `clearServerAuthCookies()` call is on an identity branch only. Check the middleware catch, the missing-config branch, `currentIdentity`'s catch and `requireUser`'s catch.
- The marker is renewed only inside the context operation, after `migrate()` and a non-null `currentIdentity`. It is never renewed in middleware.
- `/resting` has no auth, data or user content. The redirect uses a relative fixed `Location` with no `from` or return parameter, so it cannot become an open redirect.
- Status 0 and `AuthRetryableFetchError` are never mapped to 401 or to signed out.
- Tests changed their expectations because of this document. They were not deleted or skipped. The 3 audit failures go to 0 with no `skip` or `todo`.
- `next` is pinned exactly at 15.5.29 and the lockfile agrees.
- The `refresh` and `cancel` routes are unchanged.

## Open Questions

- The live DB may hold null-role rows written outside the app; the app cannot create them. If any exist, repairing them means deleting the row or setting the role by SQL, and that is the owner's data decision. Recommendation: check, and do nothing unless rows exist. — blocking: no
- Should the unused `POST /api/auth/refresh` and `POST /api/auth/cancel` be removed later? Recommendation: keep them until Iris specs (or declines) a "cancel" control. Then Max or Theo can remove both route files and their tests in one explicit cleanup. — blocking: no
- Session policy is now a 7-day idle window with no absolute cap. If the owner wants a hard cap, for example for shared family devices, that is a product choice for Rex and Eden. Recommendation: no cap for M1/M2. — blocking: no

## Theo notes (2026-11-25)

- **B1 deviation: the `/resting` Location is absolute, not relative.** In Next 15.5.29, the middleware adapter parses every `Location` with `new NextURL(location)` and no base, so a bare `/resting` throws `Invalid URL` and the page returns 500. This was checked against `node_modules/next/dist/server/web/adapter.js`. The middleware now uses `NextResponse.redirect(new URL("/resting", request.url), 303)`. Aria's intent still holds: the URL is built from the request itself, not from config or `resolveAppOrigin()`, so it works when config is broken. The path is fixed, with no query and no return parameter, and it is same-origin as the request. Quinn: assert ``location === `${origin}/resting` `` (or `new URL(location).pathname === "/resting"` with an empty `search`), not the literal `"/resting"`.
- **Test fixtures that don't match the SDK.** `test/m1-profile.test.ts` (~line 53) and `test/m2-connect.test.ts` (~line 50) mock "no session" as `{ message: "Auth session missing" }` with no `status`. The real SDK returns `AuthSessionMissingError` with `status: 400`. Under the B1 rule, a missing status is transient, so these fixtures now give 503 where the tests expect 401. Quinn should give the fixtures the real SDK shape (`name: "AuthSessionMissingError", status: 400`). The code is not changed for this.
