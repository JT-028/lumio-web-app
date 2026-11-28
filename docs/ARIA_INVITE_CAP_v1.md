# ARIA BLUEPRINT AMENDMENT — Invite rate cap (audit C3) v1.0

Date: 2026-11-26. Branch `chore/lumio-audit-cleanup`, based on `cb40ac1`.
Input: audit C3 (2026-11-25); `src/services/invites.ts`; `src/data/invites.ts`; `src/data/connect.ts`; migrations `20261012120000`, `20261013120000`, `20261013140000`; `test/m2-invites.test.ts`; `src/lib/supabase/public-config.ts`.
Scope: `POST /api/invites` only. Status codes, error codes, messages and the 201 body stay the same. No new dependency.
Owners: Theo writes the migration, `src/data/invites.ts` and `src/services/invites.ts`. Quinn writes `test/m2-invites.test.ts`.

## Decisions

- **Serialize on the parent's `profiles` row (`for no key update`).** The lock is on the real parent row, so no advisory-key namespace has to be invented or kept collision-free. The same read checks the sender role. `no key update` does not conflict with the `key share` locks that FK inserts take (`households.main_parent_id`, the FK check on `connect_invites.parent_id`), so other writes that reference the parent are not blocked. *Rejected:* `pg_advisory_xact_lock(hashtextextended(...))`. It works, but it needs a hand-picked key scheme that is shared across the database, and it records no data relationship.
- **`security definer`, `set search_path = public`.** A row lock needs UPDATE privilege on `profiles`, and `service_role` deliberately has only `select, insert`. Definer takes the lock as the owner without widening that grant. Every existing function uses the same setting. Every object reference is schema-qualified.
- **DB clock for both sides.** The function inserts without `created_at`. The column default `now()` sets it, and `connect_invites_set_expiry` still sets `expires_at = created_at + 7 days`. The window is `created_at >= now() - interval '1 hour'`. With one clock, Vercel clock skew cannot place a row outside its own window, and no caller can backdate `created_at` to escape the cap.
- **The cap and window are constants in SQL (10, 1 hour).** The rule is enforced where the lock is. No caller can pass a bigger cap.
- **Over cap is a return value, not an exception.** The function returns `jsonb`, with `result` as the tag. That matches `accept_connect_invite`. A supabase-js `error` then always means a fault (500).
- **Revoke direct `insert` from `service_role`.** After that, the RPC is the only way to add an invite, so no future `.insert()` can skip the cap. Deploy order: apply the migration together with Theo's code. If old code runs after the migration, its insert fails as 500 and never exceeds the cap.
- **Isolation:** this relies on READ COMMITTED, which is the Supabase and PostgREST default. After the lock wait, the `count(*)` statement takes a fresh snapshot and sees the rival's committed row. The function must stay VOLATILE, which is the default. Do not mark it `stable`.

## 1. Migration — `supabase/migrations/20261126120000_connect_invites_rate_cap.sql`

```sql
-- Audit C3: one atomic check-and-insert for the 10-per-rolling-hour invite cap.
-- Locks the parent's profiles row so two sends by one parent run one after the other.
-- The DB clock sets created_at and the window. Existing triggers set the key and the expiry.

create or replace function public.create_connect_invite_capped(
  p_parent_id uuid,
  p_invited_email text,
  p_invited_email_key text,
  p_token_hash text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_role text;
  recent integer;
  invite public.connect_invites%rowtype;
begin
  select role into sender_role
  from public.profiles
  where id = p_parent_id
  for no key update;

  if sender_role is distinct from 'parent' then
    raise exception 'connect invite sender must be a parent'
      using errcode = '42501';
  end if;

  select count(*) into recent
  from public.connect_invites
  where parent_id = p_parent_id
    and created_at >= now() - interval '1 hour';

  if recent >= 10 then
    return jsonb_build_object('result', 'rate_limited');
  end if;

  insert into public.connect_invites (parent_id, invited_email, invited_email_key, token_hash, state)
  values (p_parent_id, p_invited_email, p_invited_email_key, p_token_hash, 'sent')
  returning * into invite;

  return jsonb_build_object(
    'result', 'sent',
    'id', invite.id,
    'invited_email', invite.invited_email,
    'expires_at', invite.expires_at,
    'state', invite.state
  );
end;
$$;

comment on function public.create_connect_invite_capped(uuid, text, text, text) is
  'Only insert path for connect_invites. At most 10 rows per parent in the rolling hour (DB clock).';

revoke all privileges on function public.create_connect_invite_capped(uuid, text, text, text) from public;
revoke all privileges on function public.create_connect_invite_capped(uuid, text, text, text) from anon;
revoke all privileges on function public.create_connect_invite_capped(uuid, text, text, text) from authenticated;
revoke all privileges on function public.create_connect_invite_capped(uuid, text, text, text) from service_role;
grant execute on function public.create_connect_invite_capped(uuid, text, text, text) to service_role;

-- The function above is now the only way to add an invite, so no caller can skip the cap.
-- select, update and delete stay. Delete is still the Resend rollback.
revoke insert on table public.connect_invites from service_role;
```

All four existing triggers still fire on the inner insert. `normalize_email` recomputes the key, `require_parent` checks the role again, and `set_expiry` sets `expires_at` before the NOT NULL check. The `(parent_id, created_at)` index serves the count. A deleted row is not counted, so a rolled-back send frees its slot.

## 2. RPC call and result

```ts
const { data, error } = await db.rpc("create_connect_invite_capped", {
  p_parent_id: input.parentId,
  p_invited_email: input.invitedEmail,
  p_invited_email_key: input.invitedEmailKey,
  p_token_hash: input.tokenHash,
});
```

`data` is exactly one of the following:
- `{ "result": "sent", "id": uuid, "invited_email": string, "expires_at": ISO timestamptz string, "state": "sent" }`
- `{ "result": "rate_limited" }`

Anything else is a fault: an `error` (42501 non-parent, 23514/23505 constraint, network), a null or non-object `data`, or an unknown `result`. `expires_at` has the same Postgres JSON timestamptz format that the old `.select()` returned, so the 201 body does not change.

## 3. Data layer (`src/data/invites.ts`) and service mapping

- **Remove** `countRecentInvites`, `insertSentInvite` and `RETURN_COLUMNS`. **Keep** `deleteInvite` and `inviteFailure` unchanged.
- **Change** `SentInviteInsert` to `{ parentId: string; invitedEmail: string; invitedEmailKey: string; tokenHash: string }`. `createdAt` and `expiresAt` are dropped.
- **Add:**
  ```ts
  export type CappedInsertResult =
    | { result: "sent"; invite: SentInviteResponse }
    | { result: "rate_limited" };
  export async function insertSentInviteCapped(input: SentInviteInsert): Promise<CappedInsertResult>;
  ```
  Parse it in this order:
  1. If `error`, or `!data`, or `typeof data !== "object"`, throw `inviteFailure()`.
  2. If `result === "rate_limited"`, return `{ result: "rate_limited" }`.
  3. If `result !== "sent"`, throw `inviteFailure()`.
  4. Run `sentInviteResponse(data)`. If it is null, or `invite.invited_email !== input.invitedEmail`, throw `inviteFailure()`.
  5. Return `{ result: "sent", invite }`.

`src/services/invites.ts`:
- Keep this order: `INVALID_EMAIL` 400, then `EMAIL_NOT_CONFIGURED` 503, then the origin (section 5), then `createConnectToken()`, then `insertSentInviteCapped(...)`.
- If the result is `rate_limited`, throw `new AppError("RATE_LIMITED", 429, RATE_LIMITED, null)` with the existing message string. In that case no row is written and no mail is sent.
- Any data-layer throw propagates as the existing `INTERNAL` 500 "Something went wrong.".
- Then `stored = outcome.invite`. The mail send, the `deleteInvite` rollback, the `EMAIL_FAILED` 502 path and the failed-rollback `INTERNAL` 500 path stay byte-for-byte the same.
- Delete `HOUR_MS`, `MAX_INVITES_PER_HOUR`, `CONNECT_LINK_TTL_DAYS` and `CONNECT_LINK_TTL_MS`. Replace them with one comment: the 7-day expiry and the 10-per-hour cap live in SQL (`20261013120000`, `20261126120000`).

## 4. Test fake contract (Quinn, `test/m2-invites.test.ts` only)

The fake that backs invites is the **inline `getDb()` mock in `test/m2-invites.test.ts`**. `test/support/memory-db.ts` has no `connect_invites` table, and this test does not import it, so leave it unchanged. Add `async rpc(name, args)` next to `from` on the object that `getDb()` returns:

- If `name !== "create_connect_invite_capped"`, return `{ data: null, error: { code: "42883" } }`, the same as the `m2-connect` fake.
- If the `rpcFails` toggle is true (reset to `false` in `beforeEach`), return `{ data: null, error: { code: "synthetic-db-error" } }`.
- **Atomicity:** count and push in the same synchronous run, with no `await` inside `rpc`. Single-threaded JS then stands in for the row lock.
- Count the `rows` where `row.parent_id === args.p_parent_id` and `Date.parse(String(row.created_at)) >= Date.now() - 3_600_000`. Rows that are already seeded with only `{ parent_id, created_at }` must still count.
- If the count is 10 or more, return `{ data: { result: "rate_limited" }, error: null }` and push nothing.
- Otherwise, take `now = Date.now()` once and push this row: `{ id, parent_id: args.p_parent_id, invited_email: args.p_invited_email, invited_email_key: args.p_invited_email_key, token_hash: args.p_token_hash, state: "sent", created_at: new Date(now).toISOString(), expires_at: new Date(now + 7 * 86_400_000).toISOString() }`. Then return `{ data: { result: "sent", id, invited_email, expires_at, state: "sent" }, error: null }`.
- Take `id` from a counter that only goes up and is reset in `beforeEach`: `20000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`. Do not use `rows.length`, because a delete followed by a later insert could reuse an id.
- Make `from("connect_invites").insert` call `assert.fail("direct insert bypasses the cap")`. Remove `gte` once nothing calls it. Keep the `delete` and `then` paths as they are.

Required cases. Each must hold all of these: `failure()` checks the 429 and 500 bodies, `rows` stay correct, and `mailCalls` stay correct.
1. From empty, 10 sequential sends are 201 and the 11th is 429 RATE_LIMITED. 10 rows and 10 mails.
2. The existing "only this parent's recent invites" test still passes.
3. Rollback frees a slot. Seed 9 recent rows. Send with `mailStatus = 502` and expect 502 EMAIL_FAILED with 9 rows left. Then send with `mailStatus = 200` and expect 201. The next send is 429.
4. Burst. From empty, `Promise.all` of 15 `send()` gives exactly ten 201s and five 429s, 10 parent rows and 10 mails. This test must fail against the old count-then-insert code.
5. With `rpcFails`, the result is 500 INTERNAL with no row and no mail.
6. Origin, called on `createInvite()` directly. `NEXT_PUBLIC_APP_URL = "http://lumio.example.test"` gives 500 INTERNAL. `NODE_ENV = "production"` with `http://localhost:3010` also gives 500 INTERNAL. Neither writes a row or sends mail. Save `NODE_ENV` and restore it. Through `POST /api/invites` the same origins give 503 AUTH_UNAVAILABLE, because `assertCsrf` resolves the origin first (see section 5).

## 5. Origin: `resolveAppOrigin()` replaces `configuredAppOrigin()`

Delete `configuredAppOrigin()`. Call `resolveAppOrigin()` with no argument (the request Host is never a source). Catch its error and **rethrow `new AppError("INTERNAL", 500, "Something went wrong.", null)`**.

Recommended: rethrow, for two reasons:
1. The constraint is no API change, and today `createInvite()` answers a bad origin with 500 INTERNAL. At the route nothing changes either way: `assertCsrf` already calls `resolveAppOrigin()` before the service runs, so `POST /api/invites` answers a bad origin with 503 AUTH_UNAVAILABLE, as it did at `cb40ac1`. The service-level 500 is defence in depth.
2. Its own 503 says "Sign in is temporarily unavailable.", which would mislead a parent sending an invite.

The checks stay ahead of the RPC, so a bad origin never writes a row. One behaviour gets stricter on purpose: it now refuses `http:` outside local dev, any path, query or hash, and credentials, the same as auth. It no longer quietly trims to `.origin`.

## Notes for Luna

- In the migration: `for no key update` (not `for update`), `security definer`, no `stable`, the full revoke/grant block with the `(uuid, text, text, text)` signature, and `revoke insert`.
- A failed-mail row holds its slot for the few seconds before `deleteInvite`. A concurrent send in that gap may get 429. That fails closed, and it is accepted.
- `grep` should find no `countRecentInvites`, `insertSentInvite(` or `configuredAppOrigin` left in `src/` or `test/`.

## Open questions

- None blocking. The live apply (`supabase db push`) is Dep's step and needs **ship it**. No SQL concurrency check runs against real Postgres in CI. The burst test proves only the contract.
