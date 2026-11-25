# Quinn auth recovery — writer phase v1

Status: preparation; frozen Aria/Iris contracts and builder handoff pending. No QA PASS.

Inputs: AGENTS.md, Quinn skill, Alex auth recovery plan v1, existing M1/M2 tests.
Ownership: `test/**` and this report only. No staging, commit, application edits, installation, live authentication, mail, accounts, or deployment.

## Test strategy

Exercise real route handlers, cookie helpers, and rendered public components. Substitute only provider/network and database boundaries with controlled local fixtures. Never duplicate security or routing logic inside a mock of the application service under test.

| Alex acceptance | Planned evidence |
| --- | --- |
| 2.1–2.2 | Password/Google shared session; actual response cookie flags, rotation, expiry, logout; no credentials in JSON |
| 2.3 | Origin/CSRF rejection before provider calls; unsafe encoded/protocol-relative continuation; callback correlation; contract rate controls |
| 2.4 | Confirmation required/disabled provider responses; invalid/expired/replayed confirmation; neutral resend |
| 2.5 | Neutral known/unknown recovery requests; verified proof, expiry, wrong user, single use; privilege cleanup |
| 2.6, 3.5 | Pending name/role consumption and cleanup; immutable saved profile; connect continuation and explicit acceptance; parent/student role continuity |
| 3.1–3.4 | Public landing/navigation, dedicated auth/recovery states, thrown and rejected requests, pending cleanup, duplicate suppression, stale completions, input preservation, accessible errors |
| 4.1 | Existing M1/M2 validation, invite expiry/email/first-parent rules and household isolation preserved while superseded auth assertions are migrated |

Existing test migration targets: `m1-shell.test.tsx` browser-auth/reset/landing assertions; `m1-profile.test.ts` callback correlation and mutation CSRF; `m2-frontend.test.tsx` shared auth and automatic secure continuation; affected API mutation fixtures receive the frozen CSRF contract.

Cookie support now records cookie writes/options, allowing tests to inspect what actual server adapters emit rather than assuming security from a mock.

## Verification limits

No tests or builds run during preparation. Narrow execution waits for stable implementation targets; full suite, build, and fresh final QA wait for main's post-Luna request. No coverage percentage measured. DOM tests cannot prove browser layout, direct URL/history navigation, provider configuration, real emails, or live Supabase flows. These remain unverified unless separately exercised under the authorized scope.
