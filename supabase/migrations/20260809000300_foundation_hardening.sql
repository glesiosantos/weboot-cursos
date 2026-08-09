-- Leitura pública somente do perfil editorial mínimo de instrutores ativos.
drop policy if exists public_instructors_read on public.instructors;
create policy public_instructors_read on public.instructors for select to anon, authenticated
using ((active and exists(select 1 from public.courses c where c.instructor_id = instructors.id and c.status = 'PUBLISHED' and c.archived_at is null)) or public.is_admin());

drop policy if exists public_courses_read on public.courses;
create policy public_courses_read on public.courses for select to anon, authenticated
using ((status = 'PUBLISHED' and archived_at is null) or public.is_admin());

create index if not exists course_modules_course_idx on public.course_modules(course_id);
create index if not exists lessons_module_idx on public.lessons(module_id);
create index if not exists materials_course_idx on public.course_materials(course_id);
create index if not exists payments_order_idx on public.payments(order_id);
create index if not exists certificates_verification_idx on public.certificates(verification_code);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity, entity_id);

-- Promoção inicial deve ser deliberada pelo SQL editor autenticado; nunca pelo cliente.
create or replace function public.bootstrap_admin(target_email text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare target_id uuid;
begin
  if exists(select 1 from public.profiles where role = 'ADMIN') then
    raise exception 'an administrator already exists';
  end if;
  select id into target_id from auth.users where lower(email) = lower(target_email);
  if target_id is null then raise exception 'user not found'; end if;
  update public.profiles set role = 'ADMIN' where id = target_id;
  return target_id;
end; $$;
revoke all on function public.bootstrap_admin(text) from public, anon, authenticated;
