# Quinn dependency release verification

**Independent verdict: PASS.** 23 October 2026. All seven required commands exited 0.
No regression finding blocks this dependency patch. No further tests were added or run.

- Dependency patch: `7575f15d4c96dda682414afe4d284a35f73b178b`.
- Tested HEAD: `ccbda140fb3c5596850e074d1f69801e3de384ea`.
- HEAD tree: `69116abc92fa7fa4d0dae30353338445f52d2c1e`; branch `feat/lumio-m1-shell`.
- Runtime: Windows, Node `v26.12.1`, npm `12.2.0`.
- Evidence directory: `C:/Users/jdtig/AppData/Local/Temp/lumio-quinn-release-dependencies-20261023-6cfc9250`.

The tested HEAD differs from the dependency patch only in Luna's release report.
Luna's dependency gate is PASS; all execution evidence below is Quinn's fresh run.

| Exact check | Exit | Result | Log basename |
| --- | --- | --- | --- |
| `npm audit --json` | 0 | Info/low/moderate/high/critical/total: all 0 | `audit` |
| `npm ls next postcss tsx esbuild --all` | 0 | Next 15.5.28 → PostCSS 8.5.23 overridden; tsx 4.23.15 → esbuild 0.28.2; no invalid graph | `dependency-tree` |
| `npm run typecheck` | 0 | Application TypeScript PASS | `typecheck` |
| `node node_modules/typescript/bin/tsc --project test/tsconfig.json --noEmit` | 0 | Test TypeScript PASS | `test-typecheck` |
| `npm test` | 0 | 116 tests, 116 pass, 0 fail/cancelled/skipped/todo; 40,291.07 ms | `npm-test` |
| `node --import tsx --test src/domain/invite-contract.test.ts` | 0 | 2 tests, 2 pass, 0 fail/cancelled/skipped/todo; 1,033.2229 ms | `supplemental-contract` |
| `npm run build` | 0 | Next.js 15.5.28; compiled, checked types, generated 7/7 static pages, completed traces | `build` |

Each basename has `.log`, `.exit.txt`, and `.result.json` evidence; consolidated
actual exits and timestamps are in `exit-results.json`. Supplemental contracts used
`TSX_TSCONFIG_PATH=test/tsconfig.json` and are separate from the 116-test count.
Both explicit TypeScript commands finished sequentially before the build.
Commands used the installed runtime at `C:/Program Files/nodejs`, with login disabled.

Coverage: **92.80% lines, 87.04% branches, 95.81% functions** in the configured,
loaded source modules. The supplemental run is not merged into these percentages.
Only `src/components/role-screen.tsx` is below 80% lines: 69.23% lines,
50.00% branches, 57.89% functions. This existing account-flow coverage limit remains;
coverage does not measure unimported page wrappers, SQL, or external services.

The existing suite exercises account/role guards, route and response contracts,
Gmail normalization, invite creation/expiry/replay, explicit acceptance and first-parent
outcomes, household gating, parent visibility, UI error/submission states, and stale
completion handling. Fresh passing tests exercise the updated tsx/esbuild loader;
the completed Next build exercises the overridden PostCSS compilation path.

Scope verification: HEAD stayed at the tested SHA throughout all checks.
`identity-before.json`, `identity-after.json`, and `source-before/after.json` record
94 tracked source/test/asset/CI/configuration files with zero changed hashes.
There are zero tracked changes outside docs; `git diff --check` exited 0.
The dependency patch changes only package.json/package-lock.json outside docs,
with no application, test, or CI logic change from the reviewed baseline.
Manifest SHA-256: `6bf313fc35de8cbd2ae7e98e699b27ea68dbdc37239281353b5d23a960803b9f`.
Lock SHA-256: `853b8cc2478bacc55be415b76ecb945c6bb72f74bb926216e7cb981c1fcbc0d1`.

Limits: Windows execution does not establish Linux CI/native-binary compatibility.
Tests use synthetic auth/database/RPC/mail fixtures; no real account, email delivery,
OAuth exchange, live database, migration, SQL concurrency, or production flow was
exercised. No browser/screenshots were needed for this dependency-only patch.
The standard build loaded existing ignored environment configuration; no environment
contents or secret values were manually read, printed, staged, or uploaded.

Only this report is authored/staged/committed by Quinn. No reinstall, new test,
source/manifest/lock/CI edit, delegation, agent subprocess, push, or deployment occurred.
Dep's port 3010 server was not stopped, restarted, or queried. Existing user-owned
untracked instructions, specs, inspiration, and handoff remain untouched.
The report-only child commit does not change the verified executable tree.
Main/Dep retain production environment, final-HEAD, push, and deployment ownership.
