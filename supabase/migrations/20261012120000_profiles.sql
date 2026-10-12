-- Greenfield. Profiles only. Other Lumio tables are later milestones.
-- The service role is the only writer. anon and authenticated have no policies and no grants.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  role text,
  first_name text,
  email text not null,
  email_key text not null,
  created_at timestamptz not null default now(),
  constraint profiles_role_check check (
    role is null or role = 'parent' or role = 'student'
  ),
  constraint profiles_role_requires_name_check check (
    role is null or first_name is not null
  ),
  constraint profiles_first_name_check check (
    first_name is null
    or (
      char_length(first_name) between 1 and 40
      and char_length(btrim(first_name)) between 1 and 40
      and position('@' in first_name) = 0
      and first_name ~ '^[[:alpha:] ''’\-]+$'
    )
  ),
  constraint profiles_email_lowercase_check check (email = lower(email)),
  constraint profiles_email_key_lowercase_check check (email_key = lower(email_key)),
  constraint profiles_email_shape_check check (
    position('@' in email) > 1
    and char_length(email) <= 320
  ),
  constraint profiles_email_key_shape_check check (char_length(email_key) > 0),
  constraint profiles_email_unique unique (email),
  constraint profiles_email_key_unique unique (email_key)
);

comment on table public.profiles is
  'One row per auth user, inserted only by POST /api/profile. Google sign-in does not insert a row.';

comment on column public.profiles.role is
  'parent or student once chosen. Null until then. Not updated after insert.';

comment on column public.profiles.email_key is
  'Gmail canonical key when the address is Gmail. Otherwise the lowercase address.';

create or replace function public.profiles_reject_identity_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.role is distinct from old.role
     or new.email is distinct from old.email
     or new.email_key is distinct from old.email_key
     or new.created_at is distinct from old.created_at then
    raise exception 'profile role and email cannot be changed'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_reject_identity_update
  before update on public.profiles
  for each row
  execute function public.profiles_reject_identity_update();

alter table public.profiles enable row level security;

revoke all privileges on table public.profiles from public;
revoke all privileges on table public.profiles from anon;
revoke all privileges on table public.profiles from authenticated;
revoke all privileges on table public.profiles from service_role;

grant select, insert on table public.profiles to service_role;

revoke all privileges on function public.profiles_reject_identity_update() from public;
revoke all privileges on function public.profiles_reject_identity_update() from anon;
revoke all privileges on function public.profiles_reject_identity_update() from authenticated;
revoke all privileges on function public.profiles_reject_identity_update() from service_role;

grant execute on function public.profiles_reject_identity_update() to service_role;
