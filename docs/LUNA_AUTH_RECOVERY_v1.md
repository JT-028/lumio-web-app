# Luna auth recovery review preparation v1

Date: 2026-10-25. Project: Lumio. Phase: PREPARATION ONLY.
Status: NOT REVIEWED. No application verdict, QA PASS, or release approval.
Baseline: `4ff8fc6`, branch `feat/lumio-m1-shell`, verified by local Git metadata. Builder and test edits are active in the shared checkout. The current worktree is not clean.

## Inputs and authority

Read `AGENTS.md`, Luna's installed `agent-squad/luna/SKILL.md`, and these local handoffs:

- `ALEX_AUTH_RECOVERY_PLAN_v1.md` defines R1 through R4 before M3.
- `ARIA_AUTH_RECOVERY_v1.md` freezes API, session, security, and continuation contracts.
- `IRIS_AUTH_RECOVERY_v1.md` defines routes, states, accessibility, and supplied Lumi use.
- `DEP_AUTH_READINESS_v1.md` records external readiness observations and limits.

Aria's reconciled decisions govern conflicts in older Iris wording. Google availability comes from the current server operation, never Dep's historical flag. Google requires explicit post-auth role selection. Confirmation requires a visible action before POST. Reset context indicates a staged candidate, not verified recovery authority.

This document is a planned checklist. Unchecked items are acceptance targets, not findings against unfinished builders.

## Freeze and evidence handoff

- [ ] Main explicitly reports Theo, Jules, and Quinn's test writer DONE and freezes their files before review, runtime checks, or commit.
- [ ] Capture the frozen revision and complete recovery file list, including new untracked files, without reading or printing environment secrets.
- [ ] Obtain Theo's implementation notes, Jules's integration notes, and Quinn's coverage matrix. Trace actual code and callers rather than treating those reports as proof.
- [ ] Main coordinates independent Thermos security and quality reviews against the same frozen scope. No nested delegation or worker CLI is authorized in this preparation phase.
- [ ] Coordinate test execution and any shared build output with Quinn. Recheck every application fix before final verification.

## Security and correctness checklist

### Server session and cookies

- [ ] Password, confirmation, and Google use one server-validated ordinary session. SSR, middleware, protected APIs, and `/api/me` agree on identity and routing.
- [ ] Browser flows do not import the Supabase browser auth path or receive credentials through JSON, browser storage, or readable cookies. Legacy storage cleanup removes values without reading or transmitting them.
- [ ] Every session and PKCE cookie chunk stays HttpOnly, host-only, Path=/, SameSite=Lax, and Secure in production. Check bounded age, expiry, rotation, deletion, and the signed migration marker.
- [ ] Refresh updates both downstream request cookies and every final response, including redirects and errors. Invalid sessions clear all chunks. Writable route contexts do not swallow cookie failures.
- [ ] Sign-out is idempotent, attempts global provider sign-out, and always clears local auth and pending state. Reports distinguish refresh revocation from already-issued access-token expiry.

### Trust boundaries and provider failures

- [ ] Every JSON mutation, including anonymous login, signup, recovery, sign-out, profile, and invite actions, enforces trusted Origin, JSON content type, Fetch Metadata, and matching CSRF cookie/header before provider work.
- [ ] CSRF rotates after session changes and the client reacquires context before subsequent writes. Foreign origins receive no permissive CORS allowance.
- [ ] Callback and email URLs use validated configured application origin. Host and forwarded headers cannot select redirect destinations.
- [ ] Exact object schemas reject unknown properties, malformed/nonobject JSON, oversized bodies, invalid names/roles/emails, and unsupported password length. Passwords are never trimmed or logged.
- [ ] Provider errors, thrown exceptions, missing data, and 10-second timeout paths fail safely. No automatic mutation retries or raw provider diagnostics reach clients or logs.
- [ ] Signup duplicate handling, resend, and recovery responses avoid account enumeration. Provider 429 and safe Retry-After handling work. UI cooldown is described as UX only.
- [ ] Provider throttling values and distributed guarantees remain externally unverified unless supported by actual evidence. No process-local limiter is represented as shared enforcement.

### OAuth, confirmation, and password recovery

- [ ] Google start restricts the returned authorize URL to the configured provider origin/path. Callback requires PKCE and matching, unexpired browser correlation, rejects duplicate parameters, and exchanges code once.
- [ ] OAuth cancellation, unavailable provider, missing verifier, mismatched nonce, and callback replay have safe clean destinations and a working email fallback.
- [ ] Confirmation and recovery GETs only stage sealed candidates and redirect to clean pages. They cannot install general sessions, create profiles, change passwords, or accept invitations.
- [ ] Confirmation POST validates one-use signup proof and usable provider identity before installing ordinary credentials or finalizing bound intent. A user object alone is insufficient.
- [ ] Reset POST freshly verifies recovery proof with an isolated nonpersistent client. An ordinary session, signed candidate cookie, CSRF token, signup proof, or OAuth code cannot authorize password updates.
- [ ] Recovery credentials remain in request memory and never become ordinary cookies or study/profile authority. Wrong-purpose, malformed, expired, concurrent, and replayed proof fail closed.
- [ ] Reset success and failure consume local staged proof. Successful update clears local state, attempts global sign-out, and requires fresh login. An uncertain update is not retried automatically.
- [ ] Sensitive URLs are scrubbed through 303 redirects. Callback, connect, and link responses use no-store and no-referrer without token-bearing analytics or full-URL logging.

### Sealed state, onboarding, and M2 preservation

- [ ] Sealed cookies use purpose-separated HKDF, AES-256-GCM, random IVs, origin-bound authenticated data, version and expiry validation, strict payloads, and bounded size. No new secret is added.
- [ ] Intent expires after one hour; OAuth and staged links expire after ten minutes or the shorter known provider lifetime. Tampering, cancellation, missing cross-device state, and expiry clear hints and fall back safely.
- [ ] Signup onboarding binds to returned real user ID and verified normalized email. Concealed duplicates and a different identity cannot apply it. Existing immutable profiles win, including concurrent insertion.
- [ ] Google does not finalize old email-signup role/name intent. Missing state asks for explicit onboarding rather than inventing role or name.
- [ ] Continuation permits only the literal allowlisted routes and valid connect-token pattern. Test encoded, protocol-relative, scheme, backslash, query, fragment, control, whitespace, and dot-segment inputs.
- [ ] Continuation survives supported route switches and auth flows but never overrides role or student gates. Profile completion resolves pending invite before ordinary home/wait routing.
- [ ] Connect arrival consumes matching continuation but still independently validates the invite. Acceptance remains explicit and preserves verified email, student role, seven-day expiry, and atomic first-parent-wins checks.
- [ ] Account switching restores only validated continuation after sign-out and fresh CSRF. No callback or profile completion accepts an invite automatically.

### User-visible integration

- [ ] Public `/` remains an introduction. Dedicated auth routes survive direct URL, reload, and history navigation. Authenticated visits resolve before flashing forms.
- [ ] Forms recover from rejected requests, exceptions, and failed navigation. Duplicate submissions are suppressed. Uncertain account writes reconcile authoritative state before retry.
- [ ] Check-email refresh without trusted send context is neutral. Invalid confirmation/reset links have usable next actions. Success copy never fabricates mail delivery or provider authentication.
- [ ] Review keyboard order, reveal controls, error focus, live status, loading cleanup, and phone form-first hierarchy at 320px and 390px, plus 1280px and 200% reflow.
- [ ] Preserve exact supplied Lumi art, remove the visual-only remember control, and introduce no M3 features or mastery rewards.

## Required plugin gates after freeze

The installed instructions were read from these exact roots:

- `C:\Users\jdtig\.grok\installed-plugins\ponytail-3d1ab158\skills` for ponytail, ponytail-review, and ponytail-debt.
- `C:\Users\jdtig\.cursor\plugins\local\thermos\skills` for thermos and both thermo-nuclear review skills.
- `C:\Users\jdtig\.cursor\plugins\local\pstack\skills` for poteto-mode, its bug-fix playbook, all six Luna-mandated principles, no-comments, unslop, and technical-writing. TypeScript, type-system, TDD, behavior-test, blast-radius, and architect instructions were also read for the expected diff.

| Gate | Preparation disposition |
| --- | --- |
| ponytail-review | PENDING frozen code and caller tracing; no Ship verdict. |
| ponytail-debt | PENDING diff-only marker scan; no ledger rewrite. |
| Thermos security and quality | PENDING independent passes mediated by main after freeze. |
| pstack bug-fix verification | PENDING runtime evidence; no new feature or architectural redesign. |
| no-comments | PENDING scoped comment review; delegation follows main's authorization. |
| TypeScript, tests, shared API effects | PENDING implementation evidence and actual caller/test review. |
| unslop and technical-writing | Applied to this preparation document only. |
| local commit | NOT CREATED; preparation explicitly excludes commits. |

Laziness Protocol and Subtract Before You Add keep eventual fixes within this recovery scope and favor reuse over parallel auth logic. Minimize Reader Load favors one session and routing authority. Fix Root Causes requires a concrete failing case before a fix. Prove It Works and Sequence Work into Verifiable Units keep builder freeze, review, fixes, and Quinn's final evidence separate. None permits a PASS based on the checklist alone.

## Quinn handoff and completion evidence

After writers finish, coordinate focused auth and M2 regressions, the full suite, application typecheck, test typecheck, production build, and diff checks. Read package scripts and the test configuration at that time before selecting commands. Record exact commands, exit codes, counts, tested revision, and browser fixture evidence. New fixes invalidate affected earlier results until retested.

No tests, typechecks, build, browser checks, live authentication, or independent review ran during this preparation. No application file was edited by Luna. No account, email, live data, remote configuration, push, or deployment action was attempted.

Dep's report leaves Google readiness, Auth SMTP/templates/allowlists, provider throttle settings, and live migration/schema readiness externally unverified. Local mocked success cannot close these limits. Live flows require designated accounts and separate explicit scope.

Main's eventual local completion requires resolved release-blocking findings, actual plugin gate evidence, Quinn PASS on reviewed application code, a scoped conventional local commit with `Co-Authored-By: Grok 4.6 <noreply@x.ai>`, and clean worktree verification. No hash or approval is claimed here. Push and deployment remain unauthorized for this milestone even after local checks pass.

Preparation is ready. Await main's builder-DONE/freeze and full review instruction.
