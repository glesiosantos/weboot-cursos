-- Fase 02: folder promocional publico, independente da capa do curso.
alter table public.courses
  add column folder_path text,
  add column folder_alt_text text check (folder_alt_text is null or char_length(folder_alt_text) <= 240),
  add column folder_mime_type text check (folder_mime_type is null or folder_mime_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  add column folder_original_name text check (folder_original_name is null or char_length(folder_original_name) <= 255),
  add column folder_updated_at timestamptz,
  add constraint courses_folder_metadata_check check (
    (folder_path is null and folder_mime_type is null and folder_original_name is null and folder_updated_at is null)
    or (folder_path is not null and folder_mime_type is not null and folder_original_name is not null and folder_updated_at is not null)
  );

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-public-assets',
  'course-public-assets',
  true,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy public_assets_read on storage.objects for select to anon, authenticated
using (
  bucket_id = 'course-public-assets'
  and exists (
    select 1 from public.courses c
    where c.folder_path = name and c.status = 'PUBLISHED' and c.archived_at is null
  )
);
create policy public_assets_admin_insert on storage.objects for insert to authenticated
with check (bucket_id = 'course-public-assets' and public.is_admin());
create policy public_assets_admin_update on storage.objects for update to authenticated
using (bucket_id = 'course-public-assets' and public.is_admin())
with check (bucket_id = 'course-public-assets' and public.is_admin());
create policy public_assets_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'course-public-assets' and public.is_admin());
