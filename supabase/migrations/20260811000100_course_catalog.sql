-- Fase 02: catálogo, autoria, conteúdo e fronteiras públicas.
create type public.lesson_type as enum ('VIDEO', 'TEXT', 'MATERIAL');

alter table public.instructors add column linkedin_url text;
alter table public.instructors add constraint instructors_linkedin_url_check
  check (linkedin_url is null or linkedin_url ~ '^https://(www\.)?linkedin\.com/');

alter table public.courses drop constraint presencial_fields;
alter table public.courses rename column workload_minutes to workload_hours;
alter table public.courses alter column workload_hours type numeric(6,2) using workload_hours / 60.0;
alter table public.courses add constraint courses_workload_hours_check check (workload_hours > 0);
alter table public.courses add constraint courses_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
alter table public.courses add constraint courses_short_description_check check (char_length(short_description) <= 280);

create table public.course_presential_details (
  course_id uuid primary key references public.courses(id) on delete cascade,
  location_name text not null,
  address text,
  address_number text,
  complement text,
  neighborhood text,
  city text not null,
  state char(2) not null,
  postal_code text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  registration_deadline timestamptz,
  max_students integer not null check (max_students > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint presential_dates_check check (ends_at >= starts_at),
  constraint registration_deadline_check check (registration_deadline is null or registration_deadline <= starts_at)
);

insert into public.course_presential_details (course_id, location_name, address, city, state, starts_at, ends_at, max_students)
select id, coalesce(nullif(venue, ''), 'Local a confirmar'), address, coalesce(nullif(city, ''), 'São Paulo'),
       coalesce(nullif(state, ''), 'SP'), starts_at, coalesce(ends_at, starts_at), max_students
from public.courses where course_type = 'PRESENCIAL' and starts_at is not null and max_students is not null;

alter table public.courses drop column address, drop column city, drop column state, drop column venue,
  drop column starts_at, drop column ends_at, drop column schedule, drop column max_students;

alter table public.lessons add column lesson_type public.lesson_type not null default 'TEXT';
alter table public.lessons add column content text;
alter table public.lessons rename column duration_seconds to duration_minutes;
alter table public.lessons alter column duration_minutes type integer using ceil(duration_minutes / 60.0)::integer;
alter table public.lessons rename column is_free to is_preview;

alter table public.course_materials rename column name to title;
alter table public.course_materials rename column size_bytes to file_size;
alter table public.course_materials add constraint course_material_single_owner_check
  check ((module_id is null or lesson_id is null) and not (module_id is not null and lesson_id is not null));

create unique index courses_slug_lower_unique on public.courses(lower(slug));
create index courses_search_idx on public.courses using gin
  (to_tsvector('portuguese', title || ' ' || short_description));
create index presential_starts_at_idx on public.course_presential_details(starts_at);

create trigger set_updated_at before update on public.course_presential_details
  for each row execute function public.set_updated_at();

alter table public.course_presential_details enable row level security;
alter table public.course_presential_details force row level security;
create policy public_presential_details_read on public.course_presential_details for select to anon, authenticated
using (exists(select 1 from public.courses c where c.id = course_id and c.status = 'PUBLISHED' and c.archived_at is null) or public.is_admin());
create policy admin_all_course_presential_details on public.course_presential_details for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists public_modules_read on public.course_modules;
create policy public_modules_read on public.course_modules for select to anon, authenticated
using (exists(select 1 from public.courses c where c.id = course_id and c.status = 'PUBLISHED' and c.archived_at is null) or public.is_admin());

drop policy if exists lessons_read_if_free_or_enrolled on public.lessons;
-- A tabela contém caminhos/conteúdo privados: apenas ADMIN a consulta diretamente nesta fase.

drop policy if exists materials_read_if_enrolled on public.course_materials;
drop policy if exists enrolled_materials_read on storage.objects;

create or replace view public.published_lesson_metadata
with (security_invoker = true) as
select l.id, l.module_id, l.title, l.description, l.lesson_type, l.duration_minutes,
       l.position, l.is_required, l.is_preview
from public.lessons l
join public.course_modules m on m.id = l.module_id
join public.courses c on c.id = m.course_id
where c.status = 'PUBLISHED' and c.archived_at is null;
grant select on public.published_lesson_metadata to anon, authenticated;

create or replace function public.get_published_course_lessons(target_course_id uuid)
returns table (id uuid, module_id uuid, title text, description text, lesson_type public.lesson_type,
  duration_minutes integer, "position" integer, is_required boolean, is_preview boolean)
language sql stable security definer set search_path = '' as $$
  select l.id, l.module_id, l.title, l.description, l.lesson_type, l.duration_minutes,
         l.position, l.is_required, l.is_preview
  from public.lessons l
  join public.course_modules m on m.id = l.module_id
  join public.courses c on c.id = m.course_id
  where c.id = target_course_id and c.status = 'PUBLISHED' and c.archived_at is null
  order by m.position, l.position;
$$;
revoke all on function public.get_published_course_lessons(uuid) from public;
grant execute on function public.get_published_course_lessons(uuid) to anon, authenticated;

create or replace function public.ensure_online_module() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists(select 1 from public.courses where id = new.course_id and course_type = 'ONLINE') then
    raise exception 'modules are allowed only for ONLINE courses';
  end if;
  return new;
end; $$;
create trigger ensure_online_module before insert or update on public.course_modules
for each row execute function public.ensure_online_module();

create or replace function public.validate_course_publication() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'PUBLISHED' and old.status is distinct from 'PUBLISHED' then
    if trim(new.title) = '' or trim(new.slug) = '' or trim(new.description) = '' or new.instructor_id is null
       or new.workload_hours <= 0 or new.price < 0 then
      raise exception 'course has missing publication fields';
    end if;
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
create trigger validate_course_publication before update on public.courses
for each row execute function public.validate_course_publication();

-- Buckets privados continuam sem leitura para anon/authenticated; apenas ADMIN gerencia.
update storage.buckets set public = false where id in ('course-materials', 'course-videos');
