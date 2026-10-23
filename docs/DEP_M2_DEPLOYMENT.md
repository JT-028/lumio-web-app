# Dep M2 deployment

Status: dependency patch READY for focused Luna commit and renewed Quinn QA. Clean installation, full audit, resolved tree, both typechecks, 116 tests, two supplemental tests and production build all PASS. Patch is uncommitted. No push or deployment performed. The user explicitly authorized the existing Production site; the earlier preview default is superseded. Existing Git integration is the release path after the new gates pass; CLI sign-in is not a push prerequisite.

Date: 23 October 2026 (Asia/Manila).

## Release identity and gates

- Repository: https://github.com/JT-028/lumio-web-app
- Branch: `feat/lumio-m1-shell`.
- Reviewed application: `5db49003ec4b7e8d3d2e3a119cefaf7d843c4ef6`.
- Reviewed base revision: `b42912fb93b8b7f27083051d9d645e4246ce081b`. Dependency remediation is currently uncommitted and requires a new reviewed ship revision.
- Luna: PASS (`LUNA_REVIEW_v3.md`); QA addendum PASS WITH NOTE (nonblocking StrictMode coverage limitation).
- Quinn baseline: PASS, 116/116 plus two supplemental tests, both typechecks and build (`QUINN_REPORT_v3.md`). New dependency/toolchain changes justify renewed checks and focused Luna/Quinn gates, which main will invoke.
- Current owned changes: `package.json`, package-manager-generated `package-lock.json`, and this deployment report only. Existing user-owned untracked inputs remain untouched. No staging or commit.
- Initial baseline `npm audit --json` and `npm audit --package-lock-only --json` exited 1: three vulnerable packages, one critical, one high, one low. This historical result is retained below. Regenerated lockfile audit from `npm install --package-lock-only --ignore-scripts` now reports zero vulnerabilities. No threshold downgrade or bypass.
- Current remote ref, checked with `git ls-remote`: `refs/heads/feat/lumio-m1-shell` remains `0e3d60a4629eca31743378d98b7aa25829dc8b42`, eleven commits behind the candidate. There is no remote `main` ref. Push success is not claimed.

## Baseline security findings

Baseline installed dependency paths: `next@15.5.27 -> postcss@8.4.31`; `tsx@4.21.0 -> esbuild@0.27.7`.

| Package / advisory | Severity | Affected range reported by current audit | Patched target |
| --- | --- | --- | --- |
| Next.js [GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw), SVG image optimization RCE | Critical | `>=10.0.0 <=15.5.27` | `15.5.28` on the current release line |
| Next.js [GHSA-p3m5-59mp-jv5r](https://github.com/advisories/GHSA-p3m5-59mp-jv5r), Server Actions denial of service | High | `>=13.0.0 <=15.5.27` | Resolve with reviewed Next.js patch and confirm fresh audit |
| PostCSS [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93), CSS stringify XSS | Moderate | `<8.5.10` | At least `8.5.10`; use `>=8.5.23` to clear all currently reported PostCSS ranges |
| PostCSS [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q), source map file disclosure | High | `<=8.5.11` | Use `>=8.5.23` across the reported advisories |
| PostCSS [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp), incomplete source map fix | Moderate | `<=8.5.22` | `8.5.23` |
| PostCSS [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849), source map traversal | High | `<=8.5.17` | Use `>=8.5.23` across the reported advisories |
| esbuild [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr), Windows development-server file read | Low | `>=0.27.3 <0.28.1` | `0.28.1` or later compatible version |

Audit suggests Next.js `15.5.28` for Next.js/PostCSS, but registry metadata (`npm view next@15.5.28 dependencies.postcss`) still returns exactly `8.4.31`. Therefore a Next.js bump alone does not establish a PostCSS fix. The authorized patch below uses a targeted override. No `npm audit fix --force` was used.

`tsx@4.21.0` permits only esbuild `~0.27.0`, which cannot resolve the fixed `0.28.1`. Registry metadata confirms `tsx@4.23.15` permits esbuild `~0.28.0`. The authorized patch upgrades within tsx 4.x; regenerated lockfile resolves esbuild `0.28.2`.

## Authorized dependency remediation

- Pin Next.js from `15.5.27` to `15.5.28`; no major upgrade.
- Add `overrides.next.postcss = "8.5.23"`, scoped to Next.js's vulnerable PostCSS dependency. No new application dependency or audit suppression.
- Pin tsx from `4.21.0` to `4.23.15`; regenerated lock resolves esbuild `0.28.2`.
- Generate lockfile with `npm install --package-lock-only --ignore-scripts`, exit 0, zero vulnerabilities. Lockfile also reconciles existing root happy-dom metadata to the already-pinned manifest version; the happy-dom package version is unchanged.
- Local runtime: Node `v26.12.1`, npm `12.2.0`. Registry engine/peer metadata accepts the runtime and existing React 19.2.4. Remote CI remains configured for Node 24.18.0; no workflow edits.
- Initial `npm ci` hit Windows EPERM unlinking the old Next SWC native binary held by the user's server. A normal `npm install` succeeded with a retired-directory cleanup warning. The user subsequently authorized a brief verified dev-server restart to prove a clean installation.
- Before stopping anything, verified listener PID 27712, creation time, checkout-specific start-server command, parent PID 13148 with `next dev --port 3010`, and the loaded SWC module under this checkout. Rechecked exact identities before termination. A non-forceful `taskkill` attempt was refused by Windows; only the two still-matching verified Node PIDs were then stopped. No unrelated process was stopped.
- Clean `npm ci` and all subsequent gates PASS, detailed below. Restored `npm.cmd run dev` from this checkout using `Start-Process -WindowStyle Hidden` with separate task logs. New server PID 28204 listens on 3010; startup log reports Next.js 15.5.28 and Ready in 3.4 seconds. Launcher PID 31352. No app request or real service operation was made.
- npm 12 reports esbuild's postinstall blocked by existing allowScripts policy. No permission/configuration change was made. The installed optional native binary works: toolchain tests and build pass.

### Clean-install verification evidence

Evidence directory: `C:\Users\jdtig\AppData\Local\Temp\lumio-dep-m2-remediation-20261023\clean-install`. `exit-results.json` records all eight commands with exit 0. Earlier successful checks before the clean reinstall are retained in the parent directory; the table below describes the final clean installation.

| Check | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS, exit 0 | `npm-ci.log` |
| Full `npm audit --json` | PASS, exit 0; all severity counts zero, vulnerabilities object empty | `npm-audit.json` |
| `npm ls next postcss tsx esbuild --all` | PASS, exit 0; Next 15.5.28 -> overridden PostCSS 8.5.23; tsx 4.23.15 -> esbuild 0.28.2 | `resolved-tree.log` |
| `npm run typecheck` | PASS, exit 0 | `typecheck.log` |
| `node node_modules/typescript/bin/tsc --project test/tsconfig.json --noEmit` | PASS, exit 0 | `test-typecheck.log` |
| `npm test` | PASS, 116/116, zero fail/cancel/skip/todo; exit 0 | `npm-test.log` |
| Supplemental `node --import tsx --test src/domain/invite-contract.test.ts`, with test tsconfig | PASS, 2/2, zero fail/skip; exit 0 | `supplemental-contract.log` |
| `npm run build` | PASS, exit 0; Next.js 15.5.28 compiles and generates 7/7 static pages | `build.log` |
| `git diff --check` and cached diff check | PASS, exit 0; only normal LF/CRLF notices | Dep terminal evidence |
| Dev server restoration | PASS, port 3010 listener and Ready log; exact invocation/cwd saved | `devserver-before.json`, `devserver-stop.log`, `devserver-restored.json`, `devserver.stdout.log`, `devserver.stderr.log` |

Manifest SHA-256: `6BF313FC35DE8CBD2AE7E98E699B27EA68DBDC37239281353B5D23A960803B9F`.
Lockfile SHA-256: `853B8CC2478BACC55BE415B76ECB945C6BB72F74BB926216E7CB981C1FCBC0D1`.

Lockfile semantic inspection shows only Next/env/SWC, PostCSS, tsx/esbuild/platform binary changes, removal of tsx's no-longer-needed get-tsconfig/resolve-pkg-maps entries, and root metadata reconciliation. No unrelated package versions changed. The tests retain their existing experimental-module and React act warnings and expected synthetic negative-case logs; no failing command is suppressed.

Main reports all three focused read-only dependency reviews complete with no findings: `RELEASE_DEPENDENCY_SECURITY.md`, `RELEASE_DEPENDENCY_QUALITY.md`, `RELEASE_DEPENDENCY_COMMENTS.md`. Luna is ready to receive the runtime evidence. This statement records main's handoff, not a new Dep review. Main will invoke the required focused Luna commit and renewed Quinn gate before release. Dep does not stage or commit this patch.

Exact lockfile audit JSON: `C:\Users\jdtig\AppData\Local\Temp\lumio-dep-m2-audit-20261023.json` (exit 1). Public advisory pages corroborate the Next.js 15.5.28, PostCSS 8.5.23 and esbuild 0.28.1 patch boundaries. Findings describe dependency advisories, not a demonstrated exploit against Lumio.

## GitHub CI and security configuration

- GitHub CLI is authenticated as `JT-028`; remote inspection succeeds.
- GitHub default branch is `feat/lumio-m1-shell`; its API reports `protected: false`.
- Repository rulesets query returns HTTP 403 requiring GitHub Pro or a public repository. No ruleset or plan changes were made.
- Existing `.github/workflows/ci.yml`: lint/typecheck -> full tests -> build -> `npm audit`; dependencies enforce stage order. The deploy job only matches `main` and merely prints that production deployment is disabled. It does not invoke or gate the separate Vercel Git integration.
- Latest and only listed [CI run](https://github.com/JT-028/lumio-web-app/actions/runs/38279786526): SHA `0e3d60a4629eca31743378d98b7aa25829dc8b42`, completed `startup_failure`, no jobs. No current candidate CI run exists because it has not been pushed. The startup-failure cause is not established by the available run details; do not infer a passing remote gate from local QA.

## Existing Vercel setup and production risk

All four required setup checks were attempted: remote exists; neither `.vercel/project.json` nor `.vercel/repo.json` exists; `vercel whoami` and `vercel teams list --format json` both report no credentials (CLI 50.13.2). No link or new project was created.

Initial BrowserOS inspection redirected the dashboard to sign-in. During remediation, the browser connection changed; a fresh owned tab at `https://vercel.com/dashboard` successfully displayed the signed-in `jonathan-tiglaos-projects` dashboard. No sign-in action, new OAuth permission, account creation or CLI authentication was performed by Dep. Browser authentication is now directly observed; CLI remains unauthenticated. Existing tabs were preserved.

Safe scoped GitHub deployment/status inspection identifies the existing Vercel project as `jonathan-tiglaos-projects/lumio-web-app`. The old remote commit's Vercel status is `success`, linking to [existing deployment](https://vercel.com/jonathan-tiglaos-projects/lumio-web-app/5UCe6BaKgH9NTDmeeJ9ShwwgUn5N).

GitHub deployment `7030468223` associates SHA `0e3d60a4629eca31743378d98b7aa25829dc8b42` with environment **Production**, created 13 October 2026. Its latest status is `success`, timestamp `2026-10-13T05:19:11Z`, URL `https://lumio-web-p0jv9frzz-jonathan-tiglaos-projects.vercel.app`. Two earlier statuses for the same record also report Production and success.

The signed-in project overview now confirms current configuration: Production Deployment Ready, source `feat/lumio-m1-shell` at `0e3d60a4629eca31743378d98b7aa25829dc8b42`, domain `https://lumio-web-app.vercel.app/`, and explicit UI copy that pushing `feat/lumio-m1-shell` updates Production. The current deployment is the prior URL above. The user's explicit Production choice authorizes this existing integration after the new gates pass. No production branch changes, new `main`, merge, promotion or duplicate project is needed.

The project's Environment Variables screen was inspected with extraction limited to key names and scope labels; the search field was empty. Visible names were `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, and `SUPABASE_JWT_SECRET`, with Production scope labels. Expected `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`/`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY` and `RESEND_FROM_EMAIL` were not observed in that listing. This is an environment-readiness concern for main to reconcile; no values were opened or copied and no provider settings were changed. It does not establish the contents of any uninspected shared/inherited configuration. Project ID and the complete effective environment remain unverified.

No environment file was manually read, copied, staged or uploaded. The normal local Next build/dev commands loaded the existing ignored `.env` as configured, without printing its values or changing it. No secret value was printed.

## Scope

Deploy the newly reviewed exact revision to the existing Vercel project's Production site after new Luna/Quinn gates, with the observed environment-readiness concern handed to main. Authenticated GitHub deployment/status/check APIs plus browser verification of the public URL may verify the existing Git integration without CLI login. Preserve untracked user inputs and ignored environment files. Dep edits only the manifest, lockfile and deployment report. No application logic, CI, database, mail, account or provider configuration changes.

## Delivery verification

| Release evidence | Result |
| --- | --- |
| Reviewed base | `b42912fb93b8b7f27083051d9d645e4246ce081b` on `feat/lumio-m1-shell`; dependency patch uncommitted |
| Push / remote ref match | NOT SHIPPED; remote remains `0e3d60a4629eca31743378d98b7aa25829dc8b42` |
| Current security gate | PASS after clean install; full audit exit 0, zero vulnerabilities |
| New dependency validation | All eight commands PASS; focused Luna commit and renewed Quinn gate pending |
| Candidate CI | Not run remotely; prior run startup failure |
| New Vercel deployment URL / target / state / SHA | None created; no READY or exact-commit deployment claim |
| Deployed UI browser check | Not run because no M2 deployment exists |
| Existing project auth | CLI unauthenticated; BrowserOS signed-in dashboard and existing Production configuration observed |

Required continuation order: main receives ready patch/evidence and reconciles the visible environment concern -> focused Luna commit and renewed Quinn gates -> normal push of the newly reviewed exact revision -> verify remote ref -> collect CI -> verify provider success/READY, Production target and exact SHA through existing Git integration records -> browser check of actual public deployment URL. No push/deploy before the renewed gates. Missing CLI authentication alone is not a blocker; sign-in intervention is needed only if the integration cannot complete or verification requires it. Do not upload a local folder containing ignored env or user-owned inputs.

## Rollback and limits

No new deployment exists, so no rollback is needed. The signed-in overview verifies [the October 13 deployment](https://lumio-web-p0jv9frzz-jonathan-tiglaos-projects.vercel.app) at `0e3d60a4629eca31743378d98b7aa25829dc8b42` as current Production and Ready, aliased to `https://lumio-web-app.vercel.app/`. If a future authorized Production release fails, use the existing project's previous successful deployment as the rollback target and verify its alias/state before acting; no rollback was performed here.

Real authentication, inbox delivery, SQL concurrency and migrations are not exercised by this release verification. No live auth/mail/DB tests, database mutation or migration, application logic change, PR, push, deployment, or provider configuration change occurred. The authorized dependency patch and this report remain local and uncommitted for main's focused Luna/Quinn gates.
