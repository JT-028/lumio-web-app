# Dep — deployment and Auth readiness v1

Date: 25 October 2026 (Asia/Manila). Scope: read-only provider audit and explicitly authorized local URL repair for landing/auth recovery before M3. No release approval.

## Verified deployment

- Existing authenticated Vercel CLI/API access works for `jonathan-tiglaos-projects/lumio-web-app`; framework Next.js, Node 24.x.
- Current Production target is `READY`, exact SHA `4ff8fc643505ce51403de6598f0ce2018a33db4f`, matching the supplied checkout baseline on `feat/lumio-m1-shell`.
- Production `NEXT_PUBLIC_SUPABASE_URL` resolves to a valid HTTPS Supabase project origin. Production `NEXT_PUBLIC_APP_URL` matches the existing public domain, `https://lumio-web-app.vercel.app`.
- Production variable names present: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`. Public configuration and sender entries are readable/nonempty; the two sensitive server entries are present but their values are unavailable through these reads. Presence is not proof of credential validity or delivery.
- Vercel's environment-list response does not provide usable plaintext URL/key values. Individual authenticated environment GETs resolved only the necessary public configuration in process memory. An earlier failed resolution was a response-reading limitation, not evidence of an invalid Production URL.
- Authorized follow-up repaired only `NEXT_PUBLIC_SUPABASE_URL` in ignored local `.env`: the existing entry was nonempty and malformed, and an allowlisted local public key exactly matched the verified Production public key. The verified existing Production project URL replaced that entry using dotenv double quotes. All bytes outside the URL assignment were preserved; credentials and other environment entries were unchanged. Verification returned booleans only: URL valid, public key match, only URL entry changed, write verified, file gitignored. `.env` is untracked and unstaged. Only the URL and public-key entries were inspected in memory; no environment values were printed or persisted elsewhere.

## Verified Supabase Auth flags

Read-only `GET /auth/v1/settings`, using the securely resolved Production project URL and public key; no authentication flow was initiated. Only these flags were retained:

| Setting | Observed |
| --- | --- |
| Email provider enabled | true |
| Google provider enabled | false |
| Signup disabled | false |
| Email autoconfirm | false — email confirmation required |

Email enablement does not establish working SMTP, delivery, callback allowlisting, or successful login. Google is currently disabled for the project used by Production.

Follow-up at **2026-10-25 13:31:06 UTC (21:31:06 Asia/Manila)**: the owner reported, “i enabled google sign in in supabase”. An independent fresh read of the Production project's public Auth settings still returned `external.google=false`, `external.email=true`, `disable_signup=false`, and `mailer_autoconfirm=false`. The owner-reported change is recorded separately from the observed state; saved-project identity or configuration propagation remains unresolved. No dashboard sign-in, account choice, provider mutation, or live login attempt followed this report.

## Administrative access and schema limits

- Discovery found no dedicated Supabase/Vercel connector, no Supabase CLI, no Supabase access-token file at the two standard locations checked, and no Supabase token in process environment. Existing Vercel CLI credentials were used only against Vercel's own API, in memory.
- Initial browser discovery exposed only the in-app browser. Its dashboard tab redirected to sign-in. Later BrowserOS availability and signed-in access are recorded below; the initial result does not describe the BrowserOS session. No provider button, account selector, or sign-in form was used.
- Supabase Site URL, redirect allowlist, custom SMTP configuration, SMTP sender verification, and Google OAuth client/consent configuration remain **unverified**. Vercel's Resend variables configure application mail; they do not prove Supabase Auth SMTP is configured.
- Repository migrations exist: `20261012120000_profiles.sql`, `20261013120000_connect_invites.sql`, `20261013140000_households_cards.sql`. Source contains RLS declarations for profiles, invites, households, and cards; this does not prove their live application.
- Safe anonymous REST probes requested `select=*&limit=0`, without returning records: `profiles` and `connect_invites` returned HTTP 401 / PostgreSQL `42501` (insufficient privilege); `households` and `cards` returned HTTP 404 / `PGRST205` (not found in the exposed schema cache). These results do not establish migration history, RLS correctness, or physical table absence. The latter two indicate missing API-visible relations or stale/excluded schema metadata that must be checked before M2 live acceptance/M3.
- No usable privileged Supabase management/database session was available. No SQL, RPC, migration, database write, or auth attempt ran.

## Exact external blockers and handoff

1. **Google sign-in:** reconcile the owner's reported enablement with the fresh `external.google=false` observation above for the project configured in Production. An authorized administrator must verify the intended project's saved Google provider and OAuth callback/consent settings. Recovery UI must handle the observed unavailable state honestly; no successful Google login is established.
2. **Email confirmation and recovery delivery:** that administrator must inspect Supabase Auth SMTP and sender status. Check the Site URL and redirect allowlist against the Production origin and `/auth/callback`, plus the recovery callback chosen by the implementation. No conclusion about SMTP presence is possible from available access. Do not infer it from `RESEND_API_KEY` or `RESEND_FROM_EMAIL` in Vercel.
3. **Database readiness:** an authorized existing management/database session must inspect migration history and exposed schema for households/cards, then reconcile missing migrations or schema-cache/exposure issues under separate write authorization. The audit does not authorize migration application.
4. **End-to-end acceptance:** designated test accounts and explicit authorization are needed before real Google/email/recovery flows, confirmation emails, or live data changes. No accounts were created and no messages sent.
5. **Release:** this audit authorizes no push, deployment, promotion, or Production settings changes. Continue the local landing/auth recovery implementation and review/test pipeline independently of these external checks.

Dep authored this report and performed only the expressly authorized local URL repair described above. No application, asset, dependency, credential, or provider configuration changed; no package installation or nested agents were used. Concurrent agents' files remain untouched. No credential values, Supabase project URLs, headers, or account data are included.

## BrowserOS follow-up — project mismatch verified

Verified **2026-10-25 13:44–13:46 UTC (21:44–21:46 Asia/Manila)** using the newly available BrowserOS skill/tools and existing signed-in browser context. Listed inventory first and inspected only agent-owned tabs; user tab 1 remained untouched. No login, organization/account choice, consent, save, or provider write occurred. No user records, credential values, or screenshots were read/captured.

| Evidence | Verified result |
| --- | --- |
| Vercel Production Supabase project reference, securely re-resolved | `jylhsnfcgdbjcszjpcal` |
| User's existing dashboard project | `hzgvhkgsxvodmdurysvf`, named `grade6-reviewer-old`, organization `Lumio` |
| Same project? | **false** |
| Direct navigation to Production project in an owned tab | Redirected to the signed-in organization's project list; that list showed `grade6-reviewer-old`. Production admin access was not established. |
| Google provider in a freshly opened owned tab for `grade6-reviewer-old` | Enable Google switch **false**. No change/save was attempted. This does not establish what is currently unsaved in the user's tab. |
| `grade6-reviewer-old` Site URL | `http://localhost:3000` |
| `grade6-reviewer-old` redirect allowlist | **No Redirect URLs** |
| `grade6-reviewer-old` custom SMTP | Emails page displays **Set up custom SMTP to edit templates**, **Set up SMTP**, and default-template notice. Custom SMTP is not set up according to that UI. SMTP credentials were not inspected. |
| `grade6-reviewer-old` migration history | **Run your first migration**; none of the three repository migration versions appeared. This is history UI evidence, not proof of physical schema absence or absence of manually applied SQL. |

Actual Emails template names visible in this dashboard: **Confirm sign up**, **Invite user**, **Magic link or OTP**, **Change email address**, **Reset password**, **Reauthentication**. Security notification names: **Password changed**, **Email address changed**, **Phone number changed**, **Sign-in method linked**, **Sign-in method removed**, **MFA method added**, **MFA method removed**. No template bodies, tokens, subjects, or credential fields were copied.

**Updated handoff:** the browser is inspecting a different project from the one configured in Production and the repaired local environment. The mismatch is verified; it is not evidence that Production should be repointed. The owner must first identify/obtain existing dashboard access to `jylhsnfcgdbjcszjpcal` or explicitly decide that a different project is intended. Do not copy credentials, migrate data, or change Vercel/local configuration to the old project as a workaround.

In the intended Production project, an authorized administrator should inspect **Authentication → Sign In / Providers → Google**, **Authentication → Emails → SMTP Settings**, **Authentication → URL Configuration**, and **Database → Migrations**. Confirm saved Google enablement, SMTP readiness, the public Production Site URL, exact `/auth/callback` redirects for Production and approved localhost port 3010, and the recovery callback selected by the builders; then inspect the three migration versions already listed above. Those Production administrative facts remain unverified because this browser session did not expose that project. Any changes require their own authorization. Continue local implementation/review independently; no paid addon, new account, provider write, SQL execution, or live auth test is needed to complete this audit.

### Final handoff before Luna freeze

- Correct project: [Production Supabase project](https://supabase.com/dashboard/project/jylhsnfcgdbjcszjpcal), [Production Google provider settings](https://supabase.com/dashboard/project/jylhsnfcgdbjcszjpcal/auth/providers?provider=Google). These links identify the configured project; they do not establish dashboard access. The signed-in BrowserOS session redirected the direct project request to its organization list.
- The owner reported enabling Google. Dep's latest independent Production Auth settings read returned **false** at 13:31:06 UTC; the main agent separately reported another fresh Production **false** at 13:40 UTC. Dep's owned old-project dashboard tab showed **false** during 13:44–13:46 UTC. An old-project **true** state was not independently verified by Dep; no claim is made about later changes or unsaved state in the user's tab.
- The project mismatch has been communicated to the owner. The pending choice is to retain configured Production `jylhsnfcgdbjcszjpcal` (recommended by the main agent) or intentionally switch to old `hzgvhkgsxvodmdurysvf`, which is a data/project fork. No choice is inferred from silence or reported Google enablement.
- Read-only audit complete. Pending that choice, no credentials, provider project, environment configuration, migration, or other dependent setting will be changed. The earlier explicitly authorized local URL correction remains the only environment change. No further browser exploration was performed for this final handoff.

### Final owner decision and single fresh verification

**Decision resolved:** the owner explicitly chose **Keep Production's current project** and reported “it's enabled and match vercel's NEXT_PUBLIC_SUPABASE_URL.” The final target remains `jylhsnfcgdbjcszjpcal`. Earlier references to a pending project choice are historical and superseded. No migration, key replacement, or project swap is authorized or needed for this decision.

At **2026-10-25 21:48:40 Asia/Manila (13:48:40 UTC)**, Dep performed exactly one new public Auth settings GET after securely re-resolving the Production URL and public key from authenticated Vercel reads. Project-reference match to the final target was **true**. Requests sent `Cache-Control: no-cache, no-store` and `Pragma: no-cache`. The response still reported **Google enabled=false**, **email enabled=true**, **signup disabled=false**, and **email autoconfirm=false**.

The owner's reported enablement conflicts with this latest observed Production flag; it is not recorded as verified enabled. No further question, retry, browser exploration, provider write, environment change, auth attempt, or email followed. The local implementation pipeline may continue; working live Google sign-in is not established by this audit.
