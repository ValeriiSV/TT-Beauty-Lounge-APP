-- TT Beauty Lounge: client bookings from Telegram with administrator approval.

alter table public.appointments
  add column if not exists telegram_username text,
  add column if not exists telegram_language text;

alter table public.appointments
  drop constraint if exists appointments_telegram_language_check;

alter table public.appointments
  add constraint appointments_telegram_language_check
  check (telegram_language is null or telegram_language in ('ro', 'ru'));

create table if not exists public.telegram_clients (
  chat_id bigint primary key,
  username text,
  language text not null default 'ro' check (language in ('ro', 'ru')),
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.telegram_clients enable row level security;

revoke all on table public.telegram_clients from anon, authenticated;

alter table public.telegram_booking_drafts
  drop constraint if exists telegram_booking_drafts_chat_id_fkey;

alter table public.telegram_booking_drafts
  drop constraint if exists telegram_booking_drafts_step_check;

alter table public.telegram_booking_drafts
  add constraint telegram_booking_drafts_step_check
  check (step in (
    'name', 'phone', 'category', 'service', 'hair', 'hair_length', 'price',
    'date', 'time', 'confirm', 'calendar', 'edit_date', 'edit_time',
    'client_service', 'client_hair_length', 'client_date', 'client_time',
    'client_name', 'client_phone', 'client_note', 'client_confirm'
  ));

create index if not exists appointments_telegram_chat_date_idx
  on public.appointments (telegram_chat_id, preferred_date desc, preferred_time desc)
  where telegram_chat_id is not null;

create or replace function public.telegram_create_client_appointment(
  p_chat_id bigint,
  p_username text,
  p_language text,
  p_name text,
  p_phone text,
  p_service text,
  p_hair_length text,
  p_date date,
  p_time time,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duration integer := public.service_duration_minutes(p_service);
  v_close time;
  v_id uuid;
  v_code text := replace(gen_random_uuid()::text, '-', '');
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'access_denied';
  end if;
  if p_chat_id is null or p_chat_id <= 0 then raise exception 'invalid_chat'; end if;
  if p_language not in ('ro', 'ru') then raise exception 'invalid_language'; end if;
  if char_length(trim(coalesce(p_name, ''))) not between 2 and 100 then raise exception 'invalid_name'; end if;
  if char_length(trim(coalesce(p_phone, ''))) not between 5 and 30 then raise exception 'invalid_phone'; end if;
  if v_duration is null then raise exception 'invalid_service'; end if;
  if p_hair_length is not null and p_hair_length not in ('Scurt', 'Mediu', 'Lung', 'Foarte lung') then
    raise exception 'invalid_hair_length';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_date::text));
  if p_date + p_time <= timezone('Europe/Chisinau', now()) then raise exception 'invalid_datetime'; end if;
  if extract(isodow from p_date) = 7 then raise exception 'salon_closed'; end if;

  v_close := case when extract(isodow from p_date) = 6 then time '16:00' else time '18:00' end;
  if p_time < time '08:00'
     or p_time + make_interval(mins => v_duration) > v_close
     or extract(minute from p_time)::integer % 30 <> 0 then
    raise exception 'invalid_slot';
  end if;

  if exists (
    select 1
    from public.appointments a
    where a.preferred_date = p_date
      and a.status in ('pending', 'approved')
      and p_date + p_time < p_date + a.preferred_time + make_interval(mins => a.duration_minutes)
      and p_date + p_time + make_interval(mins => v_duration) > p_date + a.preferred_time
  ) then
    raise exception 'slot_unavailable';
  end if;

  insert into public.appointments (
    name, phone, service, duration_minutes, preferred_date, preferred_time,
    note, telegram_code, telegram_chat_id, telegram_linked_at,
    telegram_username, telegram_language, status, decided_at,
    notification_channel, source, hair_length
  ) values (
    trim(p_name), trim(p_phone), p_service, v_duration, p_date, p_time,
    nullif(trim(coalesce(p_note, '')), ''), v_code, p_chat_id, now(),
    nullif(left(trim(coalesce(p_username, '')), 64), ''), p_language, 'pending', null,
    'telegram', 'telegram', p_hair_length
  ) returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id, 'status', 'pending', 'duration_minutes', v_duration);
end;
$$;

create or replace function public.telegram_admin_decide_appointment(
  p_id uuid,
  p_action text,
  p_quoted_price numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.appointments%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'access_denied'; end if;
  if p_action not in ('approved', 'rejected') then raise exception 'invalid_action'; end if;
  if p_quoted_price is not null and (p_quoted_price <= 0 or p_quoted_price > 100000) then
    raise exception 'invalid_price';
  end if;

  select * into v_booking
  from public.appointments
  where id = p_id and status = 'pending'
  for update;
  if not found then raise exception 'appointment_already_processed'; end if;

  if p_action = 'approved' then
    perform pg_advisory_xact_lock(hashtext(v_booking.preferred_date::text));
    if v_booking.preferred_date + v_booking.preferred_time <= timezone('Europe/Chisinau', now()) then
      raise exception 'invalid_datetime';
    end if;
    if exists (
      select 1
      from public.appointments a
      where a.id <> v_booking.id
        and a.preferred_date = v_booking.preferred_date
        and a.status in ('pending', 'approved')
        and v_booking.preferred_date + v_booking.preferred_time
              < v_booking.preferred_date + a.preferred_time + make_interval(mins => a.duration_minutes)
        and v_booking.preferred_date + v_booking.preferred_time + make_interval(mins => v_booking.duration_minutes)
              > v_booking.preferred_date + a.preferred_time
    ) then
      raise exception 'slot_unavailable';
    end if;
  end if;

  update public.appointments
  set status = p_action,
      decided_at = now(),
      quoted_price = case when p_action = 'approved' and p_quoted_price is not null then p_quoted_price else quoted_price end
  where id = p_id
  returning * into v_booking;

  return jsonb_build_object(
    'ok', true,
    'id', v_booking.id,
    'status', v_booking.status,
    'telegram_chat_id', v_booking.telegram_chat_id,
    'telegram_language', coalesce(v_booking.telegram_language, 'ro'),
    'name', v_booking.name,
    'phone', v_booking.phone,
    'service', v_booking.service,
    'hair_length', v_booking.hair_length,
    'preferred_date', v_booking.preferred_date,
    'preferred_time', v_booking.preferred_time,
    'note', v_booking.note,
    'quoted_price', v_booking.quoted_price
  );
end;
$$;

create or replace function public.telegram_client_list_appointments(p_chat_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'access_denied'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', a.id,
      'service', a.service,
      'hair_length', a.hair_length,
      'preferred_date', a.preferred_date,
      'preferred_time', a.preferred_time,
      'status', a.status,
      'note', a.note,
      'quoted_price', a.quoted_price
    ) order by a.preferred_date desc, a.preferred_time desc)
    from public.appointments a
    where a.telegram_chat_id = p_chat_id
      and a.preferred_date >= timezone('Europe/Chisinau', now())::date - 30
  ), '[]'::jsonb);
end;
$$;

create or replace function public.telegram_client_cancel_pending(p_id uuid, p_chat_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.appointments%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'access_denied'; end if;
  update public.appointments
  set status = 'rejected', decided_at = now()
  where id = p_id
    and telegram_chat_id = p_chat_id
    and status = 'pending'
  returning * into v_booking;
  if not found then raise exception 'cannot_cancel'; end if;
  return jsonb_build_object('ok', true, 'id', v_booking.id, 'service', v_booking.service,
    'preferred_date', v_booking.preferred_date, 'preferred_time', v_booking.preferred_time);
end;
$$;

revoke all on function public.telegram_create_client_appointment(bigint,text,text,text,text,text,text,date,time,text) from public, anon, authenticated;
revoke all on function public.telegram_admin_decide_appointment(uuid,text,numeric) from public, anon, authenticated;
revoke all on function public.telegram_client_list_appointments(bigint) from public, anon, authenticated;
revoke all on function public.telegram_client_cancel_pending(uuid,bigint) from public, anon, authenticated;
grant execute on function public.telegram_create_client_appointment(bigint,text,text,text,text,text,text,date,time,text) to service_role;
grant execute on function public.telegram_admin_decide_appointment(uuid,text,numeric) to service_role;
grant execute on function public.telegram_client_list_appointments(bigint) to service_role;
grant execute on function public.telegram_client_cancel_pending(uuid,bigint) to service_role;
