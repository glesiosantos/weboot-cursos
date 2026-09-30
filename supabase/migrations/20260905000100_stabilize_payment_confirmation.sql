-- Mantem em uma unica definicao o contrato usado tanto pelo webhook quanto
-- pela confirmacao administrativa. Evita depender de alteracoes textuais no
-- corpo da funcao feitas por migracoes corretivas anteriores.
alter table public.orders drop constraint if exists orders_payment_provider_check;
alter table public.orders add constraint orders_payment_provider_check
  check (payment_provider is null or payment_provider in ('ASAAS', 'MERCADO_PAGO', 'MANUAL'));

create or replace function public.confirm_commercial_payment(
  target_order_id uuid, external_payment_id text, payment_status text,
  credential_code text, credential_token_hash text
) returns uuid language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  target_order public.orders%rowtype;
  enrollment_id uuid;
  is_presential boolean;
begin
  select * into target_order
  from public.orders
  where id = target_order_id
  for update;

  if not found then raise exception 'order not found'; end if;
  if target_order.user_id is null then raise exception 'order user not associated'; end if;
  if target_order.status = 'PAID' then
    select e.id into enrollment_id from public.enrollments e where e.order_id = target_order.id;
    return enrollment_id;
  end if;
  if target_order.status = 'REFUNDED' then raise exception 'order cannot be paid'; end if;
  if target_order.provider_payment_id is distinct from external_payment_id then
    raise exception 'payment does not belong to order';
  end if;

  insert into public.payments(order_id, provider, external_id, status, amount, paid_at)
    values(target_order.id, target_order.payment_provider, external_payment_id, payment_status, target_order.total, now())
    on conflict (external_id) do update set
      provider = excluded.provider,
      status = excluded.status,
      paid_at = coalesce(public.payments.paid_at, excluded.paid_at);

  update public.orders
  set status = 'PAID', provider_payment_id = external_payment_id, paid_at = coalesce(paid_at, now())
  where id = target_order.id;

  insert into public.enrollments(user_id, course_id, course_batch_id, order_id, status, enrolled_at)
    values(target_order.user_id, target_order.course_id, target_order.course_batch_id, target_order.id, 'ACTIVE', now())
    on conflict (user_id, course_id) do update set
      order_id = excluded.order_id,
      course_batch_id = excluded.course_batch_id,
      status = 'ACTIVE',
      enrolled_at = excluded.enrolled_at
    returning id into enrollment_id;

  update public.seat_reservations
  set status = 'CONFIRMED'
  where order_id = target_order.id and status = 'RESERVED';

  select c.course_type = 'PRESENCIAL' into is_presential
  from public.courses c where c.id = target_order.course_id;
  if is_presential then
    insert into public.event_credentials(enrollment_id, course_id, user_id, code, qr_token_hash)
      values(enrollment_id, target_order.course_id, target_order.user_id, credential_code, credential_token_hash)
      on conflict (enrollment_id) do nothing;
  end if;

  return enrollment_id;
end; $$;

revoke all on function public.confirm_commercial_payment(uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function public.confirm_commercial_payment(uuid,text,text,text,text) to service_role;
