# Luna M2 QA addendum

Date: 23 October 2026. Narrow review base: `ff2d0f7fc740e0dd333376ad74e3e5216035536f`. Reviewed application commit: `5db49003ec4b7e8d3d2e3a119cefaf7d843c4ef6`.

## Status

Narrow review PASS WITH NOTE. No blocking test-isolation, assertion, credential, or external-service finding. One deduplicated LOW coverage limitation remains accepted below. The production review in `LUNA_REVIEW_v3.md` is unchanged.

Quinn is complete with independent PASS. Luna read the finalized `QUINN_REPORT_v3.md`, and main confirmed the saved final log and authorized the local QA-only commit. The single LOW note remains nonblocking. No further application or test changes were required.

## Scope and evidence

Reviewed only Quinn's 26 added QA cases in these files:

- `test/m2-connect.test.ts` adds five route cases.
- `test/m2-frontend.test.tsx` adds ten component cases.
- `test/m2-invites.test.ts` adds eleven invite-route and transport cases.

Read supporting resets, mocks, runner configuration, and the directly exercised local functions to establish test boundaries. No application re-audit, source edit, new test, dependency change, or broad cleanup was performed. Tracked test diff checks pass with normal LF-to-CRLF notices. Luna has not rerun Quinn's suite during this narrow inspection.

Final execution evidence belongs to Quinn, with the actual final log also inspected by main:

| Check | Final evidence |
| --- | --- |
| Full configured suite | PASS, 116/116, zero failures, skipped, or cancelled, exit 0. |
| Supplemental existing invite contract cases | PASS, 2/2, zero failures or skipped, exit 0. Separate from the 116 count. |
| Application and test TypeScript checks | PASS, exit 0. |
| Production build and diff check | PASS, exit 0. |
| Loaded-source coverage | 92.63% lines, 86.97% branches, 95.51% functions. Excludes unimported files, SQL, and real services. |

Quinn's evidence directory is `C:/Users/jdtig/AppData/Local/Temp/lumio-m2-quinn-20261023-011500`. Its finalized report records filenames, command exit evidence, production identity, browser observations, warnings, and coverage limits. Existing role-screen coverage gaps remain risk notes, not demonstrated defects or reasons to expand M2. Luna does not claim a second execution of these checks.

## Assertion and isolation assessment

The configured runner isolates each file in its own process and runs files serially. File-local fetch/module replacements and synthetic environment overrides therefore do not escape into other test files. Per-case hooks reset invite rows, profiles, flags, recorded calls, account/cookie fixtures, and frontend reply/deferred state. React roots unmount after component cases. Retaining those runner settings is part of this assessment.

The new invite tests run actual local route, authorization, JSON validation, Gmail normalization, token/hash generation, data-adapter, mail-formatting, and error-mapping code. Auth and database transports are replaced. Fetch intercepts Resend without invoking native fetch. The API key, sender, origin, and users are synthetic. No environment file is loaded by this new test module. Assertions check literal response shapes, recipients, hash-only storage, seven-day expiry, fresh tokens, recent-parent rate limits, rollback preserving prior rows, and failed rollback returning INTERNAL.

The connect additions run local routes and services. Body/profile identity spoofing and consumed-token rejection assert real response codes and unchanged state before the mocked RPC runs. Successful household/card transitions use the existing in-memory RPC fixture. They do not prove SQL execution, constraints, or database concurrency.

Frontend additions render actual components and adapters. They assert visible status, preserved or cleared values, field focus/error relationships, disabled/busy controls, request counts while pending, explicit acceptance after reopening, role guards, and retry behavior. The supplied role change is a fixture transition, not a test of the role form itself. These checks observe results beyond merely restating fixtures or counting calls.

## Deduplicated LOW coverage note

`test/m2-frontend.test.tsx`, test `Strict Mode waiting effect restart releases its request lock and ignores the obsolete completion`, gives both initial reads the same waiting response and releases them together. It proves request-lock recovery on effect restart. It cannot distinguish whether the obsolete completion was ignored because processing either response yields the same UI and navigation history.

The four existing departure regressions separately cover stale redirects from waiting, acceptance, auth completion, and invitation rejection. They do not turn the Strict Mode case into proof of differing out-of-order responses during effect replay. Record those distinct claims accurately. No production defect was found, and the owner explicitly requested no test churn for this nonblocking limitation. No test or application change is needed for this handoff.

## Independent plugin reviews

Main mediated the authorized parallel read-only follow-ups. Luna read and synthesized all three reports:

- `LUNA_M2_QA_SECURITY.md` passes with the LOW Strict Mode coverage limitation. It finds no isolation or credential blocker.
- `LUNA_M2_QA_QUALITY.md` passes with the same note. Count it once, not as a second finding.
- `LUNA_M2_QA_COMMENTS.md` passes. Zero added comments, suppressions, deletion targets, or MUST KILL flags. Zero comment edits were needed.

Reuse the exact installed gate sources and constraints recorded in the preceding Luna review. Ponytail-review accepts the scoped assertions with the stated limitation. No new shortcut debt markers appear. The two Thermos passes cover this QA-only diff, and Comment Sicko covers its comments/suppressions. The pstack test-behavior, type-system, small-change, verification, and writing principles apply to this assessment. Earlier resolved application findings remain resolved. Unavailable deslop/control-ui tooling is still not claimed as run. No template authorizes a PR, external message, skill edit, design bakeoff, or application rewrite.

## Commit boundary and remaining limits

The local QA commit is limited to the three test files, final `QUINN_REPORT_v3.md`, the three narrow independent review reports, and this addendum. No application source is included. Existing user-owned AGENTS.md, specs, inspiration/assets, and the updated untracked session handoff remain outside staging. Production files compare unchanged against `5db49003ec4b7e8d3d2e3a119cefaf7d843c4ef6` before staging. The exact QA commit hash will be recorded in a documentation-only child commit.

The first staged diff check found trailing spaces in Quinn's copied coverage table. Luna removed only that report whitespace, preserving all evidence values and test contents. The staged diff check then passed. No new test or build execution was needed for this documentation cleanup.

Mocked tests and synthetic browser checks do not verify real email delivery, OAuth/cookie exchanges, live migrations, or deployed SQL. Quinn's final report supplies its independent run and BrowserOS DOM, request, focus, and size evidence. No screenshot artifact or screenshot-based visual pass is claimed. No push or deployment is authorized by this QA review. This completes the requested Luna-to-Quinn M2 work without starting M3.
