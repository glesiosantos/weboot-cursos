-- Fase 03: pedidos, checkout hospedado, reservas, matriculas e acesso presencial.
create type public.seat_reservation_status as enum ('RESERVED', 'CONFIRMED', 'EXPIRED', 'CANCELED');
create type public.event_credential_status as enum ('ACTIVE', 'USED', 'CANCELED');

alter table public.orders
  add column course_batch_id uuid references public.course_batches(id),
  add column unit_price numeric(12,2),
  add column external_reference text,
  add column asaas_checkout_url text,
  add column expires_at timestamptz;
update public.orders set unit_price = subtotal where unit_price is null;
alter table public.orders alter column unit_price set not null;
create unique index orders_external_reference_unique on public.orders(external_reference) where external_reference is not null;
create index orders_active_checkout_idx on public.orders(user_id, course_id, expires_at)
  where status = 'WAITING_PAYMENT';
create unique index orders_one_active_checkout_idx on public.orders(user_id, course_id)
  where status in ('PENDING', 'WAITING_PAYMENT');

create table public.seat_reservations (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id),
  course_batch_id uuid references public.course_batches(id),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  status public.seat_reservation_status not null default 'RESERVED',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index seat_reservations_capacity_idx on public.seat_reservations(course_id, course_batch_id, expires_at)
  where status = 'RESERVED';
create trigger set_updated_at before update on public.seat_reservations
  for each row execute function public.set_updated_at();

create table public.event_credentials (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null unique references public.enrollments(id) on delete cascade,
  course_id uuid not null references public.courses(id),
  user_id uuid not null references public.profiles(id),
  code text not null unique,
  qr_token_hash text not null unique,
  status public.event_credential_status not null default 'ACTIVE',
  issued_at timestamptz not null default now(),
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.event_credentials
  for each row execute function public.set_updated_at();

alter table public.attendance add column checked_in_at timestamptz;

alter table public.seat_reservations enable row level security;
alter table public.seat_reservations force row level security;
alter table public.event_credentials enable row level security;
alter table public.event_credentials force row level security;
create policy seat_reservations_select_own on public.seat_reservations for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy event_credentials_select_own on public.event_credentials for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy admin_all_seat_reservations on public.seat_reservations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy admin_all_event_credentials on public.event_credentials for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Toda decisao de preco/capacidade e a reserva acontecem sob locks no banco.
create or replace function public.prepare_checkout_order(
  target_user_id uuid,
  target_course_id uuid,
  reservation_minutes integer default 30
) returns table(order_id uuid, reused boolean, unit_price numeric, course_batch_id uuid,
  expires_at timestamptz, course_title text, course_type public.course_type)
language plpgsql security definer set search_path = '' as $$
declare
  selected_course public.courses%rowtype;
  selected_batch public.course_batches%rowtype;
  existing_order public.orders%rowtype;
  created_order public.orders%rowtype;
  price_snapshot numeric(12,2);
  course_capacity integer;
  occupied bigint;
  expiry timestamptz;
begin
  if reservation_minutes < 10 or reservation_minutes > 1440 then
    raise exception 'invalid reservation duration';
  end if;
  select * into selected_course from public.courses
    where id = target_course_id for update;
  if not found or selected_course.status <> 'PUBLISHED' or selected_course.archived_at is not null then
    raise exception 'course unavailable';
  end if;
  if exists(select 1 from public.enrollments e where e.user_id = target_user_id
    and e.course_id = target_course_id and e.status = 'ACTIVE') then
    raise exception 'course already acquired';
  end if;

  update public.seat_reservations set status = 'EXPIRED'
    where status = 'RESERVED' and expires_at <= now();
  update public.orders set status = 'EXPIRED'
    where status = 'WAITING_PAYMENT' and expires_at <= now();

  select * into existing_order from public.orders o
    where o.user_id = target_user_id and o.course_id = target_course_id
      and o.status = 'WAITING_PAYMENT' and o.expires_at > now()
      and o.asaas_checkout_url is not null
    order by o.created_at desc limit 1;
  if found then
    return query select existing_order.id, true, existing_order.unit_price,
      existing_order.course_batch_id, existing_order.expires_at, selected_course.title, selected_course.course_type;
    return;
  end if;

  if selected_course.pricing_type = 'BATCHES' then
    select * into selected_batch from public.get_current_course_batch(target_course_id, now()) limit 1;
    if not found then raise exception 'no current course batch'; end if;
    perform 1 from public.course_batches where id = selected_batch.id for update;
    price_snapshot := selected_batch.price;
  else
    price_snapshot := case
      when selected_course.promotional_price is not null then selected_course.promotional_price
      else selected_course.price end;
  end if;

  expiry := now() + make_interval(mins => reservation_minutes);
  if selected_course.course_type = 'PRESENCIAL' then
    select d.max_students into course_capacity from public.course_presential_details d
      where d.course_id = target_course_id;
    select count(*) into occupied from public.seat_reservations r
      where r.course_id = target_course_id and
        (r.status = 'CONFIRMED' or (r.status = 'RESERVED' and r.expires_at > now()));
    if course_capacity is null or occupied >= course_capacity then raise exception 'course sold out'; end if;
  end if;
  if selected_course.pricing_type = 'BATCHES' and selected_batch.max_sales is not null then
    select count(*) into occupied from public.seat_reservations r
      where r.course_batch_id = selected_batch.id and
        (r.status = 'CONFIRMED' or (r.status = 'RESERVED' and r.expires_at > now()));
    if occupied >= selected_batch.max_sales then raise exception 'course batch sold out'; end if;
  end if;

  begin
    insert into public.orders(user_id, course_id, course_batch_id, status, subtotal, unit_price,
      discount, total, currency, expires_at)
    values(target_user_id, target_course_id, selected_batch.id, 'PENDING', price_snapshot,
      price_snapshot, 0, price_snapshot, 'BRL', expiry) returning * into created_order;
  exception when unique_violation then
    select * into existing_order from public.orders o
      where o.user_id = target_user_id and o.course_id = target_course_id
        and o.status in ('PENDING', 'WAITING_PAYMENT') order by o.created_at desc limit 1;
    return query select existing_order.id, true, existing_order.unit_price,
      existing_order.course_batch_id, existing_order.expires_at, selected_course.title, selected_course.course_type;
    return;
  end;
  update public.orders set external_reference = created_order.id::text where id = created_order.id;
  if selected_course.course_type = 'PRESENCIAL' or selected_batch.max_sales is not null then
    insert into public.seat_reservations(course_id, course_batch_id, order_id, user_id, expires_at)
      values(target_course_id, selected_batch.id, created_order.id, target_user_id, expiry);
  end if;
  return query select created_order.id, false, price_snapshot, selected_batch.id,
    expiry, selected_course.title, selected_course.course_type;
end; $$;
revoke all on function public.prepare_checkout_order(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.prepare_checkout_order(uuid, uuid, integer) to service_role;

create or replace function public.confirm_commercial_payment(
  target_order_id uuid, external_payment_id text, payment_status text,
  credential_code text, credential_token_hash text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare target_order public.orders%rowtype; enrollment_id uuid; is_presential boolean;
begin
  select * into target_order from public.orders where id = target_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if target_order.status = 'PAID' then
    select e.id into enrollment_id from public.enrollments e where e.order_id = target_order.id;
    return enrollment_id;
  end if;
  if target_order.status in ('REFUNDED', 'CANCELED') then raise exception 'order cannot be paid'; end if;
  insert into public.payments(order_id, external_id, status, amount, paid_at)
    values(target_order.id, external_payment_id, payment_status, target_order.total, now())
    on conflict (external_id) do update set status = excluded.status, paid_at = coalesce(public.payments.paid_at, excluded.paid_at);
  update public.orders set status = 'PAID', asaas_payment_id = external_payment_id, paid_at = coalesce(paid_at, now())
    where id = target_order.id;
  insert into public.enrollments(user_id, course_id, order_id, status, enrolled_at)
    values(target_order.user_id, target_order.course_id, target_order.id, 'ACTIVE', now())
    on conflict (user_id, course_id) do update set order_id = excluded.order_id, status = 'ACTIVE', enrolled_at = excluded.enrolled_at
    returning id into enrollment_id;
  update public.seat_reservations set status = 'CONFIRMED' where order_id = target_order.id and status = 'RESERVED';
  select c.course_type = 'PRESENCIAL' into is_presential from public.courses c where c.id = target_order.course_id;
  if is_presential then
    insert into public.event_credentials(enrollment_id, course_id, user_id, code, qr_token_hash)
      values(enrollment_id, target_order.course_id, target_order.user_id, credential_code, credential_token_hash)
      on conflict (enrollment_id) do nothing;
  end if;
  return enrollment_id;
end; $$;
revoke all on function public.confirm_commercial_payment(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.confirm_commercial_payment(uuid, text, text, text, text) to service_role;

create or replace function public.cancel_commercial_order(target_order_id uuid, new_status public.order_status)
returns void language plpgsql security definer set search_path = '' as $$
declare target_order public.orders%rowtype;
begin
  if new_status not in ('CANCELED', 'EXPIRED', 'REFUNDED') then raise exception 'invalid terminal status'; end if;
  select * into target_order from public.orders where id = target_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if target_order.status = 'PAID' and new_status <> 'REFUNDED' then return; end if;
  update public.orders set status = new_status where id = target_order_id;
  update public.seat_reservations set status = case when new_status = 'EXPIRED' then 'EXPIRED'::public.seat_reservation_status else 'CANCELED'::public.seat_reservation_status end
    where order_id = target_order_id and status = 'RESERVED';
  if new_status = 'REFUNDED' then
    update public.enrollments set status = 'CANCELED' where order_id = target_order_id;
    update public.event_credentials c set status = 'CANCELED'
      from public.enrollments e where e.order_id = target_order_id and c.enrollment_id = e.id;
  end if;
end; $$;
revoke all on function public.cancel_commercial_order(uuid, public.order_status) from public, anon, authenticated;
grant execute on function public.cancel_commercial_order(uuid, public.order_status) to service_role;

create or replace function public.check_in_event(target_course_id uuid, target_token_hash text, actor_user_id uuid, manual_checkin boolean default false)
returns table(result text, student_name text, course_title text, checked_in_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare credential public.event_credentials%rowtype; actor_role public.user_role; first_use timestamptz;
begin
  select p.role into actor_role from public.profiles p where p.id = actor_user_id;
  if actor_role not in ('ADMIN', 'INSTRUCTOR') then raise exception 'check-in access denied'; end if;
  select * into credential from public.event_credentials c where c.qr_token_hash = target_token_hash for update;
  if not found or credential.course_id <> target_course_id or credential.status = 'CANCELED'
     or not exists(select 1 from public.enrollments e where e.id = credential.enrollment_id and e.status = 'ACTIVE') then
    return query select 'INVALID'::text, null::text, null::text, null::timestamptz; return;
  end if;
  if credential.status = 'USED' then
    return query select 'ALREADY_USED'::text, p.name, c.title, credential.used_at
      from public.profiles p, public.courses c where p.id = credential.user_id and c.id = credential.course_id;
    return;
  end if;
  first_use := now();
  update public.event_credentials set status = 'USED', used_at = first_use where id = credential.id;
  insert into public.attendance(enrollment_id, attendance_date, status, recorded_by, checked_in_at)
    values(credential.enrollment_id, first_use::date, 'PRESENT', actor_user_id, first_use)
    on conflict (enrollment_id, attendance_date) do update set status = 'PRESENT',
      recorded_by = excluded.recorded_by, checked_in_at = coalesce(public.attendance.checked_in_at, excluded.checked_in_at);
  insert into public.audit_logs(user_id, action, entity, entity_id, metadata)
    values(actor_user_id, case when manual_checkin then 'manual_checkin' else 'event_checkin' end,
      'event_credential', credential.id, jsonb_build_object('course_id', target_course_id));
  return query select 'AUTHORIZED'::text, p.name, c.title, first_use
    from public.profiles p, public.courses c where p.id = credential.user_id and c.id = credential.course_id;
end; $$;
revoke all on function public.check_in_event(uuid, text, uuid, boolean) from public, anon, authenticated;
grant execute on function public.check_in_event(uuid, text, uuid, boolean) to service_role;
