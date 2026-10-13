-- households and cards only. study_sets, passes, cells, and tracker tables are later.
-- study_set_id has no foreign key: study_sets does not exist yet.
-- The service role is the only writer. anon and authenticated have no policies and no grants.
-- The raw connect token is never stored. Accept writes through accept_connect_invite.

create table public.households (
  student_id uuid primary key references public.profiles (id) on delete restrict,
  main_parent_id uuid not null references public.profiles (id) on delete restrict,
  accepted_invite_id uuid not null references public.connect_invites (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint households_distinct_people_check check (main_parent_id <> student_id),
  constraint households_accepted_invite_unique unique (accepted_invite_id)
);

comment on table public.households is
  'One row per student. The first accepted parent stays. A later accept does not replace main_parent_id.';

comment on column public.households.created_at is
  'Accept time of the invite that won. Not updated when a later invite is ignored.';

create index households_main_parent_idx
  on public.households (main_parent_id);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete restrict,
  school_year text not null default '2026-2027',
  kind text not null,
  course text,
  quarter smallint,
  study_set_id uuid,
  created_at timestamptz not null default now(),
  constraint cards_school_year_check check (school_year = '2026-2027'),
  constraint cards_kind_check check (kind = 'official' or kind = 'generated'),
  constraint cards_kind_shape_check check (
    (
      kind = 'official'
      and course in ('geography_6', 'history_6', 'language_6', 'mathematics_6')
      and quarter in (1, 2)
      and study_set_id is null
    )
    or (
      kind = 'generated'
      and course is null
      and quarter is null
      and study_set_id is not null
    )
  )
);

comment on table public.cards is
  'Official rows are one course and one quarter. Generated rows are not inserted in this migration.';

comment on column public.cards.study_set_id is
  'Null on official cards. No foreign key in this migration because study_sets is not created yet.';

create unique index cards_official_unique
  on public.cards (student_id, course, quarter)
  where kind = 'official';

create unique index cards_generated_study_set_unique
  on public.cards (study_set_id)
  where kind = 'generated';

create index cards_student_kind_idx
  on public.cards (student_id, kind);

create or replace function public.households_require_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  student_role text;
  parent_role text;
begin
  select role into student_role
  from public.profiles
  where id = new.student_id;

  select role into parent_role
  from public.profiles
  where id = new.main_parent_id;

  if student_role is distinct from 'student' or parent_role is distinct from 'parent' then
    raise exception 'household requires a student and a parent'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.households_reject_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'household cannot be changed'
    using errcode = '42501';
end;
$$;

create or replace function public.households_invite_matches()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_state text;
  invite_student uuid;
  invite_parent uuid;
begin
  select state, accepted_by_student_id, parent_id
    into invite_state, invite_student, invite_parent
  from public.connect_invites
  where id = new.accepted_invite_id;

  if invite_state is distinct from 'accepted'
     or invite_student is distinct from new.student_id
     or invite_parent is distinct from new.main_parent_id then
    raise exception 'household invite does not match the accepted parent'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger households_require_roles
  before insert on public.households
  for each row
  execute function public.households_require_roles();

create trigger households_reject_update
  before update on public.households
  for each row
  execute function public.households_reject_update();

create trigger households_invite_matches
  after insert on public.households
  for each row
  execute function public.households_invite_matches();

create or replace function public.insert_official_cards(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cards (student_id, school_year, kind, course, quarter, study_set_id)
  select p_student_id, '2026-2027', 'official', official.course, official.quarter, null
  from (
    values
      ('geography_6'::text, 1::smallint),
      ('geography_6', 2::smallint),
      ('history_6', 1::smallint),
      ('history_6', 2::smallint),
      ('language_6', 1::smallint),
      ('language_6', 2::smallint),
      ('mathematics_6', 1::smallint),
      ('mathematics_6', 2::smallint)
  ) as official(course, quarter)
  where not exists (
    select 1
    from public.cards
    where cards.student_id = p_student_id
      and cards.kind = 'official'
      and cards.course = official.course
      and cards.quarter = official.quarter
  );
end;
$$;

create or replace function public.accept_connect_invite(
  p_token_hash text,
  p_student_id uuid,
  p_email_key text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.connect_invites%rowtype;
  student_role text;
  student_key text;
  household public.households%rowtype;
  has_household boolean := false;
  claimed boolean := false;
  inserted_student uuid := null;
begin
  if p_token_hash is null or p_student_id is null or p_email_key is null then
    return jsonb_build_object('result', 'not_found');
  end if;

  select * into invite
  from public.connect_invites
  where token_hash = p_token_hash
  for update;

  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;

  select role, email_key into student_role, student_key
  from public.profiles
  where id = p_student_id;

  if student_role is distinct from 'student' then
    return jsonb_build_object('result', 'role_not_student');
  end if;

  if invite.state = 'sent' and invite.expires_at <= now() then
    return jsonb_build_object('result', 'expired');
  end if;

  if invite.invited_email_key is distinct from p_email_key
     or student_key is distinct from p_email_key then
    return jsonb_build_object('result', 'email_mismatch');
  end if;

  if invite.state in ('accepted', 'ignored')
     and invite.accepted_by_student_id is distinct from p_student_id then
    return jsonb_build_object('result', 'already_used');
  end if;

  select * into household
  from public.households
  where student_id = p_student_id
  for update;
  has_household := found;

  if has_household then
    if invite.state = 'accepted'
       and invite.accepted_by_student_id = p_student_id
       and household.accepted_invite_id = invite.id then
      perform public.insert_official_cards(p_student_id);
      return jsonb_build_object(
        'result', 'accepted',
        'student_id', p_student_id,
        'main_parent_id', household.main_parent_id
      );
    end if;

    if invite.state = 'ignored' and invite.accepted_by_student_id = p_student_id then
      return jsonb_build_object(
        'result', 'ignored',
        'student_id', p_student_id,
        'reason', 'MAIN_PARENT_EXISTS'
      );
    end if;

    if invite.state = 'sent' then
      update public.connect_invites
      set state = 'ignored',
          accepted_at = now(),
          accepted_by_student_id = p_student_id
      where id = invite.id
        and state = 'sent';
      return jsonb_build_object(
        'result', 'ignored',
        'student_id', p_student_id,
        'reason', 'MAIN_PARENT_EXISTS'
      );
    end if;

    raise exception 'household does not match this invite'
      using errcode = '23514';
  end if;

  if invite.state = 'ignored' and invite.accepted_by_student_id = p_student_id then
    return jsonb_build_object(
      'result', 'ignored',
      'student_id', p_student_id,
      'reason', 'MAIN_PARENT_EXISTS'
    );
  end if;

  if invite.state = 'sent' then
    update public.connect_invites
    set state = 'accepted',
        accepted_at = now(),
        accepted_by_student_id = p_student_id
    where id = invite.id
      and state = 'sent';
    if not found then
      raise exception 'connect invite was not claimed'
        using errcode = '40001';
    end if;
    claimed := true;
  elsif invite.state is distinct from 'accepted' then
    raise exception 'connect invite cannot be accepted'
      using errcode = '23514';
  end if;

  insert into public.households (student_id, main_parent_id, accepted_invite_id)
  values (p_student_id, invite.parent_id, invite.id)
  on conflict (student_id) do nothing
  returning student_id into inserted_student;

  if inserted_student is null then
    if claimed then
      update public.connect_invites
      set state = 'ignored',
          accepted_at = now(),
          accepted_by_student_id = p_student_id
      where id = invite.id;
      return jsonb_build_object(
        'result', 'ignored',
        'student_id', p_student_id,
        'reason', 'MAIN_PARENT_EXISTS'
      );
    end if;
    raise exception 'accepted invite lost the household insert'
      using errcode = '23505';
  end if;

  perform public.insert_official_cards(p_student_id);

  return jsonb_build_object(
    'result', 'accepted',
    'student_id', p_student_id,
    'main_parent_id', invite.parent_id
  );
end;
$$;

alter table public.households enable row level security;
alter table public.cards enable row level security;

revoke all privileges on table public.households from public;
revoke all privileges on table public.households from anon;
revoke all privileges on table public.households from authenticated;
revoke all privileges on table public.households from service_role;
grant select, insert on table public.households to service_role;

revoke all privileges on table public.cards from public;
revoke all privileges on table public.cards from anon;
revoke all privileges on table public.cards from authenticated;
revoke all privileges on table public.cards from service_role;
grant select, insert on table public.cards to service_role;

revoke all privileges on function public.households_require_roles() from public;
revoke all privileges on function public.households_require_roles() from anon;
revoke all privileges on function public.households_require_roles() from authenticated;
revoke all privileges on function public.households_require_roles() from service_role;
grant execute on function public.households_require_roles() to service_role;

revoke all privileges on function public.households_reject_update() from public;
revoke all privileges on function public.households_reject_update() from anon;
revoke all privileges on function public.households_reject_update() from authenticated;
revoke all privileges on function public.households_reject_update() from service_role;
grant execute on function public.households_reject_update() to service_role;

revoke all privileges on function public.households_invite_matches() from public;
revoke all privileges on function public.households_invite_matches() from anon;
revoke all privileges on function public.households_invite_matches() from authenticated;
revoke all privileges on function public.households_invite_matches() from service_role;
grant execute on function public.households_invite_matches() to service_role;

revoke all privileges on function public.insert_official_cards(uuid) from public;
revoke all privileges on function public.insert_official_cards(uuid) from anon;
revoke all privileges on function public.insert_official_cards(uuid) from authenticated;
revoke all privileges on function public.insert_official_cards(uuid) from service_role;

revoke all privileges on function public.accept_connect_invite(text, uuid, text) from public;
revoke all privileges on function public.accept_connect_invite(text, uuid, text) from anon;
revoke all privileges on function public.accept_connect_invite(text, uuid, text) from authenticated;
revoke all privileges on function public.accept_connect_invite(text, uuid, text) from service_role;
grant execute on function public.accept_connect_invite(text, uuid, text) to service_role;
