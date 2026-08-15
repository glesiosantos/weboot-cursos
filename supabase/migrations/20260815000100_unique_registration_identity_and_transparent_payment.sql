-- Uma pessoa possui um unico contato, identificado pelo hash deterministico do CPF.
alter table public.orders drop constraint if exists orders_registration_id_key;
alter table public.orders add column if not exists public_reference_hash text;
update public.orders o set public_reference_hash = r.public_reference_hash
  from public.registration_contacts r where r.id = o.registration_id and o.public_reference_hash is null;

do $$
declare duplicate record;
begin
  for duplicate in
    select cpf_hash, (array_agg(id order by created_at, id))[1] canonical_id,
      (array_agg(id order by created_at, id))[2:] duplicate_ids
    from public.registration_contacts group by cpf_hash having count(*) > 1
  loop
    update public.registration_contacts canonical set user_id = coalesce(canonical.user_id, (
      select candidate.user_id from public.registration_contacts candidate
      where candidate.id = any(duplicate.duplicate_ids) and candidate.user_id is not null limit 1
    )) where canonical.id = duplicate.canonical_id;
    update public.orders set registration_id = duplicate.canonical_id
      where registration_id = any(duplicate.duplicate_ids);
    update public.notification_logs set registration_id = duplicate.canonical_id
      where registration_id = any(duplicate.duplicate_ids);
    delete from public.registration_contacts where id = any(duplicate.duplicate_ids);
  end loop;
end $$;

drop index if exists public.registration_contacts_identity_idx;
create unique index registration_contacts_cpf_hash_key on public.registration_contacts(cpf_hash);
create index registration_contacts_email_idx on public.registration_contacts(lower(email));
create index orders_registration_idx on public.orders(registration_id);
create unique index orders_public_reference_hash_key on public.orders(public_reference_hash) where public_reference_hash is not null;

alter table public.registration_contacts
  add column if not exists asaas_customer_id text unique;

alter table public.orders
  add column if not exists payment_method text check (payment_method in ('PIX', 'CREDIT_CARD')),
  add column if not exists installment_count integer check (installment_count between 1 and 6),
  add column if not exists provider_fee numeric(12,2) not null default 0 check (provider_fee >= 0),
  add column if not exists service_fee numeric(12,2) not null default 0 check (service_fee >= 0);

create or replace function public.prepare_guest_checkout_order(
  target_course_id uuid, participant_name text, participant_email text, participant_whatsapp text,
  participant_cpf_hash text, participant_cpf_encrypted text, reference_hash text,
  accepted_terms_version text, accepted_marketing boolean, reservation_minutes integer default 30
) returns table(order_id uuid, registration_id uuid, reused boolean, unit_price numeric,
  course_batch_id uuid, expires_at timestamptz, course_title text, course_type public.course_type)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  selected_course public.courses%rowtype; selected_batch public.course_batches%rowtype;
  existing_order public.orders%rowtype; contact public.registration_contacts%rowtype;
  created_order public.orders%rowtype; price_snapshot numeric(12,2); course_capacity integer;
  occupied bigint; expiry timestamptz;
begin
  if reservation_minutes < 10 or reservation_minutes > 1440 then raise exception 'invalid reservation duration'; end if;
  select * into selected_course from public.courses where id = target_course_id for update;
  if not found or selected_course.status <> 'PUBLISHED' or selected_course.archived_at is not null then raise exception 'course unavailable'; end if;

  update public.seat_reservations set status = 'EXPIRED' where status = 'RESERVED' and expires_at <= now();
  update public.orders set status = 'EXPIRED' where status = 'WAITING_PAYMENT' and expires_at <= now();

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(participant_cpf_hash, 0));
  select * into contact from public.registration_contacts where cpf_hash = participant_cpf_hash for update;
  if found then
    update public.registration_contacts set full_name = trim(participant_name), email = lower(participant_email),
      whatsapp = participant_whatsapp, cpf_encrypted = participant_cpf_encrypted,
      public_reference_hash = reference_hash, terms_accepted_at = now(), terms_version = accepted_terms_version,
      marketing_accepted = accepted_marketing
      where id = contact.id returning * into contact;
  else
    insert into public.registration_contacts(public_reference_hash, full_name, cpf_encrypted, cpf_hash,
      email, whatsapp, terms_accepted_at, terms_version, marketing_accepted)
    values(reference_hash, trim(participant_name), participant_cpf_encrypted, participant_cpf_hash,
      lower(participant_email), participant_whatsapp, now(), accepted_terms_version, accepted_marketing)
    returning * into contact;
  end if;

  select * into existing_order from public.orders where registration_id = contact.id
    and course_id = target_course_id and status = 'WAITING_PAYMENT' and expires_at > now()
    order by created_at desc limit 1;
  if found then
    update public.orders set public_reference_hash = reference_hash where id = existing_order.id;
    return query select existing_order.id, contact.id, true, existing_order.unit_price,
      existing_order.course_batch_id, existing_order.expires_at, selected_course.title, selected_course.course_type;
    return;
  end if;

  if exists(select 1 from public.enrollments e where e.course_id = target_course_id
    and e.user_id = contact.user_id and e.status = 'ACTIVE') then raise exception 'course already acquired'; end if;

  if selected_course.pricing_type = 'BATCHES' then
    select * into selected_batch from public.get_current_course_batch(target_course_id, now()) limit 1;
    if not found then raise exception 'no current course batch'; end if;
    perform 1 from public.course_batches where id = selected_batch.id for update;
    price_snapshot := selected_batch.price;
  else price_snapshot := coalesce(selected_course.promotional_price, selected_course.price); end if;
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

  insert into public.orders(user_id, registration_id, course_id, course_batch_id, status, subtotal,
    unit_price, discount, total, currency, expires_at)
  values(contact.user_id, contact.id, target_course_id, selected_batch.id, 'WAITING_PAYMENT', price_snapshot,
    price_snapshot, 0, price_snapshot, 'BRL', expiry) returning * into created_order;
  update public.orders set external_reference = created_order.id::text, public_reference_hash = reference_hash where id = created_order.id;
  if selected_course.course_type = 'PRESENCIAL' or selected_batch.max_sales is not null then
    insert into public.seat_reservations(course_id, course_batch_id, order_id, user_id, expires_at)
      values(target_course_id, selected_batch.id, created_order.id, contact.user_id, expiry);
  end if;
  return query select created_order.id, contact.id, false, price_snapshot,
    selected_batch.id, expiry, selected_course.title, selected_course.course_type;
end; $$;

revoke all on function public.prepare_guest_checkout_order(uuid,text,text,text,text,text,text,text,boolean,integer) from public, anon, authenticated;
grant execute on function public.prepare_guest_checkout_order(uuid,text,text,text,text,text,text,text,boolean,integer) to service_role;

create or replace function public.get_registration_status(reference_hash text)
returns table(status public.order_status, course_title text, participant_name text, course_type public.course_type,
  starts_at timestamptz, location_name text)
language sql security definer stable set search_path = '' as $$
  select o.status, c.title, r.full_name, c.course_type, d.starts_at, d.location_name
  from public.orders o join public.registration_contacts r on r.id = o.registration_id
  join public.courses c on c.id = o.course_id left join public.course_presential_details d on d.course_id = c.id
  where o.public_reference_hash = reference_hash limit 1;
$$;
revoke all on function public.get_registration_status(text) from public, authenticated;
grant execute on function public.get_registration_status(text) to anon, service_role;
