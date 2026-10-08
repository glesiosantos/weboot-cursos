-- Vouchers percentuais por curso, com elegibilidade opcional para ex-alunos.
alter table public.coupons
  add column if not exists course_id uuid references public.courses(id) on delete cascade,
  add column if not exists alumni_only boolean not null default false;

create unique index if not exists coupons_code_upper_unique on public.coupons (upper(code));

-- Mantem a rotina de checkout existente e aplica o desconto no mesmo contexto
-- transacional, antes de criar a cobrança. A elegibilidade exige matrícula
-- ativa ou concluída em qualquer curso diferente do curso comprado.
create or replace function public.prepare_guest_checkout_order(
  target_course_id uuid, participant_name text, participant_email text, participant_whatsapp text,
  participant_cpf_hash text, participant_cpf_encrypted text, reference_hash text,
  accepted_terms_version text, accepted_marketing boolean, reservation_minutes integer,
  target_coupon_code text
) returns table(order_id uuid, registration_id uuid, reused boolean, unit_price numeric,
  course_batch_id uuid, expires_at timestamptz, course_title text, course_type public.course_type)
language plpgsql security definer set search_path = '' as $$
declare
  prepared record;
  selected_coupon public.coupons%rowtype;
  stored_coupon_id uuid;
  prior_unit_price numeric(12,2);
  discount_amount numeric(12,2);
  discounted_price numeric(12,2);
begin
  select * into prepared from public.prepare_guest_checkout_order(
    target_course_id, participant_name, participant_email, participant_whatsapp,
    participant_cpf_hash, participant_cpf_encrypted, reference_hash,
    accepted_terms_version, accepted_marketing, reservation_minutes
  );
  if target_coupon_code is null or trim(target_coupon_code) = '' then
    return query select prepared.order_id, prepared.registration_id, prepared.reused,
      prepared.unit_price, prepared.course_batch_id, prepared.expires_at, prepared.course_title, prepared.course_type;
    return;
  end if;

  select * into selected_coupon from public.coupons c
    where upper(c.code) = upper(trim(target_coupon_code)) for update;
  if not found or not selected_coupon.active then raise exception 'voucher invalid'; end if;
  if selected_coupon.course_id is not null and selected_coupon.course_id <> target_course_id then
    raise exception 'voucher not valid for this course';
  end if;
  if selected_coupon.starts_at is not null and selected_coupon.starts_at > now() then raise exception 'voucher not started'; end if;
  if selected_coupon.expires_at is not null and selected_coupon.expires_at <= now() then raise exception 'voucher expired'; end if;
  if selected_coupon.max_uses is not null and (
    selected_coupon.used_count + (select count(*) from public.orders o
      where o.coupon_id = selected_coupon.id and o.id <> prepared.order_id
        and o.status in ('PENDING','WAITING_PAYMENT'))
  ) >= selected_coupon.max_uses then raise exception 'voucher exhausted'; end if;

  if selected_coupon.alumni_only and not exists (
    select 1 from public.registration_contacts r
      join public.enrollments e on e.user_id = r.user_id
    where r.id = prepared.registration_id and e.course_id <> target_course_id
      and e.status in ('ACTIVE','COMPLETED')
  ) then raise exception 'voucher requires previous enrollment'; end if;

  select o.coupon_id, o.subtotal into stored_coupon_id, prior_unit_price
    from public.orders o where o.id = prepared.order_id for update;
  if stored_coupon_id is not null and stored_coupon_id <> selected_coupon.id then
    raise exception 'pending order has another voucher';
  end if;
  -- subtotal mantém o preço original, permitindo recalcular sem acumular descontos.
  discount_amount := case when selected_coupon.type = 'PERCENTAGE' then round(prior_unit_price * selected_coupon.value / 100, 2) else least(prior_unit_price, selected_coupon.value) end;
  discounted_price := greatest(0, prior_unit_price - discount_amount);
  update public.orders set coupon_id = selected_coupon.id, discount = discount_amount,
    unit_price = discounted_price, total = discounted_price
    where id = prepared.order_id;

  return query select prepared.order_id, prepared.registration_id, prepared.reused,
    discounted_price, prepared.course_batch_id, prepared.expires_at, prepared.course_title, prepared.course_type;
end; $$;

revoke all on function public.prepare_guest_checkout_order(uuid,text,text,text,text,text,text,text,boolean,integer,text) from public, anon, authenticated;
grant execute on function public.prepare_guest_checkout_order(uuid,text,text,text,text,text,text,text,boolean,integer,text) to service_role;

-- Conta o uso somente após pagamento confirmado; pedidos pagos sem vínculo a
-- perfil (inscrição avulsa) ainda consomem o limite global do voucher.
create or replace function public.record_coupon_usage_after_payment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare linked_user_id uuid;
begin
  if new.status = 'PAID' and old.status is distinct from 'PAID' and new.coupon_id is not null then
    select coalesce(new.user_id, r.user_id) into linked_user_id
      from public.registration_contacts r where r.id = new.registration_id;
    if linked_user_id is not null then
      insert into public.coupon_usages(coupon_id, user_id, order_id)
        values(new.coupon_id, linked_user_id, new.id) on conflict (order_id) do nothing;
      if found then
        update public.coupons set used_count = used_count + 1 where id = new.coupon_id;
      end if;
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists record_coupon_usage_after_payment on public.orders;
create trigger record_coupon_usage_after_payment after update of status on public.orders
for each row execute function public.record_coupon_usage_after_payment();
