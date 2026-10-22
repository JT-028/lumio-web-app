# Luna M2 — independent Thermos security review

Date: 23 October 2026. Reviewer: thermo-nuclear-review-subagent.

## Result

**No remaining actionable findings in the final inspected working tree.** No critical, high, medium, or low defect is reported. This is a diff-scoped review, not a release, deployment, or live-service approval.

HEAD remained `fcc8b7f0e65fd9f2893639f21899cb671dffeb2a`. Luna was editing concurrently. The reviewer read the initial frontend implementation, observed the subsequent lifecycle guards, and verified the updated code before issuing this result. Resolved observations below must not be counted as open findings.

## Scope and method

Read the exact installed instructions:

- `C:\Users\jdtig\.cursor\plugins\local\thermos\agents\thermo-nuclear-review-subagent.md`
- `C:\Users\jdtig\.cursor\plugins\local\thermos\skills\thermo-nuclear-review\SKILL.md`

Inspected the live tracked diff against HEAD and full contents of these new files; did not substitute the builder's report for inspection:

- Modified: `src/app/globals.css`, `src/components/account-gate.tsx`, `src/components/home-screen.tsx`, `src/components/wait-screen.tsx`, `test/m1-shell.test.tsx`, `test/support/dom.ts`.
- New: `src/app/connect/[token]/page.tsx`, `src/components/connect-auth.tsx`, `src/components/connect-screen.tsx`, `src/lib/m2-client.ts`, `test/m2-frontend.test.tsx`.

Consulted `JULES_M2_PROGRESS.md`, the relevant M2 and student-home Iris requirements, Aria's contracts, and `SESSION_HANDOFF_2026-10-22.md`. Retained the superseding themed shell, generic connect title, deliberate OAuth/role return flow, and M2-only feature scope.

Traced consumers through the existing API routes, auth/profile services, Supabase browser/server/callback helpers, middleware, HTTP response sealing, household readers, connect data adapter, and acceptance SQL. Existing server code was context only; this report does not raise untouched backend issues.

## Security and regression evidence

- **Session identity and explicit acceptance:** `ConnectScreen.accept` and `m2-client.acceptConnect` send only a bodyless POST. The accept route calls `requireUser` and `requireStudent`; the service compares the session's canonical email. Editable auth email and client role do not authorize a household write. Preview and auth completion never accept automatically.
- **First parent and replay:** `services/connect.ts` delegates to `data/connect.ts` and `accept_connect_invite`. The SQL locks the invite, checks student role/email and prior consumption, and uses the household uniqueness constraint with `ON CONFLICT (student_id) DO NOTHING`. A later invitation cannot replace the first parent. The frontend treats accepted and ignored results separately and discards returned IDs/reasons.
- **Privacy and error output:** preview, accept, and household adapters reconstruct allowlisted data. Parent UI renders child first names only, in returned order, including duplicates. Fixed auth/API messages suppress provider bodies. Token use is confined to the route/request path, with encoded path construction, generic metadata, and no-referrer metadata/request policy; no token is forwarded to OAuth or `/role`.
- **Guards and closed features:** `/wait` uses household status and follows 401/role-required/parent/linked-student destinations. Parent home cannot render a student household response as a parent form. The linked-student home continues using `/api/me`; the existing inert guide/course/section shell remains inert. No M3 routes, study actions, rewards, or second-parent UI were introduced.
- **Request handling:** duplicate accept and invitation submission locks, recoverable network errors, terminal accept errors, malformed response rejection, private-content removal on 401, and post-accept navigation retry were inspected and exercised with mocks.

## Concurrent lifecycle fixes verified

An initial test run reproduced four redirects from departed components. The existing test file already contained the four regression cases when this reviewer read it; this reviewer did not author them. Luna subsequently added generation guards, and all four cases passed in the final run.

| Current location and symbol | Observation verified resolved |
| --- | --- |
| `src/components/wait-screen.tsx:30`, `WaitScreen.checkAgain` | A pending household response after unmount no longer redirects a newer connect screen to `/home`; effect cleanup at line 20 invalidates the response. |
| `src/components/connect-screen.tsx:78`, `ConnectScreen.accept` | A completed accept from a departed screen no longer redirects the replacement screen to `/wait`; cleanup at line 63 invalidates the operation. |
| `src/components/connect-auth.tsx:101`, `ConnectAuth.submit` | A delayed profile read after the auth form unmounts no longer calls the old session callback and redirects to `/role`; guards also follow both email SDK calls. |
| `src/components/home-screen.tsx:93`, `HomeForm.onSubmit` | A late invite rejection after unmount no longer redirects the replacement connect screen to `/`. This invite-completion pattern also existed before this slice and is not reported as a new M2 vulnerability. |

Line numbers describe the final inspected sources; symbols identify the cases if concurrent edits shift lines.

## Verification and limits

- Initial mocked frontend run: 71 tests, 67 passed and four lifecycle cases failed. All 18 M1 shell tests passed in that run.
- Final mocked run of `test/m2-frontend.test.tsx`, `test/m2-connect.test.ts`, and `test/m1-session.test.ts`: **60 passed, zero failed**. This includes all 53 current frontend cases, all four lifecycle regressions, and existing session/connect route tests.
- Test/application TypeScript check using `test/tsconfig.json`: no diagnostics. `git diff --check`: passed; only normal LF/CRLF normalization notices.
- No independent production build or real-browser visual pass was performed by this reviewer. No credentials, environment-file contents, real accounts, mail, OAuth exchange, or live database operations were used. Mocked route tests do not prove deployed SQL execution or live cookie behavior.
- No PR/MR discussion was consulted: the rubric's conditional discussion step was not triggered by any remaining medium-or-higher finding. No other review report was used to source findings.

Only this assigned report was written. No application/test edits, nested agents, git writes, commits, pushes, or network writes were performed by this reviewer.
