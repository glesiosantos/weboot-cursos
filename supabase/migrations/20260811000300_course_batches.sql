-- Fase 02: precificacao opcional por lotes. A contagem de vendas sera ligada
-- transacionalmente a pedidos/pagamentos na Fase 03; nao ha contador manual.
create type public.course_pricing_type as enum ('FIXED', 'BATCHES');
create type public.course_batch_status as enum ('DRAFT', 'SCHEDULED', 'ACTIVE', 'SOLD_OUT', 'EXPIRED', 'DISABLED');
create type public.course_batch_activation_mode as enum ('QUANTITY', 'DATE', 'QUANTITY_OR_DATE');

alter table public.courses
  add column pricing_type public.course_pricing_type not null default 'FIXED';

create table public.course_batches (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null check (trim(name) <> ''),
  position integer not null check (position > 0),
  price numeric(12,2) not null check (price >= 0),
  max_sales integer check (max_sales > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  status public.course_batch_status not null default 'DRAFT',
  activation_mode public.course_batch_activation_mode not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_batches_dates_check check (starts_at is null or ends_at is null or ends_at > starts_at),
  constraint course_batches_quantity_mode_check check (activation_mode = 'DATE' or max_sales is not null),
  constraint course_batches_date_mode_check check (activation_mode = 'QUANTITY' or starts_at is not null or ends_at is not null),
  unique (course_id, position)
);

create unique index course_batches_one_active_idx on public.course_batches(course_id) where status = 'ACTIVE';
create index course_batches_course_position_idx on public.course_batches(course_id, position);

create or replace function public.prevent_course_batch_period_overlap() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.activation_mode <> 'QUANTITY' and new.starts_at is not null and new.ends_at is not null
     and new.status not in ('DISABLED', 'EXPIRED', 'SOLD_OUT') and exists (
       select 1 from public.course_batches b
       where b.course_id = new.course_id and b.id <> new.id
         and b.activation_mode <> 'QUANTITY'
         and b.starts_at is not null and b.ends_at is not null
         and b.status not in ('DISABLED', 'EXPIRED', 'SOLD_OUT')
         and tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(new.starts_at, new.ends_at, '[)')
     ) then
    raise exception 'course batch periods cannot overlap';
  end if;
  return new;
end; $$;
create trigger prevent_course_batch_period_overlap before insert or update on public.course_batches
for each row execute function public.prevent_course_batch_period_overlap();
create trigger set_updated_at before update on public.course_batches
for each row execute function public.set_updated_at();

alter table public.course_batches enable row level security;
alter table public.course_batches force row level security;
create policy public_course_batches_read on public.course_batches for select to anon, authenticated
using (exists(select 1 from public.courses c where c.id = course_id and c.status = 'PUBLISHED' and c.archived_at is null) or public.is_admin());
create policy admin_all_course_batches on public.course_batches for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Ponto unico para catalogo e, futuramente, checkout. Nesta fase a capacidade
-- por quantidade nao e consumida, pois ainda nao existe a atribuicao pedido->lote.
create or replace function public.get_current_course_batch(target_course_id uuid, reference_at timestamptz default now())
returns setof public.course_batches
language sql stable security definer set search_path = '' as $$
  select b.*
  from public.course_batches b
  join public.courses c on c.id = b.course_id
  where c.id = target_course_id
    and c.pricing_type = 'BATCHES'
    and c.status = 'PUBLISHED' and c.archived_at is null
    and b.status in ('ACTIVE', 'SCHEDULED')
    and (b.starts_at is null or b.starts_at <= reference_at)
    and (b.ends_at is null or b.ends_at > reference_at)
  order by case when b.status = 'ACTIVE' then 0 else 1 end, b.position
  limit 1;
$$;
revoke all on function public.get_current_course_batch(uuid, timestamptz) from public;
grant execute on function public.get_current_course_batch(uuid, timestamptz) to anon, authenticated;

create or replace function public.replace_course_batches(target_course_id uuid, batches jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'administrator privileges required'; end if;
  if not exists(select 1 from public.courses where id = target_course_id) then raise exception 'course not found'; end if;
  delete from public.course_batches where course_id = target_course_id;
  insert into public.course_batches(course_id, name, position, price, max_sales, starts_at, ends_at, status, activation_mode)
  select target_course_id, trim(x.name), x.position, x.price, x.max_sales, x.starts_at, x.ends_at,
         x.status::public.course_batch_status, x.activation_mode::public.course_batch_activation_mode
  from jsonb_to_recordset(coalesce(batches, '[]'::jsonb)) as x(
    name text, position integer, price numeric, max_sales integer, starts_at timestamptz,
    ends_at timestamptz, status text, activation_mode text
  );
end; $$;
revoke all on function public.replace_course_batches(uuid, jsonb) from public;
grant execute on function public.replace_course_batches(uuid, jsonb) to authenticated;

create or replace function public.validate_course_publication() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'PUBLISHED' and old.status is distinct from 'PUBLISHED' then
    if trim(new.title) = '' or trim(new.slug) = '' or trim(new.description) = '' or new.instructor_id is null
       or new.workload_hours <= 0 or (new.pricing_type = 'FIXED' and new.price < 0) then
      raise exception 'course has missing publication fields';
    end if;
    if new.pricing_type = 'BATCHES' and not exists(
      select 1 from public.course_batches b where b.course_id = new.id and b.status in ('ACTIVE', 'SCHEDULED')
    ) then raise exception 'batch-priced course requires an active or scheduled batch'; end if;
    if new.course_type = 'PRESENCIAL' and not exists(
      select 1 from public.course_presential_details d where d.course_id = new.id
    ) then raise exception 'presential details are required'; end if;
    if new.course_type = 'ONLINE' and not exists(
      select 1 from public.course_modules m join public.lessons l on l.module_id = m.id where m.course_id = new.id
    ) then raise exception 'online course requires at least one lesson'; end if;
    new.published_at = coalesce(new.published_at, now());
  end if;
  if new.status <> 'PUBLISHED' then new.published_at = null; end if;
  return new;
end; $$;
