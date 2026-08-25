-- Faz o catalogo e o checkout avancarem para o proximo lote elegivel assim
-- que todas as vagas do lote vigente estiverem ocupadas.
create or replace function public.get_current_course_batch(
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
    and c.status = 'PUBLISHED'
    and c.archived_at is null
    and b.status in ('ACTIVE', 'SCHEDULED')
    and (b.starts_at is null or b.starts_at <= reference_at)
    and (b.ends_at is null or b.ends_at > reference_at)
    and (
      b.max_sales is null
      or b.max_sales > (
        select count(*)
        from public.seat_reservations r
        where r.course_batch_id = b.id
          and (
            r.status = 'CONFIRMED'
            or (r.status = 'RESERVED' and r.expires_at > reference_at)
          )
      )
    )
  order by case when b.status = 'ACTIVE' then 0 else 1 end, b.position
  limit 1;
$$;

revoke all on function public.get_current_course_batch(uuid, timestamptz) from public;
grant execute on function public.get_current_course_batch(uuid, timestamptz) to anon, authenticated;
