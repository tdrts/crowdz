alter table public.friend_requests
  add column if not exists updated_at timestamptz default now();

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
    on conflict (user_id, friend_id) do update set accepted = true, created_at = now();
  end if;
end;
$$;
