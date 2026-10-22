# QUINN TEST REPORT — v3

23 Oct 2026, Asia/Manila. **Independent M2 verdict: PASS, with documented coverage and service limits.** No application defect or blocking failed requirement was found. QA tests and this report remain unstaged and uncommitted for Luna's narrow QA-only follow-up and local commit. No push or deployment was performed.

## Verified result and code identity

Quinn independently ran the checks below; these are not Luna's earlier results. Main also verified the saved final test summary and exit status. The final suite passes **116/116**, with **0 failures, 0 skipped, 0 cancelled**, including **26 added cases**. Two existing domain contract tests pass separately and are not included in the 116 count.

- Reviewed application commit: `5db49003ec4b7e8d3d2e3a119cefaf7d843c4ef6` (`feat(m2): Add reviewed parent connection screens`).
- Checked-out HEAD before and after verification: `ff2d0f7fc740e0dd333376ad74e3e5216035536f` (`docs: Record Luna M2 gate and code commit`), branch `feat/lumio-m1-shell`.
- HEAD tree: `85cdc4dcc6337154f1498ef5942663fb146278a2`. The report-only child differs from the reviewed commit only in `docs/LUNA_REVIEW_v3.md`.
- Saved final identity evidence reports production diff exit 0, 84 production/configuration files, zero before/after or before/current SHA-256 manifest differences, and zero staged files. Production source, assets, schema, configuration, and dependencies remain unchanged.
- No QA commit exists from this run. Existing untracked instructions, Iris specs, session handoff, inspiration, and concurrent Luna review artifacts were preserved.

Full evidence directory: `C:\Users\jdtig\AppData\Local\Temp\lumio-m2-quinn-20261023-011500`. Every automated command below has its actual exit status recorded in the adjacent `.exit.txt` file.

| Check | Actual result | Evidence filename in the directory above |
| --- | --- | --- |
| Independent baseline `npm test` | PASS 90/90; exit 0 | `npm-test-baseline.log`, `npm-test-baseline.exit.txt` |
| Final `npm test` | PASS 116/116; fail 0; skip 0; exit 0; 15,652.1938 ms | `npm-test-final.log`, `npm-test-final.exit.txt` |
| Focused frontend and invite tests | PASS 75/75; exit 0 | `focused-additions.log`, `focused-additions.exit.txt` |
| Supplemental `node --import tsx --test src/domain/invite-contract.test.ts` with `TSX_TSCONFIG_PATH=test/tsconfig.json` | PASS 2/2; fail 0; skip 0; exit 0 | `supplemental-invite-contract.log`, `supplemental-invite-contract.exit.txt` |
| `npm run typecheck` | PASS; exit 0 | `typecheck.log`, `typecheck.exit.txt` |
| `node node_modules/typescript/bin/tsc --project test/tsconfig.json --noEmit` | PASS before and after test additions; final exit 0 | `test-typecheck.log`, `test-typecheck-final.log`, corresponding `.exit.txt` files |
| `npm run build` | PASS; exit 0; Next.js compiled, checked types, and generated 7/7 static pages | `build.log`, `build.exit.txt` |
| `git diff --check` | PASS; exit 0; normal LF-to-CRLF notices | `diff-check.log`, `diff-check.exit.txt` |
| Synthetic browser fixture rebuild | PASS; exit 0 | `browser-fixture-build.exit.txt` |
| Production identity | No differences in saved manifests or production diff | `production-before.sha256`, `production-after.sha256`, `finalization-git-identity.log` |

Commands used the existing Node runtime under `C:\Program Files\nodejs`, node:test, tsx, happy-dom, and built-in Node coverage. No framework or dependency was added. The build verifies the unchanged production baseline; the final test TypeScript check verifies the QA additions. Report completion does not invalidate these results. An unchanged docs-only commit does not require another full run.

## Requirements and DoD mapping

Inputs: Rex v1.3 in `REX_REPORT_v1.md`, Alex v1.0 tasks 2.1–2.7, Aria blueprint, Iris M2/student-home specs, Jules progress, session handoff precedence, and Luna v3 notes. Current theme/shell decisions take precedence over historical chrome and asset statements. M3 guide serving/actions, reporting, uploads, and mastery rewards are outside this verdict.

| M2 DoD / relevant AC | Independent evidence | Result and boundary |
| --- | --- | --- |
| 2.1 Send connect link; US-002 | `parent send mails one canonical Gmail link, stores only its hash, and creates a fresh seven-day invite per send`; parent form success/failure, empty list after send, rate-limit, invalid JSON/Gmail, auth and rollback tests | PASS locally. Exactly one mocked mail call per successful send; sending does not link a child. Actual inbox delivery is unverified. |
| 2.2 Seven-day expiry | `an expired connect link is 410 and changes nothing`; preview 410 and accept LINK_EXPIRED UI cases; invite expiry assertion | PASS. Seven days remains Alex's adopted default, not a newly invented requirement. |
| 2.3 New child completes link; US-003 plus US-001 account guard | `signup awaiting confirmation stays on link and sends no role, return, or accept`; `signup with session and no role leaves for role without token or profile write`; `signup without role requires reopening the link after choosing student and still needs explicit accept` | PASS under current contract: register, choose role if needed, reopen original link, explicitly accept. No automatic acceptance or token forwarding. Role selection in the reopen test is a fixture transition; separate existing role tests cover the actual form. |
| 2.4 Existing child accepts; US-004 | `a first explicit bodyless accept uses canonical session Gmail and opens the household gate`; `accept identity comes from the authenticated session even when the stored profile and body match the invite`; mismatch, role, bodyless-client and duplicate-accept cases | PASS. Session identity wins over body/profile identity, and a different Gmail is refused. |
| 2.5 First parent wins; US-005 | `the first parent wins and the same student can accept again`; `a second accept is ignored and the first parent stays`; separate accepted/ignored replay tests for a different student sharing canonical Gmail | PASS for actual local route/service decisions and the mocked RPC model. Does not prove deployed SQL locking or concurrency. |
| 2.6 Gate opens; M2 part of US-006 and US-001 | `an unlinked student resolves to /wait, including when the guide route does not exist`; bodyless accept opens household gate; waiting remains waiting until linked; Check again redirects once linked; signed-out/role/parent guards | PASS for M2 household/gate behavior. Serving working guide copies and upload actions belongs to later milestones and is not claimed. |
| 2.7 Parent sees linked children; US-005 parent visibility | `a parent home lists only that parent's child`; `parent home lists returned first names in order, including duplicates, at both widths`; malformed-list, empty-list and private-UI removal tests; BrowserOS `browser-1.json` | PASS. Only linked first names render; duplicate names remain distinct entries, no child email rendering, no partial list on malformed data. |

Additional account and failure coverage: Google callback does not create a profile; parent/student role saves once; teacher/second-role refusals; Gmail canonicalization; sign-out/session clearing; missing sessions/roles; role change to student clears parent UI and redirects; 401/403 removal of private content; fixed safe error copy; typed invalid-email field independent of provider wording; malformed successful responses fail safely; pending invite/sign-in/accept submissions send once; field errors focus the associated control; failed requests remain retryable.

## Added tests and lifecycle evidence

The 26 material additions close previously unexecuted invite-send and submission/contract gaps:

- `test/m2-connect.test.ts`: five cases for explicit bodyless acceptance, session identity over body/profile claims, consumed-token replay by another user (accepted and ignored states), and household session/role guards.
- `test/m2-frontend.test.tsx`: ten cases for invite/sign-in submit locks, blank/non-Gmail field focus, role selection then reopen and explicit acceptance, household role changes, malformed household/accept/invite responses, and StrictMode request-lock recovery.
- `test/m2-invites.test.ts`: eleven cases exercising the actual invite route/service, token generation, Gmail normalization, hash-only persistence, seven-day expiry, auth/role refusals, malformed input, missing mail configuration, parent-specific send allowance, provider/transport rollback, and rollback failure mapping.

The existing five Luna regressions also pass: four departed-screen completion cases (wait, accept, auth, parent invite) and typed invite-field handling. They verify that delayed completions cannot redirect a later screen.

**LOW coverage limitation:** the StrictMode waiting test supplies identical waiting responses and releases them together. It proves recovery of the request lock after effect restart; it cannot distinguish whether the obsolete completion was ignored. Separate departure tests cover stale completions after navigation, but they do not prove differing out-of-order replies during StrictMode replay. No application defect was found and no test churn is required for this note.

Luna's narrow QA addendum and three independent QA reviews are already complete with no blocking findings (`LUNA_REVIEW_v3_QA_ADDENDUM.md`, `LUNA_M2_QA_SECURITY.md`, `LUNA_M2_QA_QUALITY.md`, `LUNA_M2_QA_COMMENTS.md`). The LOW note is counted once. Their review does not replace Quinn's independent executions. QA files remain uncommitted for the narrow follow-up/local commit; no application rewrite or repeat broad gate is required. If a later review actually changes executable tests or application behavior, validate the affected changes then.

## Test layers and service limits

Routes, services, adapters, and React components are real local implementations. Tests replace external authentication, database transport/RPC, and mail fetches with synthetic fixtures. These are route/contract and component integration checks; they are not real-database integration tests or production end-to-end flows. Process isolation and serial test files contain module/fetch replacements; cases reset synthetic state and unmount roots.

No real account, Resend send, OAuth exchange, live cookie round trip, Supabase read/write, migration execution, SQL constraint, or production concurrency was exercised. In-memory first-parent outcomes do not establish production SQL correctness under races. No secrets are printed or staged. No live-service release approval is implied.

## Independent BrowserOS observations

Evidence uses BrowserOS neo and the inspected/rebuilt isolated fixture `D:\PORTFOLIO\lumio-m2-mock-ui`, port 3012, importing actual components and mocking all fetch/auth with outbound connections blocked by CSP. The user's server on 3010 was left untouched. The observations below are Quinn's saved results, not inherited Luna observations.

| Saved artifact | Actual observation |
| --- | --- |
| `browser-1.json` | Parent first names `Zoe`, `Lin`, `Lin` appear at 320 and 1280 px. No private child email is rendered. Recorded requests are GET `/api/me` and `/api/home`. Measured control heights are 44 px; scroll width 305 at viewport 320, 1280 at viewport 1280. |
| `browser-2.json` | At 320 px, explicit acceptance makes one POST with null body. Wrong-address refusal is visible and focused; no linkage is claimed. The synthetic route token is absent from the DOM. |
| `browser-3.json` | Waiting mount and Check again produce two GET `/api/home` calls; the page remains waiting with the explicit waiting message, at 320 px without overflow. |
| `browser-4.json` | Signed-out connect view records preview and session GETs only; no accept POST, and route token absent from DOM. The create-account state includes password confirmation. |
| `browser-5.json` | Keyboard submission from Create account focuses `connect-confirm` on password mismatch, sets `aria-invalid=true` and `aria-describedby=connect-confirm-error`, records zero POSTs, and retains no token in DOM. All seven measured controls are 44 px; scroll width 305 at viewport 320. |

No screenshot artifact was captured; earlier screenshot transport stalls limit visual evidence. These DOM, request, focus, and size observations do not establish a screenshot-based visual pass or production-browser authentication. No further browser or screenshot attempt is needed. Successful acceptance/navigation and signup/reopen behavior are established by automated local tests, not inferred from these mismatch browser observations.

## Coverage and remaining risk

Final built-in Node coverage: **92.63% lines, 86.97% branches, 95.51% functions**. The denominator contains source modules loaded by the configured `src/**/*.ts` and `src/**/*.tsx` coverage run. It does not make unimported Next.js page wrappers, SQL, external services, or the entire repository covered; the separate `src/domain/invite-contract.test.ts` run is not merged into these percentages.

Only `src/components/role-screen.tsx` falls below 80% line coverage (69.23% lines, 50.00% branches). Remaining role-save/error/choice branches carry residual account-flow risk; the reopen test supplies a role transition rather than exercising every role-form branch. Existing role tests and current M2 guard tests pass. This is a risk note, not a demonstrated failure or reason to expand this milestone.

Additional branch coverage below 80%: `src/data/connect.ts` 56.10%, `src/lib/lumio-client.ts` 66.67%, `src/data/cards.ts` 70.97%, `src/components/landing.tsx` 77.92%, `src/services/connect.ts` 78.00%, and `src/lib/auth-errors.ts` 78.79% (plus the role screen above). Unexercised database-error/fallback and broader M1 auth/card branches remain limits. Core M2 acceptance and lifecycle requirements have direct passing cases; no percentage-only tests were added.

Per-module percentages below are copied from the final saved coverage report (lines / branches / functions; uncovered source lines retained):

```text
ℹ file                     | line % | branch % | funcs % | uncovered lines
ℹ -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
ℹ src                      |        |          |         |
ℹ  app                     |        |          |         |
ℹ   api                    |        |          |         |
ℹ    connect               |        |          |         |
ℹ     [token]              |        |          |         |
ℹ      accept              |        |          |         |
ℹ       route.ts           | 100.00 |    94.12 |  100.00 |
ℹ      route.ts            | 100.00 |   100.00 |  100.00 |
ℹ    home                  |        |          |         |
ℹ     route.ts             | 100.00 |   100.00 |  100.00 |
ℹ    invites               |        |          |         |
ℹ     route.ts             | 100.00 |    94.44 |  100.00 |
ℹ    me                    |        |          |         |
ℹ     route.ts             | 100.00 |   100.00 |  100.00 |
ℹ    profile               |        |          |         |
ℹ     route.ts             | 100.00 |   100.00 |  100.00 |
ℹ    sign-out              |        |          |         |
ℹ     route.ts             | 100.00 |   100.00 |  100.00 |
ℹ   auth                   |        |          |         |
ℹ    callback              |        |          |         |
ℹ     route.ts             |  97.33 |    85.00 |   83.33 | 52-53
ℹ  components              |        |          |         |
ℹ   account-gate.tsx       |  92.39 |    80.77 |  100.00 | 67-72 92
ℹ   connect-auth.tsx       | 100.00 |    89.58 |   96.43 |
ℹ   connect-screen.tsx     |  98.56 |    95.28 |   91.67 | 35-36
ℹ   home-screen.tsx        |  99.41 |    94.20 |  100.00 | 56
ℹ   landing.tsx            |  89.08 |    77.92 |   78.95 | 104-105 113-116 119 144-154 167-168 190-191 206-214 238 243 249-250 258-270 276 282-283 295-307 311-313 317-322 515 582-585
ℹ   role-screen.tsx        |  69.23 |    50.00 |   57.89 | 76-77 83-89 94-148 151-160 205 225
ℹ   shell.tsx              |  95.20 |    82.86 |   90.48 | 21 64-66 101-102
ℹ   student-home.tsx       | 100.00 |    85.71 |   83.33 |
ℹ   wait-screen.tsx        | 100.00 |    94.12 |  100.00 |
ℹ  data                    |        |          |         |
ℹ   cards.ts               |  88.42 |    70.97 |  100.00 | 54-56 68 76-79 85-87
ℹ   connect.ts             |  93.33 |    56.10 |   92.86 | 80 105 121 124 137-140 143-144
ℹ   db.ts                  | 100.00 |   100.00 |  100.00 |
ℹ   households.ts          |  98.63 |    90.32 |  100.00 | 56
ℹ   invites.ts             |  97.10 |    91.30 |  100.00 | 53-54
ℹ   profiles.ts            |  96.15 |    86.49 |   94.44 | 76 93-95
ℹ  domain                  |        |          |         |
ℹ   email-key.ts           | 100.00 |    88.10 |  100.00 |
ℹ   guides.ts              |  94.12 |    95.45 |   93.75 | 15-16
ℹ   ids.ts                 | 100.00 |   100.00 |  100.00 |
ℹ   invite-response.ts     |  93.94 |    93.33 |  100.00 | 19-20
ℹ   name.ts                | 100.00 |    95.83 |  100.00 |
ℹ   role.ts                | 100.00 |   100.00 |  100.00 |
ℹ  lib                     |        |          |         |
ℹ   auth-errors.ts         | 100.00 |    78.79 |  100.00 |
ℹ   env.ts                 |  95.83 |    90.00 |  100.00 | 20
ℹ   form-checks.ts         | 100.00 |    97.22 |  100.00 |
ℹ   http.ts                | 100.00 |    95.65 |  100.00 |
ℹ   logger.ts              | 100.00 |    91.67 |  100.00 |
ℹ   lumio-client.ts        |  86.49 |    66.67 |   95.45 | 17 77-78 80 95 103-104 107-108 111-127 138-140 178 180 194 207 209-210
ℹ   m2-client.ts           | 100.00 |    98.44 |  100.00 |
ℹ   resend.ts              |  91.25 |    92.59 |  100.00 | 22 52-57
ℹ   supabase               |        |          |         |
ℹ    admin.ts              | 100.00 |   100.00 |  100.00 |
ℹ    cookie-client.ts      | 100.00 |    91.67 |  100.00 |
ℹ    cookie-options.ts     | 100.00 |    92.86 |  100.00 |
ℹ    public-config.ts      |  96.77 |    96.00 |  100.00 | 21
ℹ    server.ts             |  96.30 |    93.33 |  100.00 | 16
ℹ   tokens.ts              | 100.00 |   100.00 |  100.00 |
ℹ  services                |        |          |         |
ℹ   authz.ts               |  86.67 |    85.42 |  100.00 | 21 67-70 73 84-85 98-101 104-105
ℹ   connect.ts             |  85.25 |    78.00 |  100.00 | 68 79-80 96-97 100-103 106-108 111-112 117 120-122
ℹ   errors.ts              |  93.88 |    95.00 |   93.33 | 27-29
ℹ   home.ts                |  96.10 |    85.19 |  100.00 | 65 70-71
ℹ   invites.ts             |  94.95 |    87.88 |  100.00 | 52 93-96
ℹ   profile.ts             |  92.70 |    84.78 |  100.00 | 17 91 104 106-107 123 127-130
ℹ -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
ℹ all files                |  92.63 |    86.97 |   95.51 |
ℹ -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
```

## Warnings and final disposition

The run retains Node experimental module-mocking and DEP0205 module.register deprecation notices, React act warnings, intentional negative-case request/error logs, and Git LF-to-CRLF notices. They are visible in the full logs and did not fail the commands; they do not substitute for a real-service check. No new dependency, suppression, production fix, or broader cleanup was introduced.

M2 independent QA is complete with no blocking finding. All three QA test files and this report remain uncommitted. Narrow QA review is already PASS WITH NOTE and its final-report/local-commit follow-up can proceed without waiting for more QA or repeating unchanged documentation checks. No further seat was invoked by Quinn, no M3 work was started, and no commit, push, or deployment was performed by this QA run.
