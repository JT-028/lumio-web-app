BACKEND PROGRESS — M2 invites
Project: Lumio

## Files
- lumio-web-app/supabase/migrations/20261013120000_connect_invites.sql — connect_invites only, parent-role trigger, Alex’s 7-day expiry
- lumio-web-app/src/app/api/invites/route.ts — POST /api/invites
- lumio-web-app/src/services/invites.ts — create one invite. Owns the 7-day rule. Does not preview or accept
- lumio-web-app/src/services/authz.ts — requireParentRole. Existing session checks are unchanged
- lumio-web-app/src/data/invites.ts — count, insert, and roll back one invite. Service role only
- lumio-web-app/src/domain/email-key.ts — parseInvitedGmail. Existing key rules are unchanged
- lumio-web-app/src/domain/invite-response.ts — 201 allowlist. No token and no hash
- lumio-web-app/src/domain/invite-contract.test.ts — Gmail check and token-not-in-response. No live Resend or Supabase
- lumio-web-app/src/lib/tokens.ts — 32 random bytes and SHA-256 hex of the URL token
- lumio-web-app/src/lib/resend.ts — the only file that reads RESEND_API_KEY and sends mail
- lumio-web-app/.env.example — RESEND_API_KEY and RESEND_FROM_EMAIL, empty values

No page.tsx was added or edited. The connect form still says the email is not available in this milestone. GET /api/connect, POST /api/connect/:token/accept, and GET /api/home were not added.

## Endpoints
- POST /api/invites — auth: user, role parent — DoD: `{ invited_email }` returns 201 `{ id, invited_email, expires_at, state: "sent" }`; the raw token is not in the JSON and is stored only as SHA-256 hex; Resend sends one mail to that Gmail with the parent’s first name, the 7-day expiry, and `${NEXT_PUBLIC_APP_URL}/connect/{rawToken}`; a missing session is 401 UNAUTHENTICATED; a non-parent is 403 ROLE_FORBIDDEN; a non-Gmail is 400 INVALID_EMAIL; the 11th invite by this parent in the rolling hour is 429 RATE_LIMITED; a missing Resend key or sender is 503 EMAIL_NOT_CONFIGURED and keeps no row; a refused send is 502 EMAIL_FAILED and keeps no row. The route does not say whether that Gmail already has an account. The link origin is `NEXT_PUBLIC_APP_URL` only.

Every JSON error is `{ "error": { "code", "message", "details" } }`. `details` is null or `{ "field" }`. Responses send `Cache-Control: private, no-store`.

## Schema
- connect_invites only — migration: yes. `parent_id` and `accepted_by_student_id` reference `profiles` with `ON DELETE RESTRICT`. The sender must be a parent (trigger). `invited_email` is trimmed and lowercased Gmail. `invited_email_key` rewrites googlemail.com to gmail.com and removes dots and the plus-tag. `token_hash` is unique SHA-256 hex. `state` is `sent`, `accepted`, or `ignored`. `expires_at` is `created_at` plus 7 days, labeled Alex’s default, and a later update cannot change it. Indexes: unique `(token_hash)`, `(parent_id, created_at)`, `(invited_email_key, state)`. RLS is on with no policies. anon and authenticated have no grants. The service role may select, insert, update, and delete. Delete exists only to drop a row when Resend does not accept the message.
- profiles was not altered.

## Blockers
- This migration is not applied, and RESEND_API_KEY and RESEND_FROM_EMAIL are empty in git — needs: user, before a live send
- The `/home` form still does not call this route — needs: frontend
- Preview and accept are not in this pass — needs: a later backend task for GET /api/connect/:token and POST /api/connect/:token/accept

## Ready for
- [x] Frontend developer (POST /api/invites contract is stable)
- [x] Luna

`npm run typecheck` and `npm test` were run for this pass. No production deploy and no git push.
