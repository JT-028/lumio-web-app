-- connect_invites only. The service role is the only writer.
-- anon and authenticated have no policies and no grants.
-- The raw URL token is never stored. token_hash is SHA-256 hex.

create table public.connect_invites (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on delete restrict,
  invited_email text not null,
  invited_email_key text not null,
  token_hash text not null,
  state text not null default 'sent',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by_student_id uuid references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint connect_invites_state_check check (
    state = 'sent' or state = 'accepted' or state = 'ignored'
  ),
  constraint connect_invites_invited_email_check check (
    invited_email = lower(invited_email)
    and invited_email = btrim(invited_email)
    and char_length(invited_email) between 3 and 320
    and invited_email !~ '[[:space:]]'
    and invited_email ~ '^[^@]+@(gmail\.com|googlemail\.com)$'
  ),
  constraint connect_invites_email_key_check check (
    invited_email_key = lower(invited_email_key)
    and char_length(invited_email_key) between 3 and 320
    and position('+' in invited_email_key) = 0
    and invited_email_key ~ '^[^@.+[:space:]]+@gmail\.com$'
  ),
  constraint connect_invites_token_hash_check check (
    token_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint connect_invites_acceptance_check check (
    (
      state = 'sent'
      and accepted_at is null
      and accepted_by_student_id is null
    )
    or (
      state in ('accepted', 'ignored')
      and accepted_at is not null
      and accepted_by_student_id is not null
    )
  ),
  constraint connect_invites_token_hash_unique unique (token_hash)
);

comment on table public.connect_invites is
  'One row per parent send. A later send inserts a new row and does not extend an old token.';

comment on column public.connect_invites.invited_email is
  'Address Resend sends to, trimmed and lowercased. Gmail or Googlemail only.';

comment on column public.connect_invites.invited_email_key is
  'Canonical Gmail key: googlemail.com rewritten to gmail.com, dots and plus-tag removed.';

comment on column public.connect_invites.token_hash is
  'SHA-256 hex of the raw URL token. The raw token is never stored.';

comment on column public.connect_invites.expires_at is
  'Alex''s default: created_at plus 7 days. A new send inserts a new row and does not extend an old token.';

create index connect_invites_parent_created_idx
  on public.connect_invites (parent_id, created_at);

create index connect_invites_email_key_state_idx
  on public.connect_invites (invited_email_key, state);

create or replace function public.connect_invites_normalize_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  local_part text;
  domain_part text;
begin
  new.invited_email := lower(btrim(new.invited_email));
  if new.invited_email !~ '^[^@[:space:]]+@(gmail\.com|googlemail\.com)$' then
    raise exception 'connect invite email must be gmail'
      using errcode = '23514';
  end if;
  local_part := split_part(new.invited_email, '@', 1);
  domain_part := split_part(new.invited_email, '@', 2);
  if position('+' in local_part) > 0 then
    local_part := split_part(local_part, '+', 1);
  end if;
  local_part := replace(local_part, '.', '');
  if local_part = '' or domain_part not in ('gmail.com', 'googlemail.com') then
    raise exception 'connect invite email must be gmail'
      using errcode = '23514';
  end if;
  if domain_part = 'googlemail.com' then
    domain_part := 'gmail.com';
  end if;
  new.invited_email_key := local_part || '@' || domain_part;
  return new;
end;
$$;

create or replace function public.connect_invites_require_parent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_role text;
begin
  select role into sender_role
  from public.profiles
  where id = new.parent_id;

  if sender_role is distinct from 'parent' then
    raise exception 'connect invite sender must be a parent'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.connect_invites_set_expiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Alex's default: created_at plus 7 days. A new send does not extend an old token.
  if new.created_at is null then
    new.created_at := now();
  end if;
  new.expires_at := new.created_at + interval '7 days';
  return new;
end;
$$;

create or replace function public.connect_invites_lock_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.parent_id is distinct from old.parent_id
     or new.invited_email is distinct from old.invited_email
     or new.invited_email_key is distinct from old.invited_email_key
     or new.token_hash is distinct from old.token_hash
     or new.expires_at is distinct from old.expires_at
     or new.created_at is distinct from old.created_at then
    raise exception 'connect invite identity cannot be changed'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger connect_invites_normalize_email
  before insert on public.connect_invites
  for each row
  execute function public.connect_invites_normalize_email();

create trigger connect_invites_require_parent
  before insert or update on public.connect_invites
  for each row
  execute function public.connect_invites_require_parent();

create trigger connect_invites_set_expiry
  before insert on public.connect_invites
  for each row
  execute function public.connect_invites_set_expiry();

create trigger connect_invites_lock_identity
  before update on public.connect_invites
  for each row
  execute function public.connect_invites_lock_identity();

alter table public.connect_invites enable row level security;

revoke all privileges on table public.connect_invites from public;
revoke all privileges on table public.connect_invites from anon;
revoke all privileges on table public.connect_invites from authenticated;
revoke all privileges on table public.connect_invites from service_role;

-- delete is only for rolling back a row when Resend does not accept the message.
grant select, insert, update, delete on table public.connect_invites to service_role;

revoke all privileges on function public.connect_invites_normalize_email() from public;
revoke all privileges on function public.connect_invites_normalize_email() from anon;
revoke all privileges on function public.connect_invites_normalize_email() from authenticated;
revoke all privileges on function public.connect_invites_normalize_email() from service_role;
grant execute on function public.connect_invites_normalize_email() to service_role;

revoke all privileges on function public.connect_invites_require_parent() from public;
revoke all privileges on function public.connect_invites_require_parent() from anon;
revoke all privileges on function public.connect_invites_require_parent() from authenticated;
revoke all privileges on function public.connect_invites_require_parent() from service_role;
grant execute on function public.connect_invites_require_parent() to service_role;

revoke all privileges on function public.connect_invites_set_expiry() from public;
revoke all privileges on function public.connect_invites_set_expiry() from anon;
revoke all privileges on function public.connect_invites_set_expiry() from authenticated;
revoke all privileges on function public.connect_invites_set_expiry() from service_role;
grant execute on function public.connect_invites_set_expiry() to service_role;

revoke all privileges on function public.connect_invites_lock_identity() from public;
revoke all privileges on function public.connect_invites_lock_identity() from anon;
revoke all privileges on function public.connect_invites_lock_identity() from authenticated;
revoke all privileges on function public.connect_invites_lock_identity() from service_role;
grant execute on function public.connect_invites_lock_identity() to service_role;