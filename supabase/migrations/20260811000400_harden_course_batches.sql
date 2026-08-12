-- Fase 02: endurece publicacao, visibilidade e capacidade dos lotes.
alter table public.courses
  add column show_future_batches boolean not null default false;

-- Impede novos lotes sem capacidade, sem inventar um valor para eventuais
-- registros criados antes deste endurecimento. O NOT VALID preserva esses
-- registros para remediacao administrativa, mas a constraint ja vale para
-- todo INSERT/UPDATE novo.
alter table public.course_batches
  add constraint course_batches_max_sales_required
  check (max_sales is not null) not valid;

drop policy public_course_batches_read on public.course_batches;
create policy public_course_batches_read on public.course_batches for select to anon, authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.courses c
    where c.id = course_id
      and c.status = 'PUBLISHED'
      and c.archived_at is null
      and (
        (
          course_batches.status in ('ACTIVE', 'SCHEDULED')
          and (course_batches.starts_at is null or course_batches.starts_at <= now())
          and (course_batches.ends_at is null or course_batches.ends_at > now())
        )
        or (
          c.show_future_batches
          and course_batches.status = 'SCHEDULED'
          and course_batches.starts_at > now()
        )
      )
  )
);

create or replace function public.get_upcoming_course_batches(
  target_course_id uuid,
  reference_at timestamptz default now()
)
returns setof public.course_batches
language sql stable security definer set search_path = '' as $$
  select b.*
  from public.course_batches b
  join public.courses c on c.id = b.course_id
  where c.id = target_course_id
    and c.pricing_type = 'BATCHES'
    and c.show_future_batches
    and c.status = 'PUBLISHED'
    and c.archived_at is null
    and b.status = 'SCHEDULED'
    and b.starts_at > reference_at
    and (b.ends_at is null or b.ends_at > reference_at)
  order by b.position
$$;
revoke all on function public.get_upcoming_course_batches(uuid, timestamptz) from public;
grant execute on function public.get_upcoming_course_batches(uuid, timestamptz) to anon, authenticated;

create or replace function public.assert_valid_published_course_batches(target_course_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target_course public.courses%rowtype;
  course_capacity integer;
  batch_capacity bigint;
begin
  select * into target_course from public.courses where id = target_course_id;
  if not found or target_course.status <> 'PUBLISHED' or target_course.pricing_type <> 'BATCHES' then return; end if;

  if not exists (
    select 1 from public.course_batches b
    where b.course_id = target_course_id
      and b.status in ('ACTIVE', 'SCHEDULED')
      and (b.ends_at is null or b.ends_at > now())
  ) then
    raise exception 'batch-priced published course requires a current or future valid batch';
  end if;
  if exists (
    select 1 from public.course_batches b
    where b.course_id = target_course_id and b.status <> 'DISABLED' and b.max_sales is null
  ) then
    raise exception 'every enabled batch requires a valid max_sales';
  end if;

  if target_course.course_type = 'PRESENCIAL' then
    select d.max_students into course_capacity
    from public.course_presential_details d where d.course_id = target_course_id;
    select coalesce(sum(b.max_sales), 0) into batch_capacity
    from public.course_batches b
    where b.course_id = target_course_id and b.status <> 'DISABLED';
    if course_capacity is not null and batch_capacity > course_capacity then
      raise exception 'course batch capacity exceeds course capacity';
    end if;
  end if;
end; $$;
revoke all on function public.assert_valid_published_course_batches(uuid) from public;

create or replace function public.validate_changed_course_batches() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.assert_valid_published_course_batches(coalesce(new.course_id, old.course_id));
  return null;
end; $$;
create constraint trigger validate_changed_course_batches
after insert or update or delete on public.course_batches
deferrable initially deferred for each row
execute function public.validate_changed_course_batches();

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
  perform public.assert_valid_published_course_batches(target_course_id);
end; $$;
revoke all on function public.replace_course_batches(uuid, jsonb) from public;
grant execute on function public.replace_course_batches(uuid, jsonb) to authenticated;

create or replace function public.validate_course_publication() returns trigger
language plpgsql set search_path = '' as $$
declare
  course_capacity integer;
  batch_capacity bigint;
begin
  if new.status = 'PUBLISHED' then
    if trim(new.title) = '' or trim(new.slug) = '' or trim(new.description) = '' or new.instructor_id is null
       or new.workload_hours <= 0 or (new.pricing_type = 'FIXED' and new.price < 0) then
      raise exception 'course has missing publication fields';
    end if;
    if new.pricing_type = 'BATCHES' and not exists(
      select 1 from public.course_batches b
      where b.course_id = new.id and b.status in ('ACTIVE', 'SCHEDULED')
        and (b.ends_at is null or b.ends_at > now())
    ) then raise exception 'batch-priced course requires a current or future valid batch'; end if;
    if new.pricing_type = 'BATCHES' and exists(
      select 1 from public.course_batches b
      where b.course_id = new.id and b.status <> 'DISABLED' and b.max_sales is null
    ) then raise exception 'every enabled batch requires a valid max_sales'; end if;
    if new.course_type = 'PRESENCIAL' then
      select d.max_students into course_capacity from public.course_presential_details d where d.course_id = new.id;
      if course_capacity is null then raise exception 'presential details are required'; end if;
      if new.pricing_type = 'BATCHES' then
        select coalesce(sum(b.max_sales), 0) into batch_capacity
        from public.course_batches b where b.course_id = new.id and b.status <> 'DISABLED';
        if batch_capacity > course_capacity then raise exception 'course batch capacity exceeds course capacity'; end if;
      end if;
    elsif not exists(
      select 1 from public.course_modules m join public.lessons l on l.module_id = m.id where m.course_id = new.id
    ) then raise exception 'online course requires at least one lesson'; end if;
    new.published_at = coalesce(new.published_at, now());
  end if;
  if new.status <> 'PUBLISHED' then new.published_at = null; end if;
  return new;
end; $$;
