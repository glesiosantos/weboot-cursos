-- Fase 03: inscricao publica. Dados pessoais ficam fora das politicas publicas.
create table public.registration_contacts (
  id uuid primary key default gen_random_uuid(),
  public_reference_hash text not null unique,
  full_name text not null check (char_length(trim(full_name)) between 3 and 120),
  cpf_encrypted text not null,
  cpf_hash text not null,
  email text not null,
  whatsapp text not null,
  terms_accepted_at timestamptz not null,
  terms_version text not null,
  marketing_accepted boolean not null default false,
  user_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index registration_contacts_identity_idx on public.registration_contacts(cpf_hash, lower(email));
create trigger set_updated_at before update on public.registration_contacts
  for each row execute function public.set_updated_at();

alter table public.registration_contacts enable row level security;
alter table public.registration_contacts force row level security;
create policy admin_all_registration_contacts on public.registration_contacts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  registration_id uuid references public.registration_contacts(id),
  channel text not null check (channel in ('EMAIL', 'WHATSAPP')),
  type text not null,
  destination_masked text not null,
  status text not null check (status in ('PENDING', 'SENT', 'FAILED', 'SKIPPED')),
  external_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.notification_logs enable row level security;
alter table public.notification_logs force row level security;
create policy admin_all_notification_logs on public.notification_logs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

alter table public.orders alter column user_id drop not null;
alter table public.orders add column registration_id uuid unique references public.registration_contacts(id);
alter table public.seat_reservations alter column user_id drop not null;
alter table public.enrollments add column course_batch_id uuid references public.course_batches(id);
alter table public.event_credentials add column access_token_hash text unique;

drop index public.orders_one_active_checkout_idx;
create unique index orders_one_active_user_checkout_idx on public.orders(user_id, course_id)
  where user_id is not null and status in ('PENDING', 'WAITING_PAYMENT');
create unique index orders_one_active_registration_checkout_idx on public.orders(registration_id, course_id)
  where registration_id is not null and status in ('PENDING', 'WAITING_PAYMENT');

create or replace function public.prepare_guest_checkout_order(
  target_course_id uuid, participant_name text, participant_email text, participant_whatsapp text,
  participant_cpf_hash text, participant_cpf_encrypted text, reference_hash text,
  accepted_terms_version text, accepted_marketing boolean, reservation_minutes integer default 30
) returns table(order_id uuid, registration_id uuid, reused boolean, unit_price numeric,
  course_batch_id uuid, expires_at timestamptz, course_title text, course_type public.course_type)
language plpgsql security definer set search_path = '' as $$
declare
  selected_course public.courses%rowtype; selected_batch public.course_batches%rowtype;
  existing_order public.orders%rowtype; existing_registration public.registration_contacts%rowtype;
  created_order public.orders%rowtype; created_registration public.registration_contacts%rowtype;
  price_snapshot numeric(12,2); course_capacity integer; occupied bigint; expiry timestamptz;
begin
  if reservation_minutes < 10 or reservation_minutes > 1440 then raise exception 'invalid reservation duration'; end if;
  select * into selected_course from public.courses where id = target_course_id for update;
  if not found or selected_course.status <> 'PUBLISHED' or selected_course.archived_at is not null then raise exception 'course unavailable'; end if;

  update public.seat_reservations set status = 'EXPIRED' where status = 'RESERVED' and expires_at <= now();
  update public.orders set status = 'EXPIRED' where status = 'WAITING_PAYMENT' and expires_at <= now();

  if exists(select 1 from public.enrollments e join public.profiles p on p.id = e.user_id
    join auth.users u on u.id = p.id where e.course_id = target_course_id and e.status = 'ACTIVE'
    and lower(u.email) = lower(participant_email)) then raise exception 'course already acquired'; end if;

  select r.* into existing_registration from public.registration_contacts r
    join public.orders o on o.registration_id = r.id
    where o.course_id = target_course_id and o.status = 'WAITING_PAYMENT' and o.expires_at > now()
      and (r.cpf_hash = participant_cpf_hash or lower(r.email) = lower(participant_email))
    order by o.created_at desc limit 1;
  if found then
    select * into existing_order from public.orders where registration_id = existing_registration.id
      and course_id = target_course_id and status = 'WAITING_PAYMENT' and expires_at > now()
      order by created_at desc limit 1;
    return query select existing_order.id, existing_registration.id, true, existing_order.unit_price,
      existing_order.course_batch_id, existing_order.expires_at, selected_course.title, selected_course.course_type;
    return;
  end if;

  if selected_course.pricing_type = 'BATCHES' then
    select * into selected_batch from public.get_current_course_batch(target_course_id, now()) limit 1;
    if not found then raise exception 'no current course batch'; end if;
    perform 1 from public.course_batches where id = selected_batch.id for update;
    price_snapshot := selected_batch.price;
  else
    price_snapshot := coalesce(selected_course.promotional_price, selected_course.price);
  end if;
  expiry := now() + make_interval(mins => reservation_minutes);
  if selected_course.course_type = 'PRESENCIAL' then
    select d.max_students into course_capacity from public.course_presential_details d where d.course_id = target_course_id;
    select count(*) into occupied from public.seat_reservations r where r.course_id = target_course_id
      and (r.status = 'CONFIRMED' or (r.status = 'RESERVED' and r.expires_at > now()));
    if course_capacity is null or occupied >= course_capacity then raise exception 'course sold out'; end if;
  end if;
  if selected_course.pricing_type = 'BATCHES' and selected_batch.max_sales is not null then
    select count(*) into occupied from public.seat_reservations r where r.course_batch_id = selected_batch.id
      and (r.status = 'CONFIRMED' or (r.status = 'RESERVED' and r.expires_at > now()));
    if occupied >= selected_batch.max_sales then raise exception 'course batch sold out'; end if;
  end if;

  insert into public.registration_contacts(public_reference_hash, full_name, cpf_encrypted, cpf_hash,
    email, whatsapp, terms_accepted_at, terms_version, marketing_accepted)
  values(reference_hash, trim(participant_name), participant_cpf_encrypted, participant_cpf_hash,
    lower(participant_email), participant_whatsapp, now(), accepted_terms_version, accepted_marketing)
  returning * into created_registration;
  insert into public.orders(user_id, registration_id, course_id, course_batch_id, status, subtotal,
    unit_price, discount, total, currency, expires_at)
  values(null, created_registration.id, target_course_id, selected_batch.id, 'PENDING', price_snapshot,
    price_snapshot, 0, price_snapshot, 'BRL', expiry) returning * into created_order;
  update public.orders set external_reference = created_order.id::text where id = created_order.id;
  if selected_course.course_type = 'PRESENCIAL' or selected_batch.max_sales is not null then
    insert into public.seat_reservations(course_id, course_batch_id, order_id, user_id, expires_at)
      values(target_course_id, selected_batch.id, created_order.id, null, expiry);
  end if;
  return query select created_order.id, created_registration.id, false, price_snapshot,
    selected_batch.id, expiry, selected_course.title, selected_course.course_type;
end; $$;
revoke all on function public.prepare_guest_checkout_order(uuid,text,text,text,text,text,text,text,boolean,integer) from public, anon, authenticated;
grant execute on function public.prepare_guest_checkout_order(uuid,text,text,text,text,text,text,text,boolean,integer) to service_role;

create or replace function public.associate_guest_order(target_order_id uuid, target_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare target_order public.orders%rowtype;
begin
  select * into target_order from public.orders where id = target_order_id for update;
  if not found or target_order.registration_id is null then raise exception 'guest order not found'; end if;
  update public.registration_contacts set user_id = target_user_id where id = target_order.registration_id;
  update public.orders set user_id = target_user_id where id = target_order_id;
  update public.seat_reservations set user_id = target_user_id where order_id = target_order_id;
end; $$;
revoke all on function public.associate_guest_order(uuid,uuid) from public, anon, authenticated;
grant execute on function public.associate_guest_order(uuid,uuid) to service_role;

create or replace function public.get_registration_status(reference_hash text)
returns table(status public.order_status, course_title text, participant_name text, course_type public.course_type,
  starts_at timestamptz, location_name text)
language sql security definer stable set search_path = '' as $$
  select o.status, c.title, r.full_name, c.course_type, d.starts_at, d.location_name
  from public.registration_contacts r join public.orders o on o.registration_id = r.id
  join public.courses c on c.id = o.course_id left join public.course_presential_details d on d.course_id = c.id
  where r.public_reference_hash = reference_hash limit 1;
$$;
revoke all on function public.get_registration_status(text) from public, authenticated;
grant execute on function public.get_registration_status(text) to anon, service_role;

-- Atualiza a confirmacao existente para carregar turma e exige usuario associado.
create or replace function public.confirm_commercial_payment(
  target_order_id uuid, external_payment_id text, payment_status text,
  credential_code text, credential_token_hash text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare target_order public.orders%rowtype; enrollment_id uuid; is_presential boolean;
begin
  select * into target_order from public.orders where id = target_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if target_order.user_id is null then raise exception 'order user not associated'; end if;
  if target_order.status = 'PAID' then select e.id into enrollment_id from public.enrollments e where e.order_id = target_order.id; return enrollment_id; end if;
  if target_order.status in ('REFUNDED', 'CANCELED') then raise exception 'order cannot be paid'; end if;
  insert into public.payments(order_id, external_id, status, amount, paid_at)
    values(target_order.id, external_payment_id, payment_status, target_order.total, now())
    on conflict (external_id) do update set status = excluded.status, paid_at = coalesce(public.payments.paid_at, excluded.paid_at);
  update public.orders set status = 'PAID', asaas_payment_id = external_payment_id, paid_at = coalesce(paid_at, now()) where id = target_order.id;
  insert into public.enrollments(user_id, course_id, course_batch_id, order_id, status, enrolled_at)
    values(target_order.user_id, target_order.course_id, target_order.course_batch_id, target_order.id, 'ACTIVE', now())
    on conflict (user_id, course_id) do update set order_id = excluded.order_id, course_batch_id = excluded.course_batch_id,
      status = 'ACTIVE', enrolled_at = excluded.enrolled_at returning id into enrollment_id;
  update public.seat_reservations set status = 'CONFIRMED' where order_id = target_order.id and status = 'RESERVED';
  select c.course_type = 'PRESENCIAL' into is_presential from public.courses c where c.id = target_order.course_id;
  if is_presential then
    insert into public.event_credentials(enrollment_id, course_id, user_id, code, qr_token_hash)
      values(enrollment_id, target_order.course_id, target_order.user_id, credential_code, credential_token_hash)
      on conflict (enrollment_id) do nothing;
  end if;
  return enrollment_id;
end; $$;
revoke all on function public.confirm_commercial_payment(uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function public.confirm_commercial_payment(uuid,text,text,text,text) to service_role;
