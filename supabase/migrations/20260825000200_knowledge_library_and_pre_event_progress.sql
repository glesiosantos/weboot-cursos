create type public.knowledge_content_type as enum ('POST', 'PDF', 'VIDEO');
create type public.knowledge_status as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');

create table public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 160),
  summary text,
  content_type public.knowledge_content_type not null,
  content text,
  external_url text,
  file_path text,
  mime_type text,
  file_size bigint check (file_size is null or file_size > 0),
  status public.knowledge_status not null default 'DRAFT',
  version integer not null default 1 check (version > 0),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knowledge_item_payload check (
    (content_type = 'POST' and content is not null and char_length(trim(content)) > 0)
    or (content_type = 'PDF' and file_path is not null and mime_type = 'application/pdf')
    or (content_type = 'VIDEO' and (file_path is not null or external_url is not null))
  )
);

create table public.knowledge_item_images (
  id uuid primary key default gen_random_uuid(),
  knowledge_item_id uuid not null references public.knowledge_items(id) on delete cascade,
  file_path text not null unique,
  alt_text text not null check (char_length(trim(alt_text)) > 0),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique(knowledge_item_id, position)
);

create table public.course_knowledge_items (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  knowledge_item_id uuid not null references public.knowledge_items(id),
  title_override text,
  position integer not null default 0 check (position >= 0),
  is_required boolean not null default true,
  is_pre_event boolean not null default true,
  available_at timestamptz,
  due_at timestamptz,
  knowledge_version integer not null check (knowledge_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, knowledge_item_id),
  unique(course_id, position),
  constraint knowledge_schedule check (due_at is null or available_at is null or due_at >= available_at)
);

create table public.knowledge_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  course_knowledge_item_id uuid not null references public.course_knowledge_items(id) on delete cascade,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  completed_at timestamptz,
  completed_version integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(enrollment_id, course_knowledge_item_id)
);

create index course_knowledge_items_course_position_idx on public.course_knowledge_items(course_id, position);
create index knowledge_progress_enrollment_idx on public.knowledge_progress(enrollment_id);

alter table public.knowledge_items enable row level security;
alter table public.knowledge_items force row level security;
alter table public.knowledge_item_images enable row level security;
alter table public.knowledge_item_images force row level security;
alter table public.course_knowledge_items enable row level security;
alter table public.course_knowledge_items force row level security;
alter table public.knowledge_progress enable row level security;
alter table public.knowledge_progress force row level security;

create policy admin_all_knowledge_items on public.knowledge_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy admin_all_knowledge_item_images on public.knowledge_item_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy admin_all_course_knowledge_items on public.course_knowledge_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy admin_all_knowledge_progress on public.knowledge_progress for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy student_read_published_knowledge on public.knowledge_items for select to authenticated using (
  status = 'PUBLISHED' and exists (
    select 1 from public.course_knowledge_items cki
    join public.enrollments e on e.course_id = cki.course_id
    where cki.knowledge_item_id = id and e.user_id = (select auth.uid()) and e.status = 'ACTIVE'
      and (cki.available_at is null or cki.available_at <= now())
  )
);
create policy student_read_knowledge_images on public.knowledge_item_images for select to authenticated using (
  exists (select 1 from public.knowledge_items ki where ki.id = knowledge_item_id)
);
create policy student_read_course_knowledge on public.course_knowledge_items for select to authenticated using (
  exists (select 1 from public.enrollments e where e.course_id = course_id and e.user_id = (select auth.uid()) and e.status = 'ACTIVE')
  and (available_at is null or available_at <= now())
);
create policy student_read_own_knowledge_progress on public.knowledge_progress for select to authenticated using (
  exists (select 1 from public.enrollments e where e.id = enrollment_id and e.user_id = (select auth.uid()))
);

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types) values
  ('knowledge-library', 'knowledge-library', false, 1073741824,
   array['application/pdf','video/mp4','video/webm','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy knowledge_library_admin_manage on storage.objects for all to authenticated
  using (bucket_id = 'knowledge-library' and public.is_admin())
  with check (bucket_id = 'knowledge-library' and public.is_admin());

create trigger set_knowledge_items_updated_at before update on public.knowledge_items
  for each row execute function public.set_updated_at();
create trigger set_course_knowledge_items_updated_at before update on public.course_knowledge_items
  for each row execute function public.set_updated_at();
create trigger set_knowledge_progress_updated_at before update on public.knowledge_progress
  for each row execute function public.set_updated_at();

create or replace function public.register_knowledge_progress(
  target_enrollment_id uuid,
  target_course_knowledge_item_id uuid,
  mark_completed boolean default false
) returns public.knowledge_progress
language plpgsql security definer set search_path = '' as $$
declare result public.knowledge_progress; target_version integer;
begin
  if not exists (
    select 1 from public.enrollments e
    join public.course_knowledge_items cki on cki.course_id = e.course_id
    join public.knowledge_items ki on ki.id = cki.knowledge_item_id
    where e.id = target_enrollment_id and e.user_id = (select auth.uid()) and e.status = 'ACTIVE'
      and cki.id = target_course_knowledge_item_id and ki.status = 'PUBLISHED'
      and (cki.available_at is null or cki.available_at <= now())
  ) then raise exception 'knowledge access denied'; end if;

  select knowledge_version into target_version from public.course_knowledge_items where id = target_course_knowledge_item_id;
  insert into public.knowledge_progress(enrollment_id, course_knowledge_item_id, first_viewed_at, last_viewed_at, completed_at, completed_version)
  values (target_enrollment_id, target_course_knowledge_item_id, now(), now(), case when mark_completed then now() end,
    case when mark_completed then target_version end)
  on conflict (enrollment_id, course_knowledge_item_id) do update set
    first_viewed_at = coalesce(public.knowledge_progress.first_viewed_at, now()), last_viewed_at = now(),
    completed_at = case when mark_completed then now() else public.knowledge_progress.completed_at end,
    completed_version = case when mark_completed then target_version else public.knowledge_progress.completed_version end
  returning * into result;
  return result;
end; $$;

revoke all on function public.register_knowledge_progress(uuid, uuid, boolean) from public, anon;
grant execute on function public.register_knowledge_progress(uuid, uuid, boolean) to authenticated;
