-- Conturi client TT Beauty Lounge.
-- Rulează o singură dată în Supabase SQL Editor.

alter table public.appointments
  add column if not exists client_id uuid references auth.users(id) on delete set null;

create index if not exists appointments_client_idx
  on public.appointments (client_id, preferred_date desc)
  where client_id is not null;

drop policy if exists "Clientul vede programările proprii" on public.appointments;
create policy "Clientul vede programările proprii"
  on public.appointments for select to authenticated
  using (client_id = auth.uid());

create or replace function public.create_appointment(
  p_name text, p_phone text, p_service text, p_date date, p_time time,
  p_note text, p_telegram_code text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_duration integer := public.service_duration_minutes(p_service);
  v_close time;
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext(p_date::text));
  if v_duration is null then raise exception 'invalid_service'; end if;
  if p_date + p_time <= timezone('Europe/Chisinau', now()) then raise exception 'invalid_datetime'; end if;
  if extract(isodow from p_date) = 7 then raise exception 'salon_closed'; end if;
  v_close := case when extract(isodow from p_date) = 6 then time '16:00' else time '18:00' end;
  if p_time < time '08:00' or p_time + make_interval(mins => v_duration) > v_close
     or extract(minute from p_time)::integer % 30 <> 0 then raise exception 'invalid_slot'; end if;
  if exists (
    select 1 from public.appointments a
    where a.preferred_date = p_date and a.status in ('pending','approved')
      and p_date + p_time < p_date + a.preferred_time + make_interval(mins => a.duration_minutes)
      and p_date + p_time + make_interval(mins => v_duration) > p_date + a.preferred_time
  ) then raise exception 'slot_unavailable'; end if;
  insert into public.appointments(client_id,name,phone,service,duration_minutes,preferred_date,preferred_time,note,telegram_code)
  values(auth.uid(),trim(p_name),trim(p_phone),p_service,v_duration,p_date,p_time,nullif(trim(p_note),''),p_telegram_code)
  returning id into v_id;
  return jsonb_build_object('ok',true,'id',v_id,'duration_minutes',v_duration);
end;
$$;

create or replace function public.cancel_my_appointment(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_changed integer;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  update public.appointments set status='rejected', decided_at=now()
  where id=p_id and client_id=auth.uid() and status='pending'
    and preferred_date + preferred_time > timezone('Europe/Chisinau', now());
  get diagnostics v_changed = row_count;
  if v_changed = 0 then raise exception 'cannot_cancel'; end if;
  return jsonb_build_object('ok',true);
end;
$$;

revoke all on function public.cancel_my_appointment(uuid) from public;
grant execute on function public.cancel_my_appointment(uuid) to authenticated;
