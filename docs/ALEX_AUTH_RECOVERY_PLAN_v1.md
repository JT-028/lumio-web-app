# ALEX AUTH RECOVERY PLAN — v1.0

Project: Lumio. Date: 2026-10-25 (Asia/Manila).
Status: Planning complete; implementation and fresh review/QA pending.
Amendment to `ALEX_PLAN_v1.md`, inserting a bounded recovery milestone after M2 and before M3.

## Inputs and precedence

- Owner's current recovery scope and supplied audit findings; no repeat audit is required.
- Rex Report v1.3 (`REX_REPORT_v1.md`), Alex Plan v1.0, Aria Blueprint v1.0.
- `IRIS_LOGIN_SPEC_v1.md`, `IRIS_M1_SPEC_v1.md`, `IRIS_M2_SPEC_v1.md`, `IRIS_STUDENT_HOME_SPEC_v1.md`, and `SESSION_HANDOFF_2026-10-22.md` with its later amendments.
- `DEP_M2_DEPLOYMENT.md`: M2 shipped at `c95f8fb`; provider READY, historical local Luna/Quinn PASS, remote Actions startup failure, public browser verification unavailable, no live auth/mail/database proof.
- Local starting point verified: clean `4ff8fc6`, branch `feat/lumio-m1-shell`. Historical deployment approval and test passes do not cover this milestone.

This amendment supersedes the older same-page-only login/signup, prohibition on reset, browser-readable session handling, and instruction to reopen an invite manually after authentication. Existing product rules and unaffected screens remain authoritative. Current owner instructions retain the explicit agent-orchestrator override with named Squad seats; this Alex-only step neither delegates nor writes application code. Future work follows the ownership below.

## Scope and boundaries

Deliver a public `/` landing, addressable `/login` and `/signup`, email/password and Google authentication, email confirmation, password recovery/update, and one consistent server session using the blueprint's HttpOnly boundary. Restore pending first name/role intent and invite continuation through authentication without weakening authorization.

Keep the current Lumio theme, supplied Lumi files and existing usable framing; no new asset, crop, pose, character, or Lux task is needed. Do not advertise guides or other future features as usable. Preserve parent/student roles, immutable saved role, explicit invite acceptance, seven-day invite expiry, first-parent-wins, and the unlinked-student gate.

Do not implement M3 or redesign the home dashboards. M3 guides, M4 cards, M5 advice, and M6 uploads keep their order and scope. Mastery rewards stay unspecified. Do not edit `booklet-app`, the HTML hub, or unrelated dependency/CI concerns.

## Critical path and ordered acceptance

Aria session/security/continuation contract + Iris route/state specification → Theo server auth foundation → Theo confirmation/recovery/continuation with Jules consuming frozen contracts → Quinn verification → Luna review/fixes/local commit → Quinn final verification of reviewed revision.

One recovery milestone, split into these ordered local acceptance gates; these are not replacements for roadmap M3–M6:

| Gate | Effort | Deliverable | Acceptance |
| --- | --- | --- | --- |
| R1: Contracts ready | S | Aria amendment and Iris recovery spec | Every auth transition, session rule, security control, and UI state below has a named contract and owner. |
| R2: Server auth ready | M | Server session foundation plus confirmation/recovery | Mocked local requests prove password and Google flows share the HttpOnly session path, refresh/logout work, and invalid callbacks/recovery fail closed. |
| R3: Complete local journey | M | Landing, auth screens, continuation integration | Direct URLs and phone forms work; confirmation/recovery finish; invite and onboarding intent resume without automatic acceptance or gate bypass. |
| R4: Reviewed local repair | M | Fresh Luna and Quinn reports plus local commit | Security review PASS and final regression/type/build checks PASS on the reviewed code, with browser and live-service limits stated explicitly. |

## Implementation checklist

All tasks below have binary done states. `Q` means Quinn must verify with meaningful automated coverage; browser checks are also named where needed. Complexity: LOW/MED/HIGH. SEC: security-sensitive; EXT: provider integration, locally exercised with mocks unless designated accounts are supplied.

### R1 — contracts and screen states

- [ ] 1.1 Aria / API [HIGH, SEC]: Specify the server-owned session lifecycle and auth operations, including password registration/login, Google start/callback, confirmation/resend, recovery request/update, refresh, and sign-out. **DoD:** An architecture amendment names request/response/error contracts and cookie creation/rotation/expiry/clearing for every operation, with no browser-readable access/refresh token dependency. Q.
- [ ] 1.2 Aria / logic [HIGH, SEC]: Define trusted continuation and pending onboarding handling. **DoD:** A transition table covers login/signup switches, confirmation, OAuth, reset, `/role`, `/wait`, and `/connect/[token]`, specifies bounded lifetime/consumption/cleanup and cross-device fallback, and never treats supplied role/name/return data as authority. Q.
- [ ] 1.3 Aria / API [HIGH, SEC]: Freeze origin/CSRF, OAuth correlation, redirect, and abuse controls appropriate to existing project infrastructure. **DoD:** The contract names protected operations, callback exceptions and validation, trusted origin source, allowed destinations, explicit rate limits/keys/window/enforcement/failure behavior, and safe error/logging policy. Q.
- [ ] 1.4 Iris / UI [MED]: Specify public landing, dedicated auth routes, check-email/resend, forgot-password, reset-password, and callback failure states using Aria's fields. **DoD:** A route/state specification includes loading, success, invalid/expired links, retry, keyboard/focus, accessible status, and phone/desktop layouts; auth controls precede decorative hero/art on phones.
- [ ] 1.5 Aria + Iris / handoff [LOW]: Reconcile contract and screen assumptions. **DoD:** Both artifacts cross-reference one agreed transition table, explicitly supersede outdated spec sections, and give Theo/Jules/Quinn a matching contract with no invented API fields.

### R2 — server foundation and recovery

- [ ] 2.1 Theo / API [HIGH, SEC, EXT]: Implement the frozen server auth operations and session integration. **DoD:** Email/password and Google establish the same server-validated session, server-rendered protected routes and `/api/me` agree after refresh, and sign-out clears that session without relying on browser SDK storage. Q.
- [ ] 2.2 Theo / logic [HIGH, SEC]: Close session-boundary inconsistencies. **DoD:** Access/refresh credentials are absent from client JSON/storage and JavaScript-readable cookies; production cookies are HttpOnly, Secure and SameSite=Lax with bounded lifetime/scope; refresh rotation reaches the response and logout/expired sessions cannot reopen protected content. Q.
- [ ] 2.3 Theo / API [HIGH, SEC]: Implement R1 security controls. **DoD:** Cross-origin/forged mutations, uncorrelated OAuth callbacks, unsafe or malformed return URLs, and excessive auth/recovery attempts are rejected by tests, including encoded/protocol-relative destinations, while valid callbacks still work. Q.
- [ ] 2.4 Theo / API [HIGH, SEC, EXT]: Implement email confirmation and resend. **DoD:** Unconfirmed users cannot bypass confirmation through ordinary signup/login, valid confirmation enters the shared session/onboarding flow, invalid/expired/replayed links create no unauthorized session, and resend responses avoid disclosing account existence. Q.
- [ ] 2.5 Theo / API [HIGH, SEC, EXT]: Implement password recovery and update. **DoD:** Recovery request returns a neutral result for known/unknown addresses, update requires a valid recovery context, invalid/expired/replayed contexts fail safely, and completion leaves no reusable recovery privilege. Q.
- [ ] 2.6 Theo / logic [HIGH, SEC]: Implement pending onboarding and invite continuation. **DoD:** First name/role intent survives the supported confirmation path, is validated before one-time profile creation, never overwrites an existing profile, and a valid invite resumes at its preview/explicit-accept screen after auth/onboarding. Q.

Cross-device or missing-context confirmation must remain usable: authenticate as supported, then ask for missing role/name or reopen the original invite when secure restoration is unavailable; never guess values or elevate a role. Aria must document this boundary rather than promise browser-only state survives across devices. Existing M2 invite-proof confirmation behavior must retain its documented validation; ordinary auth must not acquire a new confirmation bypass.

### R3 — screens and integration

- [ ] 3.1 Jules / UI [MED]: Separate landing from auth. **DoD:** `/` renders a public introduction with working login/signup navigation, `/login` and `/signup` load directly and survive reload/history, and authenticated auth-route visits follow the agreed role/gate/continuation rules without form flashing. Q + browser.
- [ ] 3.2 Jules / UI [MED]: Wire password and Google controls to Theo's contracts. **DoD:** Both dedicated routes complete their intended server flow, all async submissions recover from rejection/exception using guaranteed cleanup such as `try/finally`, duplicate submissions are suppressed, and recoverable errors retain only appropriate nonsecret input. Q.
- [ ] 3.3 Jules / UI [MED]: Wire confirmation/resend and recovery/update screens. **DoD:** Every visible reset/resend control performs its named operation, pending/completed/error states are accessible, invalid links provide a usable next action, and successful reset exits recovery mode through the agreed destination. Q + browser.
- [ ] 3.4 Jules / UI [MED]: Repair phone hierarchy and misleading controls. **DoD:** At 320px and a representative phone viewport the heading/form appear before decorative content with no horizontal overflow, desktop remains usable at 1280px, and the visual-only remember control is removed unless Aria specifies and Theo implements tested persistence semantics. Q + browser.
- [ ] 3.5 Jules + Theo / logic [HIGH, SEC]: Integrate connect and role transitions. **DoD:** Valid invite continuation survives login/signup switching, OAuth, confirmation and role completion as specified; a parent or wrong-email account cannot accept, an unlinked student can reach connect but cannot study, and no callback auto-accepts an invite. Q.

Do not duplicate the legacy browser-SDK auth path on `/connect`; reuse the shared server contract while preserving invite preview, failure copy and explicit acceptance. Credentials and raw invite/recovery tokens must not enter persistent browser storage, logs, analytics, error messages, or reports. Aria owns their necessary transport and cleanup.

### R4 — review and verification

- [ ] 4.1 Quinn / tests [HIGH, SEC]: Add regression coverage alongside the frozen contracts, in files separate from builder edits. **DoD:** Tests cover both providers; confirmation on/off provider responses; thrown/network failures and loading cleanup; session refresh/expiry/logout; pending intent; safe redirects/origin/CSRF/rate limits; recovery misuse; invite switching/expiry/wrong-account/first-parent rules; and parent/student/null-role routing. Q.
- [ ] 4.2 Quinn / UI verification [MED]: Exercise local routes with controlled fixtures. **DoD:** A report records direct URL/history behavior, phone/desktop form hierarchy, keyboard/focus/status behavior and supplied Lumi preservation, marking any unavailable browser check as unverified rather than PASS.
- [ ] 4.3 Luna / review [HIGH, SEC]: Review the full repair and apply safe fixes, following Luna's required review workflow. **DoD:** A new report gives PASS with no unresolved release-blocking findings, references actual evidence and limitations, and a local conventional commit contains only the recovery scope with the required co-author trailer.
- [ ] 4.4 Quinn / verification [MED]: Validate the final reviewed code revision. **DoD:** Relevant auth/M2 regressions, full existing test suite, application/test typechecks, production build and diff checks pass; the report records revision, commands, counts and any service/browser gaps, and any post-test code fix is retested before final PASS.

## Ownership and handoffs

- **Aria and Iris next, together:** Aria owns auth/session/data/API/security/continuation decisions; Iris owns screens, layout, copy and accessibility. Suggested deliverables: `ARIA_AUTH_RECOVERY_BLUEPRINT_v1.md` and `IRIS_AUTH_RECOVERY_SPEC_v1.md`. Aria resolves API conflicts; Iris does not invent fields. Hand off this amendment plus Rex v1.3 and the referenced current specs.
- **Theo:** Backend/server auth and shared session/continuation implementation after R1. Hand off exact contracts, changed files and mocked evidence to Jules and Quinn. No broad schema redesign; document any narrowly necessary migration and do not apply it to a live database in this milestone.
- **Jules:** Public landing and auth/confirmation/recovery pages plus affected connect/role integration, after contract freeze. Keep edits separate from Theo and Quinn; serialize any shared-file change. Preserve supplied art. No home/library feature expansion.
- **Quinn:** Tests may be authored alongside builders in separate files; final execution follows integration and Luna fixes. Report mocked behavior separately from real provider behavior.
- **Luna:** Security/quality review, safe fixes, local commit only. Include `Co-Authored-By: Grok 4.6 <noreply@x.ai>`. Quinn verifies the resulting application revision.
- **Dep:** No deployment task in this milestone. Record any future provider redirect/template configuration prerequisite by name and purpose, without values or remote changes.

## Security decisions Aria must make concrete

The HttpOnly requirement is fixed; do not silently substitute the default browser SDK cookie/session model. Aria selects compatible provider integration and specifies how existing sessions migrate or safely reauthenticate. Passwords stay with Supabase, and saved profile role remains authoritative.

CSRF defenses must include login/session-establishing and account-changing operations, not only already-authenticated writes. SameSite/CORS alone are not a complete acceptance argument. Google/confirmation/recovery entry points need flow-specific validation without blocking legitimate provider navigation. Use configured trusted origins rather than unvalidated request host/forwarded headers for callback and email URLs.

Rate limiting must be enforceable in the deployment model, with documented shared-state or provider guarantees; a process-local map alone is not proof across Vercel instances. Keep generic recovery/resend responses and bounded provider/network failure handling. Define recovery-session restrictions, token cleanup, session rotation and the disposition of prior sessions after password change.

## Verification limits and completion

Local implementation, mocked provider journeys, review, and tests are authorized. Do not create app accounts, send real emails, attempt live authentication, mutate a live database, change remote auth configuration, push, or deploy. Live end-to-end proof requires designated test accounts and explicit scope later; it is not necessary to implement and assess the local repair. Document required provider setup without secrets, and report live flows as unverified until exercised under that authorization.

There is no current product blocker requiring a new requirements round. Contract choices belong to Aria, with Iris consuming them. A genuinely unavailable integration prerequisite must be documented with its affected acceptance item; do not mask it with placeholder success. Finish this milestone at R4 locally and hand back the evidence before beginning M3. No new production authorization is implied by the prior M2 release.
