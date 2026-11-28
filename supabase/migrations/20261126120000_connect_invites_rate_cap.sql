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
