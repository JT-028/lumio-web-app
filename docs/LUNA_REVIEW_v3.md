# Luna review v3

Date: 23 October 2026. Scope: Jules's uncommitted M2 frontend and integration with the M2 backend at `fcc8b7f`. Reviewer: Luna only. Quinn has not run this gate.

## Current status

Luna gate PASS for the scoped M2 frontend. Two MED findings and two LOW comment findings are resolved. Zero CRITICAL, HIGH, MED, or LOW findings remain open. Final typechecks, full tests, production build, diff checks, and synthetic BrowserOS interactions pass. Local commit preparation is in progress. No push, deploy, or Quinn run has occurred.

- [x] Read repository AGENTS.md, Luna and agent-squad skills, and exact installed ponytail, Thermos, and pstack gate sources.
- [x] Confirm working tree matches the briefing. Existing feature branch and user inputs remain in place.
- [x] Trace connect, authentication, household, waiting, and student contracts.
- [x] Complete correctness/security and code-quality review passes.
- [x] Reproduce real findings, apply small fixes, and rerun regression checks.
- [x] Run application typecheck, test typecheck, full tests, production build, and diff checks.
- [x] Attempt remaining BrowserOS checks using the inspected synthetic fixture on 3012.
- [ ] Stage only owned files, commit locally with required attribution, and record hashes.
- [ ] Return gate evidence and remaining checks for the main agent to hand to Quinn.

## Prerequisites and limits

This nested worker has no Task/spawn/subagent tool. The parent launched both independent Thermos reviewers and Comment Sicko on Luna's behalf. All three read-only reviews completed, and Luna read and resolved their reports before commit preparation. Luna retains sole write ownership.

The pstack template also references cursor-team-kit deslop/control-ui. Luna and the parent found neither skill installed. Neither is claimed as run. The installed project/Squad gate takes precedence over those unavailable template dependencies. BrowserOS provided direct UI interaction checks. Generic templates do not expand this task to PR creation, skill edits, design bakeoffs, external messages, or broad refactors.

## Work sequence

Feature playbook adapted to this review. Ground existing contracts first. Independent review workstreams are read-only and use parent-mediated fan-out. All file changes remain serial in Luna's owned frontend/test/report scope. Keep existing named response types and screen-state unions. Preserve the owner's theme and supplied assets. Check each regression before moving to final verification.

## Findings and actual checks

### MED, fixed: obsolete requests navigate after the user leaves

`wait-screen.tsx`, `connect-screen.tsx`, `connect-auth.tsx`, and the parent form in `home-screen.tsx` accepted late async completions after unmount. A pending wait check redirected a newly opened connect page to `/home`. A departed acceptance navigated to `/wait`. A departed auth form navigated to `/role`. A departed invite rejection navigated to `/`. Request generations now suppress obsolete completion effects. Waiting cleanup also releases its lock so React Strict Mode can start the current request.

Four focused regression tests failed before the fix with those exact unexpected navigation destinations. The same command passed all four after the fix:

`node --experimental-test-module-mocks --import tsx --test --test-name-pattern='a departed' test/m2-frontend.test.tsx`, with `TSX_TSCONFIG_PATH=test/tsconfig.json`.

The initial `npm test` completed with exit 0 before these fixes. It used the builder's 85-test tree. Node reports experimental module-mock and deprecation notices. Existing shell tests emit React act warnings. These are recorded, not treated as failures or suppressed.

### Final verification results

| Check | Actual result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0 after all application fixes. |
| `node node_modules/typescript/bin/tsc --project test/tsconfig.json --noEmit` | PASS, exit 0 after all application fixes. |
| `npm test` | PASS, exit 0. 90 tests, 90 passing, zero failing, cancelled, skipped, or todo. Includes five new Luna regressions and all 85 builder tests. |
| `npm run build` | PASS, exit 0. Seven static pages generated, with dynamic connect and API routes. No deployment. |
| `git diff --check` and `git diff --cached --check` | PASS, exit 0. Normal LF-to-CRLF notices only. |

Full test output is retained outside the repository at `%TEMP%/lumio-luna-v3-tests.log`. It contains only synthetic test fixtures and normal test logs.

### Parent-mediated independent reviews

The parent launched all three read-only reviewers in parallel. Security `01a1648f-643e-7b80-9662-1f4aa952109f`, quality `01a1648f-6627-7f62-b3fc-f2b1a171e22a`, and Comment Sicko `01a1648f-67f5-7bd3-addb-1d8ee756d72d`. All reports are complete and read by Luna.

- `LUNA_M2_THERMOS_SECURITY.md` has no remaining actionable findings after the lifecycle fix. Its independent 60-test run and TypeScript check are supporting evidence, not Luna's final full verification.
- `LUNA_M2_THERMOS_QUALITY.md` found a P2 boundary problem. `HomeForm` recovered invalid-email identity by comparing a complete display sentence. Accepted. `postInvite` now returns the typed field `invited_email` or null, and the form branches on that field. This deliberately extends the existing frontend helper in `src/lib/lumio-client.ts`; no backend change. The new boundary regression failed before the fix because the field was missing. The combined field-focus, discriminator, and four lifecycle regression run now passes all six cases.
- `LUNA_M2_COMMENTS.md` found two P3 narration comments totaling three lines. Accepted and deleted. No suppressions, MUST KILL flags, exception-protected comments, restored comments, reruns, architect sketch, encoding offers, or unenforced constraints were needed. No application behavior changed for these deletions.

No independent reviewer edited application or test code. Luna owns all dispositions and code fixes. No review is claimed for later code beyond Luna's final diff inspection and rerun checks.

### Browser progress

Read the BrowserOS neo skill. Its tab listing succeeds in this session. Existing Supabase tabs belong to the user or another task and remain untouched. Inspected the 3012 mock fixture source. It imports actual components/CSS, mocks every fetch and auth call, and serves `connect-src 'none'`. It reads no environment files. Rebundled after all application fixes. Luna restarted only its own fixture server, now PID 10880. The user's 3010 listener remains untouched.

BrowserOS observed the actual connect component at 1280px. Document scroll width equals 1280px, all six inputs/buttons are 44px tall, preview and session GETs occur without a POST, and the synthetic route value is absent from the DOM. Screenshot capture stalled; the orchestration call was terminated after bounded waiting. No screenshot PASS or screenshot artifact is claimed. Subsequent DOM and interaction checks returned successfully.

- Parent home at 1280px and 320px shows exactly Zoe, Lin, Lin, in that order. No child email reaches the DOM. Scroll width equals the viewport, and all controls measure 44px tall.
- Waiting entry and Check again request `/api/home`. Check again announces still waiting. A synthetic household failure stays on waiting with an error. A synthetic parent-home failure shows no form or empty household, and focuses Try again.
- At 320px, explicit ignored and email-mismatch accepts each issue one POST with no body, focus their fixed status, remove Accept, retain no synthetic token in the DOM, and have no horizontal overflow. A known parent has Go to home and never issues an accept POST.
- Synthetic accepted flow reaches the linked-student `/home`. That page reads only `/api/me` and retains the inert guide/study shell. These synthetic navigation checks do not execute Supabase or database SQL.
- At 320px, password mismatch focuses `connect-confirm` with `aria-invalid=true`. Tab reaches Create account, and Enter submits and returns focus to the confirmation error. Zero POSTs occur. Scroll width is 305px within the 320px viewport. The fixture route value is absent from the DOM.

The external fixture received only scenario support for the checks above, then bundled the unchanged final application sources. Its CSP continues to block all outbound connections. Fixture modifications, generated bundles, and logs remain outside the repository.

## Commit and handoff

The code commit includes the 12 application/test files listed in the staged diff, Jules's progress note, the three independent review reports, and this review report. `src/lib/lumio-client.ts` is the one deliberate addition to the original file list for the directly consumed typed field result. No API, service, database, configuration, dependency, or asset file is staged.

All existing user inputs remain untracked and unchanged: root `AGENTS.md`, `docs/IRIS_LOGIN_SPEC_v1.md`, `docs/IRIS_M2_SPEC_v1.md`, `docs/IRIS_STUDENT_HOME_SPEC_v1.md`, `docs/SESSION_HANDOFF_2026-10-22.md`, and `docs/inspiration/`. They informed the review without becoming part of this feature commit. No `.env`, secret, fixture server, scratch script, node_modules, or generated bundle is staged.

Commit hash will be recorded immediately after the local commit. No push or deploy.

## Contract and scope verdict

The M2 client uses Theo's existing methods, paths, and response shapes. Explicit acceptance remains bodyless, and the backend alone decides identity and first-parent ownership. Auth never accepts or forwards the route token. Preview/session reads run together, errors remain fixed copy, household failures remain distinct from empty households, and private content is removed on 401. Parent lists render only returned first names. Waiting uses `/api/home`; the student dashboard retains `/api/me`. Current cream/navy/gold theme, fonts, and existing assets remain intact. No M3 functionality, new assets, dependencies, or backend changes were added.

Assumed load is an ordinary browser session with concurrent network requests, navigation, repeated clicks, and existing multiuser server authorization. This review does not claim a load test or a release-wide audit.

## Plugin synthesis

- Ponytail-review verdict is Ship. No unresolved must-fix issue remains. The smallest fixes preserve the screen contracts.
- Ponytail-debt found zero new `shortcut:` or `ponytail:` comment markers. No debt ledger was written.
- Thermos has no open critical/high findings. Its quality finding is fixed through the typed frontend field result. Both independent passes ran through parent-mediated fan-out.
- No-comments accepted both findings and deleted exactly three narration lines. No other comments or suppressions needed action.
- The six always-on pstack principles guided small local guards, subtraction of narration, localized mutable state, root-cause lifecycle fixes, failing-before/passing-after tests, and final verification. TypeScript best practices, type-system discipline, boundary discipline, model-the-domain, TDD, and test-behavior-not-implementation guided the response boundary and tests. Poteto-mode used the feature review sequence and focused bug-fix checks. Technical-writing and unslop apply to this report and commit messages. Existing API/domain shapes remain unchanged apart from the small frontend `postInvite` failure discriminator.
- `how` and `blast-radius` were grounded in the actual local callers and backend flow. `postInvite` has one application caller, HomeForm. The focused typed-field and field-focus tests exercise that real helper and its consumer, and all existing invite tests still pass. No new abstraction or shared auth framework was needed. Generic design bakeoffs and PR workflows were outside the user's scope.

## Notes for Quinn

Recheck the final commit, especially delayed responses after navigation, field-error focus, duplicate accepts, identity/role refusals, malformed responses, and first-name privacy. Five new Luna tests cover four obsolete-completion paths and the typed invite error result. The other 85 tests remain in the final passing suite.

BrowserOS evidence uses actual components in an isolated synthetic fixture, not the Next.js production server or live Supabase. Screenshot capture did not complete. Real accounts, email delivery, OAuth exchange, live cookies, applied migrations, and deployed SQL were not tested. No live-service or deployment approval follows from this review. Existing React act warnings and Node experimental/deprecation notices remain visible.

Quinn has not been invoked by Luna. Push and deployment remain blocked pending Quinn PASS and the owner's explicit authorization.
