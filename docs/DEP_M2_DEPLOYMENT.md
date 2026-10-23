# Lumio M2 deployment — final

Date: 23 October 2026 (Asia/Manila).
Status: **SHIPPED — existing Production deployment READY.**

## Delivered revision

- Public Production URL: https://lumio-web-app.vercel.app/
- Immutable deployment URL: https://lumio-web-pi7u7ut0m-jonathan-tiglaos-projects.vercel.app
- Dashboard: https://vercel.com/jonathan-tiglaos-projects/lumio-web-app/8DoJxkgu6GLeBFbLaunj1cJK4ckJ
- Repository/branch: `JT-028/lumio-web-app`, `feat/lumio-m1-shell`.
- Exact shipped SHA: `c95f8fb6fb64fe7b480b0983c28d913bc9b2072d`.
- Normal push succeeded; `git ls-remote` confirmed the remote branch equals that SHA.
- Existing project: `prj_Ee5erZ9QX7sL8GaC3vWxctyWofAG`, team `jonathan-tiglaos-projects`.
- Vercel deployment: `dpl_8DoJxkgu6GLeBFbLaunj1cJK4ckJ`.
- Provider API: target `production`, state/status `READY`, exact Git SHA and branch match.
- Provider alias includes `lumio-web-app.vercel.app`; `aliasAssigned: true`.
- GitHub deployment `7278853096`: Production, exact SHA, `success` at `2026-10-23T13:01:33Z`.
- GitHub Vercel commit status: `success`, “Deployment has completed.”
- User explicitly authorized existing Production. No new project, branch, merge, promotion, or production-branch change.

## Release gates

| Gate | Final result |
| --- | --- |
| Reviewed M2 application | Luna PASS; baseline application `5db49003ec4b7e8d3d2e3a119cefaf7d843c4ef6` |
| Dependency remediation | `7575f15d4c96dda682414afe4d284a35f73b178b`; Next 15.5.28, scoped PostCSS 8.5.23 override, tsx 4.23.15 / esbuild 0.28.2 |
| Focused dependency review | Luna PASS; three independent reviews found no issues; `docs/LUNA_RELEASE_DEPENDENCIES.md` |
| Clean installation | Dep `npm ci` PASS; installed tree valid |
| Fresh full security scan | Quinn `npm audit --json` PASS, all severity counts zero |
| Fresh regression checks | Quinn 116/116 + 2/2 supplemental; both TypeScript checks and production build exit 0 |
| Tested revision | `ccbda140fb3c5596850e074d1f69801e3de384ea`; shipped child adds only Quinn's report |
| Independent QA evidence | `docs/QUINN_RELEASE_DEPENDENCIES.md` |

Dep evidence: `C:/Users/jdtig/AppData/Local/Temp/lumio-dep-m2-remediation-20261023/clean-install`.
Quinn evidence: `C:/Users/jdtig/AppData/Local/Temp/lumio-quinn-release-dependencies-20261023-6cfc9250`.
No application logic, test, or CI changes were made by Dep.

## Production environment reconciliation

Official Vercel CLI device sign-in completed for the existing account. Scoped APIs verified the existing repository integration and Production branch. Project variables and linked shared variables were inspected; linked shared count was zero.

The local public Supabase URL was malformed and was not uploaded. Existing integration URL was valid. Local public keys exactly matched the integration; legacy anon and service-role JWT claims matched its project reference, expected roles, and future expiry. This is structural identity evidence, not live authentication or cryptographic verification. The verified service-role fallback was used; the opaque secret key was not copied.

Added only these missing names to the existing project's **Production** scope:

| Name | Storage |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Encrypted; existing integration URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Encrypted; matching integration public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Sensitive; matching local service-role credential |
| `NEXT_PUBLIC_APP_URL` | Encrypted; current Production domain |
| `RESEND_API_KEY` | Sensitive; local allowlisted value |
| `RESEND_FROM_EMAIL` | Encrypted; local allowlisted value |

All six names/scopes were confirmed after creation. Existing variables were preserved. No redundant anon alias, unused OAuth secret, database credential, or unrelated local key was copied. An array API request failed with HTTP 400 Invalid JSON; re-listing confirmed no additions, then create-only single-object requests succeeded. Values travelled in protected process memory/stdin, never command arguments, reports, or Git. Local environment files were not changed. Provider variable creation did not itself trigger deployment.

## CI and verification limits

- Remote Actions run: https://github.com/JT-028/lumio-web-app/actions/runs/39957707315 — completed `startup_failure`, zero jobs/check runs. Cause remains undiagnosed. **Remote CI is not green.** Vercel Git integration deployed independently after the renewed local release gates passed.
- Public browser UI check: **unavailable**. BrowserOS transport failed at its local connector. No alternate browser, screenshot, curl/fetch site verification, or UI PASS is claimed. Delivery is established by exact provider SHA, Production READY, assigned alias, and GitHub deployment success.
- Local verification ran on Windows with Node 26.12.1/npm 12.2.0; it does not independently prove every Linux runtime behavior. The Vercel build reached READY.
- Tests use mocked auth/database/RPC/mail. No live account, email delivery, OAuth flow, database mutation, migration, or SQL concurrency check was performed.
- Existing nonblocking StrictMode/role coverage limits remain documented in the review/QA reports.
- npm's existing esbuild postinstall warning was retained; native esbuild and the real tests/build passed without changing script permissions.
- Only the verified checkout's dev server was briefly stopped for clean installation, then restored on port 3010 with Next 15.5.28. User-owned untracked inputs were preserved.

## Rollback and report handling

Prior successful Production deployment: `dpl_5UCe6BaKgH9NTDmeeJ9ShwwgUn5N`, SHA `0e3d60a4629eca31743378d98b7aa25829dc8b42`, URL https://lumio-web-p0jv9frzz-jonathan-tiglaos-projects.vercel.app . It was READY/current before this release. If rollback is needed, select that prior successful deployment in the existing project's rollback controls and verify the Production alias afterward. No rollback was performed.

This final report update is local only, uncommitted and unpushed. No documentation-only redeployment was triggered.
