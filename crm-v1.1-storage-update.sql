-- TT Beauty Lounge CRM v1.1
-- Rulează după CRM v1 deja instalat.
-- Activează uploadul fotografiilor CRM în bucket-ul booking-photos pentru administrator.

-- indexuri utile
create index if not exists clients_name_idx on public.clients(lower(full_name));
create index if not exists clients_phone_idx on public.clients(phone_normalized);
create index if not exists appointments_visit_status_idx on public.appointments(visit_status, preferred_date);

-- Politici Storage pentru administratorul aplicației
drop policy if exists "TT owner uploads CRM photos" on storage.objects;
create policy "TT owner uploads CRM photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'booking-photos'
  and (storage.foldername(name))[1] = 'crm'
  and lower(auth.jwt() ->> 'email') = 'valerkasvetlicenco@icloud.com'
);

drop policy if exists "TT owner reads CRM photos" on storage.objects;
create policy "TT owner reads CRM photos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'booking-photos'
  and (storage.foldername(name))[1] = 'crm'
  and lower(auth.jwt() ->> 'email') = 'valerkasvetlicenco@icloud.com'
);

drop policy if exists "TT owner updates CRM photos" on storage.objects;
create policy "TT owner updates CRM photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'booking-photos'
  and (storage.foldername(name))[1] = 'crm'
  and lower(auth.jwt() ->> 'email') = 'valerkasvetlicenco@icloud.com'
)
with check (
  bucket_id = 'booking-photos'
  and (storage.foldername(name))[1] = 'crm'
  and lower(auth.jwt() ->> 'email') = 'valerkasvetlicenco@icloud.com'
);

drop policy if exists "TT owner deletes CRM photos" on storage.objects;
create policy "TT owner deletes CRM photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'booking-photos'
  and (storage.foldername(name))[1] = 'crm'
  and lower(auth.jwt() ->> 'email') = 'valerkasvetlicenco@icloud.com'
);
