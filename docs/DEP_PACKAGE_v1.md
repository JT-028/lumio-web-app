DEP DEPLOYMENT PACKAGE — v1.0
Project: Lumio
Target: Vercel preview (not production)
Input: Quinn Test Report v1 (26 passed, 0 failed, 0 skipped). Luna Review v1: ponytail-review Ship, thermos no criticals. The PASS WITH CONDITIONS hold was only until a test suite existed.

## Files Generated
- Dockerfile — multi-stage, non-root user `lumio` (uid 1001). Base image `node:24.18.0-bookworm-slim` (digest pinned). Same Node that passed `npm test` locally. Not `latest`.
- .dockerignore — excludes `node_modules`, `.next`, `.env`, `.env.*`, and `test/`.
- docker-compose.yml — Next.js service only, image `lumio:0.1.0`. No database. Supabase stays external.
- .github/workflows/ci.yml — lint, test, build, security-scan, then a deploy job that does not deploy.
- .env.example — names and comments only. No values.
- No Terraform. No Kubernetes.

Port: the app listens on **3010**. `npm start` is `next start --port 3010`. `PORT=3010` is set in the image and in compose. This is not port 3000. HEALTHCHECK requests `GET /` on 3010. No new product route was added.

Secrets: Vercel environment variables for the preview project. Never in git, never in this workflow, never in the image. `.env` stays gitignored. Task 0.1 (Supabase project, Google and email auth, Resend sender, and pasting keys) is the owner's job.

## Environment Variables Required
| Variable | Description | Example | Secret? |
|---|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL. Build-time. Inlined by `next build`. | — | no (still not committed) |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Preferred browser key. Build-time. One browser key is required. | — | YES |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Older browser key. Build-time. Used only if publishable is unset. | — | YES |
| SUPABASE_SECRET_KEY | Server-only Supabase secret. Runtime. Never `NEXT_PUBLIC_`. | — | YES |
| SUPABASE_SERVICE_ROLE_KEY | Older server-only service role. Runtime. Used only if the secret key is unset. | — | YES |
| NEXT_PUBLIC_APP_URL | Public origin for links. Build-time. | — | no |

Build-time versus runtime: the four `NEXT_PUBLIC_*` names are read while `next build` runs. Changing them on Vercel requires a new preview deployment. `SUPABASE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are read on the server at runtime. Docker Compose passes public names as build args and the two server keys as runtime environment. Empty values are valid; the app stays unconfigured and does not invent keys.

External endpoints: Supabase Auth and Postgres, reached only through the URL above. No second database in compose. Resend and xAI are not in `.env.example`. M1 code does not read them. Do not add those names until a later milestone.

## CI/CD Pipeline Stages
1. lint — `npm run typecheck` (no eslint script in this repo)
2. test — `npm test`
3. build — `npm run build`
4. security-scan — `npm audit`
5. deploy — push to `main` only. The step prints that production deploy is disabled and does not call Vercel. It does not run on `feat/lumio-m1-shell`. A failed earlier job skips this job (`needs`).

Node in CI is `24.18.0`. The test job runs on `windows-latest` and copies the checkout to `D:\PORTFOLIO\booklet-web-app\lumio-web-app` so the existing path assertion can pass. Workflow file contains no secrets.

Branch protection recommendation, not applied from here: on `main`, require the lint, test, build, and security-scan checks, disallow force-push, and do not treat the deploy job as a production gate. This package pushes only `feat/lumio-m1-shell` and does not create `main`. GitHub will show that feature branch as the default until `main` exists. Do not point Vercel production at the default branch. Production stays `main`, which is not deployed.

## Deployment Verification Checklist
- [ ] Open the Vercel preview URL. `GET /` returns 200. There is no `/health` route.
- [ ] Confirm the Vercel deployment is a Preview, not Production.
- [ ] After task 0.1, email sign-in and Google sign-in return to the app. Until the keys exist, sign-in cannot succeed.
- [ ] Do not expect a database migration from this package. Supabase migrations stay the owner's job.
- [ ] App logs are already JSON lines on stdout (`level`, `msg`, `request_id`, `user_id`, `route`, `code`, `duration_ms`). No log vendor was added.
- [ ] No error tracker was added. Do not expect Sentry or Datadog events.

## Rollback Procedure
1. Vercel → the project → Deployments. This package does not create a production deployment. If a preview should be dropped, delete that preview deployment, or redeploy the previous commit. If someone promoted it, use the deployment menu → Instant Rollback. Stop when the previous production deployment is current.
2. Or from git: `git revert <this-commit>` on `feat/lumio-m1-shell` and push that branch. Do not force-push. Vercel rebuilds the preview from the revert. Do not merge to `main`.

Either path is one dashboard action or one revert, under five minutes.

## Open Questions
- Vercel CLI is not installed, and the Vercel config on this machine has no token. No preview URL was created. Owner task 0.1: connect `JT-028/lumio-web-app` in Vercel, ignore the GitHub default branch for production, set the production branch to `main` (create `main` later; do not deploy it now), allow preview deployments for `feat/lumio-m1-shell`, and paste the six names from `.env.example`. Do not promote this branch to production.
- Creating the Supabase project, Google and email auth, and the Resend sender stays task 0.1. Do not put those secrets in git.
- `npm audit` is a blocking stage. On 2026-10-13 it reported 3 advisories (esbuild low/moderate, postcss high via `next@15.5.27`). That job fails and deploy does not run. Do not silence it. `npm audit fix --force` would upgrade Next and is out of this package.
- The Docker daemon was not running here, so the image was not built in this session. The Dockerfile is the definition. Port stays 3010.
