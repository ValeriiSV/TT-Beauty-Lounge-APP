-- Only the server-side Telegram webhook may call administrator RPCs.
revoke all on function public.telegram_admin_cancel_appointment(uuid) from public, anon, authenticated;
revoke all on function public.telegram_admin_list_appointments(date, boolean) from public, anon, authenticated;
revoke all on function public.telegram_admin_reschedule_appointment(uuid, date, time) from public, anon, authenticated;
revoke all on function public.link_appointment_telegram(text, bigint) from public, anon, authenticated;

grant execute on function public.telegram_admin_cancel_appointment(uuid) to service_role;
grant execute on function public.telegram_admin_list_appointments(date, boolean) to service_role;
grant execute on function public.telegram_admin_reschedule_appointment(uuid, date, time) to service_role;
grant execute on function public.link_appointment_telegram(text, bigint) to service_role;
