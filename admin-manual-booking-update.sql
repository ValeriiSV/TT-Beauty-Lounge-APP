-- TT Beauty Lounge — programare manuală din aplicația administratorului
-- Rulează o singură dată în Supabase SQL Editor înainte de publicarea aplicației v15.
-- Păstrează accesul service_role folosit de Telegram și permite administratorului autentificat
-- să creeze programări telefonice din aplicația web.

create or replace function public.admin_create_phone_appointment(
  p_name text,
  p_phone text,
  p_service text,
  p_date date,
  p_time time,
  p_hair_length text,
  p_quoted_price numeric
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duration integer := public.service_duration_minutes(p_service);
  v_close time;
  v_id uuid;
  v_code text := replace(gen_random_uuid()::text, '-', '');
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_role text := coalesce(auth.role(), '');
begin
  if v_role <> 'service_role' and v_email <> 'valerkasvetlicenco@icloud.com' then
    raise exception 'access_denied';
  end if;

  if char_length(trim(coalesce(p_name, ''))) not between 2 and 100 then
    raise exception 'invalid_name';
  end if;
  if char_length(trim(coalesce(p_phone, ''))) not between 5 and 30 then
    raise exception 'invalid_phone';
  end if;
  if p_hair_length not in ('Scurt', 'Mediu', 'Lung', 'Foarte lung') then
    raise exception 'invalid_hair_length';
  end if;
  if p_quoted_price is null or p_quoted_price < 1 or p_quoted_price > 100000 then
    raise exception 'invalid_price';
  end if;
  if v_duration is null then
    raise exception 'invalid_service';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_date::text));

  if p_date + p_time <= timezone('Europe/Chisinau', now()) then
    raise exception 'invalid_datetime';
  end if;
  if extract(isodow from p_date) = 7 then
    raise exception 'salon_closed';
  end if;

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
    telegram_code, status, decided_at, notification_channel, hair_length, quoted_price
  ) values (
    trim(p_name), trim(p_phone), p_service, v_duration, p_date, p_time,
    v_code, 'approved', now(), 'phone', p_hair_length, p_quoted_price
  )
  returning id into v_id;

  return jsonb_build_object(
    'ok', true,
    'id', v_id,
    'duration_minutes', v_duration,
    'status', 'approved',
    'hair_length', p_hair_length,
    'quoted_price', p_quoted_price
  );
end;
$$;

revoke all on function public.admin_create_phone_appointment(text, text, text, date, time, text, numeric) from public;
grant execute on function public.admin_create_phone_appointment(text, text, text, date, time, text, numeric) to authenticated, service_role;
