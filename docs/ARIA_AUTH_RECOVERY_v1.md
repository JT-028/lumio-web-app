# ARIA BLUEPRINT AMENDMENT — Auth recovery v1.0

Date: 2026-10-25. Input: `ALEX_AUTH_RECOVERY_PLAN_v1.md`; baseline application `4ff8fc6`.
Status: contract frozen for local implementation; implementation/review/provider proof pending.
This is the R1 contract referenced by Iris, Theo, Jules and Quinn; it supersedes browser-SDK auth, same-page-only modes, reset stubs and manual invite reopening in earlier specs. No application code is supplied here.

Reconciled with `IRIS_AUTH_RECOVERY_v1.md`: build `/check-email` as the neutral post-send page and `/confirm-email` as the clean explicit confirmation-entry/error page. Aria's table below governs API binding. There is no hardcoded Google capability flag: show the start action while availability is unknown; a current server PROVIDER_UNAVAILABLE result disables it with Iris's email fallback copy for that attempt. Do not treat Dep's historical flag as current capability. Google signup does not persist or finalize pre-auth role/name: collect them explicitly at `/role` after Google identity verification. Confirmation entry requires a visible “Confirm email” button before POST, not automatic consumption on navigation. Reset context confirms only presence of a staged candidate; submission performs the authoritative one-use validity check and may then display the invalid-link state.

## Decisions and preserved data

- Server-owned Supabase auth using installed SDKs only. Browser components call same-origin JSON routes; never import `supabase/browser`, receive access/refresh tokens, inspect session cookies, or use local/session storage for auth intent.
- Keep profiles, invites, households, RLS, immutable saved role/name, seven-day invite validity and atomic first-parent-wins accept transaction. No schema migration, library, infrastructure or environment secret added.
- `POST /api/profile` is the existing role endpoint; do not invent `/api/role`. Google accounts without a profile must explicitly choose one role there; never infer it from provider metadata or an invite.
- Signup intent is validated input for one-time profile insertion, never authorization. Existing profiles always win. Ordinary signup must not call admin confirmation APIs or bypass required email confirmation. Existing M2 invitation proof checks remain unchanged; no new bypass is introduced.

## Frozen public types and validation

```ts
type Role = "parent" | "student";
type Onboarding = { first_name: string; role: Role };
type NextPath = "/role" | "/wait" | "/home" | `/connect/${string}`;
type Me = { id: string; role: Role | null; first_name: string | null;
  email: string; has_main_parent: boolean }; // existing shape unchanged
type AuthResult = { status: "authenticated"; next: NextPath };
type CheckEmail = { status: "check_email" };
type ErrorEnvelope = { error: { code: string; message: string;
  details: { field: string } | null } }; // existing envelope
type AuthContext = { authenticated: boolean; next: NextPath | null;
  onboarding: Onboarding | null; has_continuation: boolean;
  link: "none" | "confirmation" | "recovery" | "invalid" };
```

All listed bodies are exact JSON objects (no token fields, unknown properties rejected); optional fields are marked `?`. Empty bodies use `{}`. Maximum JSON body 8,000 characters; reject malformed/nonobject input. Email trimmed, valid syntax, <=254 characters; match verified email with existing `emailKey`. Name uses `parseFirstName` (NFC, 1–40 characters with a letter). Password is nonempty, <=1,024 characters, never trimmed; Supabase enforces signup/update strength. Client confirmation field is never transmitted. Reject invalid roles and malformed continuation with 400 VALIDATION.

## HTTP contract

All JSON endpoints: `Cache-Control: private, no-store`; cookies carried with same-origin credentials. No JSON contains credentials, provider bodies, raw invite/link tokens or pending email. All POSTs below require the CSRF controls below, including anonymous ones.

| Method/path | Authentication and exact request | Success JSON/status |
| --- | --- | --- |
| GET `/api/auth/context` | Public; no query | 200 `AuthContext`; creates CSRF cookie; also sends `X-CSRF-Token` response header |
| POST `/api/auth/intent` | Public `{ continuation?: string }`; omission clears continuation | 200 `{ status: "ready" }`; stores validated continuation; never accepts arbitrary onboarding here |
| POST `/api/auth/sign-in` | Public `{ email: string, password: string }` | 200 `AuthResult`; authenticated provider identity required |
| POST `/api/auth/sign-up` | Public `{ email: string, password: string, first_name: string, role: Role }` | 200 `AuthResult` if provider returns a verified usable session; otherwise 202 `CheckEmail`, including concealed duplicate-account responses |
| POST `/api/auth/google` | Public `{}` | 200 `{ status: "redirect", url: string }`; URL must be the configured Supabase authorize origin/path, not caller input |
| POST `/api/auth/resend` | Public `{ email: string }` | 202 `CheckEmail` for known/unknown addresses; confirmation only |
| POST `/api/auth/forgot-password` | Public `{ email: string }` | 202 `CheckEmail` for known/unknown addresses; requests provider recovery email |
| POST `/api/auth/confirm` | Public `{}`; requires staged confirmation cookie | 200 `AuthResult`; verifies provider signup token once and restores bound intent if available |
| POST `/api/auth/reset-password` | Public `{ password: string }`; requires staged recovery token | 200 `{ status: "password_updated", next: "/login?notice=password_updated" }`; consumes proof, ends sessions, clears credentials |
| POST `/api/auth/cancel` | Public `{}` | 200 `{ status: "cancelled", next: "/login" }`; clears pending intent, link, PKCE/correlation cookies, not an unrelated ordinary session |
| POST `/api/auth/refresh` | Ordinary session `{}` | 200 `AuthResult`; provider validates/rotates credentials; 401 if unavailable/expired |
| POST `/api/sign-out` | `{}`; idempotent even without session | 204 no body; local cookies cleared regardless of provider failure |
| GET `/api/me` | Ordinary authenticated session | 200 existing `Me`; 401 unauthenticated |
| POST `/api/profile` | Ordinary session `{ first_name: string, role: Role }` | 201 existing `Me`; keep 409 ROLE_ALREADY_SET; after success refetch context for `next` |

Error mapping: 400 VALIDATION; 401 INVALID_CREDENTIALS or UNAUTHENTICATED; 403 EMAIL_UNCONFIRMED, CSRF_REJECTED; 400 LINK_INVALID; 410 LINK_EXPIRED (only when reliably known); 409 ROLE_ALREADY_SET; 429 RATE_LIMITED; 503 AUTH_UNAVAILABLE or PROVIDER_UNAVAILABLE; 500 INTERNAL. Preserve existing M2 codes. Messages are safe constants; field details only for validation. Provider disabled Google maps to PROVIDER_UNAVAILABLE; do not hardcode Dep's historical Google flag. SDK returned errors, thrown errors, timeouts and missing expected data all receive an explicit failure path.

## Trusted origin, CSRF and abuse boundary

- Callback/email absolute URLs use validated `NEXT_PUBLIC_APP_URL` only (origin, no credentials/query/fragment); require HTTPS outside localhost development. Missing/invalid configuration fails closed with AUTH_UNAVAILABLE. Never fall back to request Host/forwarded headers. Existing Supabase public config and `requireSecretKey()` remain server configuration sources; do not print values.
- Every application JSON mutation, including profile/invite accept/send and sign-out, requires exact trusted `Origin`, `Content-Type: application/json`, and `X-CSRF-Token` matching a cryptographically random HttpOnly `lumio_csrf` cookie. Context returns its value in a header to same-origin JS; cookie lifetime 1 hour. Missing Origin/token, mismatch, foreign origin, or cross-site Fetch Metadata -> 403. No CORS allowance for foreign origins. Validate before provider work; compare tokens safely. Rotate after login/confirmation/reset/logout; client refreshes context before further writes.
- Cross-site GET callbacks are exceptions only to POST CSRF, not flow verification. They cannot accept invites or change passwords/profiles. OAuth requires PKCE and browser correlation; confirmation/recovery stage links for explicit CSRF-protected POST.
- Use Supabase Auth's shared provider throttling; no process-local map presented as distributed protection. Provider controls the actual numeric limits/windows and account/project/IP keys; local audit did not establish their configured values. Theo must document these as externally unverified, not claim an app-enforced quota. Do not forward untrusted caller IP headers or retry provider mutations automatically. Map provider 429 and validated Retry-After (fallback 60 seconds); network/provider errors fail closed after a 10-second request timeout. UI suppresses duplicate submissions and displays 60-second resend/recovery cooldown; cooldown is UX, not enforcement. No distributed limiter is in this milestone.
- Recovery/resend normalize account-specific responses to 202; rate-limit/service failures may return 429/503 only with generic copy, never address existence. Signup concealed duplicates also produce check_email. No account enumeration via context.

## Session and state lifetime

- `@supabase/ssr` cookie adapters execute only server-side. Force HttpOnly, host-only, Path=/, SameSite=Lax, Secure in production for every session/PKCE chunk; preserve these flags even on refresh. Session cookie maximum age 7 days, clamped to provider expiry where applicable; refresh validity remains provider-controlled. Remove visual Remember me control; no alternate persistence mode.
- Middleware refresh propagates all changed/deleted chunks to both downstream request and final response, including redirects/errors. Never trust cookies alone: `getUser()` validates ordinary API users; unauthorized/invalid refresh clears all auth chunks. SSR and `/api/me` share validation and routing; no protected cache. Do not swallow response-cookie writes in writable route contexts.
- Sign-out requests provider global sign-out and always clears local auth, intent, link, PKCE and CSRF cookies. Provider failure is logged as a safe code, not fabricated global revocation success. Revoked refresh tokens cannot refresh; already-issued access tokens may remain valid until provider JWT expiry. This limitation also applies after password reset.
- Existing browser-managed sessions are deliberately invalidated once: expire legacy Supabase auth/PKCE chunks on first upgraded context request when `lumio_auth_v1` server marker is absent. Marker is HttpOnly, signed, same flags/7-day TTL; it is migration hygiene, never identity authority. Clear old browser auth storage in UI cleanup without reading/transmitting token values; require reauthentication.
- Use Node `crypto`, existing server key through `requireSecretKey()`, HKDF with purpose-separated labels, AES-256-GCM sealed cookies (authenticated encryption), random IV, version/issued-at/expiry and origin-bound associated data. No new signing secret. Strict payload validation, max sealed cookie 3,000 bytes; tamper/expiry -> clear and safe fallback. Key rotation invalidates pending state only. No credentials/passwords in onboarding state.
- `lumio_intent`: 1-hour TTL, validated continuation plus optional normalized email, provider user ID and onboarding. Preserve across route switches; bind signup intent to returned real user ID and verified normalized email before profile creation. Discard concealed-duplicate/unbound signup onboarding. Never apply intent on a different user/email. Clear onboarding after insertion or discovering an existing profile; retain continuation until arrival at its preview. This sealed hint cannot mutate an existing profile.
- `lumio_oauth`: 10-minute TTL, random correlation nonce plus expected callback nonce; SDK PKCE verifier separately HttpOnly. One active browser OAuth attempt; new start replaces old. Missing/mismatched nonce/verifier fails closed. Clear on callback/cancel/expiry. SDK also validates provider OAuth state; do not override it with arbitrary redirect data.
- `lumio_link`: 10-minute TTL or shorter known provider expiry, sealed `{ purpose: "signup" | "recovery", token_hash: string }`; never expose through context/JSON. Only transport provider token hash in initial callback URL then this HttpOnly cookie. Provider verification, not cookie integrity, is the one-use authority.

## Callback, confirmation and reset contracts

1. Google start calls server `signInWithOAuth` with PKCE and `skipBrowserRedirect`; redirect target is trusted `/auth/callback?flow=oauth&nonce=<random>`. GET `/auth/callback` accepts only `flow=oauth`, single `code` and matching nonce/cookie; reject duplicates, missing verifier and provider `error`. Exchange once server-side, validate user, write ordinary session, resolve next. OAuth never silently inserts a role, including when older email intent exists.
2. Email template contract: signup link is trusted `/auth/confirm?token_hash={{ .TokenHash }}&type=signup`; recovery link is trusted `/auth/recovery?token_hash={{ .TokenHash }}&type=recovery`. GET routes reject wrong/duplicate/malformed type/hash; stage sealed link cookie then 303 to clean `/confirm-email` or `/reset-password`. No token verification, general session, profile insertion or password change on GET. `AuthContext.link` indicates a staged candidate, not proof it is valid. Explicit confirm/reset POST performs verification; invalid/expired/replayed proof returns safe error and clears staged cookie.
3. Confirmation POST uses isolated server Supabase `verifyOtp({ token_hash, type: "signup" })`, then writes shared session only after successful provider validation. If bound, unexpired signup intent matches verified user/email, validate again and create profile once via existing service; concurrent ROLE_ALREADY_SET reads existing profile and resolves next. If confirmation was disabled and signup returned a session, use the same intent-finalization path. Never assume a `user` without a usable session is authenticated.
4. Reset POST must freshly call isolated server `verifyOtp({ token_hash, type: "recovery" })` on each attempt. Existing logged-in session, CSRF token, signed cookie alone, signup proof or ordinary OAuth code cannot authorize password update. Recovery credentials stay in request memory with persistence/auto-refresh disabled, never in ordinary auth cookies; ordinary session middleware cannot convert recovery into study access. `updateUser({password})` executes only using that verified recovery session. Clear link proof on success or failure; consumed proof on provider/update failure requires a new recovery link. Provider one-use verification rejects concurrent/replayed submissions.
5. On update success request global sign-out for recovered user, clear all local auth and pending cookies, return password_updated and require fresh login. If update succeeds but revocation fails, still exit recovery and log safe revocation failure; do not claim all old access tokens are gone. Do not retry password update automatically.
6. All callback outcomes 303 to clean local destinations: OAuth cancel -> `/login?error=cancelled`; correlation/code/provider failure -> `/login?error=auth`; confirmation invalid -> `/confirm-email?error=invalid_link`; recovery invalid -> `/reset-password?error=invalid_link`; infrastructure failure -> corresponding page `?error=unavailable`. Pages have explicit retry/request-new-link actions. No raw provider error text in query. Malformed flow never installs session. Set no-store, Referrer-Policy: no-referrer on callbacks/connect/link pages; scrub token URLs immediately and disable analytics there; never log full callback URLs.
7. Template/allowlist/SMTP prerequisites above must be reported by Theo; do not change remote templates/configuration. Legacy implicit fragment-token links are unsupported: request a new link; never parse tokens in browser SDK. Cross-device confirmation/recovery works from provider token hash without original PKCE cookie. Missing onboarding/continuation safely leads to `/role` or ordinary destination; original invite can be reopened. Cross-device OAuth without original verifier must restart Google.

## Continuation and route transitions (shared with Iris)

Continuation input is <=256 characters, literal relative pathname only: exactly `/home`, `/wait`, `/role`, or `/connect/` followed by existing `[A-Za-z0-9_-]{43,128}` token. Reject `%`, backslash, query, fragment, whitespace/control characters, scheme, `//`, dot segments and every other path; never decode into a second meaning. Raw invite appears only in necessary link transport/sealed cookie/redirect, not JSON payload responses except the authorized `next` navigation path; never persistent browser storage or logs. It remains navigation context, not proof of email/role/ownership.

| Event | Required behavior |
| --- | --- |
| Anonymous connect -> login/signup | POST intent with literal connect path, then navigate clean `/login` or `/signup`; shared routes/forms replace browser SDK ConnectAuth path; no auto-accept |
| Login <-> signup, forgot/resend, reload | Preserve server continuation; password cleared on switch/failure; route itself owns mode. Do not replace intent with empty defaults on every render |
| Auth completes, profile absent | Valid bound email-signup intent may finalize profile; otherwise `/role`, continuation retained; Google always explicit role selection |
| Auth completes, profile present | Saved profile immutable; pending connect takes priority, regardless of role/email, so preview explains wrong account and permits switching |
| Profile POST succeeds | GET context; server resolves pending connect first, else parent `/home`, linked student `/home`, unlinked student `/wait` |
| Arrive connect preview | Server validates invite independently (404/410/used state), consumes matching continuation; accepting remains separate existing POST with student role + verified email + atomic first-parent checks |
| `/wait` or `/home` continuation | Never overrides gate: parent/linked student `/home`; unlinked student `/wait`; missing profile `/role` |
| Authenticated `/login` or `/signup` | Server resolves above before form rendering; public `/` stays a public introduction; `/role` with saved profile resolves onward |
| Explicit switch account on connect | Save current validated connect intent, sign out, reacquire CSRF, POST intent again, then login; sign-out itself always clears old state |
| Cancel, expired intent or absent cross-device state | Clear expired/cancelled hints, use profile/gate resolver; do not invent name/role, accept invite or bypass wait |

## File ownership and verification handoff

- Theo: new `src/domain/auth-contract.ts` (public types); `src/services/auth.ts` (provider operations/finalization); `src/lib/auth-state.ts` (sealed intent/link/OAuth); `src/lib/auth-security.ts` (origin/CSRF/continuation); `src/lib/auth-session.ts` (response cookie adapter). All server modules import server-only; no UI imports. New exact route files under `src/app/api/auth/{context,intent,sign-in,sign-up,google,resend,forgot-password,confirm,reset-password,cancel,refresh}/route.ts`, and `src/app/auth/{confirm,recovery}/route.ts`. Amend existing callback, sign-out, profile, authz/profile services, middleware, env/public-config/cookie helpers as needed; backend owns all API/server/domain edits. Retire browser auth helper from active flows.
- Jules: `src/app/{page.tsx,login/page.tsx,signup/page.tsx,check-email/page.tsx,confirm-email/page.tsx,forgot-password/page.tsx,reset-password/page.tsx}`, affected role/connect pages/components, `src/components/{landing,connect-auth,role-screen,account-gate,shell}.tsx`, new auth form components, CSS, `src/lib/auth-client.ts` (fetch/header helper), existing UI clients. Fetch context before mutations and after CSRF rotation; fetch failures/JSON failures use safe UI errors. All submissions use try/catch/finally with duplicate lock and unmount guards. Import public contract types only. Check-email purpose/address may remain in current component memory after submission; refresh/direct visit has no trusted send context and uses Iris's neutral links, requiring address re-entry for resend. No address or purpose inferred from URL or staged recovery proof. Existing Lumi imports unchanged; no new asset required. No backend file overlap without serialized handoff.
- Quinn: separate `test/auth-recovery*.test.ts[x]` and controlled fixtures. Cover every endpoint/status, confirmation on/off, thrown SDK errors, duplicate/replayed/expired proof, normal-session reset denial, token/cookie secrecy, CSRF/login forgery, OAuth correlation/provider unavailable/cancel, hostile continuations, cookie refresh propagation/legacy reauth, identity-bound intent and profile races, cross-device fallback, role selection and all M2 gates. Verify phone/direct URL/history and loading cleanup; unavailable browser/live-provider checks remain unverified.
- Luna: review sensitive state, proof isolation, response cookies, continuation and CSRF before local commit. This document freezes interfaces, not a PASS. No delegation, account creation, emails, provider writes, live auth, push or deploy is authorized. No unresolved product fork; provider settings/throttle values/live schema remain documented external verification limits from Dep.
