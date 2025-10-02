-- Ensure friend request timestamps and meeting streak tracking are in place

alter table public.friend_requests
  add column if not exists updated_at timestamptz default now();

alter table public.friends
  add column if not exists total_meets integer default 0,
  add column if not exists daily_meets integer default 0,
  add column if not exists last_daily_reset date default current_date;

alter table public.meeting_participants
  add column if not exists confirmed_at timestamptz;

create or replace function public.respond_friend_request(request_id uuid, action text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requester uuid := auth.uid();
  request record;
  accept boolean := action = 'accept';
begin
  if requester is null then
    raise exception 'Not authenticated';
  end if;

  select *
    into request
  from friend_requests
  where id = request_id;

  if request is null then
    raise exception 'Request not found';
  end if;

  if requester not in (request.from_user, request.to_user) then
    raise exception 'Not allowed';
  end if;

  if request.status <> 'pending' then
    raise exception 'Request already resolved';
  end if;

  update friend_requests
     set status = case when accept then 'accepted' else 'declined' end,
         updated_at = now()
   where id = request_id;

  if accept then
    insert into friends (user_id, friend_id, accepted)
    values
      (request.from_user, request.to_user, true),
      (request.to_user, request.from_user, true)
    on conflict (user_id, friend_id) do update
      set accepted = true,
          created_at = now();
  end if;
end;
$$;

drop function if exists public.end_meeting(uuid);
drop function if exists public.confirm_meeting(uuid);

create function public.end_meeting(p_meeting_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requester uuid := auth.uid();
begin
  if requester is null then
    raise exception 'Not authenticated';
  end if;

  update meetings
     set active = false,
         ended_at = now()
   where id = p_meeting_id
     and active = true
     and exists (
       select 1
       from meeting_participants mp
       where mp.meeting_id = p_meeting_id
         and mp.user_id = requester
     );

  if not found then
    raise exception 'Not authorized or meeting already closed';
  end if;

  update meeting_participants
     set left_at = coalesce(left_at, now())
   where meeting_id = p_meeting_id;
end;
$$;

create function public.confirm_meeting(p_meeting_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requester uuid := auth.uid();
  participant_ids uuid[];
  today date := current_date;
  participant uuid;
  partner uuid;
begin
  if requester is null then
    raise exception 'Not authenticated';
  end if;

  select array_agg(user_id)
    into participant_ids
  from meeting_participants
  where meeting_id = p_meeting_id;

  if participant_ids is null or array_length(participant_ids, 1) <> 2 then
    raise exception 'Meeting must have exactly two participants' using errcode = 'P0001';
  end if;

  if requester <> participant_ids[1] and requester <> participant_ids[2] then
    raise exception 'Not authorized';
  end if;

  update meetings
     set active = false,
         ended_at = now()
   where id = p_meeting_id
     and active = true;

  update meeting_participants
     set left_at = coalesce(left_at, now()),
         confirmed_at = coalesce(confirmed_at, now())
   where meeting_id = p_meeting_id;

  foreach participant in array participant_ids loop
    foreach partner in array participant_ids loop
      continue when participant = partner;
      update friends
         set total_meets = coalesce(total_meets, 0) + 1,
             daily_meets = case
                             when last_daily_reset = today then coalesce(daily_meets, 0) + 1
                             else 1
                           end,
             last_daily_reset = case
                                  when last_daily_reset = today then last_daily_reset
                                  else today
                                end
       where user_id = participant
         and friend_id = partner;
    end loop;
  end loop;
end;
$$;
