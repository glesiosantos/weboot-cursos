create or replace function public.admin_remove_course_participant(
  target_course_id uuid,
  target_order_id uuid
) returns table(user_id uuid, delete_auth_user boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_order public.orders%rowtype;
  target_registration_id uuid;
  target_user_id uuid;
  target_enrollment_ids uuid[];
  can_delete_auth_user boolean := false;
begin
  select * into target_order
  from public.orders
  where id = target_order_id and course_id = target_course_id
  for update;

  if not found then
    raise exception 'participant not found';
  end if;

  target_registration_id := target_order.registration_id;
  target_user_id := target_order.user_id;

  if target_registration_id is not null and exists (
    select 1 from public.orders
    where registration_id = target_registration_id and id <> target_order_id
  ) then
    raise exception 'participant has other registrations';
  end if;

  select coalesce(array_agg(id), '{}'::uuid[]) into target_enrollment_ids
  from public.enrollments
  where order_id = target_order_id;

  delete from public.audit_logs audit
  where audit.entity_id = any(target_enrollment_ids);
  delete from public.notification_logs notification
  where notification.registration_id = target_registration_id;
  delete from public.coupon_usages usage
  where usage.order_id = target_order_id;
  delete from public.payments payment
  where payment.order_id = target_order_id;
  delete from public.seat_reservations reservation
  where reservation.order_id = target_order_id;
  delete from public.enrollments enrollment
  where enrollment.order_id = target_order_id;

  if target_user_id is not null then
    delete from public.lesson_progress progress
    where progress.user_id = target_user_id and progress.course_id = target_course_id;
    delete from public.certificates certificate
    where certificate.user_id = target_user_id and certificate.course_id = target_course_id;
  end if;

  delete from public.orders removed_order
  where removed_order.id = target_order_id;

  if target_registration_id is not null then
    delete from public.registration_contacts registration
    where registration.id = target_registration_id;
  end if;

  if target_user_id is not null then
    select p.role = 'STUDENT'
      and not exists(select 1 from public.orders other_order where other_order.user_id = target_user_id)
      and not exists(select 1 from public.enrollments other_enrollment where other_enrollment.user_id = target_user_id)
      and not exists(select 1 from public.registration_contacts other_registration where other_registration.user_id = target_user_id)
      and not exists(select 1 from public.lesson_progress other_progress where other_progress.user_id = target_user_id)
      and not exists(select 1 from public.certificates other_certificate where other_certificate.user_id = target_user_id)
    into can_delete_auth_user
    from public.profiles p
    where p.id = target_user_id;
  end if;

  return query select target_user_id, coalesce(can_delete_auth_user, false);
end;
$$;

revoke all on function public.admin_remove_course_participant(uuid, uuid) from public;
grant execute on function public.admin_remove_course_participant(uuid, uuid) to service_role;
