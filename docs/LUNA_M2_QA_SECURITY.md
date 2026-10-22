# Luna M2 — narrow Thermos QA review

23 October 2026. HEAD inspected: `ff2d0f7fc740e0dd333376ad74e3e5216035536f` (application gate commit `5db4900`).

**Verdict: PASS with one low-priority QA finding. No credential/live-service leak or blocking test-isolation defect found.** This finding concerns a test's claimed race coverage, not a production defect.

Scope: only the uncommitted additions in `test/m2-connect.test.ts`, `test/m2-frontend.test.tsx`, and new `test/m2-invites.test.ts` (26 added cases). Retained the exact installed Thermos agent/skill rubric from the preceding review. Read supporting mocks and local code only to trace those cases; did not reopen the application audit or other review reports.

## Finding

**[P3] Make the obsolete Strict Mode response observably different.**

- Location: `test/m2-frontend.test.tsx:539`, test `Strict Mode waiting effect restart releases its request lock and ignores the obsolete completion`; specifically the shared resolver at lines 540–543.
- Confidence: high, established by tracing the mock and real `WaitScreen.checkAgain`.
- Both initial `/api/home` requests capture the same default `homeReply` (`needs_parent: true`, line 132), wait on the same `holdHome`, and resolve together (fetch mock, line 68). Processing the obsolete response would therefore produce the same waiting UI, no navigation, and an enabled Check again button. Those assertions pass whether one or both completions update the screen. The case verifies request-lock release during effect restart, but does not establish its advertised obsolete-completion protection.
- Suggested test-only correction for Luna: give the two requests independent responses/resolvers; resolve the current request as waiting, then resolve the obsolete request as linked or unauthorized. Assert that the late obsolete result neither navigates nor changes the current UI. Keep the existing lock-release assertion.

## Boundaries and behavioral checks

- **Isolation:** the configured test command uses process isolation and serial file execution. The added cases use existing per-case resets; new invite tests reset rows, profile, flags, call records, and synthetic environment values in `beforeEach`. File-local fetch/module mocks and environment overrides do not escape into another test process under this command.
- **Invite tests exercise real local code:** only server auth and the database transport are replaced. `POST /api/invites` still runs the real authorization/profile lookup, JSON parsing, invite service, data adapter, Gmail normalization, random token/hash generation, error envelope, and Resend mail formatter. Global fetch intercepts the Resend request without delegating to native fetch. Keys, sender, origin, and identities are synthetic; no environment files are loaded. Assertions cover authorization before writes/mail, Gmail rejection, fresh seven-day links, hash-only storage/response, parent-specific recent-send limits, provider failure rollback, and failed rollback returning INTERNAL.
- **Connect additions exercise real local handlers/services/data adapters:** session/cookie and admin database boundaries remain mocked. Bodyless accept and canonical session identity reach the actual route/service; mismatch and consumed-token cases assert zero RPC calls and unchanged state, so their rejection is not supplied by the RPC stub. The successful household/card transition uses the existing in-memory RPC implementation and does not execute SQL or verify database concurrency.
- **Frontend additions import real components and adapters:** only SDK/navigation/HTTP boundaries are mocked. Repeated form submissions, explicit acceptance after reopening, role-change guards, malformed responses, error focus, and preserving inputs on failure are asserted through rendered UI and captured calls. The role-choice step is a supplied fixture transition, not a claim to test the role form itself.

No other actionable findings. Mocked coverage does not establish live cookie exchange, mail delivery, SQL constraints, or deployed behavior. No PR discussion lookup was required because there are no medium-or-higher findings.

No tests were rerun; the supplied 116/116 result remains Quinn's evidence. This reviewer changed only this report using `apply_patch`; no test/application edits, live-service calls, credentials, nested agents, or git writes.
